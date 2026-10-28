"use client";

import React from "react";
import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";

export type CardColorTheme =
  | "blue"
  | "emerald"
  | "amber"
  | "rose"
  | "purple"
  | "indigo"
  | "cyan"
  | "slate";

// Isometric 3D SVG of the SmartBox Gateway Device (Hitam or Putih)
export const SmartBoxIllustration: React.FC<{
  isWhite?: boolean;
  className?: string;
}> = ({
  isWhite,
  className = "w-14 sm:w-16 h-auto drop-shadow-md select-none shrink-0",
}) => {
  const topColor = isWhite ? "#e2e8f0" : "#253248";
  const bevelColor = isWhite ? "#cbd5e1" : "#1e293b";
  const leftFace = isWhite ? "#94a3b8" : "#1b2438";
  const rightFace = isWhite ? "#64748b" : "#0f172a";
  const strokeCol = isWhite ? "#475569" : "#334155";

  return (
    <svg
      viewBox="0 0 160 110"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="80" cy="98" rx="65" ry="10" fill="black" fillOpacity="0.35" />
      <path d="M18 64 L78 96 L144 64 L84 34 Z" fill={rightFace} stroke={strokeCol} strokeWidth="1" />
      <path d="M18 42 L78 74 L78 94 L18 62 Z" fill={leftFace} stroke={strokeCol} strokeWidth="1" />
      <path d="M78 74 L144 42 L144 62 L78 94 Z" fill={rightFace} stroke={strokeCol} strokeWidth="1" />
      <path d="M18 42 L78 12 L144 42 L84 74 Z" fill={topColor} stroke={strokeCol} strokeWidth="1" />
      <path d="M20 42 L78 14 L142 42 L84 72 Z" fill={bevelColor} />

      {/* Ports */}
      <path d="M25 54 L32 58 L32 65 L25 61 Z" fill="#090d16" stroke="#475569" strokeWidth="0.8" />
      <circle cx="28" cy="53" r="1" fill="#f59e0b" />
      <path d="M38 61 L45 65 L45 72 L38 68 Z" fill="#090d16" stroke="#475569" strokeWidth="0.8" />
      <circle cx="41" cy="60" r="1" fill="#10b981" />
      <path d="M51 68 L58 72 L58 79 L51 75 Z" fill="#090d16" stroke="#475569" strokeWidth="0.8" />
      <circle cx="54" cy="67" r="1" fill="#10b981" />
      <path d="M64 75 L71 79 L71 86 L64 82 Z" fill="#090d16" stroke="#475569" strokeWidth="0.8" />
      <circle cx="67" cy="74" r="1" fill="#10b981" />

      <path d="M88 80 L96 76 L96 70 L88 74 Z" fill="#090d16" stroke="#eab308" strokeWidth="0.8" />
      <path d="M104 72 L112 68 L112 62 L104 66 Z" fill="#090d16" stroke="#eab308" strokeWidth="0.8" />
      <path d="M120 64 L128 60 L128 54 L120 58 Z" fill="#090d16" stroke="#eab308" strokeWidth="0.8" />
      <rect x="74" y="38" width="10" height="3" transform="rotate(-26 74 38)" fill="#38bdf8" fillOpacity="0.4" />
    </svg>
  );
};

export interface ISummaryCardItem {
  id?: string;
  title: string;
  value: string | number;
  icon?: LucideIcon;
  color?: CardColorTheme;
  percentage?: string | number;
  sublabel?: string;
  deviceType?: "hitam" | "putih";
  deviceImage?: React.ReactNode;
  breakdown?: {
    healthy: number;
    warning: number;
    critical: number;
  };
  badge?: {
    text: string;
    variant?: "success" | "warning" | "danger" | "info" | "neutral";
    trend?: "up" | "down" | "neutral";
  };
  subtext?: string | React.ReactNode;
  footer?: React.ReactNode;
  sparkline?: number[];
  onClick?: () => void;
  active?: boolean;
  className?: string;
}

const cardThemeMap: Record<
  CardColorTheme,
  {
    cardBg: string;
    iconBg: string;
    valColor: string;
  }
> = {
  blue: {
    cardBg: "bg-white dark:bg-[#07172f] border-slate-200/90 dark:border-blue-900/50 shadow-xs",
    iconBg: "bg-[#0073ea] text-white",
    valColor: "text-[#0073ea] dark:text-[#0091ff]",
  },
  emerald: {
    cardBg: "bg-white dark:bg-[#06241b] border-slate-200/90 dark:border-emerald-900/50 shadow-xs",
    iconBg: "bg-[#00c875] text-white dark:text-[#06241b]",
    valColor: "text-[#00a862] dark:text-[#00c875]",
  },
  amber: {
    cardBg: "bg-white dark:bg-[#221c0b] border-slate-200/90 dark:border-amber-900/50 shadow-xs",
    iconBg: "bg-[#fdab3d] text-white dark:text-[#221c0b]",
    valColor: "text-[#d97706] dark:text-[#fdab3d]",
  },
  rose: {
    cardBg: "bg-white dark:bg-[#281019] border-slate-200/90 dark:border-rose-950/60 shadow-xs",
    iconBg: "bg-[#f65f6e] text-white dark:text-[#281019]",
    valColor: "text-[#e2445c]",
  },
  slate: {
    cardBg: "bg-white dark:bg-[#0b1324] border-slate-200/90 dark:border-slate-800/80 shadow-xs",
    iconBg: "bg-slate-700 text-white",
    valColor: "text-[#0073ea] dark:text-[#0091ff]",
  },
  indigo: {
    cardBg: "bg-white dark:bg-[#0b1324] border-slate-200/90 dark:border-slate-800/80 shadow-xs",
    iconBg: "bg-indigo-600 text-white",
    valColor: "text-[#0073ea] dark:text-[#0091ff]",
  },
  purple: {
    cardBg: "bg-white dark:bg-[#0b1324] border-slate-200/90 dark:border-purple-900/50 shadow-xs",
    iconBg: "bg-purple-600 text-white",
    valColor: "text-purple-600 dark:text-purple-400",
  },
  cyan: {
    cardBg: "bg-white dark:bg-[#071a2c] border-slate-200/90 dark:border-cyan-900/50 shadow-xs",
    iconBg: "bg-cyan-500 text-white",
    valColor: "text-cyan-600 dark:text-cyan-400",
  },
};

