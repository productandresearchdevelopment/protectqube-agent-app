"use client";

import React from "react";

/**
 * Realistic Isometric 3D SVG Illustration of the SmartBox Gateway Device.
 * Available in Hitam (Raspberry Pi 3B+) and Putih (Rockchip RK3328).
 */
export const SmartBoxIsometricIllustration: React.FC<{ isWhite?: boolean; className?: string }> = ({
  isWhite = false,
  className = "w-24 sm:w-28 h-auto drop-shadow-md select-none shrink-0",
}) => {
  const topColor = isWhite ? "#e2e8f0" : "#222c3f";
  const bevelColor = isWhite ? "#cbd5e1" : "#1a2332";
  const leftFace = isWhite ? "#94a3b8" : "#141c2b";
  const rightFace = isWhite ? "#64748b" : "#0d1420";
  const strokeCol = isWhite ? "#475569" : "#2d3a4f";

  return (
    <svg
      viewBox="0 0 160 110"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="80" cy="98" rx="65" ry="10" fill="black" fillOpacity="0.45" />
      <path d="M18 64 L78 96 L144 64 L84 34 Z" fill={rightFace} stroke={strokeCol} strokeWidth="1" />
      <path d="M18 42 L78 74 L78 94 L18 62 Z" fill={leftFace} stroke={strokeCol} strokeWidth="1" />
      <path d="M78 74 L144 42 L144 62 L78 94 Z" fill={rightFace} stroke={strokeCol} strokeWidth="1" />
      <path d="M18 42 L78 12 L144 42 L84 74 Z" fill={topColor} stroke={strokeCol} strokeWidth="1" />
      <path d="M20 42 L78 14 L142 42 L84 72 Z" fill={bevelColor} />

      {/* Front Ports & LED Indicators */}
      <path d="M25 54 L32 58 L32 65 L25 61 Z" fill="#080b12" stroke="#374151" strokeWidth="0.8" />
      <circle cx="28" cy="53" r="1.2" fill="#f59e0b" />
      <path d="M38 61 L45 65 L45 72 L38 68 Z" fill="#080b12" stroke="#374151" strokeWidth="0.8" />
      <circle cx="41" cy="60" r="1.2" fill="#00c875" />
      <path d="M51 68 L58 72 L58 79 L51 75 Z" fill="#080b12" stroke="#374151" strokeWidth="0.8" />
      <circle cx="54" cy="67" r="1.2" fill="#00c875" />
      <path d="M64 75 L71 79 L71 86 L64 82 Z" fill="#080b12" stroke="#374151" strokeWidth="0.8" />
      <circle cx="67" cy="74" r="1.2" fill="#00c875" />

      {/* Vents */}
      <path d="M88 80 L96 76 L96 70 L88 74 Z" fill="#080b12" stroke="#eab308" strokeWidth="0.8" />
      <path d="M104 72 L112 68 L112 62 L104 66 Z" fill="#080b12" stroke="#eab308" strokeWidth="0.8" />
      <path d="M120 64 L128 60 L128 54 L120 58 Z" fill="#080b12" stroke="#eab308" strokeWidth="0.8" />
    </svg>
  );
};
