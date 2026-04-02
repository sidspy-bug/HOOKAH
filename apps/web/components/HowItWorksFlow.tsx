import React from 'react';

const steps = [
  {
    id: 1,
    icon: '📄',
    title: '1. Feed Data',
    desc: 'Aggressively filters research papers.',
    fullDesc: 'Upload PDFs, scrape arXiv, or link Mendeley. Our Paper Analyst agent extracts only relevant methodology.',
    x: 50,
    y: 50
  },
  {
    id: 2,
    icon: '🔍',
    title: '2. Extract Limitations',
    desc: 'Reads between the lines for gaps.',
    fullDesc: 'The AI engine reads conclusion sections, extracting stated weaknesses and future work explicitly cited by authors.',
    x: 400,
    y: 50
  },
  {
    id: 3,
    icon: '✨',
    title: '3. Map The Gaps',
    desc: 'Synthesizes overlapping clusters.',
    fullDesc: 'Discover aggregated clusters of overlapping limitations that reveal entirely under-researched domains and blind spots.',
    x: 400,
    y: 250
  },
  {
    id: 4,
    icon: '🚀',
    title: '4. Generate Scopes',
    desc: 'Ranks by novelty and impact.',
    fullDesc: 'Automatically rank gap candidates by feasibility, novelty, and impact. Generate step-by-step hypothesis approaches.',
    x: 50,
    y: 250
  }
];

const paths = [
  { d: "M 300 100 L 400 100", id: "p1" }, // 1 -> 2
  { d: "M 525 150 L 525 250", id: "p2" }, // 2 -> 3 (Vertical)
  { d: "M 400 300 L 300 300", id: "p3" }, // 3 -> 4 (Backwards horizontal)
];

// Refined paths for a 2x2 grid layout
const gridPaths = [
  { from: 0, to: 1, d: "M 250 100 H 400" },
  { from: 1, to: 2, d: "M 525 150 V 250" },
  { from: 2, to: 3, d: "M 400 300 H 250" }
];

export const HowItWorksFlow = () => {
  return (
    <div className="flowContainer">
      {/* Desktop SVG Flow */}
      <svg viewBox="0 0 700 400" className="flowSvg">
        <defs>
          <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--surface)" />
            <stop offset="100%" stopColor="var(--surface-soft)" />
          </linearGradient>
        </defs>

        {/* Connection Paths */}
        <path d="M 230 100 H 400" className="flowPath" style={{ animationDelay: '0.2s' }} />
        <path d="M 525 150 V 250" className="flowPath" style={{ animationDelay: '0.8s' }} />
        <path d="M 400 300 H 230" className="flowPath" style={{ animationDelay: '1.4s' }} />

        {/* Data Particles */}
        <circle r="4" className="flowDataParticle particleAnim" style={{ "--path-d": '"M 230 100 H 400"', animationDelay: '0.5s' } as any} />
        <circle r="4" className="flowDataParticle particleAnim" style={{ "--path-d": '"M 525 150 V 250"', animationDelay: '1.2s' } as any} />
        <circle r="4" className="flowDataParticle particleAnim" style={{ "--path-d": '"M 400 300 H 230"', animationDelay: '1.9s' } as any} />

        {/* Nodes */}
        {steps.map((step, i) => (
          <g key={step.id} className="flowNodeContainer nodeEntrance" style={{ animationDelay: `${i * 0.4}s` }}>
            <rect 
              x={step.x} y={step.y} 
              width="250" height="100" 
              className="flowNodeRect"
            />
            <rect 
              x={step.x + 15} y={step.y + 15} 
              width="44" height="44" 
              className="flowIconOuter" 
            />
            <text x={step.x + 24} y={step.y + 44} style={{ fontSize: '20px' }}>{step.icon}</text>
            <text x={step.x + 75} y={step.y + 35} className="flowTitle">{step.title}</text>
            <text x={step.x + 75} y={step.y + 60} className="flowDesc">{step.desc}</text>
          </g>
        ))}
      </svg>

      {/* Mobile Stacked Flow */}
      <div className="mobileFlow">
        {steps.map((step, i) => (
          <div key={step.id} className="mobileNode nodeEntrance" style={{ animationDelay: `${i * 0.2}s` }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '2rem', background: 'var(--orange-glow)', padding: '10px', borderRadius: '12px' }}>{step.icon}</span>
              <h3 style={{ margin: 0 }}>{step.title}</h3>
            </div>
            <p className="subtext">{step.fullDesc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
