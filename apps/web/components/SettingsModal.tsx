type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h2>Settings</h2>
          <button className="modalClose" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modalBody">
          <section className="settingsSection">
            <h3>About GapForge</h3>
            <p className="muted">
              GapForge is an AI-assisted research gap discovery tool. It analyzes
              academic papers to identify research gaps, extract limitations, and
              suggest ranked project directions.
            </p>
          </section>

          <section className="settingsSection">
            <h3>Pipeline Agents</h3>
            <ul className="agentList">
              <li>
                <span className="agentDot green" />
                <div>
                  <strong>Paper Analyst</strong>
                  <p className="muted small">Selects relevant papers from the dataset</p>
                </div>
              </li>
              <li>
                <span className="agentDot blue" />
                <div>
                  <strong>Limitation Extractor</strong>
                  <p className="muted small">Extracts limitations &amp; future work</p>
                </div>
              </li>
              <li>
                <span className="agentDot purple" />
                <div>
                  <strong>Gap Synthesizer</strong>
                  <p className="muted small">Clusters signals into gap candidates</p>
                </div>
              </li>
              <li>
                <span className="agentDot orange" />
                <div>
                  <strong>Novelty Validator</strong>
                  <p className="muted small">Scores novelty, impact &amp; feasibility</p>
                </div>
              </li>
              <li>
                <span className="agentDot teal" />
                <div>
                  <strong>Scope Generator</strong>
                  <p className="muted small">Produces hypothesis &amp; project scope</p>
                </div>
              </li>
              <li>
                <span className="agentDot red" />
                <div>
                  <strong>Ranking Agent</strong>
                  <p className="muted small">Computes weighted scores &amp; ranks</p>
                </div>
              </li>
            </ul>
          </section>

          <section className="settingsSection">
            <h3>API Connection</h3>
            <div className="settingsRow">
              <span className="muted">Backend URL</span>
              <code>{process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}</code>
            </div>
            <div className="settingsRow">
              <span className="muted">Version</span>
              <code>v0.1.0 MVP</code>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
