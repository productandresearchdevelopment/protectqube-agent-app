"use client";

import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Calendar,
  Cpu,
  XCircle,
  CheckCircle2,
  Clock,
  Radio,
  Signal,
  Thermometer,
  AlertCircle,
  X,
} from "lucide-react";
import {
  useCellularReportGatewayDetail,
  ICellularReportGatewayDetail,
} from "@/store/api/monitoring";
import { SmartBoxIsometricIllustration } from "@/components/ui/SmartBoxIllustration";

interface CellularReportDetailCardProps {
  gatewayId: string | null;
  dateRange?: string;
  onClose?: () => void;
}

export const CellularReportDetailCard: React.FC<CellularReportDetailCardProps> = ({
  gatewayId,
  dateRange,
  onClose,
}) => {
  const { data, isLoading } = useCellularReportGatewayDetail(gatewayId, dateRange);
  const [selectedEventDate, setSelectedEventDate] = useState<string>("ALL");
  const [hoveredDay, setHoveredDay] = useState<{
    day: number;
    dayNumStr: string;
    dateKey: string;
    fullDate: string;
    status: "online" | "offline" | "degraded";
    uptimePct: number;
    eventCount: number;
    totalDurationStr: string;
    isToday: boolean;
  } | null>(null);

  // Generate daily status bar chart items for each day of the month (01 Oct - 31 Oct)
  const dailyStatusList = useMemo(() => {
    const daysInMonth = 31;
    const monthStr = "Oct";
    const yearStr = "2026";
    const todayDay = 31;

    const events = data?.trouble_events || [];

    const list = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayNumStr = day < 10 ? `0${day}` : `${day}`;
      const dateKey = `${dayNumStr} ${monthStr}`;
      const fullDate = `${dayNumStr} ${monthStr} ${yearStr}`;

      const dayEvents = events.filter((ev) => {
        const trimmed = (ev.start_time || "").trim();
        return trimmed.startsWith(dateKey) || trimmed.startsWith(`${day} ${monthStr}`);
      });

      let status: "online" | "offline" | "degraded" = "online";
      let uptimePct = 100;
      let totalDurationStr = "0m";
      const eventCount = dayEvents.length;

      if (eventCount > 0) {
        status = "offline";
        uptimePct = Math.max(20, Math.round(100 - eventCount * 4));
        totalDurationStr = dayEvents[0]?.duration || `${eventCount * 5}m`;
      }

      list.push({
        day,
        dayNumStr,
        dateKey,
        fullDate,
        status,
        uptimePct,
        eventCount,
        totalDurationStr,
        isToday: day === todayDay,
      });
    }

    return list;
  }, [data?.trouble_events]);

  // Extract distinct dates for per-day filter (e.g. "30 Oct")
  const uniqueDates = useMemo(() => {
    const set = new Set<string>();
    (data?.trouble_events || []).forEach((ev) => {
      const parts = ev.start_time.trim().split(" ");
      if (parts.length >= 2) {
        set.add(`${parts[0]} ${parts[1]}`);
      }
    });
    return Array.from(set);
  }, [data?.trouble_events]);

  // Filter trouble events by selected date
  const filteredEvents = useMemo(() => {
    if (!data?.trouble_events) return [];
    if (selectedEventDate === "ALL") {
      return data.trouble_events;
    }
    return data.trouble_events.filter((ev) => ev.start_time.startsWith(selectedEventDate));
  }, [data?.trouble_events, selectedEventDate]);

  if (!gatewayId) return null;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <div className="size-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Memuat data performa gateway...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-[#070e1d] rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
        Data performa untuk gateway {gatewayId} tidak ditemukan.
      </div>
    );
  }

  const d = data;
  const isWhite = (d.type || "").includes("Putih");

  // Segment background color resolver
  const getSegmentBg = (status: string) => {
    switch (status) {
      case "online":
        return "bg-[#00c875]";
      case "degraded":
        return "bg-[#f59e0b]";
      case "offline":
        return "bg-[#e2445c]";
      case "no_data":
        return "bg-[#6366f1]";
      default:
        return "bg-[#00c875]";
    }
  };

  return (
    <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-4 sm:p-5 space-y-4 font-sans transition-all duration-300">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <FileSpreadsheet className="size-4" />
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Detail Performa Gateway &ndash; {d.location || d.id}
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#00c875]/15 dark:bg-[#00c875]/20 text-[#00c875] border border-[#00c875]/30">
            {d.status}
          </span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Tutup Detail"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 items-stretch">
        <div className="xl:col-span-4 bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row xl:flex-row gap-4 items-center sm:items-start xl:items-start justify-between shadow-xs">
          <div className="flex flex-col items-center justify-center shrink-0 pt-1">
            <SmartBoxIsometricIllustration isWhite={isWhite} />
          </div>

          <div className="flex-1 min-w-0 space-y-2 w-full">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide leading-tight truncate" title={d.location}>
                {d.location}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium truncate" title={d.id}>
                {d.id}
              </p>
            </div>

            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 font-normal pt-1">
              <div className="grid grid-cols-[80px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Tipe</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium">: {d.type}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Modem</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium">: {d.modem}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Provider</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium">: {d.provider}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">No. SIM Card</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-mono">: {d.sim_number}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">SIM Status</span>
                <span className="text-[#00c875] text-[11px] font-medium">: {d.sim_status}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">IP Address</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-mono">: {d.ip_address}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] items-start">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Lokasi</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">: {d.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (xl:col-span-8): 10 KPI Metric Cards (2 rows of 5 cards) */}
        <div className="xl:col-span-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {/* Card 1: Periode */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-slate-200/80 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <Calendar className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Periode</span>
            </div>
            <div className="mt-2.5">
              <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {d.period}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                {d.period_hours}
              </div>
            </div>
          </div>

          {/* Card 2: CPU – Modem Uptime */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-emerald-500/15 flex items-center justify-center text-[#00c875]">
                <Cpu className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">CPU – Modem Uptime</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#00c875] leading-tight">
                {d.cpu_modem_uptime}
              </div>
              <div className="text-[11px] font-semibold text-[#00c875] mt-0.5">
                {d.cpu_modem_uptime_pct}
              </div>
            </div>
          </div>

          {/* Card 3: CPU – Modem Offline */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-rose-500/15 flex items-center justify-center text-[#e2445c]">
                <XCircle className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">CPU – Modem Offline</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#e2445c] leading-tight">
                {d.cpu_modem_offline}
              </div>
              <div className="text-[11px] font-semibold text-[#e2445c] mt-0.5">
                {d.cpu_modem_offline_pct}
              </div>
            </div>
          </div>

          {/* Card 4: Success Rate */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-emerald-500/15 flex items-center justify-center text-[#00c875]">
                <CheckCircle2 className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Success Rate</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#00c875] leading-tight">
                {d.success_rate}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {d.success_rate_checks}
              </div>
            </div>
          </div>

          {/* Card 5: Avg Response Time */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-blue-500/15 flex items-center justify-center text-[#0073ea]">
                <Clock className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Avg Response Time</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {d.avg_response_time}
              </div>
            </div>
          </div>

          {/* Card 6: Network Uptime */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-emerald-500/15 flex items-center justify-center text-[#00c875]">
                <Radio className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Network Uptime</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#00c875] leading-tight">
                {d.network_uptime}
              </div>
              <div className="text-[11px] font-semibold text-[#00c875] mt-0.5">
                {d.network_uptime_pct}
              </div>
            </div>
          </div>

          {/* Card 7: Network Offline */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-rose-500/15 flex items-center justify-center text-[#e2445c]">
                <XCircle className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Network Offline</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#e2445c] leading-tight">
                {d.network_offline}
              </div>
              <div className="text-[11px] font-semibold text-[#e2445c] mt-0.5">
                {d.network_offline_pct}
              </div>
            </div>
          </div>

          {/* Card 8: Avg RSRP */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-blue-500/15 flex items-center justify-center text-[#0073ea]">
                <Signal className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Avg RSRP</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {d.avg_rsrp}
              </div>
            </div>
          </div>

          {/* Card 9: Avg Modem Temperature */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-rose-500/15 flex items-center justify-center text-[#e2445c]">
                <Thermometer className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Avg Modem Temp</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {d.avg_modem_temp}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {d.temp_range}
              </div>
            </div>
          </div>

          {/* Card 10: Total Gangguan */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-amber-500/15 flex items-center justify-center text-[#f59e0b]">
                <AlertCircle className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Total Gangguan</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#f59e0b] leading-tight">
                {d.total_gangguan}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Section: Timeline Status & Riwayat Gangguan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left Column (lg:col-span-6): Daily Status Bar Chart (01 Oct - 31 Oct) */}
        <div className="lg:col-span-6 bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            {/* Header with Title & Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Timeline Status Harian ({d.period})
                </h4>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  31 Hari
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#00c875]" />
                  Online
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#e2445c]" />
                  Gangguan / Offline
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-blue-500" />
                  Hari Ini
                </span>
              </div>
            </div>

            {/* Daily Bar Chart Card with Date Labels on TOP and Bars on BOTTOM */}
            <div className="mt-3.5 p-3.5 rounded-xl bg-white dark:bg-[#070e1d] border border-slate-200/90 dark:border-slate-800/80 shadow-xs">
              {/* 31 Columns Grid: Each day has Date Label on TOP and Bar on BOTTOM */}
              <div className="grid grid-cols-31 gap-1 sm:gap-1.5 items-end pt-1">
                {dailyStatusList.map((item) => {
                  const isSelected = selectedEventDate === item.dateKey;
                  const barColor =
                    item.status === "offline"
                      ? "bg-[#e2445c] hover:bg-[#ff4d6d]"
                      : (item.status as string) === "degraded"
                      ? "bg-[#f59e0b] hover:bg-[#fbbf24]"
                      : "bg-[#00c875] hover:bg-[#05e287]";

                  return (
                    <div
                      key={item.day}
                      onClick={() => {
                        if (selectedEventDate === item.dateKey) {
                          setSelectedEventDate("ALL");
                        } else {
                          setSelectedEventDate(item.dateKey);
                        }
                      }}
                      onMouseEnter={() => setHoveredDay(item)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className="flex flex-col items-center gap-2 cursor-pointer group"
                      title={`${item.fullDate}: ${
                        item.status === "offline" ? "Gangguan / Offline" : "Online Normal"
                      }`}
                    >
                      {/* 1. LABEL TANGGAL DI ATAS */}
                      <span
                        className={`text-[9px] sm:text-[10px] font-mono block leading-none transition-all select-none ${
                          item.isToday
                            ? "font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/20 px-1 py-0.5 rounded ring-1 ring-blue-500/50 scale-110 shadow-xs"
                            : isSelected
                            ? "font-bold text-amber-500 dark:text-amber-400"
                            : "text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200"
                        }`}
                      >
                        {item.dayNumStr}
                      </span>

                      {/* 2. BAR DI BAWAHNYA */}
                      <div className="w-full h-24 sm:h-28 bg-slate-100 dark:bg-slate-900/60 rounded-md p-0.5 flex flex-col justify-end border border-slate-200/60 dark:border-slate-800/60">
                        <div
                          style={{ height: `${item.uptimePct}%` }}
                          className={`w-full rounded-xs transition-all duration-200 ${barColor} ${
                            item.isToday
                              ? "ring-2 ring-blue-500 shadow-md shadow-blue-500/35"
                              : ""
                          } ${
                            isSelected
                              ? "ring-2 ring-amber-400 scale-105"
                              : "group-hover:scale-105"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Hover / Selected Day Real-Time Info Bar */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between text-xs min-h-7.5">
                {hoveredDay ? (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {hoveredDay.fullDate}
                      {hoveredDay.isToday && (
                        <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-500/20 text-blue-500">
                          Hari Ini
                        </span>
                      )}
                      :
                    </span>
                    <span
                      className={`font-medium ${
                        hoveredDay.status === "offline"
                          ? "text-[#e2445c]"
                          : "text-[#00c875]"
                      }`}
                    >
                      {hoveredDay.status === "offline"
                        ? `Gangguan Offline (${hoveredDay.eventCount} event, durasi ${hoveredDay.totalDurationStr})`
                        : `Normal Online (Uptime 100%)`}
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between w-full">
                    <span>
                      Arahkan kursor atau klik tanggal (01 - 31) untuk memfilter detail gangguan.
                    </span>
                    {selectedEventDate !== "ALL" && (
                      <button
                        onClick={() => setSelectedEventDate("ALL")}
                        className="text-blue-500 hover:underline text-[11px] font-medium cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (lg:col-span-6): Riwayat Gangguan Table with Date Selector & Scrollable 10 Rows */}
        <div className="lg:col-span-6 bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Riwayat Gangguan
                </h4>
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                  {filteredEvents.length} event
                </span>
              </div>

              {/* Date Selector Dropdown for Daily Filtering */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Filter Tanggal:</span>
                <select
                  value={selectedEventDate}
                  onChange={(e) => setSelectedEventDate(e.target.value)}
                  className="text-xs font-medium bg-white dark:bg-[#070e1d] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs"
                >
                  <option value="ALL">Semua Tanggal ({(d.trouble_events || []).length})</option>
                  {uniqueDates.map((dateStr) => {
                    const count = (d.trouble_events || []).filter((e) => e.start_time.startsWith(dateStr)).length;
                    return (
                      <option key={dateStr} value={dateStr}>
                        {dateStr} ({count} event)
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Scrollable Compact Table (max 10 rows visible) */}
            <div className="overflow-x-auto mt-2 max-h-87.5 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-[#0a1224] shadow-xs">
                  <tr className="text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/60 font-semibold">
                    <th className="py-2 px-2 text-center w-8">No.</th>
                    <th className="py-2 px-3">Mulai</th>
                    <th className="py-2 px-3">Selesai</th>
                    <th className="py-2 px-3 text-center">Durasi</th>
                    <th className="py-2 px-3">Penyebab / Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40 text-[11px]">
                  {filteredEvents.map((event, idx) => (
                    <tr
                      key={event.no || idx}
                      className="hover:bg-slate-100/80 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-2 px-2 text-center text-slate-500 dark:text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                        {event.start_time}
                      </td>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                        {event.end_time}
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-[#f59e0b] whitespace-nowrap">
                        {event.duration}
                      </td>
                      <td className="py-2 px-3 text-slate-800 dark:text-slate-200 truncate max-w-50" title={event.cause}>
                        {event.cause}
                      </td>
                    </tr>
                  ))}
                  {filteredEvents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500 dark:text-slate-400 text-xs">
                        Tidak ada riwayat gangguan pada tanggal yang dipilih.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
