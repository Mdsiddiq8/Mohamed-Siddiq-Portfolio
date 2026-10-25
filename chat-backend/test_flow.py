"""End-to-end check in MOCK mode (no WhatsApp / LLM keys needed):  python test_flow.py"""
import os
import sqlite3
import subprocess
import sys
import tempfile
import time

import httpx

PORT = 8765
BASE = f"http://127.0.0.1:{PORT}"
OWNER = "918524807305"
tmp = tempfile.mkdtemp()
DB = os.path.join(tmp, "t.db")

env = {
    **os.environ,
    "DB_PATH": DB,
    "AUTO_REPLY_DELAY_SECONDS": "1",
    "OWNER_WHATSAPP_NUMBER": OWNER,
    "WHATSAPP_VERIFY_TOKEN": "tok123",
    "WHATSAPP_TOKEN": "",
    "OPENAI_API_KEY": "",
    "ALLOWED_ORIGINS": "*",
}
srv = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "app:app", "--port", str(PORT), "--log-level", "warning"],
    cwd=os.path.dirname(os.path.abspath(__file__)), env=env,
)
ok = True


def check(name, cond, extra=""):
    global ok
    ok &= bool(cond)
    print(("PASS" if cond else "FAIL"), name, extra)


def wa_payload(sender, text, context_id=None):
    msg = {"from": sender, "type": "text", "text": {"body": text}}
    if context_id:
        msg["context"] = {"id": context_id}
    return {"entry": [{"changes": [{"value": {"messages": [msg]}}]}]}