export const SummaryCard: React.FC<ISummaryCardItem> = ({
  title,
  value,
  icon: Icon,
  color = "blue",
  percentage,
  sublabel,
  deviceType,
  deviceImage,
  breakdown,
  badge,
  subtext,
  footer,
  onClick,
  active = false,
  className = "",
}) => {
  const theme = cardThemeMap[color] || cardThemeMap.blue;

  // Total for breakdown bar
  const breakdownTotal = breakdown
    ? breakdown.healthy + breakdown.warning + breakdown.critical || 1
    : 0;

  return (
    <div
      onClick={onClick}
      className={`border rounded-xl p-3 sm:px-3.5 sm:py-3 transition-all duration-200 shadow-xs flex items-center gap-3 select-none ${
        theme.cardBg
      } ${
        onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md" : ""
      } ${
        active
          ? "ring-2 ring-[#0073ea]/40 border-[#0073ea]"
          : ""
      } ${className}`}
    >
      {/* Left Column: Solid Icon Circle or 3D Device Illustration */}
      <div className="shrink-0 flex items-center justify-center">
        {deviceImage ? (
          deviceImage
        ) : deviceType ? (
          <SmartBoxIllustration
            isWhite={deviceType === "putih"}
            className="w-14 sm:w-16 h-auto drop-shadow-md select-none shrink-0"
          />
        ) : Icon ? (
          <div
            className={`size-10 sm:size-11 rounded-full ${theme.iconBg} flex items-center justify-center shrink-0 shadow-sm`}
          >
            <Icon
              className="size-5"
              strokeWidth={color === "emerald" || color === "amber" ? 2.8 : 2}
            />
          </div>
        ) : null}
      </div>

      {/* Right Column: Values & Details */}
      <div className="flex-1 min-w-0">
        {/* Value */}
        <div className={`text-xl sm:text-2xl font-black tracking-tight leading-none ${theme.valColor}`}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>

        {/* Title & Sublabel */}
        <div className="mt-1 flex items-baseline gap-1 flex-wrap">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 tracking-tight truncate">
            {title}
          </span>
          {sublabel && (
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal truncate">
              {sublabel}
            </span>
          )}
        </div>

        {/* Percentage (e.g. 94.5% for Healthy, 4.0% for Warning) */}
        {percentage && (
          <div className={`text-xs font-bold leading-none mt-1 ${theme.valColor}`}>
            {percentage}
          </div>
        )}

        {/* Breakdown Progress Bar & Legend (for SmartBox Hitam & Putih) */}
        {breakdown && (
          <div className="mt-1.5 w-full">
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden">
              <div
                style={{ width: `${(breakdown.healthy / breakdownTotal) * 100}%` }}
                className="bg-[#00c875] h-full"
              />
              <div
                style={{ width: `${(breakdown.warning / breakdownTotal) * 100}%` }}
                className="bg-[#fdab3d] h-full"
              />
              <div
                style={{ width: `${(breakdown.critical / breakdownTotal) * 100}%` }}
                className="bg-[#e2445c] h-full"
              />
            </div>
            <div className="flex items-center gap-2.5 text-[10px] font-semibold mt-1">
              <span className="flex items-center gap-1 text-[#00c875]">
                <span className="size-1.5 rounded-full bg-[#00c875]" />
                {breakdown.healthy}
              </span>
              <span className="flex items-center gap-1 text-[#fdab3d]">
                <span className="size-1.5 rounded-full bg-[#fdab3d]" />
                {breakdown.warning}
              </span>
              <span className="flex items-center gap-1 text-[#e2445c]">
                <span className="size-1.5 rounded-full bg-[#e2445c]" />
                {breakdown.critical}
              </span>
            </div>
          </div>
        )}

        {/* Fallback for legacy footer/subtext if passed and no breakdown/percentage */}
        {!breakdown && !percentage && footer && (
          <div className="mt-1.5 text-xs text-slate-400">
            {footer}
          </div>
        )}
        {!breakdown && !percentage && subtext && !footer && (
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable Grid Wrapper for Summary Cards
export const SummaryCardsGrid: React.FC<{
  cards: ISummaryCardItem[];
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}> = ({ cards, columns = 6, className = "" }) => {
  const colClasses = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
    6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
  }[columns];

  return (
    <div className={`grid gap-3.5 ${colClasses} ${className}`}>
      {cards.map((card, idx) => (
        <SummaryCard key={card.id || card.title || idx} {...card} />
      ))}
    </div>
  );
};
