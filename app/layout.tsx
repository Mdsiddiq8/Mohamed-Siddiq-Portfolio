import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mohamed Siddiq Portfolio",
  description:
    "AI Engineer specializing in RAG systems, Voice AI, Multi-Agent architectures and LLM integration. Building intelligent Python-powered solutions from Chennai, India.",
  keywords: [
    "AI Engineer",
    "GenAI Engineer",
    "RAG",
    "Voice AI",
    "Multi-Agent Systems",
    "Python",
    "LangChain",
    "LlamaIndex",
    "Chennai",
  ],
  authors: [{ name: "Mohamed Siddiq" }],
  openGraph: {
    title: "Mohamed Siddiq Portfolio",
    description:
      "Building RAG assistants, Voice AI and multi-agent systems in Python.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
