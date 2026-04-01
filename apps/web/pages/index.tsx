import Head from 'next/head';
import Link from 'next/link';
import React, { useEffect, useState, useMemo } from 'react';

const MATH_EQUATIONS = [
  "E = mc²", "∇ × E = -∂B/∂t", "iℏ∂ψ/∂t = Ĥψ", "S = k log W", 
  "e^{iπ} + 1 = 0", "F = G(m₁m₂)/r²", "PV = nRT", 
  "a² + b² = c²", "f'(x) = lim(h→0) (f(x+h) - f(x))/h",
  "σ² = ∑(x_i - μ)²/N", "H(X) = -∑P(x)logP(x)"
];

const MathBackground = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      equation: MATH_EQUATIONS[Math.floor(Math.random() * MATH_EQUATIONS.length)],
      left: Math.random() * 100 + "%",
      fontSize: (Math.random() * 1.5 + 1.2) + "rem",
      duration: (Math.random() * 20 + 20) + "s",
      delay: (Math.random() * -30) + "s"
    }));
  }, []);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
      {particles.map(p => (
        <div 
          key={p.id} 
          className="mathParticle" 
          style={{ left: p.left, fontSize: p.fontSize, animationDuration: p.duration, animationDelay: p.delay }}
        >
          {p.equation}
        </div>
      ))}
    </div>
  );
};

export default function LandingPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("gapforge_theme");
    if (savedTheme === "dark") {
      setTheme("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  return (
    <>
      <Head>
        <title>GapForge | AI Research Gap Discovery</title>
        <meta
          name="description"
          content="Discover research gaps with AI-powered analysis. Analyze papers, extract limitations, and get ranked project directions."
        />
      </Head>
      <div className="marketingPage">
        <MathBackground />
        
        <header className="topNav" style={{ borderBottom: "none", background: "transparent", position: "relative", zIndex: 10 }}>
          <div className="brandContainer">
            <div className="brand" style={{ fontSize: "1.5rem" }}>GapForge</div>
          </div>
          <nav className="topLinks">
            <Link href="/dashboard" className="sendBtn" style={{ padding: "0 20px", width: "auto", borderRadius: "8px", textDecoration: "none" }}>
              Sign In
            </Link>
          </nav>
        </header>

        <main>
          <section className="marketingHero">
            <h1>Discover the unknown. <br/><span className="typewriterText" style={{ animationDuration: "5s" }}>Build the future.</span></h1>
            <p className="subtext">
              GapForge autonomously analyzes thousands of academic papers to extract limitations, cluster findings, and generate highly ranked, rigorously backed project directions.
            </p>
            <div className="ctaRow">
              <Link href="/dashboard" className="marketingBtn primary">
                Start Exploring Free
              </Link>
              <button onClick={() => setShowHowItWorks(!showHowItWorks)} className="marketingBtn">
                {showHowItWorks ? "Hide Details" : "How It Works"}
              </button>
            </div>
          </section>

          {showHowItWorks && (
            <section id="how-it-works" className="bentoGrid" style={{ animation: "slideDown 0.4s ease-out forwards" }}>
            <div className="bentoCard large">
              <div className="featureIcon">📄</div>
              <h3>1. Feed Data at Scale</h3>
              <p className="subtext" style={{margin: 0}}>Upload PDFs, scrape direct from arXiv, or link your Mendeley library. Our Paper Analyst agent aggressively filters through noise to find only relevant methodology.</p>
            </div>
            
            <div className="bentoCard">
              <div className="featureIcon">🔍</div>
              <h3>2. Extract Limitations</h3>
              <p className="subtext" style={{margin: 0}}>The core AI engine reads conclusion sections, extracting stated weaknesses, technical limitations, and future work explicitly cited by authors.</p>
            </div>

            <div className="bentoCard">
              <div className="featureIcon">✨</div>
              <h3>3. Map The Gaps</h3>
              <p className="subtext" style={{margin: 0}}>Discover aggregated clusters of overlapping limitations that reveal entirely under-researched domains and blind spots.</p>
            </div>

            <div className="bentoCard large">
              <div className="featureIcon">🚀</div>
              <h3>4. Generate Project Scopes</h3>
              <p className="subtext" style={{margin: 0}}>Automatically rank gap candidates by feasibility, novelty, and impact. Finally, generate step-by-step hypothesis approaches to tackle them.</p>
            </div>
          </section>
          )}
        </main>

        <footer className="marketingFooter">
          <h2>Ready to forge the next breakthrough?</h2>
          <p className="muted" style={{ marginTop: "40px", fontSize: "0.85rem" }}>
            © 2026 GapForge AI. All rights reserved. Built for researchers.
          </p>
        </footer>
      </div>
    </>
  );
}
