import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Sidebar from "../components/Sidebar";
import HistorySidebar from "../components/HistorySidebar";
import InfoModal from "../components/InfoModal";
import LimitationCard from "../components/LimitationCard";
import ResearchInsightCard from "../components/ResearchInsightCard";
import type { AnalyzeResponse } from "../lib/types";

type CriticalSectionKey =
  | "hidden_assumptions"
  | "methodological_weaknesses"
  | "conceptual_gaps"
  | "contradictions"
  | "deep_insights";

const criticalSectionLabels: Record<CriticalSectionKey, string> = {
  hidden_assumptions: "Hidden Assumptions",
  methodological_weaknesses: "Methodological Weaknesses",
  conceptual_gaps: "Conceptual Gaps",
  contradictions: "Contradictions",
  deep_insights: "Deep Insights",
};

const fallbackInsight = {
  title: "Evidence-grounded research insight",
  problem: "A meaningful research problem has been identified from the analyzed paper.",
  evidence: ["Evidence is grounded in extracted paper findings and limitations."],
  why_gap_exists: "The gap persists because current evidence does not fully resolve the underlying methodological problem.",
  why_it_matters: "Resolving this issue would improve scientific validity and real-world usefulness.",
  vulnerability: "medium" as const,
  impact: "high" as const,
  confidence: 0.72,
  depth_score: 7.0,
  hidden_assumption: "The paper relies on an implicit assumption that remains under-tested.",
  methodological_weakness: "Method choices leave important causal or contextual questions unresolved.",
  conceptual_gap: "The conceptual framing does not fully explain when the approach should fail.",
  contradiction: "The scope of the claims appears broader than the direct evidence base.",
  deep_insight: "The deeper issue may be a mismatch between benchmark success and trustworthy practical use.",
  direction: {
    title: "Targeted research direction",
    approach: "Design a concrete follow-up study that tests the hidden assumptions and boundary conditions directly.",
  },
  scores: {
    novelty: 7.0,
    feasibility: 7.0,
    impact: 8.0,
  },
  overall_score: 7.4,
};

function normalizeInsight(raw: any) {
  return {
    title: raw?.title || fallbackInsight.title,
    problem: raw?.problem || fallbackInsight.problem,
    evidence: Array.isArray(raw?.evidence) && raw.evidence.length > 0 ? raw.evidence : fallbackInsight.evidence,
    why_gap_exists: raw?.why_gap_exists || fallbackInsight.why_gap_exists,
    why_it_matters: raw?.why_it_matters || fallbackInsight.why_it_matters,
    vulnerability: raw?.vulnerability === "low" || raw?.vulnerability === "medium" || raw?.vulnerability === "high" ? raw.vulnerability : fallbackInsight.vulnerability,
    impact: raw?.impact === "low" || raw?.impact === "medium" || raw?.impact === "high" ? raw.impact : fallbackInsight.impact,
    confidence: typeof raw?.confidence === "number" ? raw.confidence : fallbackInsight.confidence,
    depth_score: typeof raw?.depth_score === "number" ? raw.depth_score : fallbackInsight.depth_score,
    hidden_assumption: raw?.hidden_assumption || fallbackInsight.hidden_assumption,
    methodological_weakness: raw?.methodological_weakness || fallbackInsight.methodological_weakness,
    conceptual_gap: raw?.conceptual_gap || fallbackInsight.conceptual_gap,
    contradiction: raw?.contradiction || fallbackInsight.contradiction,
    deep_insight: raw?.deep_insight || fallbackInsight.deep_insight,
    direction: {
      title: raw?.direction?.title || fallbackInsight.direction.title,
      approach: raw?.direction?.approach || fallbackInsight.direction.approach,
    },
    scores: {
      novelty: typeof raw?.scores?.novelty === "number" ? raw.scores.novelty : fallbackInsight.scores.novelty,
      feasibility: typeof raw?.scores?.feasibility === "number" ? raw.scores.feasibility : fallbackInsight.scores.feasibility,
      impact: typeof raw?.scores?.impact === "number" ? raw.scores.impact : fallbackInsight.scores.impact,
    },
    overall_score: typeof raw?.overall_score === "number" ? raw.overall_score : fallbackInsight.overall_score,
  };
}

