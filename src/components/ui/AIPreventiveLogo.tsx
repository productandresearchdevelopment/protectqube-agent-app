import React from "react";

interface AIPreventiveLogoProps {
  className?: string;
  size?: number;
}

export const AIPreventiveLogo: React.FC<AIPreventiveLogoProps> = ({
  className = "size-7",
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="aiShieldGlow" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" stopOpacity="0.22" />
          <stop offset="1" stopColor="#0284c7" stopOpacity="0.06" />
        </linearGradient>
        <linearGradient id="aiSparkGrad" x1="8" y1="7" x2="16" y2="17" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff8a65" />
          <stop offset="1" stopColor="#ff5722" />
        </linearGradient>
      </defs>

      {/* Outer Preventive Shield */}
      <path
        d="M12 2.2L4 6.2V11.8C4 16.8 7.5 21.2 12 22.5C16.5 21.2 20 16.8 20 11.8V6.2L12 2.2Z"
        fill="url(#aiShieldGlow)"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* AI Intelligence Sparkle (Gradient Orange #ff7a59) */}
      <path
        d="M12 7.2C12 9.5 10.3 11.3 8 12C10.3 12.7 12 14.5 12 16.8C12 14.5 13.7 12.7 16 12C13.7 11.3 12 9.5 12 7.2Z"
        fill="url(#aiSparkGrad)"
      />

      {/* Center Neural Sensor Node */}
      <circle cx="12" cy="12" r="1.3" fill="#ffffff" />
    </svg>
  );
};
