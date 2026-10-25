"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { profile } from "@/data/portfolio";
import { whatsappPath } from "@/data/whatsapp-icon";

// Set NEXT_PUBLIC_CHAT_API to the chat-backend URL. Empty = demo mode.
const CHAT_API = (process.env.NEXT_PUBLIC_CHAT_API || "").replace(/\/$/, "");
const SID_KEY = "ms_chat_sid";

type Sender = "visitor" | "owner" | "agent" | "system";
type Msg = { key: string; serverId?: number; sender: Sender; text: string; ts: number; sent?: boolean };

const GREETING: Msg = {
  key: "greeting",
  sender: "agent",
  ts: Date.now(),
  text: "Hi, I'm Mohamed's AI assistant. Ask me about his projects, skills or experience. You can also message him here: he gets it on WhatsApp, and I'll answer until he's free.",
};

const QUICK = [
  "What have you built?",
  "Skills & tech stack",
  "I want to hire you",
  "Is Mohamed available?",
];

function demoReply(text: string): string {
  const t = text.toLowerCase();
  if (/(hire|job|role|opening|work with|freelance|collab)/.test(t))
    return "Thanks for reaching out! Share your name, an email or phone number, and a line about what you need, and Mohamed will get back to you.";
  if (/(avail|when|notice|start)/.test(t))
    return "I don't have his availability. Leave your contact details and he'll confirm it personally.";
  if (/(built|project|rag|voice|agent)/.test(t))
    return "He has built a Hybrid Voice RAG assistant (7 Indian languages), an Enterprise GenAI RAG app, a 4-agent CrewAI support system and an AutoGen support agent, all in Python.";
  if (/(skill|stack|python|langchain|tech|tool)/.test(t))
    return "Core stack: Python, FastAPI, LangChain, LlamaIndex, ChromaDB, CrewAI, AutoGen, and the OpenAI, Azure OpenAI and Gemini APIs.";
  if (/(human|real|bot|ai\b)/.test(t))
    return "I'm Mohamed's AI assistant. He's been notified and will follow up personally.";
  return "I can tell you about his projects, skills and experience, or pass a message to Mohamed. What would you like to know?";
}

