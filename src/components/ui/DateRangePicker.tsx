"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown, Check, X, RotateCcw } from "lucide-react";
import {
  parseDisplayToInput,
  parseInputToDisplay,
  getCurrentMonthPeriodStr,
  formatDateToInput,
  formatDateToDisplay,
} from "@/lib/reportPeriodUtils";

export interface DateRangePickerProps {
  value: string;
  onChange: (rangeStr: string) => void;
  className?: string;
  align?: "left" | "right";
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  className = "",
  align = "right",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Initialize input dates from current value
  const getInitialDates = () => {
    const defaultRange = value || getCurrentMonthPeriodStr();
    const parts = defaultRange.split(" - ");
    const s = parseDisplayToInput(parts[0]) || "2026-11-01";
    const e = parseDisplayToInput(parts[1]) || (parts[0] ? parseDisplayToInput(parts[0]) : "2026-11-04");
    return { s, e };
  };

  const [startDate, setStartDate] = useState<string>(() => getInitialDates().s);
  const [endDate, setEndDate] = useState<string>(() => getInitialDates().e);

  // Sync internal state when prop value changes
  useEffect(() => {
    const { s, e } = getInitialDates();
    setStartDate(s);
    setEndDate(e);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (ev: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(ev.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleApply = () => {
    let s = startDate;
    let e = endDate;
    if (!s && !e) {
      onChange(getCurrentMonthPeriodStr());
      setIsOpen(false);
      return;
    }
    if (!s && e) s = e;
    if (s && !e) e = s;

    // Ensure start is not after end
    if (s > e) {
      const temp = s;
      s = e;
      e = temp;
    }

    const dispStart = parseInputToDisplay(s);
    const dispEnd = parseInputToDisplay(e);
    const formatted = `${dispStart} - ${dispEnd}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleReset = () => {
    const def = getCurrentMonthPeriodStr();
    const parts = def.split(" - ");
    const s = parseDisplayToInput(parts[0]);
    const e = parseDisplayToInput(parts[1]);
    setStartDate(s);
    setEndDate(e);
    onChange(def);
    setIsOpen(false);
  };


  // Preview days count
  const calculateDays = () => {
    if (!startDate || !endDate) return 1;
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const diff = Math.abs(d2.getTime() - d1.getTime());
    return Math.round(diff / (1000 * 3600 * 24)) + 1;
  };

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-[#070e1d] hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-300 dark:border-slate-700/80 rounded-xl transition-all cursor-pointer shadow-xs active:scale-98"
        title="Klik untuk memilih rentang tanggal filter"
      >
        <Calendar className="size-3.5 text-[#0073ea]" />
        <span className="font-mono text-[11px] sm:text-xs tracking-tight">{value || "Pilih Tanggal"}</span>
        <ChevronDown
          className={`size-3 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } mt-2 w-80 sm:w-88 bg-white dark:bg-[#070e1d] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 text-slate-800 dark:text-slate-100 font-sans animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-blue-500/15 flex items-center justify-center text-[#0073ea]">
                <Calendar className="size-3.5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Filter Rentang Tanggal
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* Date Input Pickers: Start & End */}
          <div className="mt-3 space-y-2.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Tanggal Mulai (Start Date)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono font-medium bg-slate-50 dark:bg-[#0a1224] border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0073ea]/40 focus:border-[#0073ea] transition-all cursor-pointer shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Tanggal Selesai (End Date)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono font-medium bg-slate-50 dark:bg-[#0a1224] border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0073ea]/40 focus:border-[#0073ea] transition-all cursor-pointer shadow-2xs"
              />
            </div>
          </div>

          {/* Selection Preview */}
          <div className="mt-3 p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              Periode Terpilih:
            </div>
            <div className="font-mono text-blue-600 dark:text-blue-400 font-bold mt-0.5">
              {startDate ? parseInputToDisplay(startDate) : "-"} &ndash; {endDate ? parseInputToDisplay(endDate) : "-"} ({calculateDays()} Hari)
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-3.5 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors"
              title="Reset ke bulan berjalan"
            >
              <RotateCcw className="size-3" />
              <span>Reset</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-2.5 py-1.5 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#0073ea] hover:bg-blue-600 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Check className="size-3.5" />
                <span>Terapkan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

