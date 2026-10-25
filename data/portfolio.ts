export const profile = {
  name: "Mohamed Siddiq",
  role: "AI Engineer",
  tagline: "GenAI Engineer",
  location: "Chennai, India",
  email: "mohamedsiddiq092@gmail.com",
  heroHeadline: "I Build AI That\nThinks, Speaks &\nSolves.",
  heroSub:
    "AI Engineer crafting RAG assistants, voice AI and multi-agent systems in Python — intelligence that reads your documents, speaks your language and resolves real problems.",
  resumeUrl: "/resume/Mohamed_Siddiq_Resume.pdf",
  summary:
    "AI Engineer and 2026 B.Tech graduate in Artificial Intelligence & Data Science, building end-to-end LLM applications in Python: RAG pipelines with vector databases, multi-agent systems and voice AI using LangChain, LlamaIndex, FastAPI, ChromaDB, and OpenAI, Azure OpenAI and Gemini models. Backed by 3 years of end-to-end digital marketing experience across Google Ads, Meta Ads and sales lead generation.",
};

export const stats = [
  { value: "4", label: "AI systems built end-to-end in Python" },
  { value: "7", label: "Indian languages in the Voice RAG assistant" },
  { value: "3 yrs", label: "Digital marketing & lead generation" },
  { value: "4", label: "Professional certifications" },
];

export const navLinks = [
  { label: "Approach", href: "#approach" },
  { label: "Work", href: "#work" },
  { label: "Skills", href: "#stack" },
  { label: "Experience", href: "#experience" },
  { label: "Contact", href: "#contact" },
];

export const approach = {
  title: "The Approach",
  number: "01",
  steps: [
    {
      icon: "🔍",
      title: "Discover & Define",
      desc: "Deep-dive into business context, data landscape and user pain points to frame the right AI problem.",
    },
    {
      icon: "🧠",
      title: "Architect & Prototype",
      desc: "Design retrieval pipelines, agent graphs and voice flows — then validate with rapid prototypes before committing to production.",
    },
    {
      icon: "⚡",
      title: "Build & Ship",
      desc: "Production-grade Python code with vector stores, guardrails and observability — deployed on cloud, monitored and iterated.",
    },
  ],
};

export interface Project {
  id: string;
  title: string;
  subtitle: string;
  overview: string;
  description: string[];
  tech: string[];
  color: string;
  image: string;
  github?: string;
}