function newSessionId() {
  const bytes = new Uint8Array(12);
  try {
    crypto.getRandomValues(bytes);
  } catch {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return "v_" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function readSid(): string {
  try {
    const s = localStorage.getItem(SID_KEY);
    if (s) return s;
    const n = newSessionId();
    localStorage.setItem(SID_KEY, n);
    return n;
  } catch {
    return newSessionId();
  }
}

type Availability = { key: string; label: string } | null;

// green = reachable soon, amber = later today, grey = busy
function availabilityDot(key?: string) {
  if (key === "now" || key === "ai") return "#25d366";
  if (key === "15m" || key === "1h") return "#f5a623";
  return "#9aa5ab";
}

function time(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [unread, setUnread] = useState(0);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [availability, setAvailability] = useState<Availability>(null);
  const [mounted, setMounted] = useState(false); // times render client-side only (no SSR mismatch)
  useEffect(() => setMounted(true), []);
  const sidRef = useRef("");
  const lastIdRef = useRef(0);
  const seenRef = useRef<Set<number>>(new Set());
  const hasChattedRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const openRef = useRef(false);
  openRef.current = open;

  // session + history (API mode)
  useEffect(() => {
    sidRef.current = readSid();
    if (!CHAT_API) return;
    fetch(`${CHAT_API}/api/chat/${sidRef.current}`)
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((d: { messages: { id: number; sender: Sender; text: string; ts: number }[]; availability?: Availability }) => {
        setAvailability(d.availability ?? null);
        if (!d.messages.length) return;
        hasChattedRef.current = true;
        d.messages.forEach((m) => {
          seenRef.current.add(m.id);
          lastIdRef.current = Math.max(lastIdRef.current, m.id);
        });
        setMessages([
          GREETING,
          ...d.messages.map((m) => ({
            key: `s${m.id}`,
            serverId: m.id,
            sender: m.sender,
            text: m.text,
            ts: m.ts * 1000,
            sent: true,
          })),
        ]);
      })
      .catch(() => {});
  }, []);

  // teaser bubble once
  useEffect(() => {
    const t = setTimeout(() => !openRef.current && setTeaser(true), 3500);
    const h = setTimeout(() => setTeaser(false), 12000);
    return () => {
      clearTimeout(t);
      clearTimeout(h);
    };
  }, []);

  // poll for Mohamed's / the assistant's replies
  useEffect(() => {
    if (!CHAT_API) return;
    const id = setInterval(async () => {
      if (!hasChattedRef.current) return;
      try {
        const r = await fetch(`${CHAT_API}/api/chat/${sidRef.current}?after=${lastIdRef.current}`);
        if (!r.ok) return;
        const d: { messages: { id: number; sender: Sender; text: string; ts: number }[]; availability?: Availability } = await r.json();
        if (d.availability !== undefined) setAvailability(d.availability);
        const fresh = d.messages.filter((m) => !seenRef.current.has(m.id));
        if (!fresh.length) return;
        fresh.forEach((m) => {
          seenRef.current.add(m.id);
          lastIdRef.current = Math.max(lastIdRef.current, m.id);
        });
        const incoming = fresh.filter((m) => m.sender !== "visitor");
        if (incoming.length) {
          setTyping(false);
          setMessages((prev) => [
            ...prev,
            ...incoming.map((m) => ({
              key: `s${m.id}`,
              serverId: m.id,
              sender: m.sender,
              text: m.text,
              ts: m.ts * 1000,
              sent: true,
            })),
          ]);
          if (!openRef.current) setUnread((u) => u + incoming.length);
        }
      } catch {
        /* retry on next tick */
      }
    }, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTeaser(false);
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const send = useCallback(async (raw: string) => {
    const text = raw.trim().slice(0, 1000);
    if (!text) return;
    const key = `l${Date.now()}`;
    setMessages((prev) => [...prev, { key, sender: "visitor", text, ts: Date.now() }]);
    setInput("");
    hasChattedRef.current = true;

    if (!CHAT_API) {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          { key: `a${Date.now()}`, sender: "agent", text: demoReply(text), ts: Date.now() },
        ]);
      }, 900 + Math.min(text.length * 15, 900));
      return;
    }

    try {
      const r = await fetch(`${CHAT_API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sidRef.current, message: text }),
      });
      if (r.status === 429) throw new Error("rate");
      if (!r.ok) throw new Error("http");
      const d: { id: number } = await r.json();
      seenRef.current.add(d.id);
      lastIdRef.current = Math.max(lastIdRef.current, d.id);
      setMessages((prev) => prev.map((m) => (m.key === key ? { ...m, serverId: d.id, sent: true } : m)));
      setTyping(true);
      setTimeout(() => setTyping(false), 8000);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          key: `e${Date.now()}`,
          sender: "system",
          ts: Date.now(),
          text:
            (e as Error).message === "rate"
              ? "You're sending messages too fast. Please wait a few minutes."
              : "Couldn't send that. Please try again, or use the WhatsApp button.",
        },
      ]);
    }
  }, []);

  const onlyGreeting = messages.length === 1;

  return (
    <>
      {/* Chat panel: always mounted, toggled with classes */}
      <div
        role="dialog"
        aria-label="Chat with Mohamed Siddiq"
        aria-hidden={!open}
        className={`fixed z-[60] right-3 bottom-24 sm:right-6 w-[min(380px,calc(100vw-1.5rem))] h-[min(560px,calc(100dvh-8rem))] flex flex-col overflow-hidden rounded-2xl shadow-[0_24px_60px_-12px_rgba(0,0,0,0.35)] origin-bottom-right transition-all duration-300 ease-out ${
          open ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-90 translate-y-4 pointer-events-none"
        }`}
        style={{ background: "#efeae2" }}
      >
        {/* header */}
        <div className="flex items-center gap-3 px-4 py-3 text-white" style={{ background: "#075e54" }}>
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/20 shrink-0">
            <img src="/images/mohamed-cutout.png" alt="" className="w-full h-full object-cover object-top" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight truncate">Mohamed Siddiq</p>
            <p className="text-xs text-white/80 leading-tight flex items-center gap-1.5">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: availability ? availabilityDot(availability.key) : "#25d366" }}
              />
              {availability ? `Mohamed: ${availability.label}` : "AI assistant online · Mohamed replies when free"}
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/15 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* messages */}
        <div ref={listRef} aria-live="polite" className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {!CHAT_API && (
            <p className="mx-auto max-w-[92%] text-center text-[11px] leading-snug rounded-lg bg-[#fff3c4] text-[#5c4a00] px-3 py-2">
              Preview mode: replies come from a built-in demo and messages are not delivered. Use the WhatsApp button
              in the header to reach Mohamed now.
            </p>
          )}
          {messages.map((m) =>
            m.sender === "system" ? (
              <p key={m.key} className="text-center text-[11px] text-[#8a2c2c]">
                {m.text}
              </p>
            ) : (
              <div key={m.key} className={`chat-pop flex ${m.sender === "visitor" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[82%] rounded-xl px-3 py-2 text-[13.5px] leading-snug shadow-sm ${
                    m.sender === "visitor"
                      ? "bg-[#d9fdd3] text-[#111b21] rounded-tr-sm"
                      : "bg-white text-[#111b21] rounded-tl-sm"
                  }`}
                >
                  {m.sender === "owner" && <p className="text-[11px] font-semibold text-[#075e54] mb-0.5">Mohamed</p>}
                  {m.sender === "agent" && <p className="text-[11px] font-semibold text-[#6b7c85] mb-0.5">AI assistant</p>}
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  <p className="mt-1 text-right text-[10px] text-[#667781]">
                    {mounted ? time(m.ts) : ""}
                    {m.sender === "visitor" && m.sent && <span className="ml-1 text-[#53bdeb]">✓✓</span>}
                  </p>
                </div>
              </div>
            )
          )}
          {typing && (
            <div className="flex justify-start">
              <div className="bg-white rounded-xl rounded-tl-sm px-3.5 py-3 shadow-sm flex gap-1" aria-label="Typing">
                <span className="typing-dot" />
                <span className="typing-dot" style={{ animationDelay: "0.15s" }} />
                <span className="typing-dot" style={{ animationDelay: "0.3s" }} />
              </div>
            </div>
          )}
          {onlyGreeting && (
            <div className="flex flex-wrap gap-2 pt-1">
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-[#075e54] bg-white border border-[#075e54]/25 hover:bg-[#075e54] hover:text-white transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 px-3 py-2.5"
          style={{ background: "#f0f2f5" }}
        >
          <label htmlFor="chat-input" className="sr-only">
            Message
          </label>
          <input
            id="chat-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={1000}
            placeholder="Type a message"
            autoComplete="off"
            className="flex-1 min-w-0 rounded-full bg-white px-4 py-2.5 text-sm text-[#111b21] placeholder:text-[#667781] outline-none focus:ring-2 focus:ring-[#25d366]/50"
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={!input.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition-opacity shrink-0"
            style={{ background: "#25d366" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a.993.993 0 00-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z" />
            </svg>
          </button>
        </form>
      </div>

      {/* teaser */}
      <div
        className={`fixed z-[60] right-[5.25rem] bottom-8 sm:right-[6.5rem] max-w-[220px] rounded-xl rounded-br-sm bg-white px-3.5 py-2.5 text-[13px] font-medium text-[#0c111d] shadow-lg transition-all duration-300 ${
          teaser && !open ? "opacity-100 translate-x-0" : "opacity-0 translate-x-3 pointer-events-none"
        }`}
        aria-hidden={!teaser || open}
      >
        Questions? Chat with me.
      </div>

      {/* floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat"}
        aria-expanded={open}
        className="chat-fab fixed z-[60] right-3 bottom-4 sm:right-6 sm:bottom-6 w-16 h-16 rounded-full flex items-center justify-center text-white shadow-[0_10px_30px_-6px_rgba(37,211,102,0.7)] hover:scale-105 active:scale-95 transition-transform"
        style={{ background: "#25d366" }}
      >
        <span className="fab-ring" aria-hidden />
        {open ? (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d={whatsappPath} />
          </svg>
        )}
        {unread > 0 && !open && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#e53935] text-[11px] font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
    </>
  );
}
