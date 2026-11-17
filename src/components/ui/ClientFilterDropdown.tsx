"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Building2, ChevronDown, Check, Search } from "lucide-react";
import { useClients } from "@/store/api/system";

export interface ClientFilterDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  className?: string;
}

export const ClientFilterDropdown: React.FC<ClientFilterDropdownProps> = ({
  value,
  onChange,
  options = [],
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: clientApiData } = useClients({ all: true });

  const clientList = useMemo(() => {
    const set = new Set<string>();

    // From API
    if (clientApiData) {
      const items = Array.isArray(clientApiData)
        ? clientApiData
        : (clientApiData as any)?.items || [];
      items.forEach((c: any) => {
        if (c?.name && typeof c.name === "string" && c.name.trim() && c.name.trim() !== "-") {
          set.add(c.name.trim());
        }
      });
    }

    // From options prop (e.g. current page gateways)
    options.forEach((opt) => {
      if (opt && typeof opt === "string" && opt.trim() && opt.trim() !== "-" && opt.trim() !== "All Clients") {
        set.add(opt.trim());
      }
    });

    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [clientApiData, options]);

  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clientList;
    const term = searchTerm.toLowerCase();
    return clientList.filter((c) => c.toLowerCase().includes(term));
  }, [clientList, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const curClient = value && value !== "All Clients" && value !== "All" ? value : "All Clients";
  const isSelected = curClient !== "All Clients";

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-xs ${
          isSelected
            ? "bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-[#0073ea] dark:text-[#00d2ff]"
            : "bg-slate-100 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800"
        }`}
        title={isSelected ? `Client: ${curClient}` : "Filter by Client"}
      >
        <Building2
          className={`size-3.5 ${
            isSelected
              ? "text-[#0073ea] dark:text-[#00d2ff]"
              : "text-slate-500 dark:text-slate-400"
          }`}
        />
        <span className="truncate max-w-[140px]">{curClient}</span>
        <ChevronDown
          className={`size-3.5 text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-56 rounded-xl bg-white dark:bg-[#0c1527] border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
          {clientList.length > 5 && (
            <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800">
              <div className="relative flex items-center">
                <Search className="size-3.5 absolute left-2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search client..."
                  className="w-full pl-7 pr-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto scrollbar-thin">
            {/* All Clients */}
            <button
              type="button"
              onClick={() => {
                onChange("All Clients");
                setIsOpen(false);
                setSearchTerm("");
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
                !isSelected
                  ? "bg-blue-50 dark:bg-blue-950/40 text-[#0073ea] font-semibold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Building2 className="size-3.5 text-slate-400 shrink-0" />
                <span className="truncate">All Clients</span>
              </div>
              {!isSelected && <Check className="size-3.5 text-[#0073ea] shrink-0" />}
            </button>

            {/* Client List */}
            {filteredClients.map((client) => {
              const active = curClient === client;
              return (
                <button
                  key={client}
                  type="button"
                  onClick={() => {
                    onChange(client);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
                    active
                      ? "bg-blue-50 dark:bg-blue-950/40 text-[#0073ea] font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="size-1.5 rounded-full bg-slate-400 shrink-0" />
                    <span className="truncate">{client}</span>
                  </div>
                  {active && <Check className="size-3.5 text-[#0073ea] shrink-0" />}
                </button>
              );
            })}

            {filteredClients.length === 0 && (
              <div className="px-3 py-3 text-center text-xs text-slate-400">
                No clients found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
