"use client";

import React from "react";
import { Search, ChevronDown, Download, Calendar, Filter, X, LucideIcon } from "lucide-react";

export interface IFilterOption {
  label: string;
  value: string;
}

export interface IFilterConfig {
  id: string;
  label?: string;
  value: string;
  options: IFilterOption[];
  onChange: (val: string) => void;
  icon?: React.ReactNode;
}

interface FilterHeaderProps {
  search: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  filters?: IFilterConfig[];
  actions?: React.ReactNode;
  timeframe?: string;
  onTimeframeClick?: () => void;
  onExportClick?: () => void;
  exportLoading?: boolean;
  title?: string;
  titleIcon?: LucideIcon;
  totalCount?: number;
  unitLabel?: string;
  className?: string;
}

export const FilterHeader: React.FC<FilterHeaderProps> = ({
  search,
  onSearchChange,
  searchPlaceholder = "Cari gateway ID, lokasi...",
  filters = [],
  actions,
  timeframe = "24 Jam Terakhir",
  onTimeframeClick,
  onExportClick,
  exportLoading = false,
  title,
  titleIcon: TitleIcon,
  totalCount,
  unitLabel = "unit",
  className = "",
}) => {
  return (
    <div
      className={`bg-white dark:bg-[#0b1120] border border-slate-200/90 dark:border-slate-800/80 rounded-xl p-4 shadow-xs transition-colors ${className}`}
    >
      {title ? (
        <div className="space-y-3.5">
          {/* Top Bar: Title, Count Badge, Timeframe & Export */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              {TitleIcon ? (
                <div className="size-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/15 text-[#0073ea] flex items-center justify-center shrink-0">
                  <TitleIcon className="size-4" />
                </div>
              ) : (
                <div className="size-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/15 text-[#0073ea] flex items-center justify-center shrink-0">
                  <Filter className="size-4" />
                </div>
              )}
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                  {title}
                </h1>
                {totalCount !== undefined && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 dark:bg-blue-500/15 text-[#0073ea] border border-blue-500/20">
                    Total: {totalCount.toLocaleString()} {unitLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Right Side: Actions (Timeframe, Export) */}
            <div className="flex flex-wrap items-center gap-2">
              {actions}

              {onTimeframeClick && (
                <button
                  type="button"
                  onClick={onTimeframeClick}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-xs"
                >
                  <Calendar className="size-3.5 text-[#0073ea]" />
                  <span>{timeframe}</span>
                  <ChevronDown className="size-3 text-slate-400" />
                </button>
              )}

              {onExportClick && (
                <button
                  type="button"
                  disabled={exportLoading}
                  onClick={onExportClick}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0073ea] hover:bg-blue-600 active:scale-95 rounded-lg transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Download className="size-3.5" />
                  <span>{exportLoading ? "Exporting..." : "Export CSV"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom Bar: Search Bar & All Dynamic Filters (Neatly side-by-side on 1 row) */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-55 max-w-sm flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#0073ea]/30 focus:border-[#0073ea] transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* Dynamic Filter Dropdowns */}
            {filters.map((f) => (
              <div key={f.id} className="relative">
                <select
                  value={f.value}
                  onChange={(e) => f.onChange(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0073ea]/30 focus:border-[#0073ea] transition-all cursor-pointer shadow-xs"
                >
                  {f.options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Single Row Mode (when title is omitted) */
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left Side: Search Bar & Filters */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
            {/* Search Input */}
            <div className="relative min-w-50 sm:min-w-65 max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#0073ea]/30 focus:border-[#0073ea] transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Dynamic Filter Dropdowns */}
            {filters.map((f) => (
              <div key={f.id} className="relative">
                <select
                  value={f.value}
                  onChange={(e) => f.onChange(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0073ea]/30 focus:border-[#0073ea] transition-all cursor-pointer"
                >
                  {f.options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
              </div>
            ))}
          </div>

          {/* Right Side: Actions (Timeframe, Export, Custom) */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto shrink-0">
            {actions}

            {onTimeframeClick && (
              <button
                type="button"
                onClick={onTimeframeClick}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Calendar className="size-3.5 text-[#0073ea]" />
                <span>{timeframe}</span>
                <ChevronDown className="size-3 text-slate-400" />
              </button>
            )}

            {onExportClick && (
              <button
                type="button"
                disabled={exportLoading}
                onClick={onExportClick}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#0073ea] hover:bg-blue-600 active:scale-95 rounded-lg transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Download className="size-3.5" />
                <span>{exportLoading ? "Exporting..." : "Export CSV"}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
