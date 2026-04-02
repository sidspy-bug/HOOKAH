import React, { useMemo } from 'react';

const MATH_EQUATIONS = [
  "E = mc²", "∇ × E = -∂B/∂t", "iℏ∂ψ/∂t = Ĥψ", "S = k log W", 
  "e^{iπ} + 1 = 0", "F = G(m₁m₂)/r²", "PV = nRT", 
  "a² + b² = c²", "f'(x) = lim(h→0) (f(x+h) - f(x))/h",
  "σ² = ∑(x_i - μ)²/N", "H(X) = -∑P(x)logP(x)"
];

interface MathBackgroundProps {
  opacity?: number;
}

const MathBackground: React.FC<MathBackgroundProps> = ({ opacity = 1 }) => {
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
    <div style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      overflow: 'hidden', 
      zIndex: 0, 
      pointerEvents: 'none',
      opacity: opacity
    }}>
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

export default MathBackground;
