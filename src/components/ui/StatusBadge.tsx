"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Activity } from "lucide-react";

export type StatusVariant =
  | "healthy"
  | "online"
  | "warning"
  | "degraded"
  | "caution"
  | "critical"
  | "offline"
  | "issue"
  | "good"
  | "wear"
  | "bad"
  | "neutral";

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  showDot?: boolean;
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  showDot = true,
  showIcon = false,
  className = "",
}) => {
  // Infer variant if not provided
  const normalized = (variant || status || "").toLowerCase();

  let colorClasses =
    "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
  let dotColor = "bg-slate-400";
  let Icon = Activity;

  if (
    normalized.includes("health") ||
    normalized.includes("online") ||
    normalized.includes("good") ||
    normalized.includes("normal") ||
    normalized.includes("running") ||
    normalized.includes("connected")
  ) {
    colorClasses =
      "bg-emerald-50 dark:bg-emerald-500/15 text-[#00c875] border-emerald-200/60 dark:border-emerald-500/25";
    dotColor = "bg-[#00c875]";
    Icon = CheckCircle2;
  } else if (
    normalized.includes("warn") ||
    normalized.includes("degraded") ||
    normalized.includes("caution") ||
    normalized.includes("wear") ||
    normalized.includes("issue")
  ) {
    colorClasses =
      "bg-amber-50 dark:bg-amber-500/15 text-[#fdab3d] border-amber-200/60 dark:border-amber-500/25";
    dotColor = "bg-[#fdab3d]";
    Icon = AlertTriangle;
  } else if (
    normalized.includes("crit") ||
    normalized.includes("off") ||
    normalized.includes("bad") ||
    normalized.includes("fail") ||
    normalized.includes("not detected") ||
    normalized.includes("no response") ||
    normalized.includes("poor")
  ) {
    colorClasses =
      "bg-rose-50 dark:bg-rose-500/15 text-[#e2445c] border-rose-200/60 dark:border-rose-500/25";
    dotColor = "bg-[#e2445c]";
    Icon = AlertCircle;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${colorClasses} ${className}`}
    >
      {showIcon ? (
        <Icon className="size-3 shrink-0" />
      ) : showDot ? (
        <span className={`size-1.5 rounded-full shrink-0 ${dotColor}`} />
      ) : null}
      <span>{status}</span>
    </span>
  );
};

// Device Type indicator pill (Hitam / Putih)
export const DeviceTypeBadge: React.FC<{
  type: string;
  className?: string;
}> = ({ type, className = "" }) => {
  const isBlack = type.toLowerCase().includes("hitam");

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div
        className={`w-4 h-2.5 rounded-xs border flex items-center justify-center ${
          isBlack
            ? "bg-slate-900 border-slate-700 text-white"
            : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700"
        }`}
      >
        <div
          className={`w-2.5 h-1 rounded-xs ${
            isBlack ? "bg-slate-600" : "bg-white"
          }`}
        />
      </div>
      <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium">
        {isBlack ? "Hitam" : "Putih"}
      </span>
    </div>
  );
};

// Mini Progress Load Bar for CPU / RAM / SD
export const LoadProgressBar: React.FC<{
  percent: number;
  showText?: boolean;
  className?: string;
}> = ({ percent, showText = true, className = "" }) => {
  const getColor = (pct: number) => {
    if (pct >= 85) return "bg-[#e2445c]";
    if (pct >= 60) return "bg-[#fdab3d]";
    return "bg-[#00c875]";
  };

  const getTextColor = (pct: number) => {
    if (pct >= 85) return "text-[#e2445c]";
    if (pct >= 60) return "text-[#fdab3d]";
    return "text-slate-800 dark:text-slate-200";
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {showText && (
        <span className={`text-[11px] font-bold w-8 text-right font-mono ${getTextColor(percent)}`}>
          {percent}%
        </span>
      )}
      <div className="w-10 h-2 rounded-xs bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0">
        <div
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
          className={`h-full ${getColor(percent)} transition-all duration-300`}
        />
      </div>
    </div>
  );
};