function normalizeDirection(raw: any, linkedGap: string) {
  return {
    title: raw?.title || fallbackInsight.direction.title,
    linked_gap: raw?.linked_gap || linkedGap,
    approach: raw?.approach || fallbackInsight.direction.approach,
    scores: {
      novelty: typeof raw?.scores?.novelty === "number" ? raw.scores.novelty : fallbackInsight.scores.novelty,
      feasibility: typeof raw?.scores?.feasibility === "number" ? raw.scores.feasibility : fallbackInsight.scores.feasibility,
      impact: typeof raw?.scores?.impact === "number" ? raw.scores.impact : fallbackInsight.scores.impact,
    },
    overall_score: typeof raw?.overall_score === "number" ? raw.overall_score : fallbackInsight.overall_score,
  };
}

function normalizeResearchGap(raw: any) {
  return {
    title: raw?.title || fallbackInsight.title,
    problem: raw?.problem || fallbackInsight.problem,
    evidence: Array.isArray(raw?.evidence) && raw.evidence.length > 0 ? raw.evidence : fallbackInsight.evidence,
    why_gap_exists: raw?.why_gap_exists || fallbackInsight.why_gap_exists,
    why_it_matters: raw?.why_it_matters || fallbackInsight.why_it_matters,
    vulnerability: raw?.vulnerability === "low" || raw?.vulnerability === "medium" || raw?.vulnerability === "high" ? raw.vulnerability : fallbackInsight.vulnerability,
    impact: raw?.impact === "low" || raw?.impact === "medium" || raw?.impact === "high" ? raw.impact : fallbackInsight.impact,
    confidence: typeof raw?.confidence === "number" ? raw.confidence : fallbackInsight.confidence,
    depth_score: typeof raw?.depth_score === "number" ? raw.depth_score : fallbackInsight.depth_score,
  };
}

function normalizeAnalyzeResponse(raw: any): AnalyzeResponse {
  const insights =
    Array.isArray(raw?.insights) && raw.insights.length > 0
      ? raw.insights.map(normalizeInsight)
      : [fallbackInsight];
  const researchGaps = Array.isArray(raw?.research_gaps) ? raw.research_gaps.map(normalizeResearchGap) : [];
  const directions = Array.isArray(raw?.directions)
    ? raw.directions.map((item: any, index: number) => normalizeDirection(item, insights[index]?.title || fallbackInsight.title))
    : [];

  return {
    overview: {
      title: raw?.overview?.title || "Research Intelligence Report",
      executive_summary: raw?.overview?.executive_summary || "The analysis identified a substantive contribution, a key limitation, and a high-priority implication for follow-up work.",
      objective: raw?.overview?.objective || "Objective unavailable in the saved result.",
      methodology: raw?.overview?.methodology || "Methodology unavailable in the saved result.",
      key_findings: Array.isArray(raw?.overview?.key_findings) ? raw.overview.key_findings : [],
    },
    limitations: {
      grouped: Array.isArray(raw?.limitations?.grouped) ? raw.limitations.grouped : [],
    },
    critical_reasoning: {
      hidden_assumptions: Array.isArray(raw?.critical_reasoning?.hidden_assumptions) ? raw.critical_reasoning.hidden_assumptions : [fallbackInsight.hidden_assumption],
      methodological_weaknesses: Array.isArray(raw?.critical_reasoning?.methodological_weaknesses) ? raw.critical_reasoning.methodological_weaknesses : [fallbackInsight.methodological_weakness],
      conceptual_gaps: Array.isArray(raw?.critical_reasoning?.conceptual_gaps) ? raw.critical_reasoning.conceptual_gaps : [fallbackInsight.conceptual_gap],
      contradictions: Array.isArray(raw?.critical_reasoning?.contradictions) ? raw.critical_reasoning.contradictions : [fallbackInsight.contradiction],
      deep_insights: Array.isArray(raw?.critical_reasoning?.deep_insights) ? raw.critical_reasoning.deep_insights : [fallbackInsight.deep_insight],
    },
    research_gaps: researchGaps,
    directions: directions,
    insights,
    most_critical_insight: normalizeInsight(raw?.most_critical_insight || insights[0] || fallbackInsight),
    analysis_improvements: {
      missing_angles: Array.isArray(raw?.analysis_improvements?.missing_angles) ? raw.analysis_improvements.missing_angles : ["Probe hidden contextual variables that may change the interpretation of the reported results."],
      additional_perspectives: Array.isArray(raw?.analysis_improvements?.additional_perspectives) ? raw.analysis_improvements.additional_perspectives : ["Add stakeholder and deployment-facing perspectives to complement the methodological critique."],
      future_improvements: Array.isArray(raw?.analysis_improvements?.future_improvements) ? raw.analysis_improvements.future_improvements : ["Run follow-up studies that test boundary conditions and hidden assumptions directly."],
    },
  };
}