export const projects: Project[] = [
  {
    id: "hybrid-voice-rag",
    title: "Hybrid Voice RAG AI Assistant",
    subtitle: "Voice + Retrieval Augmented Generation",
    overview:
      "Voice and text assistant that answers questions from users' own uploaded documents, in 7 Indian languages.",
    description: [
      "Engineered an end-to-end voice-enabled RAG assistant with a document ingestion and indexing pipeline, supporting real-time spoken and text interaction over uploaded documents.",
      "Built a high-recall hybrid retrieval engine combining dense semantic search (ChromaDB) and sparse keyword matching (BM25Okapi) via LangChain.",
      "Implemented adaptive multilingual NLP with natural language switching across 7 languages (English, Hindi, Tamil, Telugu, Malayalam, Kannada, Urdu).",
      "Created a speech pipeline using Whisper for speech-to-text and TTS-1-HD with Pydub for clear, context-aware voice responses.",
      "Developed a Streamlit interface for document upload, text chat, and voice input/output.",
    ],
    tech: [
      "Python",
      "Streamlit",
      "OpenAI API",
      "GPT-4o-mini",
      "Whisper",
      "TTS-1-HD",
      "LangChain",
      "ChromaDB",
      "BM25Okapi",
      "Pydub",
    ],
    color: "#0055ff",
    image: "/images/projects/voice-rag.webp",
  },
  {
    id: "enterprise-rag",
    title: "Enterprise GenAI RAG Application",
    subtitle: "Production RAG for Enterprise Documents",
    overview:
      "Conversational platform answering questions grounded in a company's private, unstructured data.",
    description: [
      "Designed an enterprise-style GenAI application that turns unstructured data into actionable insights using a RAG pipeline and vector database grounded in private domain knowledge.",
      "Reduced hallucinations by grounding every LLM response in retrieved domain context, and added real-time response streaming and dynamic prompt orchestration.",
      "Implemented domain guardrails for secure, scalable use, and exposed the pipeline through FastAPI for integration with enterprise applications.",
    ],
    tech: ["Python", "OpenAI API", "LangChain", "ChromaDB", "FastAPI"],
    color: "#22d3ee",
    image: "/images/projects/enterprise-rag.webp",
  },
  {
    id: "multi-agent-support",
    title: "Multi-Agent Customer Support System",
    subtitle: "Autonomous Agent Orchestration",
    overview:
      "Automated customer support platform where specialised AI agents resolve tickets and escalate hard cases.",
    description: [
      "Built a multi-agent customer support platform with 4 role-based agents (Support, Technical, Escalation, QA) to automate end-to-end issue resolution.",
      "Engineered a routing engine that scores query complexity and priority and transfers high-priority or edge-case tickets to escalation workflows.",
      "Developed REST API endpoints with persistent SQLite/PostgreSQL storage for full ticket lifecycle management and conversation state retention.",
      "Built an HTML/JS front end and supported Gemini and OpenAI as interchangeable LLM providers.",
    ],
    tech: [
      "Python",
      "CrewAI",
      "FastAPI",
      "Gemini API",
      "OpenAI",
      "SQLite",
      "PostgreSQL",
      "HTML/JS",
    ],
    color: "#8b5cf6",
    image: "/images/projects/multi-agent.webp",
  },
  {
    id: "autogen-support",
    title: "AutoGen Customer Support Agent",
    subtitle: "Microsoft AutoGen Framework",
    overview:
      "Multi-agent support assistant that escalates complex cases to a stronger reasoning model.",
    description: [
      "Built an autonomous support framework with 3-agent collaboration: User Proxy Agent, General Agent, and Senior Agent.",
      "Implemented dual-tier escalation: GPT-4o for standard queries and o3-mini for complex technical disputes, safety issues, and policy exceptions.",
      "Integrated FuzzyWuzzy matching with CSV knowledge bases (Pandas) for fast retrieval, and orchestrated multi-turn conversations with GroupChatManager.",
    ],
    tech: [
      "Python",
      "Microsoft AutoGen",
      "OpenAI",
      "Azure OpenAI",
      "GPT-4o",
      "o3-mini",
      "Pandas",
      "FuzzyWuzzy",
    ],
    color: "#f59e0b",
    image: "/images/projects/autogen-agent.webp",
  },
];

/* ── SKILLS: 100% match with resume. `brand` = official logo, `glyph` = generic icon ── */
export interface Skill {
  name: string;
  brand?: string;
  glyph?: string;
}

export const skillCategories: { category: string; skills: Skill[] }[] = [
  {
    category: "Languages & APIs",
    skills: [
      { name: "Python", brand: "python" },
      { name: "SQL", glyph: "db" },
      { name: "FastAPI", brand: "fastapi" },
      { name: "Flask", brand: "flask" },
      { name: "REST APIs", glyph: "api" },
      { name: "Debugging & Troubleshooting", glyph: "bug" },
    ],
  },
  {
    category: "Generative AI",
    skills: [
      { name: "Gen AI", glyph: "ai" },
      { name: "LLMs (OpenAI GPT-4o, o3-mini)", glyph: "ai" },
      { name: "Azure OpenAI", glyph: "cloud" },
      { name: "Gemini", brand: "gemini" },
      { name: "Prompt Engineering", glyph: "ai" },
      { name: "NLP", glyph: "ai" },
      { name: "Embeddings", glyph: "ai" },
      { name: "Hugging Face", brand: "huggingface" },
    ],
  },
  {
    category: "LangChain & Agentic AI",
    skills: [
      { name: "LangChain", brand: "langchain" },
      { name: "LlamaIndex", glyph: "search" },
      { name: "Agentic AI", glyph: "agent" },
      { name: "AI Agents", glyph: "agent" },
      { name: "Multi-Agent Systems", glyph: "agent" },
      { name: "CrewAI", brand: "crewai" },
      { name: "AutoGen", glyph: "agent" },
      { name: "n8n", brand: "n8n" },
      { name: "Zapier", brand: "zapier" },
    ],
  },
  {
    category: "RAG & Vector Search",
    skills: [
      { name: "RAG Pipelines", glyph: "pipeline" },
      { name: "Vector Databases (ChromaDB)", glyph: "db" },
      { name: "Hybrid Search", glyph: "search" },
      { name: "Semantic Search", glyph: "search" },
      { name: "Data Ingestion Pipelines", glyph: "pipeline" },
    ],
  },
  {
    category: "AI Models & Data",
    skills: [
      { name: "ML", glyph: "ai" },
      { name: "Deep Learning", glyph: "ai" },
      { name: "TensorFlow (Basics)", brand: "tensorflow" },
      { name: "Scikit-Learn", brand: "scikitlearn" },
      { name: "Pandas", brand: "pandas" },
      { name: "NumPy", brand: "numpy" },
      { name: "Model Evaluation", glyph: "check" },
      { name: "Performance Optimization", glyph: "bolt" },
    ],
  },
  {
    category: "Cloud & DevOps",
    skills: [
      { name: "Docker", brand: "docker" },
      { name: "Git", brand: "git" },
      { name: "GitHub", brand: "github" },
      { name: "Azure OpenAI", glyph: "cloud" },
      { name: "AWS (Basics)", glyph: "cloud" },
      { name: "Apache Airflow", brand: "airflow" },
    ],
  },
  {
    category: "Quality & Teamwork",
    skills: [
      { name: "Guardrails", glyph: "shield" },
      { name: "Hallucination Control", glyph: "shield" },
      { name: "Edge-Case Testing", glyph: "check" },
      { name: "Cross-Functional Collaboration", glyph: "users" },
      { name: "Problem Solving", glyph: "bulb" },
    ],
  },
];

