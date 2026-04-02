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
import MathBackground from "../components/MathBackground";

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
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [infoModalType, setInfoModalType] = useState<"settings" | "pricing" | "feedback" | "agents" | null>(null);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedTitle, setExtractedTitle] = useState("");

  const [typedText, setTypedText] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  React.useEffect(() => {
    const savedTheme = localStorage.getItem("gapforge_theme");
    if (savedTheme === "dark") {
      setTheme("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

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
    if (!uploadedFile) {
      setExtractedTitle("");
      return;
    }

    const fetchTitle = async () => {
      const formData = new FormData();
      formData.append("file", uploadedFile);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
        const res = await fetch(`${baseUrl}/api/v1/extract-pdf`, {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.title && data.title !== "Unknown Paper") {
            setExtractedTitle(data.title);
          }
        }
      } catch (err) {
        console.error("Failed to extract title", err);
      }
    };

    fetchTitle();
  }, [uploadedFile]);

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

  React.useEffect(() => {
    if (!loading) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev;
        const increment = prev < 40 ? 8 : prev < 70 ? 5 : 2;
        return Math.min(92, prev + increment);
      });
    }, 500);

    return () => clearInterval(timer);
  }, [loading]);

  const handleSubmit = useCallback(async () => {
    if (!topic.trim() && !uploadedFile) {
      setError("Please enter a topic or upload a PDF.");
      return;
    }

    setLoading(true);
    setProgress(6);
    setError(null);

    try {
      const result = await analyzeResearchGaps({
        topic: topic.trim() || extractedTitle || "Uploaded research paper",
        keywords: keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
        domain: domain.trim() || null,
        file: uploadedFile,
      });

      // Save to history
      setProgress(100);
      const entry: HistoryEntry = {
        topic: result.overview.title || extractedTitle || topic.trim() || "Research analysis",
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
      setProgress(0);
    }
  }, [topic, keywords, domain, router, extractedTitle, uploadedFile]);

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

      {loading && <LoadingSpinner progress={progress} />}

      <div className="shell">
        <MathBackground opacity={0.4} />
        <Sidebar
          onToggleHistory={() => setHistoryOpen(!historyOpen)}
          onOpenAgents={() => { setInfoModalType("agents"); setSettingsOpen(true); }}
          onOpenSettings={() => { setInfoModalType("settings"); setSettingsOpen(true); }}
          onOpenFeedback={() => { setInfoModalType("feedback"); setSettingsOpen(true); }}
        />

        <main className="appMain">
          <header className="topNav">
            <div className="brandContainer animate-fadeInDown">
              <div className="brand">GapForge</div>
            </div>
            <nav className="topLinks animate-fadeInDown" style={{ animationDelay: '0.1s' }}>
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

            <section className="centerStage animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            <div style={{ minHeight: '4.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <h1 className="typewriterText">
                {typedText}
                <span className="cursor" />
              </h1>
            </div>
            <p className="subtext">
              Analyze academic papers, extract limitations, and get ranked
              research insights with evidence-backed directions and scoring.
            </p>

            <article className="promptCard">
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your research topic, e.g. 'AI assistants for student mental health support'"
                aria-label="Research topic input"
              />



              <div className="promptFooter">
                <div className="leftControls">
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
                  disabled={loading || (!topic.trim() && !uploadedFile)}
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

        {settingsOpen && infoModalType && (
          <InfoModal
            type={infoModalType}
            isOpen={settingsOpen}
            onClose={() => { setSettingsOpen(false); setInfoModalType(null); }}
            theme={theme}
            onThemeChange={(newTheme) => {
              setTheme(newTheme);
              localStorage.setItem("gapforge_theme", newTheme);
              if (newTheme === "dark") {
                document.documentElement.setAttribute("data-theme", "dark");
              } else {
                document.documentElement.removeAttribute("data-theme");
              }
            }}
          />
        )}
    </>
  );
}