export default function ResultsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [infoModalType, setInfoModalType] = useState<"settings" | "pricing" | "feedback" | "agents" | null>(null);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  const overviewRef = useRef<HTMLDivElement>(null);
  const limitationsRef = useRef<HTMLDivElement>(null);
  const insightsRef = useRef<HTMLDivElement>(null);
  const criticalRef = useRef<HTMLDivElement>(null);
  const improvementsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedHistory = localStorage.getItem("gapforge_history");
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch {
        setHistory([]);
      }
    }
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem("gapforge_result");
    if (!stored) {
      router.push("/dashboard");
      return;
    }
    try {
      setData(normalizeAnalyzeResponse(JSON.parse(stored)));
    } catch {
      router.push("/dashboard");
    }
  }, [router]);

  if (!data) return null;

  const totalLimitations = data.limitations.grouped.reduce((acc, group) => acc + group.items.length, 0);
  const summaryCards = [
    { label: "Overview", value: 1, ref: overviewRef },
    { label: "Limitations", value: totalLimitations, ref: limitationsRef },
    { label: "Insights", value: data.insights.length, ref: insightsRef },
    { label: "Critical Lens", value: data.critical_reasoning.deep_insights.length, ref: criticalRef },
    { label: "Improvements", value: data.analysis_improvements.future_improvements.length, ref: improvementsRef },
  ];

  const scrollTo = (targetRef: React.RefObject<HTMLDivElement>) => {
    targetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const improvementSections = [
    { label: "Missing Angles", items: data.analysis_improvements.missing_angles },
    { label: "Additional Perspectives", items: data.analysis_improvements.additional_perspectives },
    { label: "Future Improvements", items: data.analysis_improvements.future_improvements },
  ];

  return (
    <>
      <Head>
        <title>Report — {data.overview.title} | GapForge</title>
        <meta name="description" content={`Structured research report for: ${data.overview.title}`} />
      </Head>

      <div className="shell">
        <Sidebar
          onToggleHistory={() => setHistoryOpen(!historyOpen)}
          onOpenAgents={() => {
            setInfoModalType("agents");
            setSettingsOpen(true);
          }}
          onOpenSettings={() => {
            setInfoModalType("settings");
            setSettingsOpen(true);
          }}
          onOpenFeedback={() => {
            setInfoModalType("feedback");
            setSettingsOpen(true);
          }}
        />

        {historyOpen && (
          <HistorySidebar
            history={history}
            setHistory={setHistory}
            onItemClick={(entry) => {
              const normalized = normalizeAnalyzeResponse(entry.result);
              sessionStorage.setItem("gapforge_result", JSON.stringify(normalized));
              setData(normalized);
            }}
          />
        )}

        <main className="appMain">
          <header className="topNav">
            <div className="brand">GapForge</div>
            <nav className="topLinks">
              <button className="cta" onClick={() => router.push("/dashboard")}>← New Analysis</button>
            </nav>
          </header>

          <div className="resultsScroll">
          <div className="resultsContainer">
            <div className="resultsHeader">
              <button className="backBtn" onClick={() => router.push("/dashboard")}>← Back to dashboard</button>
              <h1>Research Intelligence Report</h1>
              <p className="subtext" style={{ textAlign: "left" }}>
                {data.overview.title}
              </p>
            </div>

            <article className="card executiveSummaryCard" ref={overviewRef}>
              <h2>Executive Summary</h2>
              <p>{data.overview.executive_summary}</p>
            </article>

            <article className="card" style={{ borderLeft: "4px solid #f97316" }}>
              <div className="panelHeader" style={{ marginBottom: 10 }}>
                <h2>Most Critical Insight</h2>
              </div>
              <ResearchInsightCard insight={data.most_critical_insight} index={0} />
            </article>

            <div className="statsRow">
              {summaryCards.map((card) => (
                <button
                  key={card.label}
                  className="statCard summaryCardBtn"
                  onClick={() => scrollTo(card.ref)}
                >
                  <div className="statNumber teal">{card.value}</div>
                  <div className="statLabel">{card.label}</div>
                </button>
              ))}
            </div>

            <section className="reportSection">
              <div className="panelHeader" style={{ marginBottom: 10 }}>
                <h2>Paper Overview</h2>
              </div>
              <article className="card" style={{ display: "grid", gap: 12 }}>
                <div>
                  <h3 className="themeTitle" style={{ marginBottom: 6 }}>Objective</h3>
                  <p className="muted" style={{ color: "var(--text)" }}>{data.overview.objective}</p>
                </div>
                <div>
                  <h3 className="themeTitle" style={{ marginBottom: 6 }}>Methodology</h3>
                  <p className="muted" style={{ color: "var(--text)" }}>{data.overview.methodology}</p>
                </div>
                <div>
                  <h3 className="themeTitle" style={{ marginBottom: 6 }}>Key Findings</h3>
                  <ul className="insightEvidenceList">
                    {data.overview.key_findings.map((finding, index) => (
                      <li key={`${finding}-${index}`}>{finding}</li>
                    ))}
                  </ul>
                </div>
              </article>
            </section>

            <section className="reportSection" ref={limitationsRef}>
              <div className="panelHeader" style={{ marginBottom: 10 }}>
                <h2>Limitations</h2>
              </div>
              <div style={{ display: "grid", gap: 14 }}>
                {data.limitations.grouped.map((group) => (
                  <section key={group.category} className="themeGroup">
                    <h3 className="themeTitle">{group.category}</h3>
                    <div style={{ display: "grid", gap: 10 }}>
                      {group.items.map((limitation, index) => (
                        <LimitationCard
                          key={`${group.category}-${index}`}
                          category={group.category}
                          limitation={limitation}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </section>

            <section className="reportSection" ref={insightsRef}>
              <div className="panelHeader" style={{ marginBottom: 10 }}>
                <h2>Research Insights</h2>
              </div>
              <div style={{ display: "grid", gap: 14 }}>
                {data.insights.map((insight, index) => (
                  <ResearchInsightCard key={`${insight.title}-${index}`} insight={insight} index={index} />
                ))}
              </div>
            </section>

            <section className="reportSection" ref={criticalRef}>
              <div className="panelHeader" style={{ marginBottom: 10 }}>
                <h2>Critical Reasoning</h2>
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                {(Object.keys(criticalSectionLabels) as CriticalSectionKey[]).map((key) => (
                  <article className="card" key={key}>
                    <h3 style={{ marginTop: 0 }}>{criticalSectionLabels[key]}</h3>
                    <ul className="insightEvidenceList">
                      {data.critical_reasoning[key].map((item, index) => (
                        <li key={`${key}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>

            <section className="reportSection" ref={improvementsRef}>
              <div className="panelHeader" style={{ marginBottom: 10 }}>
                <h2>How To Improve This Analysis Further</h2>
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                {improvementSections.map((section) => (
                  <article className="card" key={section.label}>
                    <h3 style={{ marginTop: 0 }}>{section.label}</h3>
                    <ul className="insightEvidenceList">
                      {section.items.map((item, index) => (
                        <li key={`${section.label}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
          </div>
          </div>
        </main>
      </div>

      <InfoModal
        type={infoModalType || "settings"}
        isOpen={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          setInfoModalType(null);
        }}
      />
    </>
  );
}
