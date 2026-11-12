"use client";

import React, { useState, useRef, useEffect } from "react";
import { Package, ChevronDown, Check } from "lucide-react";

export interface TypeFilterDropdownProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const TypeFilterDropdown: React.FC<TypeFilterDropdownProps> = ({
  value,
  onChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const curType = value || "All Types";
  const isBlack =
    curType.toLowerCase().includes("hitam") ||
    curType.toLowerCase().includes("black");
  const isWhite =
    curType.toLowerCase().includes("putih") ||
    curType.toLowerCase().includes("white");

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-xs ${
          isBlack
            ? "bg-slate-900 border-slate-700 text-white"
            : isWhite
            ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100"
            : "bg-slate-100 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800"
        }`}
      >
        {isBlack ? (
          <div className="size-4 rounded flex items-center justify-center shrink-0 bg-slate-950 border border-slate-700">
            <div className="w-2.5 h-1 rounded-xs bg-slate-500" />
          </div>
        ) : isWhite ? (
          <div className="size-4 rounded flex items-center justify-center shrink-0 bg-white border border-slate-300">
            <div className="w-2.5 h-1 rounded-xs bg-slate-300" />
          </div>
        ) : (
          <Package className="size-3.5 text-slate-500" />
        )}

        <span>
          {isBlack
            ? "SmartBox Black"
            : isWhite
            ? "SmartBox White"
            : "All Types"}
        </span>
        <ChevronDown
          className={`size-3.5 text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white dark:bg-[#0c1527] border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* All Types */}
          <button
            type="button"
            onClick={() => {
              onChange("All Types");
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
              !isBlack && !isWhite
                ? "bg-blue-50 dark:bg-blue-950/40 text-[#0073ea] font-semibold"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <div className="flex items-center gap-2">
              <Package className="size-3.5 text-slate-400" />
              <span>All Types</span>
            </div>
            {!isBlack && !isWhite && (
              <Check className="size-3.5 text-[#0073ea]" />
            )}
          </button>

          {/* SmartBox Black */}
          <button
            type="button"
            onClick={() => {
              onChange("SmartBox Hitam");
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
              isBlack
                ? "bg-blue-50 dark:bg-blue-950/40 text-[#0073ea] font-semibold"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="size-4 rounded flex items-center justify-center shrink-0 bg-slate-900 border border-slate-700">
                <div className="w-2.5 h-1 rounded-xs bg-slate-500" />
              </div>
              <span>SmartBox Black</span>
            </div>
            {isBlack && <Check className="size-3.5 text-[#0073ea]" />}
          </button>

          {/* SmartBox White */}
          <button
            type="button"
            onClick={() => {
              onChange("SmartBox Putih");
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
              isWhite
                ? "bg-blue-50 dark:bg-blue-950/40 text-[#0073ea] font-semibold"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="size-4 rounded flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600">
                <div className="w-2.5 h-1 rounded-xs bg-white" />
              </div>
              <span>SmartBox White</span>
            </div>
            {isWhite && <Check className="size-3.5 text-[#0073ea]" />}
          </button>
        </div>
      )}
    </div>
  );
};
