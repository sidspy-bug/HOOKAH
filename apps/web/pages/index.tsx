import Head from 'next/head';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import MathBackground from '../components/MathBackground';
import { HowItWorksFlow } from '../components/HowItWorksFlow';

export default function LandingPage() {
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("gapforge_theme");
    if (savedTheme === "dark") {
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
            <HowItWorksFlow />
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
