import Head from "next/head";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Sidebar from "../components/Sidebar";
import HistorySidebar from "../components/HistorySidebar";
import InfoModal from "../components/InfoModal";
import PaperCard from "../components/PaperCard";
import GapCard from "../components/GapCard";
import DirectionCard from "../components/DirectionCard";
import type { AnalyzeResponse } from "../lib/types";

export default function ResultsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [infoModalType, setInfoModalType] = useState<"settings" | "pricing" | "feedback" | "agents" | null>(null);
  const [activeTab, setActiveTab] = useState<"papers" | "limitations" | "gaps" | "directions">("directions");
  const [historyOpen, setHistoryOpen] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const storedHistory = localStorage.getItem("gapforge_history");
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Failed to parse history.");
      }
    }
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem("gapforge_result");
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  const handleHistoryClick = (entry: any) => {
    sessionStorage.setItem("gapforge_result", JSON.stringify(entry.result));
    setData(entry.result);
  };

  if (!data) return null;

  const tabs = [
    { key: "directions" as const, label: "Directions", count: data.top_suggested_research_directions.length },
    { key: "gaps" as const, label: "Research Gaps", count: data.identified_research_gaps.length },
    { key: "papers" as const, label: "Papers", count: data.analyzed_papers.length },
    { key: "limitations" as const, label: "Limitations", count: data.extracted_limitations.length },
  ];

  return (
    <>
      <Head>
        <title>Results — {data.topic} | GapForge</title>
        <meta name="description" content={`Research gap analysis results for: ${data.topic}`} />
      </Head>

      <div className="shell">
        <Sidebar
          onToggleHistory={() => setHistoryOpen(!historyOpen)}
          onOpenAgents={() => { setInfoModalType("agents"); setSettingsOpen(true); }}
          onOpenSettings={() => { setInfoModalType("settings"); setSettingsOpen(true); }}
          onOpenFeedback={() => { setInfoModalType("feedback"); setSettingsOpen(true); }}
        />

        {historyOpen && (
          <HistorySidebar 
            history={history}
            setHistory={setHistory}
            onItemClick={handleHistoryClick}
          />
        )}

        <main className="appMain">
          <header className="topNav">
            <div className="brand">GapForge</div>
            <nav className="topLinks">
              <button
                className="cta"
                onClick={() => router.push("/")}
              >
                ← New Analysis
              </button>
            </nav>
          </header>

          <div className="resultsContainer">
            {/* Header */}
            <div className="resultsHeader">
              <button className="backBtn" onClick={() => router.push("/")}>
                ← Back to home
              </button>
              <h1>Analysis Results</h1>
              <p className="subtext" style={{ textAlign: "left" }}>
                Research gap analysis for: <strong>{data.topic}</strong>
              </p>
              {data.normalized_keywords.length > 0 && (
                <div className="resultsMeta" style={{ marginTop: 10 }}>
                  {data.normalized_keywords.map((kw) => (
                    <span key={kw} className="keywordTag">{kw}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Stats Row */}
            <div className="statsRow">
              <div className="statCard">
                <div className="statNumber orange">
                  {data.analyzed_papers.length}
                </div>
                <div className="statLabel">Papers Analyzed</div>
              </div>
              <div className="statCard">
                <div className="statNumber purple">
                  {data.extracted_limitations.length}
                </div>
                <div className="statLabel">Limitations Found</div>
              </div>
              <div className="statCard">
                <div className="statNumber teal">
                  {data.identified_research_gaps.length}
                </div>
                <div className="statLabel">Gaps Identified</div>
              </div>
              <div className="statCard">
                <div className="statNumber green">
                  {data.top_suggested_research_directions.length}
                </div>
                <div className="statLabel">Directions Suggested</div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="actionRow" style={{ justifyContent: "flex-start", marginBottom: 20 }}>
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`chip ${activeTab === tab.key ? "chipActive" : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                  style={
                    activeTab === tab.key
                      ? {
                          background: "var(--text)",
                          color: "#fff",
                          borderColor: "var(--text)",
                        }
                      : {}
                  }
                >
                  {tab.label}
                  <span className="sectionBadge" style={
                    activeTab === tab.key
                      ? { background: "rgba(255,255,255,0.25)", color: "#fff", border: "none" }
                      : {}
                  }>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Directions Tab */}
            {activeTab === "directions" && (
              <section className="resultsSection">
                <div className="sectionHeader">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--orange)'}}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="6"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                  </svg>
                  <h2>Top Research Directions</h2>
                </div>
                <div className="cardGrid">
                  {data.top_suggested_research_directions.map((dir, i) => (
                    <DirectionCard key={dir.title} direction={dir} index={i} />
                  ))}
                </div>
              </section>
            )}

            {/* Gaps Tab */}
            {activeTab === "gaps" && (
              <section className="resultsSection">
                <div className="sectionHeader">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--teal)'}}>
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <h2>Identified Research Gaps</h2>
                </div>
                <div className="cardGrid">
                  {data.identified_research_gaps.map((gap, i) => (
                    <GapCard key={gap.gap_id} gap={gap} index={i} />
                  ))}
                </div>
              </section>
            )}

            {/* Papers Tab */}
            {activeTab === "papers" && (
              <section className="resultsSection">
                <div className="sectionHeader">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--purple)'}}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                  <h2>Analyzed Papers</h2>
                </div>
                <div className="cardGrid cols2">
                  {data.analyzed_papers.map((paper) => (
                    <PaperCard key={paper.paper_id} paper={paper} />
                  ))}
                </div>
              </section>
            )}

            {/* Limitations Tab */}
            {activeTab === "limitations" && (
              <section className="resultsSection">
                <div className="sectionHeader">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--red)'}}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <h2>Extracted Limitations</h2>
                </div>
                <ul className="limitationsList">
                  {data.extracted_limitations.map((lim, i) => (
                    <li key={i}>
                      <span className="limIcon">▸</span>
                      {lim}
                    </li>
                  ))}
                </ul>
              </section>
            )}
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
