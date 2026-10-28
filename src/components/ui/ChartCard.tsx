"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className = "",
  contentClassName = "",
}) => {
  return (
    <div
      className={`bg-white dark:bg-[#0b1120] border border-slate-200/90 dark:border-slate-800/80 rounded-xl px-3 py-3 sm:px-3.5 sm:py-3.5 shadow-xs transition-colors flex flex-col ${className}`}
    >
      {/* Chart Card Header */}
      <div className="flex items-center justify-between gap-2 mb-2 border-b border-slate-100 dark:border-slate-800/70 pb-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="size-6 rounded-md bg-blue-500/10 dark:bg-blue-500/15 text-[#0073ea] flex items-center justify-center shrink-0">
              <Icon className="size-3.5" />
            </div>
          )}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h4>
            {subtitle && (
              <p className="text-[10px] text-slate-400 font-medium">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>

      {/* Chart Canvas Area */}
      <div className={`relative w-full ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
};

// Reusable Grid Wrapper for Charts (default: 2 columns grid for 4 charts)
export const ChartGrid: React.FC<{
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}> = ({ children, columns = 2, className = "" }) => {
  const colClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 lg:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <div className={`grid gap-3.5 ${colClasses} ${className}`}>
      {children}
    </div>
  );
};
