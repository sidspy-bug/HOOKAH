import React from "react";

type InfoModalProps = {
  type: "settings" | "agents" | "pricing" | "feedback";
  isOpen: boolean;
  onClose: () => void;
  theme?: "light" | "dark";
  onThemeChange?: (theme: "light" | "dark") => void;
};

export default function InfoModal({ type, isOpen, onClose, theme, onThemeChange }: InfoModalProps) {
  if (!isOpen) return null;

  const renderContent = () => {
    switch (type) {
      case "settings":
        return (
          <div className="modalBody feedbackBody">
            <h3 style={{ marginBottom: 12 }}>User Preferences</h3>
            <div className="formGroup">
              <label htmlFor="apiKey" className="formLabel">OpenAI API Key</label>
              <input
                type="password"
                id="apiKey"
                className="formTextarea"
                style={{ height: "42px" }}
                placeholder="sk-..."
              />
            </div>
            <div className="formGroup" style={{ marginTop: 12 }}>
              <label htmlFor="modelSelect" className="formLabel">Default Model</label>
              <select id="modelSelect" className="formTextarea" style={{ height: "42px", padding: "0 12px" }}>
                <option value="gpt-4o">GPT-4o (Default)</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                <option value="llama-3">Llama 3 (Local)</option>
                <option value="heuristic">Local Heuristic (Offline)</option>
              </select>
            </div>
            <div className="formGroup" style={{ marginTop: 12 }}>
              <label className="formLabel">Appearance</label>
              <select 
                className="formTextarea" 
                style={{ height: "42px", padding: "0 12px" }}
                value={theme || "light"}
                onChange={(e) => {
                  if (onThemeChange) {
                    onThemeChange(e.target.value as "light" | "dark");
                  }
                }}
              >
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
              </select>
            </div>
            <div className="formGroup" style={{ marginTop: 24, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
              <button
                className="sendBtn"
                style={{ width: "100%", borderRadius: "10px", height: "42px", background: "var(--surface-hover)", color: "var(--red)", borderColor: "var(--line)", boxShadow: "none" }}
                onClick={() => {
                  if (confirm("Are you sure you want to clear all history? This action cannot be undone.")) {
                    localStorage.removeItem("gapforge_history");
                    window.location.reload();
                  }
                }}
              >
                Clear All History
              </button>
            </div>
          </div>
        );
      case "agents":
        const [activeStep, setActiveStep] = React.useState(0);
        
        React.useEffect(() => {
          const interval = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % 7);
          }, 2000);
          return () => clearInterval(interval);
        }, []);

        const pipelineAgents = [
          { id: 1, name: "Paper Analyst", desc: "Selects relevant papers", icon: "📄", color: "green" },
          { id: 2, name: "Limitation Extractor", desc: "Extracts weaknesses", icon: "🔍", color: "blue" },
          { id: 3, name: "Gap Synthesizer", desc: "Clusters research signals", icon: "✨", color: "purple" },
          { id: 4, name: "Novelty Validator", desc: "Scores novelty & impact", icon: "🚀", color: "orange" },
          { id: 5, name: "Scope Generator", desc: "Produces hypothesis & scope", icon: "📝", color: "teal" },
          { id: 6, name: "Ranking Agent", desc: "Computes final weights", icon: "📊", color: "red" }
        ];

        return (
          <div className="modalBody">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Pipeline Engine</h3>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--orange)', letterSpacing: '0.1em' }}>
                {activeStep === 0 ? "Initializing..." : `Step ${activeStep}/6: ${pipelineAgents[activeStep-1]?.name}`}
              </div>
            </div>
            
            <p className="muted" style={{ marginBottom: 20, fontSize: '0.9rem' }}>
              GapForge coordinates specialized AI agents in a sequential pipeline to discover and validate research gaps autonomously.
            </p>

            <div className="agentPipelineContainer">
              {pipelineAgents.map((agent, i) => {
                const stepIdx = i + 1;
                const isActive = activeStep === stepIdx;
                const isCompleted = activeStep > stepIdx;
                
                return (
                  <div key={agent.id} style={{ position: 'relative' }}>
                    <div className={`agentStep ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                      <div className="agentNodeIcon" style={{ color: `var(--${agent.color}, var(--orange))` }}>
                        {agent.icon}
                      </div>
                      <div className="agentNodeContent">
                        <h4>{agent.name}</h4>
                        <p>{agent.desc}</p>
                      </div>
                      {isActive && <div className="nodePulse" />}
                    </div>
                    
                    {i < pipelineAgents.length - 1 && (
                      <div className="pipelineConnector" style={{ height: '22px', top: '100%', left: '42px' }}>
                        {isActive && <div className="dataParticle" />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <button 
                className="softBtn" 
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setActiveStep(0)}
              >
                Restart Simulation
              </button>
            </div>
          </div>
        );
      case "pricing":
        return (
          <div className="modalBody" style={{ padding: "0 10px 20px" }}>
            <div className="pricingGrid">
              <div className="pricingCard">
                <h4>Free</h4>
                <div className="pricingPrice">$0<span>/mo</span></div>
                <ul className="pricingFeatures">
                  <li><span className="checkIcon">✓</span> 5 pipeline runs/day</li>
                  <li><span className="checkIcon">✓</span> Basic directions</li>
                  <li><span className="checkIcon">✓</span> Local dataset access</li>
                </ul>
                <button className="pricingBtn">Current Plan</button>
              </div>
              <div className="pricingCard pro">
                <div className="pricingBadge">Recommended</div>
                <h4>Pro</h4>
                <div className="pricingPrice">$9<span>/mo</span></div>
                <ul className="pricingFeatures">
                  <li><span className="checkIcon">✓</span> Unlimited runs</li>
                  <li><span className="checkIcon">✓</span> Custom parameters</li>
                  <li><span className="checkIcon">✓</span> PDF/Markdown export</li>
                </ul>
                <button className="pricingBtn proBtn">Upgrade to Pro</button>
              </div>
              <div className="pricingCard">
                <h4>Enterprise</h4>
                <div className="pricingPrice">$49<span>/mo</span></div>
                <ul className="pricingFeatures">
                  <li><span className="checkIcon">✓</span> Team workspaces</li>
                  <li><span className="checkIcon">✓</span> Custom data ingest</li>
                  <li><span className="checkIcon">✓</span> Priority support</li>
                </ul>
                <button className="pricingBtn">Contact Sales</button>
              </div>
            </div>
          </div>
        );
      case "feedback":
        return (
          <div className="modalBody feedbackBody">
            <p className="subtext" style={{ marginBottom: "16px", textAlign: "left", fontSize: "0.95rem" }}>
              Help us improve GapForge. Share your thoughts, report bugs, or suggest features.
            </p>
            <div className="formGroup">
              <label htmlFor="feedbackInput" className="formLabel">Your Feedback</label>
              <textarea
                className="formTextarea"
                placeholder="What can we do better?"
                rows={5}
                id="feedbackInput"
              />
            </div>
            <div className="formFooter" style={{ marginTop: "16px" }}>
              <button
                className="sendBtn"
                style={{ width: "100%", borderRadius: "10px", height: "42px" }}
                onClick={() => {
                  const el = document.getElementById("feedbackInput") as HTMLTextAreaElement;
                  if (el) {
                    const text = el.value.trim();
                    if (text) {
                      const existing = JSON.parse(localStorage.getItem("gapforge_feedback") || "[]");
                      existing.push({ text, date: new Date().toISOString() });
                      localStorage.setItem("gapforge_feedback", JSON.stringify(existing));
                      el.value = "";
                      alert("Feedback submitted successfully. Thank you!");
                      onClose();
                    } else {
                      alert("Please enter some feedback first.");
                    }
                  }
                }}
              >
                Submit Feedback
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent" onClick={e => e.stopPropagation()}>
        <div className="modalHeader">
          <h2>{type.charAt(0).toUpperCase() + type.slice(1)}</h2>
          <button className="modalClose" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        {renderContent()}
      </div>
    </div>
  );
}
