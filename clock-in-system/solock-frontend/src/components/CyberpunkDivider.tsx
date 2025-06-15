import React from 'react';

const CyberpunkDivider: React.FC = () => (
  <div className="flex justify-center my-8">
    <svg width="340" height="24" viewBox="0 0 340 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id="neon-gradient" x1="0" y1="12" x2="340" y2="12" gradientUnits="userSpaceOnUse">
          <stop stopColor="#39FF14"/>
          <stop offset="1" stopColor="#00FFC6"/>
        </linearGradient>
      </defs>
      <g filter="url(#glow)">
        <rect x="0" y="10" width="340" height="4" rx="2" fill="url(#neon-gradient)">
          <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite"/>
        </rect>
        <circle cx="10" cy="12" r="6" fill="#39FF14">
          <animate attributeName="r" values="6;8;6" dur="1.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="330" cy="12" r="6" fill="#00FFC6">
          <animate attributeName="r" values="6;8;6" dur="1.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite"/>
        </circle>
      </g>
    </svg>
  </div>
);

export default CyberpunkDivider; 