try:
    for _ in range(50):
        try:
            httpx.get(f"{BASE}/health", timeout=1)
            break
        except Exception:
            time.sleep(0.2)
    c = httpx.Client(base_url=BASE, timeout=5)

    # 1. visitor message -> AI assistant answers when owner is silent
    r = c.post("/api/chat", json={"session_id": "visitor_aaaa1111", "name": "Priya", "message": "What projects has he built?"})
    check("post chat", r.status_code == 200 and len(r.json()["code"]) == 4, r.text)
    time.sleep(2.2)
    msgs = c.get("/api/chat/visitor_aaaa1111").json()["messages"]
    check("agent replied after delay", [m["sender"] for m in msgs] == ["visitor", "agent"], str([m["sender"] for m in msgs]))
    check("polling with ?after works", len(c.get(f"/api/chat/visitor_aaaa1111?after={msgs[0]['id']}").json()["messages"]) == 1)

    # 2. owner answers via '#code text' before the delay -> agent stays silent
    r = c.post("/api/chat", json={"session_id": "visitor_bbbb2222", "message": "Hi, are you free for a project?"})
    code = r.json()["code"]
    c.post("/webhook", json=wa_payload(OWNER, f"#{code} Yes, let's talk. Email me!"))
    time.sleep(2.2)
    msgs = c.get("/api/chat/visitor_bbbb2222").json()["messages"]
    check("owner reply delivered, agent silent", [m["sender"] for m in msgs] == ["visitor", "owner"], str([m["sender"] for m in msgs]))

    # 3. owner answers by replying to the notification (WhatsApp context id)
    c.post("/api/chat", json={"session_id": "visitor_cccc3333", "message": "Hello"})
    with sqlite3.connect(DB) as db:
        db.execute("INSERT INTO outbound(wamid,session_id) VALUES('wamid.TEST','visitor_cccc3333')")
    c.post("/webhook", json=wa_payload(OWNER, "Hey! Thanks for writing.", context_id="wamid.TEST"))
    msgs = c.get("/api/chat/visitor_cccc3333").json()["messages"]
    check("reply-to-message mapping", any(m["sender"] == "owner" and "Thanks" in m["text"] for m in msgs))

    # 4. messages from any other number are ignored
    before = len(c.get("/api/chat/visitor_cccc3333").json()["messages"])
    c.post("/webhook", json=wa_payload("919999999999", f"#{code} I am an impostor"))
    after = len(c.get("/api/chat/visitor_cccc3333").json()["messages"])
    check("non-owner webhook ignored", before == after and "impostor" not in str(c.get("/api/chat/visitor_bbbb2222").json()))

    # 5. owner can switch the assistant off
    c.post("/webhook", json=wa_payload(OWNER, "/bot off"))
    c.post("/api/chat", json={"session_id": "visitor_dddd4444", "message": "Anyone there?"})
    time.sleep(2.2)
    msgs = c.get("/api/chat/visitor_dddd4444").json()["messages"]
    check("/bot off silences the assistant", [m["sender"] for m in msgs] == ["visitor"])
    c.post("/webhook", json=wa_payload(OWNER, "/bot on"))

    # 6. webhook verification + input validation
    check("webhook verify ok", c.get("/webhook", params={"hub.mode": "subscribe", "hub.verify_token": "tok123", "hub.challenge": "42"}).text == "42")
    check("webhook verify rejects bad token", c.get("/webhook", params={"hub.mode": "subscribe", "hub.verify_token": "nope", "hub.challenge": "42"}).status_code == 403)
    check("bad session id rejected", c.post("/api/chat", json={"session_id": "x", "message": "hi"}).status_code == 400)
    check("oversized message rejected", c.post("/api/chat", json={"session_id": "visitor_eeee5555", "message": "a" * 1001}).status_code == 422)

    # 7a. availability list: tapping a time tells the visitor, silences the AI, shows a status
    code = c.post("/api/chat", json={"session_id": "visitor_gggg7777", "message": "Can we talk today?"}).json()["code"]
    pick = {"from": OWNER, "type": "interactive",
            "interactive": {"type": "list_reply", "list_reply": {"id": f"av|{code}|1h", "title": "Free in 1 hour"}}}
    c.post("/webhook", json={"entry": [{"changes": [{"value": {"messages": [pick]}}]}]})
    time.sleep(2.2)
    d = c.get("/api/chat/visitor_gggg7777").json()
    check("list tap tells visitor, AI silent",
          [m["sender"] for m in d["messages"]] == ["visitor", "owner"] and "about an hour" in d["messages"][1]["text"])
    check("API exposes availability", d["availability"] == {"key": "1h", "label": "Free in ~1 hour"}, str(d["availability"]))

    # 7b. template quick-reply button (used outside the 24h window)
    code = c.post("/api/chat", json={"session_id": "visitor_hhhh8888", "message": "Hello?"}).json()["code"]
    btn = {"from": OWNER, "type": "button", "button": {"payload": f"av|{code}|busy", "text": "Busy right now"}}
    c.post("/webhook", json={"entry": [{"changes": [{"value": {"messages": [btn]}}]}]})
    d = c.get("/api/chat/visitor_hhhh8888").json()
    check("template button tells visitor 'busy'", d["availability"]["label"] == "Busy right now" and "isn't available" in d["messages"][-1]["text"])

    # 7c. 'Let AI assistant reply' hands over to the assistant immediately
    code = c.post("/api/chat", json={"session_id": "visitor_iiii9999", "message": "Tell me about RAG"}).json()["code"]
    pick = {"from": OWNER, "type": "interactive",
            "interactive": {"type": "list_reply", "list_reply": {"id": f"av|{code}|ai", "title": "Let AI assistant reply"}}}
    c.post("/webhook", json={"entry": [{"changes": [{"value": {"messages": [pick]}}]}]})
    d = c.get("/api/chat/visitor_iiii9999").json()
    check("AI option makes the assistant reply now", [m["sender"] for m in d["messages"]] == ["visitor", "agent"])

    # 7d. a visitor cannot trigger availability by faking the id from a non-owner number
    code = c.post("/api/chat", json={"session_id": "visitor_jjjj0000", "message": "hi"}).json()["code"]
    fake = {"from": "919999999999", "type": "interactive",
            "interactive": {"type": "list_reply", "list_reply": {"id": f"av|{code}|now", "title": "x"}}}
    c.post("/webhook", json={"entry": [{"changes": [{"value": {"messages": [fake]}}]}]})
    check("non-owner availability tap ignored", c.get("/api/chat/visitor_jjjj0000").json()["availability"] is None)

    # 7. rate limit
    codes = [c.post("/api/chat", json={"session_id": "visitor_ffff6666", "message": "spam"}).status_code for _ in range(22)]
    check("rate limit kicks in", 429 in codes, f"{codes.count(200)} accepted")
finally:
    srv.terminate()

print("\nALL PASSED" if ok else "\nSOME FAILED")
sys.exit(0 if ok else 1)
