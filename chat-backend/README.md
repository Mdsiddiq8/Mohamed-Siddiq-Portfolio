# Portfolio chat backend

A visitor writes in the website chat. Mohamed gets it on WhatsApp straight away with a
list of availability options. He taps one and the visitor is told exactly that.
If he does not respond within `AUTO_REPLY_DELAY_SECONDS` (default 15), an AI assistant
answers from `knowledge.md`. It always says it is Mohamed's AI assistant, and it is told it
does not know his availability until he has chosen one.

## What Mohamed sees on WhatsApp

1. **First message from a visitor:** a list message "New portfolio message" with the text and
   a **Choose reply** button. Options: Available now, Free in 15 minutes, Free in 1 hour,
   Tonight (evening), Tomorrow, Busy right now, Let AI assistant reply.
2. **He taps one:** the visitor sees that status in the chat header and as a message from Mohamed.
   The AI assistant stays quiet for that visitor (except for "Let AI assistant reply").
3. **Later messages from the same visitor:** plain text notifications `[#a1b2] Name: message`.
4. **To chat directly:** reply to a notification, or send `#a1b2 your text`.
5. `/bot off` stops the AI assistant for everyone, `/bot on` turns it back on.

## Run locally (mock mode, no keys)

```
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
python test_flow.py        # full flow against a temporary server
python test_whatsapp.py    # WhatsApp payload limits and the 24h-window fallback
```

In the site project root copy `.env.local.example` to `.env.local` (it points to
`http://localhost:8000`) and run `npm run dev`.

## Connect real WhatsApp (about 30 minutes)

1. Go to developers.facebook.com, create an app of type **Business**, add the **WhatsApp** product.
2. In **WhatsApp > API Setup** copy the **Phone number ID** and a token into `.env`
   (`WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TOKEN`). The temporary token expires in 24 hours;
   for real use create a permanent token from a System User.
3. Add your own number (918524807305) under **To** and verify it.
4. **Send "hi" from your phone to the business test number.** That opens a 24 hour window in
   which the backend can send you the interactive list.
5. Deploy this folder over HTTPS (Dockerfile included; Render, Railway, Fly.io all work). Set the
   environment variables from `.env.example`.
6. In **WhatsApp > Configuration** set the callback URL to `https://YOUR-HOST/webhook`, the verify
   token to your `WHATSAPP_VERIFY_TOKEN`, and subscribe to the **messages** field.
7. In the website project set `NEXT_PUBLIC_CHAT_API=https://YOUR-HOST` and rebuild.

### Outside the 24 hour window

WhatsApp only allows free-form and interactive messages for 24 hours after you last messaged the
business number. Every tap on a list option or any message you send reopens that window. For the
times when it is closed, create a message template once (WhatsApp Manager > Message templates):

- Category **Utility**, language English, name `portfolio_visitor_message`
- Body: `New portfolio message from {{1}}: {{2}}`
- Three **Quick reply** buttons, in this order: `Available now`, `Free in 1 hour`, `Busy right now`

Set `WHATSAPP_TEMPLATE_NAME=portfolio_visitor_message`. When Meta rejects a normal message because
the window is closed (error 131047), the backend sends the template instead and your taps still work.
Template approval usually takes minutes to a few hours. Without a template the backend logs a warning
and the visitor still gets the AI assistant's reply, but you are not notified until you message the number.

## Turn on the AI assistant

Set `OPENAI_API_KEY` (any OpenAI-compatible API; change `OPENAI_BASE_URL` and `OPENAI_MODEL` for others).
Edit `knowledge.md` to change what it knows. It answers only from that file, hands over to Mohamed
for anything else, and never invents prices, dates or availability.

## Safety defaults

Only the number in `OWNER_WHATSAPP_NUMBER` can answer visitors, change availability or switch the bot.
Rate limit (20 messages per 10 minutes per session and per IP), 1000 character cap, webhook signature
check when `WHATSAPP_APP_SECRET` is set, CORS limited to `ALLOWED_ORIGINS`. SQLite is the store; mount a
volume for `DB_PATH` if your host has an ephemeral disk.
