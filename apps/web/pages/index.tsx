import Head from "next/head";
import React, { useState, useCallback } from "react";
import { useRouter } from "next/router";
import Sidebar from "../components/Sidebar";
import HistorySidebar from "../components/HistorySidebar";
import InfoModal from "../components/InfoModal";
import FileUpload from "../components/FileUpload";
import LoadingSpinner from "../components/LoadingSpinner";
import { analyzeResearchGaps } from "../lib/api";
import type { AnalyzeResponse } from "../lib/types";

const quickActions = [
  { label: "AI Mental Health", topic: "AI assistants for student mental health support", keywords: ["longitudinal", "fairness", "explainability"], domain: "health-ai" },
  { label: "NLP Chatbots", topic: "Low-resource NLP for public service chatbots", keywords: ["low-resource nlp", "chatbots", "fairness"], domain: "public-sector-ai" },
  { label: "Explainable AI", topic: "Explainable clinical triage assistants", keywords: ["explainability", "clinical ai"], domain: "health-ai" },
  { label: "Future of Work", topic: "Multimodal workload estimation for hybrid teams", keywords: ["multimodal", "productivity"], domain: "future-of-work" },
  { label: "LLM Reliability", topic: "Reproducibility challenges in applied LLM product teams", keywords: ["llm ops", "reproducibility"], domain: "ml-systems" },
];

type HistoryEntry = {
  topic: string;
  timestamp: string;
  result: AnalyzeResponse;
};

export default function HomePage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [infoModalType, setInfoModalType] = useState<"settings" | "pricing" | "feedback" | "agents" | null>(null);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [typedText, setTypedText] = useState("");

  React.useEffect(() => {
    const fullText = "Discover research gaps with confidence";
    let currentText = "";
    let isDeleting = false;
    let timerId: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (!isDeleting && currentText.length < fullText.length) {
        currentText = fullText.substring(0, currentText.length + 1);
        setTypedText(currentText);
        timerId = setTimeout(tick, 100);
      } else if (!isDeleting && currentText.length === fullText.length) {
        isDeleting = true;
        timerId = setTimeout(tick, 5000); // Wait longer before deleting
      } else if (isDeleting && currentText.length > 0) {
        currentText = currentText.substring(0, currentText.length - 1);
        setTypedText(currentText);
        timerId = setTimeout(tick, 40);
      } else if (isDeleting && currentText.length === 0) {
        isDeleting = false;
        timerId = setTimeout(tick, 1000); // Wait before re-typing
      }
    };
    timerId = setTimeout(tick, 100);
    return () => clearTimeout(timerId);
  }, []);

  React.useEffect(() => {
    const stored = localStorage.getItem("gapforge_history");
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse history.");
      }
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!topic.trim()) {
      setError("Please enter a research topic.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await analyzeResearchGaps({
        topic: topic.trim(),
        keywords: keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
        domain: domain.trim() || null,
      });

      // Save to history
      const entry: HistoryEntry = {
        topic: topic.trim(),
        timestamp: new Date().toLocaleString(),
        result,
      };
      setHistory((prev) => {
        const newHistory = [entry, ...prev];
        localStorage.setItem("gapforge_history", JSON.stringify(newHistory));
        return newHistory;
      });

      // Store result and navigate
      sessionStorage.setItem("gapforge_result", JSON.stringify(result));
      router.push("/results");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Is the API server running?");
      setLoading(false);
    }
  }, [topic, keywords, domain, router]);

  const handleQuickAction = (action: typeof quickActions[0]) => {
    setTopic(action.topic);
    setKeywords(action.keywords.join(", "));
    setDomain(action.domain);
  };

  const handleHistoryClick = (entry: HistoryEntry) => {
    sessionStorage.setItem("gapforge_result", JSON.stringify(entry.result));
    router.push("/results");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      <Head>
        <title>GapForge | AI Research Gap Discovery</title>
        <meta
          name="description"
          content="Discover research gaps with AI-powered analysis. Analyze papers, extract limitations, and get ranked project directions."
        />
      </Head>

      {loading && <LoadingSpinner />}

      <div className="shell">
        <Sidebar
          onToggleHistory={() => setHistoryOpen(!historyOpen)}
          onOpenAgents={() => { setInfoModalType("agents"); setSettingsOpen(true); }}
          onOpenSettings={() => { setInfoModalType("settings"); setSettingsOpen(true); }}
          onOpenFeedback={() => { setInfoModalType("feedback"); setSettingsOpen(true); }}
        />

        <main className="appMain">
          <header className="topNav">
            <div className="brandContainer">
              <span className="shuttle">🚀</span>
              <div className="brand">GapForge</div>
            </div>
            <nav className="topLinks">

              <a href="#" onClick={(e) => { e.preventDefault(); setInfoModalType("pricing"); setSettingsOpen(true); }}>
                Pricing
              </a>
              <a href="#" onClick={(e) => { e.preventDefault(); alert("Login coming soon!"); }}>
                Login
              </a>
              <button className="cta" onClick={() => document.querySelector("textarea")?.focus()}>
                Get started
              </button>
            </nav>
          </header>

          <div className="mainBody">
            {historyOpen && (
              <HistorySidebar 
                history={history}
                setHistory={setHistory}
                onItemClick={handleHistoryClick}
              />
            )}

            <section className="centerStage">
            <p className="logoMark">◆</p>
            <h1 className="typewriterText">
              {typedText}
              <span className="cursor" />
            </h1>
            <p className="subtext">
              Analyze academic papers, extract limitations, and get ranked
              project directions — all backed by citations.
            </p>

            <article className="promptCard">
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your research topic, e.g. 'AI assistants for student mental health support'"
                aria-label="Research topic input"
              />

              <div className="promptExtras">
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="Keywords (comma-separated)"
                  aria-label="Keywords input"
                />
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="Domain (e.g. health-ai)"
                  aria-label="Domain input"
                />
              </div>

              <div className="promptFooter">
                <div className="leftControls">
                  <button
                    className="iconBtn"
                    title="Clear form"
                    onClick={() => {
                      setTopic("");
                      setKeywords("");
                      setDomain("");
                      setError(null);
                    }}
                  >
                    ✕
                  </button>
                  <button className="softBtn" title="Auto-fill example" onClick={() => handleQuickAction(quickActions[0])}>
                    Auto ▾
                  </button>
                  <button className="softBtn" title="View agents" onClick={() => { setInfoModalType("settings"); setSettingsOpen(true); }}>
                    Agents
                  </button>
                  <FileUpload 
                    selectedFile={uploadedFile} 
                    onFileSelect={setUploadedFile} 
                  />
                </div>
                <button
                  className="sendBtn"
                  aria-label="Analyze"
                  onClick={handleSubmit}
                  disabled={loading || !topic.trim()}
                  title="Run analysis"
                >
                  ↑
                </button>
              </div>
            </article>

            {error && (
              <div className="errorBanner">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px', flexShrink: 0}}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {error}
              </div>
            )}

            <div className="actionRow">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  className="chip"
                  onClick={() => handleQuickAction(action)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </section>
          </div>
        </main>
      </div>

      <InfoModal
        type={infoModalType || "settings"}
        isOpen={settingsOpen}
        onClose={() => { setSettingsOpen(false); setInfoModalType(null); }}
      />
    </>
  );
}
