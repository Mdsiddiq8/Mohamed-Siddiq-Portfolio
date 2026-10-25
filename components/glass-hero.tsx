"use client";

import { INTRO_ENV } from "@/data/intro-envelope";
import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";
import {
  profile,
  navLinks,
  approach,
  projects,
  skillCategories,
  services,
  experience,
  certifications,
  languages,
  footerLinks,
  stats,
  type Project,
  type Skill,
} from "@/data/portfolio";
import { brandIcons } from "@/data/skill-icons";
import ChatWidget from "@/components/chat-widget";

gsap.registerPlugin(ScrollTrigger);

/* ────────────────────────────────────────────
   NAVBAR
   ──────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  return (
    <>
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/80 backdrop-blur-xl shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a
            href="#"
            className="font-bold text-lg tracking-tight"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            MS<span className="text-[#0055ff]">.</span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-gray-600 hover:text-[#0055ff] transition-colors"
              >
                {l.label}
              </a>
            ))}
            <a
              href={profile.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-white bg-[#0055ff] px-5 py-2 rounded-full hover:bg-[#0044cc] transition-colors"
            >
              Resume
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setDrawerOpen(!drawerOpen)}
            aria-label="Toggle menu"
          >
            <span
              className={`block w-6 h-0.5 bg-current transition-transform duration-300 ${
                drawerOpen ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-current transition-opacity duration-300 ${
                drawerOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-current transition-transform duration-300 ${
                drawerOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile drawer — always mounted for hydration safety */}
      <div
        className={`fixed inset-0 z-40 bg-white flex flex-col items-center justify-center gap-8 transition-all duration-300 md:hidden ${
          drawerOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {navLinks.map((l) => (
          <a
            key={l.href}
            href={l.href}
            onClick={() => setDrawerOpen(false)}
            className="text-2xl font-semibold text-gray-800 hover:text-[#0055ff] transition-colors"
          >
            {l.label}
          </a>
        ))}
        <a
          href={profile.resumeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg font-semibold text-white bg-[#0055ff] px-8 py-3 rounded-full hover:bg-[#0044cc] transition-colors"
        >
          Resume
        </a>
      </div>
    </>
  );
}

/* ────────────────────────────────────────────
   SECTION PILL
   ──────────────────────────────────────────── */
function SectionPill({ number, label }: { number: string; label: string }) {
  return (
    <span className="section-pill">
      {number} / {label}
    </span>
  );
}

/* ────────────────────────────────────────────
   TALKING PORTRAIT
   - If /videos/intro.mp4 exists: plays it (muted loop, tap to hear it)
   - Otherwise: the cutout "speaks" the intro using the browser voice
   ──────────────────────────────────────────── */
const INTRO_SCRIPT =
  "Hi, I'm Mohamed Siddiq, an AI Engineer from Chennai. I build RAG assistants, voice AI and multi-agent systems in Python. AI that can read your documents, speak your language and resolve real problems. Let's build something intelligent together.";

function TalkingPortrait() {
  // Start with the cutout; switch to the video only if /videos/intro.mp4 exists
  const [hasVideo, setHasVideo] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const speakingRef = useRef(false);
  const voicedRef = useRef(false);
  speakingRef.current = speaking;

  useEffect(() => {
    let cancelled = false;
    fetch("/videos/intro.mp4", { method: "HEAD" })
      .then((r) => {
        const type = r.headers.get("content-type") || "";
        if (!cancelled && r.ok && type.startsWith("video")) setHasVideo(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // chips react while he speaks
  useEffect(() => {
    document.documentElement.dataset.speaking = speaking ? "1" : "0";
    return () => {
      document.documentElement.dataset.speaking = "0";
    };
  }, [speaking]);

  // Draw the video through WebGL: the file stores colour (top) and transparency (bottom),
  // so he is cut out cleanly on every browser, with no frame and no blending tricks.
  useEffect(() => {
    if (!hasVideo) return;
    const cv = glRef.current;
    const video = videoRef.current;
    if (!cv || !video) return;
    const gl = cv.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) {
      setHasVideo(false);
      return;
    }
    const sh = (type: number, src: string) => {
      const o = gl.createShader(type)!;
      gl.shaderSource(o, src);
      gl.compileShader(o);
      return o;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, "attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}"));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER,
      "precision mediump float;varying vec2 uv;uniform sampler2D t;void main(){vec3 c=texture2D(t,vec2(uv.x,uv.y*.5)).rgb;float a=texture2D(t,vec2(uv.x,.5+uv.y*.5)).r;gl_FragColor=vec4(min(c,vec3(a)),a);}"));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    let raf = 0;
    let first = true;
    const render = () => {
      if (video.readyState >= 2 && video.videoWidth > 0) {
        try {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          if (first) {
            first = false;
            setReady(true);
          }
        } catch {
          /* ignore a dropped frame */
        }
      }
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [hasVideo]);

  // back to the silent loop
  const stopVoice = () => {
    const v = videoRef.current;
    if (!v) return;
    v.onended = null;
    v.muted = true;
    v.loop = true;
    setSpeaking(false);
    v.currentTime = 0;
    v.play().catch(() => {});
  };

  // play the intro WITH sound (needs a user gesture on most browsers)
  const startVoice = async (): Promise<boolean> => {
    const v = videoRef.current;
    if (!v) return false;
    v.muted = false;
    v.volume = 1;
    v.loop = false;
    v.currentTime = 0;
    v.onended = stopVoice;
    try {
      await v.play();
      voicedRef.current = true;
      setSpeaking(true);
      return true;
    } catch {
      // browser blocked sound: keep the silent loop and wait for a tap
      v.muted = true;
      v.loop = true;
      v.onended = null;
      v.play().catch(() => {});
      return false;
    }
  };

  // The intro speaks by itself as soon as the page opens.
  // Browsers only allow sound after the visitor has interacted once (tap, click or key press), so:
  //  1) try to speak immediately, 2) if blocked, the very first tap/key anywhere starts it,
  //  3) after that it speaks again every time he scrolls back to the top.
  useEffect(() => {
    if (!hasVideo) return;
    let unlocked = false;
    const onGesture = (e: Event) => {
      if ((e.target as Element | null)?.closest?.("[data-intro-btn]")) return; // the button handles itself
      if (unlocked || voicedRef.current) return;
      unlocked = true;
      cleanup();
      startVoice();
    };
    const cleanup = () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      window.removeEventListener("touchend", onGesture);
    };
    startVoice().then((ok) => {
      if (ok) {
        unlocked = true;
        cleanup();
      }
    });
    window.addEventListener("pointerdown", onGesture);
    window.addEventListener("keydown", onGesture);
    window.addEventListener("touchend", onGesture);
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasVideo]);

  // leaving the video stops the voice, coming back speaks again (once sound has been unlocked)
  useEffect(() => {
    const el = wrapRef.current;
    if (!hasVideo || !el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting && speakingRef.current) stopVoice();
        else if (e.isIntersecting && voicedRef.current && !speakingRef.current) startVoice();
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasVideo]);

  // Speaking effects: spectrum ring, ripples and halo, driven by the voice data synced to the video clock
  useEffect(() => {
    if (!hasVideo) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = canvas.getContext("2d");
    if (!g) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const BARS = 72;
    const NB = INTRO_ENV[0].length;
    const smooth = new Float32Array(BARS);
    const ripples: { r: number; a: number }[] = [];
    let level = 0;
    let lastBeat = 0;

    const draw = (t: number) => {
      g.clearRect(0, 0, w, h);
      const cx = w * 0.472; // his centre line in the video
      const cy = h * 0.45; // upper chest, behind the chair
      const base = h * 0.27;
      const v = videoRef.current;
      const live = speakingRef.current && !!v && !v.muted;
      let bands: number[] | null = null;
      if (live && v) {
        const idx = Math.min(INTRO_ENV.length - 1, Math.max(0, Math.round(v.currentTime * 24)));
        bands = INTRO_ENV[idx];
      }
      const raw = bands ? bands.reduce((s, x) => s + x, 0) / (bands.length * 99) : 0;
      level += (raw - level) * 0.3;

      // halo
      const idle = 0.07 + 0.02 * Math.sin(t / 900);
      const hr = base * (1.35 + level * 0.9);
      const grd = g.createRadialGradient(cx, cy, base * 0.2, cx, cy, hr);
      grd.addColorStop(0, `rgba(0,85,255,${(live ? 0.14 + level * 0.3 : idle).toFixed(3)})`);
      grd.addColorStop(0.55, `rgba(34,211,238,${(live ? 0.1 + level * 0.2 : idle * 0.6).toFixed(3)})`);
      grd.addColorStop(1, "rgba(34,211,238,0)");
      g.fillStyle = grd;
      g.beginPath();
      g.arc(cx, cy, hr, 0, Math.PI * 2);
      g.fill();

      if (!reduce) {
        if (live && level > 0.55 && t - lastBeat > 420) {
          ripples.push({ r: base, a: 0.45 });
          lastBeat = t;
        }
        for (let i = ripples.length - 1; i >= 0; i--) {
          const rp = ripples[i];
          rp.r += 2.2;
          rp.a -= 0.009;
          if (rp.a <= 0) {
            ripples.splice(i, 1);
            continue;
          }
          g.strokeStyle = `rgba(0,85,255,${rp.a.toFixed(3)})`;
          g.lineWidth = 2;
          g.beginPath();
          g.arc(cx, cy, rp.r, 0, Math.PI * 2);
          g.stroke();
        }

        for (let i = 0; i < BARS; i++) {
          const mirror = Math.abs(i - BARS / 2) / (BARS / 2); // 0..1, symmetrical
          const target = bands
            ? bands[Math.min(NB - 1, Math.floor(mirror * NB))] / 99
            : 0.04 + 0.03 * Math.sin(i * 0.5 + t / 500);
          smooth[i] += (target - smooth[i]) * 0.4;
          const ang = (i / BARS) * Math.PI * 2 - Math.PI / 2;
          const len = 6 + smooth[i] * h * 0.15;
          const x1 = cx + Math.cos(ang) * (base + 10);
          const y1 = cy + Math.sin(ang) * (base + 10);
          const x2 = cx + Math.cos(ang) * (base + 10 + len);
          const y2 = cy + Math.sin(ang) * (base + 10 + len);
          const lg = g.createLinearGradient(x1, y1, x2, y2);
          lg.addColorStop(0, "rgba(0,85,255,0.9)");
          lg.addColorStop(1, "rgba(34,211,238,0.85)");
          g.strokeStyle = lg;
          g.lineWidth = 3;
          g.lineCap = "round";
          g.beginPath();
          g.moveTo(x1, y1);
          g.lineTo(x2, y2);
          g.stroke();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [hasVideo]);

  const toggle = async () => {
    const v = videoRef.current;
    if (hasVideo && v) {
      if (speakingRef.current && !v.muted) {
        stopVoice();
      } else {
        await startVoice();
      }
      return;
    }
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    if (synth.speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(INTRO_SCRIPT);
    u.lang = "en-IN";
    u.rate = 1;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(u);
  };

  return (
    <div ref={wrapRef} className="relative w-full max-w-[520px] mx-auto lg:ml-auto">
      {hasVideo ? (
        <div className="relative w-[138%] max-w-none -ml-[19%]">
          <canvas
            ref={canvasRef}
            aria-hidden
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
          <img
            src="/images/intro-poster.png"
            alt="Mohamed Siddiq, AI Engineer"
            draggable={false}
            className={`relative w-full h-auto select-none pointer-events-none transition-opacity duration-300 ${ready ? "opacity-0" : "opacity-100"}`}
            style={{ aspectRatio: "16 / 9" }}
          />
          <canvas
            ref={glRef}
            width={1280}
            height={720}
            role="img"
            aria-label="Mohamed Siddiq introducing himself"
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              WebkitMaskImage: "linear-gradient(to bottom, #000 97%, transparent 100%)",
              maskImage: "linear-gradient(to bottom, #000 97%, transparent 100%)",
            }}
          />
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            onError={() => setHasVideo(false)}
            className="absolute left-0 top-0 w-px h-px opacity-0 pointer-events-none"
          >
            <source src="/videos/intro.mp4" type="video/mp4" />
          </video>
        </div>
      ) : (
        <img
          src="/images/mohamed-cutout.png"
          alt="Mohamed Siddiq, AI Engineer"
          className={`w-full h-auto select-none ${speaking ? "speaking-bob" : ""}`}
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom, #000 72%, transparent 100%)",
            maskImage: "linear-gradient(to bottom, #000 72%, transparent 100%)",
          }}
          draggable={false}
        />
      )}

      {/* Play / speaking control */}
      <button
        data-intro-btn
        onClick={toggle}
        aria-label={speaking ? "Stop intro" : "Play intro with sound"}
        className="absolute left-1/2 -translate-x-1/2 -bottom-4 z-10 flex items-center gap-3 px-5 py-3 rounded-full bg-[#0c111d]/90 text-white backdrop-blur-md hover:bg-[#0c111d] transition-colors pulse-glow"
      >
        {speaking ? (
          <span className="flex items-end gap-[3px] h-4" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="wave-bar w-[3px] bg-[#22d3ee] rounded-full"
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </span>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        )}
        <span
          className="text-xs font-semibold tracking-wider uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {speaking ? "Speaking…" : "Tap for sound"}
        </span>
      </button>
    </div>
  );
}

/* ────────────────────────────────────────────
   HERO SECTION
   ──────────────────────────────────────────── */
function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#0055ff] hover:border-[#0055ff] transition-colors"
    >
      {children}
    </a>
  );
}

/* Scroll progress bar (top of page) */
function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return (
    <div className="fixed top-0 inset-x-0 z-[70] h-[3px] pointer-events-none" aria-hidden>
      <div
        ref={barRef}
        className="h-full origin-left bg-gradient-to-r from-[#0055ff] via-[#7c3aed] to-[#22d3ee]"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}

/* Count-up number: shows the final value at rest, counts up when scrolled into view */
function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useGSAP(() => {
    const m = value.match(/^(\d+)(.*)$/);
    if (!m || !ref.current) return;
    const el = ref.current;
    const target = parseInt(m[1], 10);
    const suffix = m[2];
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const o = { v: 0 };
      el.textContent = `0${suffix}`;
      gsap.to(o, {
        v: target,
        duration: 1.4,
        ease: "power2.out",
        snap: { v: 1 },
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
        onUpdate: () => {
          el.textContent = `${Math.round(o.v)}${suffix}`;
        },
        onComplete: () => {
          el.textContent = value;
        },
      });
    });
  }, [value]);
  return <span ref={ref}>{value}</span>;
}

/* Cycles through what he builds */
const ROLE_WORDS = ["RAG pipelines", "Prompt-engineered workflows", "Voice AI assistants", "Multi-agent systems", "LLM apps in Python"];
function RotatingWords() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % ROLE_WORDS.length), 2400);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="inline-flex gap-2 items-baseline">
      <span className="text-gray-400">I build</span>
      <span key={i} className="word-in text-[#0055ff]">
        {ROLE_WORDS[i]}
      </span>
    </span>
  );
}

const HERO_CHIPS: { label: string; skill: Skill; accent: string; pos: string; depth: number; float: string }[] = [
  { label: "Python", skill: { name: "Python", brand: "python" }, accent: "#2563eb", pos: "top-[6%] left-2", depth: 26, float: "float-1" },
  { label: "RAG", skill: { name: "RAG", glyph: "search" }, accent: "#d97706", pos: "top-[27%] left-2", depth: 34, float: "float-5" },
  { label: "Prompt Engineering", skill: { name: "Prompt Engineering", glyph: "ai" }, accent: "#0891b2", pos: "top-[6%] right-2", depth: 24, float: "float-5" },
  { label: "LLM", skill: { name: "LLM", glyph: "ai" }, accent: "#059669", pos: "top-[40%] right-0", depth: 38, float: "float-2" },
  { label: "Voice AI", skill: { name: "Voice AI", glyph: "ai" }, accent: "#7c3aed", pos: "top-[58%] left-0", depth: 30, float: "float-3" },
  { label: "Multi-agent", skill: { name: "Multi-agent", glyph: "agent" }, accent: "#db2777", pos: "bottom-[14%] right-0", depth: 20, float: "float-4" },
];

function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.from(".hero-eyebrow", { y: 20, opacity: 0, duration: 0.6, delay: 0.2 })
          .from(
            ".hero-char",
            { yPercent: 115, rotate: 8, opacity: 0, duration: 1, stagger: 0.07, ease: "expo.out" },
            "-=0.3"
          )
          .from(".hero-role", { y: 40, opacity: 0, duration: 0.7 }, "-=0.6")
          .from(".hero-sub", { y: 30, opacity: 0, duration: 0.6 }, "-=0.4")
          .from(".hero-cta", { y: 30, opacity: 0, duration: 0.6 }, "-=0.3")
          .from(".hero-portrait", { x: 60, opacity: 0, duration: 1 }, "-=1.2")
          .from(".hero-chip", { scale: 0.6, opacity: 0, duration: 0.6, stagger: 0.12, ease: "back.out(2)" }, "-=0.4");

        // cursor parallax on the floating chips (fine pointers only)
        if (window.matchMedia("(pointer: fine)").matches && sectionRef.current) {
          const section = sectionRef.current;
          const onMove = (e: PointerEvent) => {
            const r = section.getBoundingClientRect();
            const nx = (e.clientX - r.left) / r.width - 0.5;
            const ny = (e.clientY - r.top) / r.height - 0.5;
            gsap.utils.toArray<HTMLElement>(".parallax-chip").forEach((el) => {
              const d = Number(el.dataset.depth || 20);
              gsap.to(el, { x: nx * d * 2, y: ny * d * 2, duration: 0.8, ease: "power3.out", overwrite: "auto" });
            });
          };
          section.addEventListener("pointermove", onMove);
          return () => section.removeEventListener("pointermove", onMove);
        }
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center bg-[#eef0f4] grid-overlay noise-bg overflow-hidden pt-24 pb-12"
    >
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#0055ff]/10 rounded-full blur-3xl float-1" />
      <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-[#22d3ee]/10 rounded-full blur-3xl float-2" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-10 items-center">
        {/* Left: name + role */}
        <div>
          <p
            className="hero-eyebrow text-xs sm:text-sm font-bold tracking-[0.25em] uppercase text-gray-500 mb-4"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Hello, I&apos;m
          </p>

          <h1
            aria-label="MOHAMED."
            className="hero-headline whitespace-nowrap text-6xl sm:text-7xl lg:text-8xl xl:text-[7rem] font-extrabold leading-[0.95] tracking-tight text-[#0055ff]"
          >
            {"MOHAMED.".split("").map((ch, i) => (
              <span key={i} aria-hidden className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]">
                <span className="hero-char inline-block">{ch}</span>
              </span>
            ))}
          </h1>

          <div className="hero-role mt-5">
            <p className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0c111d]">
              AI Engineer<span className="text-[#0055ff]">.</span>
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              {["GenAI Engineer", "Prompt Engineer"].map((r, k) => (
                <span
                  key={r}
                  className="inline-flex items-center gap-2 rounded-full border border-[#0055ff]/15 bg-white/80 backdrop-blur px-4 py-1.5 text-[13px] font-semibold text-[#0c111d] shadow-[0_6px_18px_-10px_rgba(0,85,255,.45)]"
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${k ? "bg-[#7c3aed]" : "bg-[#0055ff]"}`} />
                  {r}
                </span>
              ))}
            </div>
            <div
              className="mt-4 inline-flex items-center gap-3 rounded-xl border border-gray-200/80 bg-white/60 px-4 py-2.5 text-[12px] sm:text-[13px] font-semibold tracking-wide uppercase text-gray-500"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <span className="text-[#0055ff]">&gt;</span>
              <RotatingWords />
            </div>
          </div>

          <p className="hero-sub mt-6 text-base sm:text-lg text-gray-600 max-w-lg leading-relaxed">
            I build digital intelligence that{" "}
            <span className="font-semibold text-[#0c111d]">thinks, speaks</span>{" "}
            &amp; <span className="font-semibold text-[#0c111d]">performs</span>{" "}
            — AI that reads your documents, speaks your language and resolves
            real problems.
          </p>

          <div className="hero-cta mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#work"
              className="px-7 py-3.5 bg-[#0c111d] text-white font-semibold rounded-full hover:bg-[#0055ff] transition-colors text-sm"
            >
              View My Work
            </a>
          </div>

          <div className="hero-cta mt-8 flex items-center gap-3">
            <SocialIcon href={footerLinks.linkedin} label="LinkedIn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9.75h4v11.25H3V9.75zm6.5 0h3.83v1.54h.06c.53-1 1.84-2.06 3.78-2.06 4.04 0 4.78 2.66 4.78 6.1v5.67h-4v-5.03c0-1.2-.02-2.74-1.67-2.74-1.67 0-1.93 1.3-1.93 2.65v5.12h-4V9.75z" />
              </svg>
            </SocialIcon>
            <SocialIcon href={footerLinks.github} label="GitHub">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 015.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0023.5 12C23.5 5.65 18.35.5 12 .5z" />
              </svg>
            </SocialIcon>
            <SocialIcon href={`mailto:${footerLinks.email}`} label="Email">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 7l9 6 9-6" />
              </svg>
            </SocialIcon>
          </div>
        </div>

        {/* Right: talking portrait */}
        <div className="hero-portrait relative">
          <TalkingPortrait />
          {HERO_CHIPS.map((c) => (
            <div
              key={c.label}
              data-depth={c.depth}
              className={`parallax-chip hero-chip absolute hidden sm:block ${c.pos}`}
            >
              <span
                className={`${c.float} inline-flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur text-xs font-bold text-[#0c111d] shadow-[0_10px_30px_-10px_rgba(15,23,42,0.35)] border border-white`}
              >
                <SkillIcon skill={c.skill} accent={c.accent} />
                {c.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────
   IDENTITY SECTION: bio + stats
   ──────────────────────────────────────────── */
function IdentitySection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from(".identity-card", {
        scrollTrigger: {
          trigger: ".identity-card",
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
        y: 60,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="py-24 sm:py-32 bg-white" id="identity">
      <div className="max-w-7xl mx-auto px-6">
        <div className="identity-card grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionPill number="00" label="WHO I AM" />
            <h2 className="mt-6 text-4xl sm:text-5xl font-extrabold text-[#0c111d] leading-tight">
              Building Real
              <br />
              <span className="text-[#0055ff]">Intelligent Systems.</span>
            </h2>
            <p className="mt-6 text-gray-500 leading-relaxed">
              {profile.summary}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {languages.map((lang) => (
                <span
                  key={lang}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-gray-100 bg-[#fafbfc] p-6"
              >
                <p className="text-4xl font-extrabold text-[#0055ff]">
                  <CountUp value={s.value} />
                </p>
                <p className="mt-2 text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────
   APPROACH SECTION
   ──────────────────────────────────────────── */
function ApproachSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from(".approach-card", {
        scrollTrigger: {
          trigger: ".approach-cards",
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
        y: 50,
        opacity: 0,
        stagger: 0.15,
        duration: 0.7,
        ease: "power3.out",
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="py-24 sm:py-32 bg-[#fafbfc] grid-overlay noise-bg relative"
      id="approach"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <SectionPill number={approach.number} label="THE APPROACH" />
          <h2 className="mt-6 text-3xl sm:text-4xl font-bold text-[#0c111d]">
            From Problem to Production AI
          </h2>
          <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
            Every project follows a battle-tested methodology — discover the
            real problem, architect the right solution, ship code that works at
            scale.
          </p>
        </div>

        <div className="approach-cards grid md:grid-cols-3 gap-8">
          {approach.steps.map((step, i) => (
            <div
              key={i}
              className="approach-card bg-white rounded-2xl p-8 border border-gray-100 hover:border-[#0055ff]/20 hover:shadow-lg transition-[border-color,box-shadow] duration-300 group"
            >
              <div className="text-4xl mb-6">{step.icon}</div>
              <div
                className="text-xs font-bold text-[#0055ff]/40 mb-3"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                STEP {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="text-xl font-bold text-[#0c111d] mb-3">
                {step.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────
   PROJECT CARD with 3D Tilt
   ──────────────────────────────────────────── */

/* ── Project technologies: official logo where one exists, otherwise a tuned icon + colour ── */
const TECH_STYLE: Record<string, { brand?: string; glyph?: string; color: string }> = {
  Python: { brand: "python", color: "#3776AB" },
  Streamlit: { brand: "streamlit", color: "#FF4B4B" },
  "OpenAI API": { brand: "openai", color: "#10A37F" },
  OpenAI: { brand: "openai", color: "#10A37F" },
  "GPT-4o-mini": { glyph: "ai", color: "#10A37F" },
  "GPT-4o": { glyph: "ai", color: "#10A37F" },
  "o3-mini": { glyph: "bolt", color: "#0d9488" },
  Whisper: { glyph: "mic", color: "#0891b2" },
  "TTS-1-HD": { glyph: "wave", color: "#0d9488" },
  LangChain: { brand: "langchain", color: "#1C9BD6" },
  ChromaDB: { glyph: "db", color: "#F59E0B" },
  BM25Okapi: { glyph: "search", color: "#EA580C" },
  Pydub: { glyph: "wave", color: "#6366f1" },
  FastAPI: { brand: "fastapi", color: "#009688" },
  CrewAI: { brand: "crewai", color: "#FF5A50" },
  "Gemini API": { brand: "gemini", color: "#8E75B2" },
  SQLite: { brand: "sqlite", color: "#0F80CC" },
  PostgreSQL: { brand: "postgresql", color: "#4169E1" },
  "HTML/JS": { brand: "html5", color: "#E34F26" },
  "Microsoft AutoGen": { glyph: "agent", color: "#0078D4" },
  "Azure OpenAI": { glyph: "cloud", color: "#0078D4" },
  Pandas: { brand: "pandas", color: "#150458" },
  FuzzyWuzzy: { glyph: "search", color: "#8b5cf6" },
};

function techOf(name: string) {
  const t = TECH_STYLE[name] ?? { glyph: "ai", color: "#2563eb" };
  const skill: Skill = { name, brand: t.brand, glyph: t.glyph };
  return { skill, color: t.color };
}

// where the floating logos sit in a project's header
const BUBBLE_POS = [
  "top-[14%] left-[8%]",
  "top-[10%] right-[12%]",
  "bottom-[16%] left-[14%]",
  "bottom-[12%] right-[8%]",
  "top-[44%] left-[3%]",
  "top-[40%] right-[3%]",
];

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform =
      "perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)";
  }, []);

  return (
    <div
      ref={cardRef}
      className="project-card sheen bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-gray-200 transition-[border-color,box-shadow] duration-500 cursor-pointer group"
      style={{ transformStyle: "preserve-3d", transition: "transform 0.3s ease", ["--glow" as string]: `${project.color}66` }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Colourful header: gradient mesh, big number and the project's logos floating around it */}
      <div
        className="aspect-[16/9] relative overflow-hidden"
        style={{
          background: `radial-gradient(circle at 20% 20%, ${project.color}40, transparent 55%), radial-gradient(circle at 85% 80%, ${project.color}33, transparent 55%), linear-gradient(135deg, ${project.color}22, ${project.color}0a)`,
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-1.5"
          style={{ background: `linear-gradient(90deg, ${project.color}, ${project.color}55)` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
            style={{ background: `linear-gradient(135deg, ${project.color}, ${project.color}bb)`, boxShadow: `0 18px 40px -12px ${project.color}99` }}
          >
            {String(index + 1).padStart(2, "0")}
          </div>
        </div>
        {project.tech.slice(0, BUBBLE_POS.length).map((name, i) => {
          const { skill, color } = techOf(name);
          return (
            <span
              key={name}
              className={`absolute ${BUBBLE_POS[i]} float-${(i % 6) + 1} ${i >= 4 ? "hidden sm:block" : ""}`}
              style={{ ["--c" as string]: color }}
            >
              <span
                className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-white/95 text-[11px] font-bold text-slate-700 shadow-md border"
                style={{ borderColor: `${color}40` }}
              >
                <SkillIcon skill={skill} accent={color} />
                {name}
              </span>
            </span>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-6 sm:p-8">
        <p
          className="text-xs font-bold tracking-wider uppercase mb-2"
          style={{ color: project.color, fontFamily: "var(--font-mono)" }}
        >
          {project.subtitle}
        </p>
        <h3 className="text-xl sm:text-2xl font-bold text-[#0c111d] mb-3">
          {project.title}
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-2 font-medium">
          {project.overview}
        </p>
        <ul className="text-gray-500 text-sm leading-relaxed mb-6 space-y-1.5 list-disc list-inside">
          {project.description.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
        <p className="text-[11px] font-bold tracking-wider uppercase text-gray-400 mb-3" style={{ fontFamily: "var(--font-mono)" }}>
          Built with · {project.tech.length} technologies
        </p>
        <div className="flex flex-wrap gap-2">
          {project.tech.map((t) => {
            const { skill, color } = techOf(t);
            return (
              <span
                key={t}
                className="skill-chip inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 bg-white cursor-default"
                style={{ ...chipVars(color), backgroundColor: `${color}0d` }}
              >
                <SkillIcon skill={skill} accent={color} />
                {t}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   SHOWCASE / PROJECTS SECTION
   ──────────────────────────────────────────── */
function ShowcaseSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from(".project-card", {
        scrollTrigger: {
          trigger: ".projects-grid",
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
        y: 60,
        opacity: 0,
        stagger: 0.2,
        duration: 0.8,
        ease: "power3.out",
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="py-24 sm:py-32 bg-white"
      id="work"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <SectionPill number="02" label="SELECTED AI WORK" />
          <h2 className="mt-6 text-3xl sm:text-4xl font-bold text-[#0c111d]">
            Projects That Think
          </h2>
          <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
            Each project is built end-to-end in Python — from data ingestion and
            vector indexing to agent orchestration and production deployment.
          </p>
        </div>

        <div className="projects-grid grid md:grid-cols-2 gap-8">
          {projects.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────
   AI STACK SECTION
   ──────────────────────────────────────────── */
const GLYPHS: Record<string, React.ReactNode> = {
  ai: (<><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" /><path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z" /></>),
  db: (<><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" /><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></>),
  cloud: (<path d="M7 18a4 4 0 010-8 5.5 5.5 0 0110.6 1.5A3.3 3.3 0 0117 18z" />),
  agent: (<><rect x="5" y="8" width="14" height="10" rx="3" /><path d="M12 4v4M9 13h.01M15 13h.01M9 21h6" /></>),
  api: (<><path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" /></>),
  bug: (<><rect x="8" y="8" width="8" height="11" rx="4" /><path d="M12 8V5M8 12H4M16 12h4M8 17l-3 2M16 17l3 2M9 5l1.5 2M15 5l-1.5 2" /></>),
  search: (<><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.5-4.5" /></>),
  pipeline: (<><circle cx="5" cy="12" r="2" /><circle cx="19" cy="6" r="2" /><circle cx="19" cy="18" r="2" /><path d="M7 12h4c3 0 3-6 6-6M11 12c3 0 3 6 6 6" /></>),
  check: (<><circle cx="12" cy="12" r="8" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></>),
  bolt: (<path d="M13 3L5 13h6l-1 8 8-10h-6z" />),
  shield: (<><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" /><path d="M9 12l2 2 4-4" /></>),
  users: (<><circle cx="9" cy="9" r="3" /><circle cx="17" cy="10" r="2.3" /><path d="M3.5 19c.5-3 2.8-5 5.5-5s5 2 5.5 5M15 15c2.5-.3 4.7 1.2 5.5 4" /></>),
  mic: (<><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0014 0M12 18v3M9 21h6" /></>),
  wave: (<path d="M3 12h2M7 8v8M11 5v14M15 8v8M19 10v4M21 12h0" />),
  bulb: (<><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z" /></>),
};

// One accent per category, tuned for a light background
const ACCENTS = [
  "#2563eb", // Languages & APIs
  "#7c3aed", // Generative AI
  "#059669", // LangChain & Agentic AI
  "#d97706", // RAG & Vector Search
  "#db2777", // AI Models & Data
  "#0284c7", // Cloud & DevOps
  "#475569", // Quality & Teamwork
];

function skillColor(skill: Skill, accent: string) {
  const brand = skill.brand ? brandIcons[skill.brand] : undefined;
  return brand ? `#${brand.hex}` : accent;
}

function SkillIcon({ skill, accent }: { skill: Skill; accent: string }) {
  const brand = skill.brand ? brandIcons[skill.brand] : undefined;
  const color = skillColor(skill, accent);
  return (
    <span
      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
      style={{ backgroundColor: `${color}1a` }}
      aria-hidden
    >
      {brand ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill={color}>
          <path d={brand.path} />
        </svg>
      ) : (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {GLYPHS[skill.glyph || "ai"]}
        </svg>
      )}
    </span>
  );
}

type AccentSkill = { skill: Skill; accent: string };

function chipVars(color: string): React.CSSProperties {
  return {
    ["--c" as string]: color,
    ["--bc" as string]: `${color}33`,
    ["--glow" as string]: `${color}40`,
  };
}

function MarqueeRow({
  items,
  reverse,
  seconds,
}: {
  items: AccentSkill[];
  reverse?: boolean;
  seconds: number;
}) {
  return (
    <div className="marquee-mask overflow-hidden py-1.5">
      <div
        className={`marquee-track ${reverse ? "marquee-reverse" : ""}`}
        style={{ animationDuration: `${seconds}s` }}
      >
        {[...items, ...items].map(({ skill, accent }, i) => (
          <span
            key={i}
            aria-hidden={i >= items.length}
            className="marquee-chip inline-flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-full bg-white text-sm font-semibold text-[#0c111d] whitespace-nowrap"
            style={chipVars(skillColor(skill, accent))}
          >
            <SkillIcon skill={skill} accent={accent} />
            {skill.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function SkillCard({
  category,
  skills,
  accent,
  className = "",
}: {
  category: string;
  skills: Skill[];
  accent: string;
  className?: string;
}) {
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div
      onPointerMove={onMove}
      className={`stack-category group relative overflow-hidden rounded-2xl p-6 bg-white border border-gray-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_18px_40px_-18px_rgba(15,23,42,0.25)] transition-shadow duration-300 ${className}`}
    >
      {/* accent bar */}
      <span
        className="absolute left-0 top-0 h-full w-1"
        style={{ background: accent }}
        aria-hidden
      />
      {/* mouse-follow spotlight */}
      <span
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(300px circle at var(--mx, 50%) var(--my, 50%), ${accent}1f, transparent 65%)`,
        }}
        aria-hidden
      />
      <h3
        className="relative text-xs font-bold mb-5 tracking-[0.18em] uppercase"
        style={{ fontFamily: "var(--font-mono)", color: accent }}
      >
        {category}
      </h3>
      <div className="relative flex flex-wrap gap-2">
        {skills.map((s) => (
          <span
            key={s.name}
            className="skill-chip inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 bg-white cursor-default"
            style={chipVars(skillColor(s, accent))}
          >
            <SkillIcon skill={s} accent={accent} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function StackSection() {
  const sectionRef = useRef<HTMLElement>(null);

  // flatten + dedupe for the marquee and the count line
  const all: AccentSkill[] = [];
  const seen = new Set<string>();
  skillCategories.forEach((cat, ci) => {
    cat.skills.forEach((skill) => {
      if (!seen.has(skill.name)) {
        seen.add(skill.name);
        all.push({ skill, accent: ACCENTS[ci % ACCENTS.length] });
      }
    });
  });
  const rowA = all.filter((_, i) => i % 2 === 0);
  const rowB = all.filter((_, i) => i % 2 === 1);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".stack-head > *", {
          opacity: 0,
          y: 16,
          stagger: 0.1,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: { trigger: ".stack-head", start: "top 85%" },
        });
        gsap.from(".stack-category", {
          opacity: 0,
          y: 30,
          stagger: 0.1,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: { trigger: ".stack-grid", start: "top 88%" },
        });
        gsap.set(".skill-chip", { opacity: 0, y: 10, scale: 0.9 });
        ScrollTrigger.batch(".skill-chip", {
          start: "top 95%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              scale: 1,
              stagger: 0.035,
              duration: 0.45,
              ease: "back.out(1.5)",
              clearProps: "transform",
            }),
        });
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="py-24 sm:py-32 bg-[#f6f8fc] grid-overlay noise-bg relative overflow-hidden"
      id="stack"
    >
      <div className="absolute -top-24 left-1/4 w-96 h-96 bg-[#0055ff]/10 rounded-full blur-3xl float-1" />
      <div className="absolute top-1/2 -right-24 w-96 h-96 bg-[#7c3aed]/10 rounded-full blur-3xl float-3" />
      <div className="absolute -bottom-24 left-0 w-96 h-96 bg-[#22d3ee]/10 rounded-full blur-3xl float-2" />

      <div className="relative z-10">
        <div className="stack-head text-center mb-12 px-6">
          <SectionPill number="03" label="SKILLS" />
          <h2 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight heading-shimmer">
            Skills
          </h2>
          <p className="mt-5 text-gray-500 max-w-2xl mx-auto">
            A full-spectrum AI engineering toolkit — from LLM APIs and agent
            frameworks to vector databases and cloud infrastructure.
          </p>
          <p
            className="mt-4 text-xs font-bold tracking-[0.2em] uppercase text-[#0055ff]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {all.length} skills · {skillCategories.length} domains
          </p>
        </div>

        {/* Animated logo marquee */}
        <div className="mb-14 space-y-1" aria-label="Skills overview">
          <MarqueeRow items={rowA} seconds={55} />
          <MarqueeRow items={rowB} seconds={65} reverse />
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="stack-grid grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {skillCategories.map((cat, ci) => (
              <SkillCard
                key={cat.category}
                category={cat.category}
                skills={cat.skills}
                accent={ACCENTS[ci % ACCENTS.length]}
                className={
                  ci === skillCategories.length - 1 &&
                  skillCategories.length % 3 === 1
                    ? "lg:col-span-3"
                    : ""
                }
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────
   EXPERIENCE SECTION
   ──────────────────────────────────────────── */
function ExperienceSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from(".exp-item", {
        scrollTrigger: {
          trigger: ".exp-timeline",
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
        x: -40,
        opacity: 0,
        stagger: 0.2,
        duration: 0.7,
        ease: "power3.out",
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="py-24 sm:py-32 bg-white"
      id="experience"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <SectionPill number="04" label="EXPERIENCE" />
          <h2 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#0c111d]">
            Experience<span className="text-[#0055ff]">.</span>
          </h2>
        </div>

        <div className="exp-timeline max-w-4xl mx-auto space-y-14">
          {experience.map((exp, i) => (
            <div key={i} className="exp-item relative pl-8 border-l-2 border-gray-200">
              <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-[#0055ff] border-4 border-white" />
              <span
                className="text-sm font-bold text-[#0055ff] tracking-wider"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {exp.period}
              </span>
              <h3 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#0c111d]">
                {exp.role}
              </h3>
              <p className="mt-1 text-base sm:text-lg text-gray-500 font-medium">
                {exp.company}
                {(exp as any).cgpa && (
                  <span className="ml-2 text-[#0055ff]">
                    | CGPA: {(exp as any).cgpa}
                  </span>
                )}
              </p>
              <p className="mt-4 text-gray-600 text-base sm:text-lg leading-relaxed">
                {exp.description}
              </p>
            </div>
          ))}
        </div>

        {/* Certifications */}
        <div className="mt-20 text-center">
          <h3
            className="text-sm font-bold text-[#0055ff] tracking-wider uppercase mb-6"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Certifications
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {certifications.map((cert) => (
              <div
                key={cert.title}
                className="px-5 py-3 rounded-xl bg-gray-50 border border-gray-100"
              >
                <p className="text-sm font-semibold text-[#0c111d]">
                  {cert.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{cert.issuer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────
   SERVICES SECTION
   ──────────────────────────────────────────── */
function ServicesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from(".service-card", {
        scrollTrigger: {
          trigger: ".services-grid",
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
        y: 40,
        opacity: 0,
        stagger: 0.12,
        duration: 0.6,
        ease: "power3.out",
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="py-24 sm:py-32 bg-[#fafbfc] grid-overlay noise-bg relative"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <SectionPill number="05" label="SERVICES" />
          <h2 className="mt-6 text-3xl sm:text-4xl font-bold text-[#0c111d]">
            What I Can Build For You
          </h2>
          <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
            End-to-end AI solutions — from proof of concept to production
            deployment.
          </p>
        </div>

        <div className="services-grid grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {services.map((s, i) => (
            <div
              key={i}
              className="service-card bg-white rounded-2xl p-8 border border-gray-100 hover:border-[#0055ff]/20 hover:shadow-lg transition-[border-color,box-shadow] duration-300"
            >
              <div className="text-4xl mb-4">{s.icon}</div>
              <h3 className="text-lg font-bold text-[#0c111d] mb-2">
                {s.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────
   CONTACT / FOOTER
   ──────────────────────────────────────────── */
function Footer() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from(".footer-content", {
        scrollTrigger: {
          trigger: ".footer-content",
          start: "top 90%",
          toggleActions: "play none none reverse",
        },
        y: 40,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
      });
    },
    { scope: sectionRef }
  );

  return (
    <footer
      ref={sectionRef}
      className="bg-[#050507] text-white py-24 sm:py-32"
      id="contact"
    >
      <div className="footer-content max-w-7xl mx-auto px-6 text-center">
        <SectionPill number="06" label="GET IN TOUCH" />
        <h2 className="mt-8 text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight">
          Have something ambitious
          <br />
          in mind? <span className="text-[#0055ff]">Let&apos;s build it.</span>
        </h2>
        <p className="mt-6 text-gray-400 max-w-xl mx-auto">
          IHave an AI project in mind? I&apos;d love to discuss how RAG, voice AIapos;d love to discuss how RAG, voice AI
          or multi-agent systems can solve your business challenges.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={`mailto:${footerLinks.email}`}
            className="px-8 py-3.5 bg-[#0055ff] text-white font-semibold rounded-full hover:bg-[#0044cc] transition-colors text-sm"
          >
            Say Hello
          </a>
          <a
            href={footerLinks.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3.5 border border-white/20 text-white/80 font-semibold rounded-full hover:border-[#0055ff] hover:text-white transition-colors text-sm"
          >
            LinkedIn
          </a>
          <a
            href={footerLinks.github}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3.5 border border-white/20 text-white/80 font-semibold rounded-full hover:border-[#0055ff] hover:text-white transition-colors text-sm"
          >
            GitHub
          </a>
        </div>

        {/* Bottom bar */}
        <div className="mt-20 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Mohamed Siddiq. All rights
            reserved.
          </p>
          <p
            className="text-xs text-gray-600"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Built with Next.js + GSAP + Python-powered AI
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ────────────────────────────────────────────
   MAIN GLASS HERO COMPONENT
   ──────────────────────────────────────────── */
export default function GlassHero() {
  // Initialize Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    lenis.on("scroll", ScrollTrigger.update);

    // Layout keeps changing while images, fonts and the intro video load, which leaves the scroll
    // animations with stale positions (cards that never appear). Re-measure whenever the page height changes.
    let refreshTimer: number | undefined;
    const refresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
    };
    const ro = new ResizeObserver(refresh);
    ro.observe(document.body);
    window.addEventListener("load", refresh);
    refresh();
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      ro.disconnect();
      window.removeEventListener("load", refresh);
      window.clearTimeout(refreshTimer);
      lenis.destroy();
      gsap.ticker.remove(tick);
    };
  }, []);

  return (
    <main>
      <ScrollProgress />
      <Navbar />
      <HeroSection />
      <IdentitySection />
      <ApproachSection />
      <ShowcaseSection />
      <StackSection />
      <ExperienceSection />
      <ServicesSection />
      <Footer />
      <ChatWidget />
    </main>
  );
}
