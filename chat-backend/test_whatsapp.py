"""Checks the WhatsApp payloads against Meta's limits and the 24h-window fallback (no network): python test_whatsapp.py"""
import asyncio
import json
import os
import sys
import tempfile

import httpx

os.environ.update(
    DB_PATH=os.path.join(tempfile.mkdtemp(), "w.db"),
    OWNER_WHATSAPP_NUMBER="918524807305",
    WHATSAPP_TOKEN="test-token",
    WHATSAPP_PHONE_NUMBER_ID="1234567890",
    WHATSAPP_TEMPLATE_NAME="portfolio_visitor_message",
)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import app  # noqa: E402

ok = True


def check(name, cond, extra=""):
    global ok
    ok &= bool(cond)
    print(("PASS" if cond else "FAIL"), name, extra)


calls: list[dict] = []
window_open = True


def handler(request: httpx.Request) -> httpx.Response:
    body = json.loads(request.content)
    calls.append(body)
    assert request.headers["authorization"] == "Bearer test-token"
    if not window_open and body["type"] != "template":
        return httpx.Response(400, json={"error": {"code": 131047, "message": "Re-engagement message"}})
    return httpx.Response(200, json={"messages": [{"id": f"wamid.T{len(calls)}"}]})


real = httpx.AsyncClient
app.httpx.AsyncClient = lambda **kw: real(transport=httpx.MockTransport(handler), **kw)

app.init_db()
session = app.upsert_session("visitor_unit0001", "Priya\nSharma " + "x" * 80)
long_text = "Hello\nthere " * 600

# 1. interactive list respects WhatsApp limits
p = app.list_payload(session, long_text)["interactive"]
rows = p["action"]["sections"][0]["rows"]
check("list: <=10 rows", len(rows) <= 10, f"{len(rows)} rows")
check("list: row titles <=24 chars", all(len(r["title"]) <= 24 for r in rows))
check("list: row ids <=200 chars", all(len(r["id"]) <= 200 for r in rows))
check("list: body <=1024", len(p["body"]["text"]) <= 1024, str(len(p["body"]["text"])))
check("list: header/footer <=60", len(p["header"]["text"]) <= 60 and len(p["footer"]["text"]) <= 60)
check("list: button label <=20", len(p["action"]["button"]) <= 20)
check("list: has time options + AI row", {"now", "15m", "1h", "tonight", "tomorrow", "busy", "ai"} == {r["id"].split("|")[2] for r in rows})

# 2. window open -> one interactive message, wamid remembered for reply mapping
asyncio.run(app.notify_owner(session, "Can we talk?", True))
check("window open: single interactive send", [c["type"] for c in calls] == ["interactive"], str([c["type"] for c in calls]))
with app.closing(app.db()) as c:
    check("wamid stored for reply-to mapping", c.execute("SELECT 1 FROM outbound WHERE wamid='wamid.T1'").fetchone() is not None)

# 3. window closed -> falls back to the approved template with 3 quick-reply buttons
calls.clear()
window_open = False
asyncio.run(app.notify_owner(session, long_text, True))
check("window closed: interactive then template", [c["type"] for c in calls] == ["interactive", "template"], str([c["type"] for c in calls]))
tpl = calls[-1]["template"]
params = tpl["components"][0]["parameters"]
check("template: name + 2 body params", tpl["name"] == "portfolio_visitor_message" and len(params) == 2)
check("template: no newlines in params", all("\n" not in x["text"] for x in params))
btns = [c for c in tpl["components"] if c["type"] == "button"]
check("template: 3 quick replies carry the code",
      [b["parameters"][0]["payload"] for b in btns] == [f"av|{session['code']}|{k}" for k in app.TEMPLATE_KEYS])

# 4. follow-up messages are plain text with the code
calls.clear()
window_open = True
asyncio.run(app.notify_owner(session, "one more thing", False))
check("follow-up is plain text with #code", calls[0]["type"] == "text" and f"[#{session['code']}]" in calls[0]["text"]["body"])

# 5. no template configured -> no template attempt, no crash
calls.clear()
window_open = False
app.WA_TEMPLATE_NAME = ""
asyncio.run(app.notify_owner(session, "hello", True))
check("no template configured: only interactive tried", [c["type"] for c in calls] == ["interactive"])

print("\nALL PASSED" if ok else "\nSOME FAILED")
sys.exit(0 if ok else 1)
