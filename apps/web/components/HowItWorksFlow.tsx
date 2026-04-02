import React, { useState, useRef } from 'react';

const steps = [
  {
    id: 1,
    icon: '📄',
    title: '1. Feed Data',
    desc: 'Aggressively filters research papers.',
    fullDesc: 'Upload PDFs, scrape arXiv, or link Mendeley. Our Paper Analyst agent extracts only relevant methodology.'
  },
  {
    id: 2,
    icon: '🔍',
    title: '2. Extract Limitations',
    desc: 'Reads between the lines for gaps.',
    fullDesc: 'The AI engine reads conclusion sections, extracting stated weaknesses and future work explicitly cited by authors.'
  },
  {
    id: 3,
    icon: '🚀',
    title: '3. Generate Scopes',
    desc: 'Ranks by novelty and impact.',
    fullDesc: 'Automatically rank gap candidates by feasibility, novelty, and impact. Generate step-by-step hypothesis approaches.'
  },
  {
    id: 4,
    icon: '✨',
    title: '4. Map The Gaps',
    desc: 'Synthesizes overlapping clusters.',
    fullDesc: 'Discover aggregated clusters of overlapping limitations that reveal entirely under-researched domains and blind spots.'
  }
];

const Card3D = ({ step, index }: { step: typeof steps[0], index: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Percentage for reflection
    const xPct = (x / rect.width) * 100;
    const yPct = (y / rect.height) * 100;
    
    // Calculate rotation (max 15 degrees)
    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;
    
    setRotate({ x: rotateX, y: rotateY });
    setMousePos({ x: xPct, y: yPct });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setMousePos({ x: 50, y: 50 });
  };

  return (
    <div 
      className="card3dWrap" 
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      <div 
        ref={cardRef}
        className="card3d"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ 
          transform: rotate.x !== 0 || rotate.y !== 0 
            ? `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)` 
            : undefined,
          '--mouse-x': `${mousePos.x}%`,
          '--mouse-y': `${mousePos.y}%`,
          '--tilt-x': `${rotate.x}deg`,
          '--tilt-y': `${rotate.y}deg`,
        } as React.CSSProperties}
      >
        <div className="card3dContent">
          <div className="card3dIcon">{step.icon}</div>
          <div className="card3dText">
            <h4 className="card3dTitle">{step.title}</h4>
            <p className="card3dDesc">{step.desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const HowItWorksFlow = () => {
  return (
    <div className="flowContainer">
      {/* Desktop SVG Background Paths */}
      <svg viewBox="0 0 900 500" className="flowSvg">
        {/* Connection Paths logic for 2x2 grid */}
        {/* 1 (Top Left) -> 2 (Top Right) */}
        <path d="M 380 120 H 520" className="flowPath" />
        {/* 2 (Top Right) -> 3 (Bottom Right) */}
        <path d="M 650 190 V 310" className="flowPath" />
        {/* 3 (Bottom Right) -> 4 (Bottom Left) */}
        <path d="M 520 380 H 380" className="flowPath" />

        {/* Animated Particles */}
        <circle r="4" className="flowDataParticle">
          <animateMotion dur="3s" repeatCount="indefinite" path="M 380 120 H 520" />
        </circle>
        <circle r="4" className="flowDataParticle">
          <animateMotion dur="3s" repeatCount="indefinite" path="M 650 190 V 310" begin="1s" />
        </circle>
        <circle r="4" className="flowDataParticle">
          <animateMotion dur="3s" repeatCount="indefinite" path="M 520 380 H 380" begin="2s" />
        </circle>
      </svg>

      {/* Interactive 3D Cards Grid */}
      <div className="cardGrid3d">
        {steps.map((step, i) => (
          <Card3D key={step.id} step={step} index={i} />
        ))}
      </div>

      {/* Mobile Stacked Flow */}
      <div className="mobileFlow">
        {steps.map((step, i) => (
          <div key={step.id} className="mobileNode nodeEntrance" style={{ animationDelay: `${i * 0.1}s` }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '1.8rem' }}>{step.icon}</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{step.title}</h3>
            </div>
            <p className="subtext" style={{ fontSize: '0.9rem' }}>{step.fullDesc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
