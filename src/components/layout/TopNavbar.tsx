"use client";

import React from "react";
import {
  Menu,
  RefreshCw,
  Sun,
  Moon,
  Search,
  CheckCircle2,
  AlertTriangle,
  Radio,
  SlidersHorizontal,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useGatewayHealth, useTriggerInspection } from "@/store/api/monitoring";
import { toast } from "sonner";

interface TopNavbarProps {
  title: string;
  onOpenMobile: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ title, onOpenMobile }) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { theme, setTheme } = useTheme();
  const { data: health } = useGatewayHealth();
  const triggerMutation = useTriggerInspection();

  const handleRefresh = async () => {
    try {
      await triggerMutation.mutateAsync();
      toast.success("Diagnosa hardware SmartBox berhasil diperbarui!");
    } catch {
      toast.error("Gagal melakukan diagnosa hardware.");
    }
  };

  const isHealthy = health?.overall_status === "HEALTHY";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs">
      {/* Left side: Mobile Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h1>
            {/* Monday Status Pill */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white shadow-xs ${
                isHealthy ? "bg-[#00c875]" : "bg-[#fdab3d]"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>{isHealthy ? "Operational" : "Attention"}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 hidden md:block">
            SmartBox Hitam & Putih Diagnostics • MQTT Realtime
          </p>
        </div>
      </div>

      {/* Middle: Monday.com Search Bar */}
      <div className="hidden lg:flex items-center max-w-xs w-full mx-6">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search diagnostics, agents, logs..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-[#0073ea] focus:ring-1 focus:ring-[#0073ea] outline-none transition-all"
          />
        </div>
      </div>

      {/* Right side: Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Monday Action Button (+ Inspect Hardware) */}
        <button
          onClick={handleRefresh}
          disabled={triggerMutation.isPending}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#0073ea] hover:bg-[#0060c5] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          title="Force hardware diagnostic probe cycle"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${triggerMutation.isPending ? "animate-spin" : ""}`}
          />
          <span className="hidden sm:inline">Inspect Now</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Light / Dark mode"
        >
          {mounted && theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>
    </header>
  );
};
