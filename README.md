# Mohamed Siddiq — AI Engineer Portfolio

Personal portfolio site for **Mohamed Siddiq**, AI Engineer building RAG assistants, voice AI and multi-agent systems in Python.

🔗 **GitHub:** [github.com/Mdsiddiq8](https://github.com/Mdsiddiq8)
🌐 **Live Demo:** [mohamed-siddiq-portfolio-3vs06uhhy-mdsiddiq1.vercel.app](https://mohamed-siddiq-portfolio-3vs06uhhy-mdsiddiq1.vercel.app/)

## Tech Stack

- [Next.js 14](https://nextjs.org) (App Router) + React 18 + TypeScript
- Tailwind CSS
- GSAP + Lenis for animation and smooth scroll
- `chat-backend/` — a standalone Python/FastAPI WhatsApp-relay backend (see its own README); not currently wired into the live site

## Features

- Animated hero with a WebGL-rendered, alpha-matted intro video and voice greeting
- Selected AI work: Hybrid Voice RAG Assistant, Enterprise GenAI RAG App, Multi-Agent Customer Support System, AutoGen Support Agent
- Skills, experience, certifications and contact sections

## Workflow

**Visitor flow on the site:**
1. Hero section loads and plays an alpha-matted intro video with a voice greeting (tap to unmute).
2. Visitor scrolls through Approach → Selected AI Work (projects) → Skills → Experience → Certifications → Contact.

**Development workflow:**
1. `npm install` → `npm run dev` for the frontend (see [RUN-LOCALLY.md](./RUN-LOCALLY.md)).
2. Edit content in `data/portfolio.ts` (profile, projects, skills, experience) — the UI renders directly from this file.
3. Commit and push to `main`; deploy the frontend on Vercel.

`chat-backend/` is kept as an optional, separately deployable WhatsApp-relay + AI-assistant service (see its own [README](./chat-backend/README.md)) — the frontend has no chat widget wired to it right now.

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
components/     React components (hero, etc.)
data/           Portfolio content (profile, projects, skills, experience)
public/         Images, videos and static assets
chat-backend/   Optional, standalone Python/FastAPI WhatsApp-relay backend (not wired into the site)
```

## Deploy

The easiest way to deploy this app is [Vercel](https://vercel.com/new), from the creators of Next.js. See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for other options.