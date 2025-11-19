'use client';

export default function AnimatedSushi() {
  return (
    <div className="animate-spin-slow">
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
      >
        {/* Nori (seaweed) wrapper - black curved shape */}
        <path
          d="M 30 40 Q 60 20 90 40 L 90 80 Q 60 100 30 80 Z"
          fill="#1a1a1a"
          className="drop-shadow-md"
        />
        
        {/* Rice fill */}
        <ellipse cx="60" cy="60" rx="25" ry="20" fill="#f5f5dc" opacity="0.9" />
        
        {/* Orange/salmon filling */}
        <ellipse cx="60" cy="55" rx="18" ry="12" fill="#ff9966" />
        
        {/* Highlight on rice */}
        <ellipse cx="50" cy="50" rx="8" ry="5" fill="#ffffff" opacity="0.6" />
        
        {/* Left eye - white */}
        <circle cx="45" cy="68" r="5" fill="#ffffff" />
        {/* Left pupil */}
        <circle cx="46" cy="69" r="2.5" fill="#000000" />
        
        {/* Right eye - white */}
        <circle cx="75" cy="68" r="5" fill="#ffffff" />
        {/* Right pupil */}
        <circle cx="76" cy="69" r="2.5" fill="#000000" />
        
        {/* Smile - curved mouth */}
        <path
          d="M 50 78 Q 60 84 70 78"
          stroke="#000000"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
