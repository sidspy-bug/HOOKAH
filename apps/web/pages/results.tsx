import Head from "next/head";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Sidebar from "../components/Sidebar";
import HistorySidebar from "../components/HistorySidebar";
import InfoModal from "../components/InfoModal";
import PaperCard from "../components/PaperCard";
import GapCard from "../components/GapCard";
import DirectionCard from "../components/DirectionCard";
import LimitationCard from "../components/LimitationCard";
import type { AnalyzeResponse } from "../lib/types";

export default function ResultsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [infoModalType, setInfoModalType] = useState<"settings" | "pricing" | "feedback" | "agents" | null>(null);
  const [activeTab, setActiveTab] = useState<"papers" | "limitations" | "gaps" | "directions">("directions");
  const [historyOpen, setHistoryOpen] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  // Dashboard refs & state
  const directionsRef = useRef<HTMLDivElement>(null);
  const gapsRef = useRef<HTMLDivElement>(null);
  const papersRef = useRef<HTMLDivElement>(null);
  const limitationsRef = useRef<HTMLDivElement>(null);
  
  const [highlightedPaperId, setHighlightedPaperId] = useState<string | null>(null);
  const [highlightedGapId, setHighlightedGapId] = useState<string | null>(null);
  const [limFilter, setLimFilter] = useState<"All" | "AI Impacted" | "Moderate" | "Minor">("All");

  const handleTabSwitch = (tabKey: typeof activeTab) => {
    setActiveTab(tabKey);
    const refs = {
      directions: directionsRef,
      gaps: gapsRef,
      papers: papersRef,
      limitations: limitationsRef
    };
    setTimeout(() => {
      refs[tabKey]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

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
              <div 
                className={`statCard ${activeTab === 'papers' ? 'activeStat' : ''}`}
                onClick={() => handleTabSwitch('papers')}
                style={{ cursor: 'pointer', borderColor: activeTab === 'papers' ? 'var(--orange)' : '' }}
              >
                <div className="statNumber orange">
                  {data.analyzed_papers.length}
                </div>
                <div className="statLabel">Papers Analyzed</div>
              </div>
              <div 
                className={`statCard ${activeTab === 'limitations' ? 'activeStat' : ''}`}
                onClick={() => handleTabSwitch('limitations')}
                style={{ cursor: 'pointer', borderColor: activeTab === 'limitations' ? 'var(--purple)' : '' }}
              >
                <div className="statNumber purple">
                  {data.extracted_limitations.length}
                </div>
                <div className="statLabel">Limitations Found</div>
              </div>
              <div 
                className={`statCard ${activeTab === 'gaps' ? 'activeStat' : ''}`}
                onClick={() => handleTabSwitch('gaps')}
                style={{ cursor: 'pointer', borderColor: activeTab === 'gaps' ? 'var(--teal)' : '' }}
              >
                <div className="statNumber teal">
                  {data.identified_research_gaps.length}
                </div>
                <div className="statLabel">Gaps Identified</div>
              </div>
              <div 
                className={`statCard ${activeTab === 'directions' ? 'activeStat' : ''}`}
                onClick={() => handleTabSwitch('directions')}
                style={{ cursor: 'pointer', borderColor: activeTab === 'directions' ? 'var(--green)' : '' }}
              >
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
                  onClick={() => handleTabSwitch(tab.key)}
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

            {/* Single Panel View (formerly 2x2 Grid) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 10 }}>
              
              {/* Top Left: Directions */}
              <div 
                ref={directionsRef}
                className={`dashboardPanel ${activeTab === "directions" ? "highlighted-panel" : ""}`}
                style={{ display: activeTab === "directions" ? 'flex' : 'none', minHeight: '600px', width: '100%', boxSizing: 'border-box' }}
              >
                <div className="panelHeader">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--orange)'}}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="6"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                  </svg>
                  <h2>Research Directions</h2>
                </div>
                <div className="panelSubtitle">
                  {data.top_suggested_research_directions.length} actionable directions identified to advance research
                </div>
                <div style={{ display: 'grid', gap: 14 }}>
                  {data.top_suggested_research_directions.map((dir, i) => (
                    <DirectionCard 
                      key={dir.title} 
                      direction={dir} 
                      index={i} 
                      allLimitations={data.extracted_limitations}
                    />
                  ))}
                </div>
              </div>

              {/* Top Right: Gaps */}
              <div 
                ref={gapsRef}
                className={`dashboardPanel ${activeTab === "gaps" ? "highlighted-panel" : ""}`}
                style={{ display: activeTab === "gaps" ? 'flex' : 'none', minHeight: '600px', width: '100%', boxSizing: 'border-box' }}
              >
                <div className="panelHeader">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--teal)'}}>
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <h2>Research Gaps</h2>
                </div>
                <div className="panelSubtitle">
                  {data.identified_research_gaps.length} research gaps identified from existing literature
                </div>
                <div style={{ display: 'grid', gap: 14 }}>
                  {data.identified_research_gaps.map((gap, i) => (
                    <div 
                      key={gap.gap_id} 
                      ref={(el) => {
                        if (el && highlightedGapId === gap.gap_id) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }}
                      className={highlightedGapId === gap.gap_id ? 'item-highlight' : ''}
                      style={{ borderRadius: 8 }}
                    >
                      <GapCard 
                        gap={gap} 
                        index={i} 
                        onPaperClick={(id) => {
                          setHighlightedPaperId(id);
                          setActiveTab("papers");
                          papersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }} 
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Left: Papers */}
              <div 
                ref={papersRef}
                className={`dashboardPanel ${activeTab === "papers" ? "highlighted-panel" : ""}`}
                style={{ display: activeTab === "papers" ? 'flex' : 'none', minHeight: '600px', width: '100%', boxSizing: 'border-box' }}
              >
                <div className="panelHeader">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--purple)'}}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                  <h2>Analyzed Papers</h2>
                </div>
                <div className="panelSubtitle">
                  {data.analyzed_papers.length} papers analyzed to provide insights
                </div>
                <div className="cardGrid cols2">
                  {data.analyzed_papers.map((paper) => (
                    <div 
                      key={paper.paper_id}
                      ref={(el) => {
                        if (el && highlightedPaperId === paper.paper_id) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }}
                    >
                      <PaperCard 
                        paper={paper} 
                        isHighlighted={highlightedPaperId === paper.paper_id} 
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Right: Limitations */}
              <div 
                ref={limitationsRef}
                className={`dashboardPanel ${activeTab === "limitations" ? "highlighted-panel" : ""}`}
                style={{ display: activeTab === "limitations" ? 'flex' : 'none', minHeight: '600px', width: '100%', boxSizing: 'border-box' }}
              >
                <div className="panelHeader">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--red)'}}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <h2>Extracted Limitations</h2>
                </div>
                <div className="panelSubtitle">
                  {data.extracted_limitations.length} extracted limitations that reveal research issues
                </div>
                
                <div className="limFilterRow">
                  {["All", "AI Impacted", "Moderate", "Minor"].map((f) => (
                    <button 
                      key={f}
                      className={`limFilterBtn ${limFilter === f ? 'active ' + f.toLowerCase().replace(' ', '-') : ''}`}
                      onClick={() => setLimFilter(f as any)}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {data.extracted_limitations.map((lim, i) => {
                    const lLower = lim.toLowerCase();
                    let severity = "Minor";
                    if (lLower.includes("bias") || lLower.includes("fairness") || lLower.includes("demographic") || lLower.includes("scoring")) severity = "AI Impacted";
                    else if (lLower.includes("validity") || lLower.includes("dataset") || lLower.includes("real-world") || lLower.includes("follow-up") || lLower.includes("size")) severity = "Moderate";
                    else if (i % 4 === 0) severity = "AI Impacted";
                    else if (i % 2 === 0) severity = "Moderate";

                    if (limFilter !== "All" && severity !== limFilter) return null;

                    return (
                      <LimitationCard 
                        key={i} 
                        limitation={lim} 
                        index={i}
                        papers={data.analyzed_papers}
                        gaps={data.identified_research_gaps}
                        directions={data.top_suggested_research_directions}
                        onPaperClick={(id) => {
                          setHighlightedPaperId(id);
                          setActiveTab("papers");
                          papersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        onGapClick={(id) => {
                          setHighlightedGapId(id);
                          setActiveTab("gaps");
                          gapsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                      />
                    );
                  })}
                </div>
              </div>

            </div>
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
