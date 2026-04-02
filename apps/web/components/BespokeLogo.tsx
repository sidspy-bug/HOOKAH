import React from 'react';

export const BespokeLogo = ({ size = 32, color = 'var(--orange)' }) => {
  return (
    <div className="bespokeLogo" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="logoSvg"
      >
        <circle cx="50" cy="50" r="48" stroke={color} strokeWidth="4" />
        <path
          d="M50 20L80 70H20L50 20Z"
          fill={color}
          className="logoTriangle"
        />
        <rect
          x="40"
          y="45"
          width="20"
          height="10"
          fill="var(--bg)"
          className="logoReflected"
        />
      </svg>
      <style jsx>{`
        .bespokeLogo {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .bespokeLogo:hover {
          transform: rotate(15deg) scale(1.1);
        }
        .logoSvg {
          width: 100%;
          height: 100%;
        }
        .logoTriangle {
          transform-origin: center;
          animation: logoFloat 3s ease-in-out infinite;
        }
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
};