export const services = [
  {
    icon: "💬",
    title: "RAG Chatbots",
    desc: "Custom retrieval-augmented chatbots that answer from your own documents with cited, accurate responses.",
  },
  {
    icon: "🎙️",
    title: "Voice AI Assistants",
    desc: "Speech-to-text + LLM + text-to-speech pipelines for natural voice interactions with your data.",
  },
  {
    icon: "🤖",
    title: "AI Agents & Multi-Agent Automation",
    desc: "Autonomous agent systems that collaborate, use tools and escalate — replacing manual workflows.",
  },
  {
    icon: "🔗",
    title: "LLM API Integration",
    desc: "Connect OpenAI, Gemini, Claude or open-source models into your existing products and workflows.",
  },
  {
    icon: "⚡",
    title: "n8n Workflow Automation",
    desc: "End-to-end n8n automations that connect your apps, CRMs and AI models — leads, follow-ups and reports running on autopilot.",
  },
  {
    icon: "🚀",
    title: "Micro SaaS Products",
    desc: "Small, focused AI-powered SaaS tools taken from idea to a live, usable product — built lean and shipped fast.",
  },
  {
    icon: "🌐",
    title: "Website Development",
    desc: "Fast, modern, responsive websites and landing pages — with AI chat and automation built in when you need it.",
  },
  {
    icon: "✍️",
    title: "Prompt Engineering",
    desc: "Well-structured prompts, evaluation and guardrails that make LLM outputs reliable, consistent and production-ready.",
  },
];

export const experience = [
  {
    period: "2022 — 2025",
    role: "Operative Executive — Digital Marketing",
    company: "Evoulth Digital Pvt. Ltd., India",
    description:
      "Independently managed end-to-end digital marketing, from campaign strategy and creative production to execution and performance tracking. Ran lead-generation campaigns on Meta Ads and Google Ads, turning social media traffic into direct sales inquiries and calls while optimizing ROAS, CPC, and CAC. Created and edited video content for paid ads and social media, and managed brand social media accounts end to end. Improved search rankings and organic traffic through on-page and off-page SEO; tracked results in Excel dashboards. Worked with sales and growth teams to turn campaign data into optimization decisions and reduce funnel drop-offs; coordinated email and bulk SMS campaigns.",
  },
  {
    period: "2022 — 2026",
    role: "B.Tech — Artificial Intelligence & Data Science",
    company: "Mohamed Sathak A.J. College of Engineering, Chennai",
    cgpa: "7.0",
    description:
      "Bachelor of Technology in Artificial Intelligence & Data Science, with hands-on LLM, RAG and multi-agent projects built in Python (see Selected AI Work).",
  },
];

export const certifications = [
  { title: "AI Engineer", issuer: "Unstop" },
  { title: "Business Analytics", issuer: "IBM" },
  { title: "Data Analytics", issuer: "Novitech Pvt. Ltd." },
  { title: "Digital Business Skills", issuer: "HCL" },
];

export const languages = ["English", "Tamil", "Hindi", "Urdu"];

export const footerLinks = {
  github: "https://github.com/Mdsiddiq8",
  linkedin: "https://www.linkedin.com/in/mohamed-siddiq-ai/",
  email: "mohamedsiddiq092@gmail.com",
};
