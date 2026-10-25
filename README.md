# Mohamed Siddiq — AI Engineer Portfolio

Personal portfolio site for **Mohamed Siddiq**, AI Engineer building RAG assistants, voice AI and multi-agent systems in Python.

🔗 **GitHub:** [github.com/Mdsiddiq8](https://github.com/Mdsiddiq8)
🌐 **Live Demo:** [mohamed-siddiq-portfolio-3vs06uhhy-mdsiddiq1.vercel.app](https://mohamed-siddiq-portfolio-3vs06uhhy-mdsiddiq1.vercel.app/)

## Tech Stack

- [Next.js 14](https://nextjs.org) (App Router) + React 18 + TypeScript
- Tailwind CSS
- GSAP + Lenis for animation and smooth scroll
- `chat-backend/` — a Python/FastAPI chat widget backend (see its own README)

## Features

- Animated hero with a WebGL-rendered, alpha-matted intro video and voice greeting
- Selected AI work: Hybrid Voice RAG Assistant, Enterprise GenAI RAG App, Multi-Agent Customer Support System, AutoGen Support Agent
- Skills, experience, certifications and contact sections
- Built-in chat widget wired to a separate Python backend

## Workflow

**Visitor flow on the site:**
1. Hero section loads and plays an alpha-matted intro video with a voice greeting (tap to unmute).
2. Visitor scrolls through Approach → Selected AI Work (projects) → Skills → Experience → Certifications → Contact.
3. Visitor can open the chat widget at any time to ask a question.

**Chat widget flow (frontend ↔ `chat-backend`):**
1. Visitor sends a message in the website chat widget.
2. The Next.js frontend calls the FastAPI backend (`chat-backend/app.py`) at `NEXT_PUBLIC_CHAT_API`.
3. The backend instantly notifies Mohamed on WhatsApp with the message and quick-reply availability options.
4. If Mohamed doesn't respond within `AUTO_REPLY_DELAY_SECONDS` (default 15s), an AI assistant replies to the visitor using only the facts in `chat-backend/knowledge.md`.
5. Mohamed can reply directly from WhatsApp at any time, or toggle the AI assistant on/off with `/bot on` / `/bot off`.

**Development workflow:**
1. `npm install` → `npm run dev` for the frontend (see [RUN-LOCALLY.md](./RUN-LOCALLY.md)).
2. `pip install -r requirements.txt` → `uvicorn app:app --reload --port 8000` for `chat-backend` (see its own [README](./chat-backend/README.md)).
3. Edit content in `data/portfolio.ts` (profile, projects, skills, experience) — the UI renders directly from this file.
4. Commit and push to `main`; deploy the frontend on Vercel and `chat-backend` on any Docker host (Render, Railway, Fly.io).

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

See [RUN-LOCALLY.md](./RUN-LOCALLY.md) for detailed setup (including Windows/Mac shortcuts and optional env vars), or double-click `start-windows.bat` / `start-mac-linux.command`.

## Project Structure

```
app/            Next.js App Router pages, layout and global styles
components/     React components (hero, chat widget, etc.)
data/           Portfolio content (profile, projects, skills, experience)
public/         Images, videos and static assets
chat-backend/   Python/FastAPI backend for the chat widget
```

## Deploy

The easiest way to deploy this app is [Vercel](https://vercel.com/new), from the creators of Next.js. See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for other options.
