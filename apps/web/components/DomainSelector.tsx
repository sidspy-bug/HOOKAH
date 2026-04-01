import React, { useState, useRef, useEffect } from 'react';

const DOMAIN_OPTIONS = [
  { value: "", label: "Any Domain", icon: "🌐" },
  { value: "health-ai", label: "Health AI", icon: "🩺" },
  { value: "finance", label: "Finance & Fintech", icon: "💰" },
  { value: "education", label: "Education Tech", icon: "🎓" },
  { value: "climate", label: "Climate Tech", icon: "🌍" },
  { value: "robotics", label: "Robotics", icon: "🤖" },
  { value: "public-sector-ai", label: "Public Sector", icon: "🏛️" },
  { value: "future-of-work", label: "Future of Work", icon: "💼" },
  { value: "ml-systems", label: "ML Systems", icon: "⚙️" },
];

export default function DomainSelector({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOption = DOMAIN_OPTIONS.find((o) => o.value === value) || { value, label: value || "Any Domain", icon: "✨" };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="domainSelector" ref={ref}>
      <button 
        type="button" 
        className={`domainTrigger ${isOpen ? 'open' : ''} ${value ? 'hasValue' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select domain"
      >
        <div className="domainValue">
          <span className="domainIcon">{selectedOption.icon}</span>
          <span>{selectedOption.label}</span>
        </div>
        <svg className="domainChevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div className="domainDropdown">
          <div className="domainDropdownHeader">Select Domain</div>
          <div className="domainOptions">
            {DOMAIN_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`domainOption ${value === option.value ? 'selected' : ''}`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span className="domainIcon">{option.icon}</span>
                <span>{option.label}</span>
                {value === option.value && (
                  <svg className="checkIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
