"use client";

import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Calendar,
  Cpu,
  XCircle,
  CheckCircle2,
  Clock,
  Disc,
  Pause,
  AlertCircle,
  HardDrive,
  Video,
  X,
} from "lucide-react";
import {
  useDVRReportGatewayDetail,
  IDVRReportGatewayDetail,
  IDailySlaRecord,
  IDailySlaSummary,
} from "@/store/api/monitoring";
import { SmartBoxIsometricIllustration } from "@/components/ui/SmartBoxIllustration";
import { parseReportPeriod } from "@/lib/reportPeriodUtils";


interface DVRReportDetailCardProps {
  gatewayId: string | null;
  dateRange?: string;
  onClose?: () => void;
}

export const DVRReportDetailCard: React.FC<DVRReportDetailCardProps> = ({
  gatewayId,
  dateRange,
  onClose,
}) => {
  const { data, isLoading } = useDVRReportGatewayDetail(gatewayId, dateRange);
  const [selectedEventDate, setSelectedEventDate] = useState<string>("ALL");
  const [selectedBarDay, setSelectedBarDay] = useState<number | null>(null);
  const [dailyViewMetric, setDailyViewMetric] = useState<"cpu_dvr" | "recording">("cpu_dvr");

  const handleSelectDay = (day: number | null, dateKey?: string) => {
    setSelectedBarDay((prev) => (prev === day ? null : day));
    if (day === null) {
      setSelectedEventDate("ALL");
    } else if (dateKey) {
      setSelectedEventDate(dateKey);
    }
  };
  const [hoveredDay, setHoveredDay] = useState<{
    day: number;
    dayNumStr: string;
    dateKey: string;
    fullDate: string;
    gwStatus: "online" | "offline" | "degraded" | "future";
    cellStatus: "online" | "offline" | "degraded" | "future";
    dvrStatus: "online" | "offline" | "degraded" | "future";
    eventsCount: number;
    isToday: boolean;
    isFuture?: boolean;
  } | null>(null);

  const periodInfo = useMemo(() => {
    return parseReportPeriod(data?.period || dateRange);
  }, [data?.period, dateRange]);

  // Generate dynamic daily status points: full 30-day month timeline, indicators only appear for filtered dates
  const dailyMultiTrack = useMemo(() => {
    const { daysInMonth, monthStr, yearStr, todayDay, isCurrentMonth } = periodInfo;
    const minDay = periodInfo.startDay;
    const maxDay = periodInfo.endDay;
    const events = data?.trouble_events || [];
    const breakdown = data?.daily_breakdown || [];

    const totalDays = Math.max(daysInMonth, maxDay);
    const list = [];
    for (let day = 1; day <= totalDays; day++) {
      const dayNumStr = day < 10 ? `0${day}` : `${day}`;
      const dateKey = `${dayNumStr} ${monthStr}`;
      const fullDate = `${dayNumStr} ${monthStr} ${yearStr}`;

      const isInRange = day >= minDay && day <= maxDay;
      const isFutureDate = Boolean(isCurrentMonth && todayDay && day > todayDay);
      const hasBar = isInRange && !isFutureDate;

      const dayEvents = hasBar
        ? events.filter((ev) => {
            const trimmed = (ev.start_time || "").trim();
            return trimmed.startsWith(dateKey) || trimmed.startsWith(`${day} ${monthStr}`);
          })
        : [];

      const daySla = breakdown.find((r) => r.day === day);

      // Status per track
      let gwStatus: "online" | "offline" | "future" = !hasBar ? "future" : "online";
      let cellStatus: "online" | "offline" | "future" = !hasBar ? "future" : "online";
      let dvrStatus: "online" | "offline" | "future" = !hasBar ? "future" : "online";

      if (hasBar) {
        if (daySla) {
          if ((daySla.cpu_modem_downtime_min ?? 0) > 0) gwStatus = "offline";
          if ((daySla.cellular_downtime_min ?? 0) > 0) cellStatus = "offline";
          if ((daySla.cpu_dvr_downtime_min ?? daySla.downtime_min ?? 0) > 0 || (daySla.rec_downtime_min ?? 0) > 0) dvrStatus = "offline";
        }

        for (const ev of dayEvents) {
          const cat = (ev.category || "").toLowerCase();
          const desc = (ev.description || "").toLowerCase();
          if (cat.includes("gateway") || desc.includes("gateway") || desc.includes("power")) {
            gwStatus = "offline";
          }
          if (cat.includes("cellular") || desc.includes("sim") || desc.includes("modem")) {
            cellStatus = "offline";
          }
          if (cat.includes("dvr") || cat.includes("camera") || desc.includes("recording") || desc.includes("nvr")) {
            dvrStatus = "offline";
          }
        }

        if (gwStatus === "offline") {
          cellStatus = "offline";
          dvrStatus = "offline";
        }
      }

      list.push({
        day,
        dayNumStr,
        dateKey,
        fullDate,
        gwStatus,
        cellStatus,
        dvrStatus,
        eventsCount: dayEvents.length,
        isToday: day === todayDay,
        isFuture: !hasBar,
        isInRange,
      });
    }

    return list;
  }, [data?.trouble_events, data?.daily_breakdown, periodInfo]);

  // 1. Filter trouble events strictly within the active date range
  const rangeFilteredEvents = useMemo(() => {
    const rawEvents = data?.trouble_events || [];
    const minDay = periodInfo.startDay;
    const maxDay = periodInfo.endDay || periodInfo.effectiveDays;
    const month = periodInfo.monthStr.toLowerCase();

    return rawEvents.filter((ev) => {
      const parts = (ev.start_time || "").trim().split(" ");
      if (parts.length >= 2) {
        const dNum = parseInt(parts[0], 10);
        const mStr = parts[1].toLowerCase().replace(".", "");
        const isSameMonth = mStr.startsWith(month.slice(0, 3)) || month.startsWith(mStr.slice(0, 3));
        if (!isNaN(dNum) && isSameMonth) {
          return dNum >= minDay && dNum <= maxDay;
        }
        if (!isNaN(dNum) && !isSameMonth) {
          return false;
        }
      }
      return true;
    });
  }, [data?.trouble_events, periodInfo.startDay, periodInfo.endDay, periodInfo.effectiveDays, periodInfo.monthStr]);

  // 2. Extract distinct dates for trouble event filter dropdown
  const uniqueDates = useMemo(() => {
    const set = new Set<string>();
    rangeFilteredEvents.forEach((ev) => {
      const parts = ev.start_time.trim().split(" ");
      if (parts.length >= 2) {
        set.add(`${parts[0]} ${parts[1]}`);
      }
    });
    return Array.from(set);
  }, [rangeFilteredEvents]);

  // 3. Filter trouble events by selected date (timeline bar click or dropdown selection)
  const filteredEvents = useMemo(() => {
    if (selectedBarDay !== null) {
      const dayNumStr = selectedBarDay < 10 ? `0${selectedBarDay}` : `${selectedBarDay}`;
      const prefix = `${dayNumStr} ${periodInfo.monthStr}`;
      return rangeFilteredEvents.filter((ev) => {
        const trimmed = (ev.start_time || "").trim();
        return trimmed.startsWith(prefix) || trimmed.startsWith(`${selectedBarDay} ${periodInfo.monthStr}`);
      });
    }
    if (selectedEventDate === "ALL") {
      return rangeFilteredEvents;
    }
    return rangeFilteredEvents.filter((ev) => ev.start_time.startsWith(selectedEventDate));
  }, [rangeFilteredEvents, selectedEventDate, selectedBarDay, periodInfo.monthStr]);

  // Filter Rincian SLA to only show active days between startDay and effectiveDays
  const activeDailyBreakdown = useMemo(() => {
    const allRows = data?.daily_breakdown || [];
    const minDay = periodInfo.startDay;
    const maxDay = periodInfo.effectiveDays;
    return allRows.filter((row) => row.day >= minDay && row.day <= maxDay);
  }, [data?.daily_breakdown, periodInfo.startDay, periodInfo.effectiveDays]);

  // When a day bar is clicked, filter Rincian SLA to only that day; otherwise show all active days up to today
  const displayedBreakdown = useMemo(() => {
    if (selectedBarDay !== null) {
      return activeDailyBreakdown.filter((r) => r.day === selectedBarDay);
    }
    return activeDailyBreakdown;
  }, [activeDailyBreakdown, selectedBarDay]);

  // Compute footer summary dynamically for displayed rows
  const displayedSummary = useMemo(() => {
    const isCpu = dailyViewMetric === "cpu_dvr";
    const count = displayedBreakdown.length;
    if (count === 0) return null;

    let totalUptime = 0;
    let totalDowntime = 0;
    displayedBreakdown.forEach((r) => {
      totalUptime += isCpu ? (r.cpu_dvr_uptime_min ?? r.uptime_min) : (r.rec_uptime_min ?? r.cpu_dvr_uptime_min ?? r.uptime_min);
      totalDowntime += isCpu ? (r.cpu_dvr_downtime_min ?? r.downtime_min) : (r.rec_downtime_min ?? r.cpu_dvr_downtime_min ?? r.downtime_min);
    });

    const totalObs = totalUptime + totalDowntime;
    const avgSuccessRate = totalObs > 0 ? (totalUptime / totalObs) * 100 : 0;
    const isSuccess = avgSuccessRate >= 98.0;

    return {
      count,
      totalObs,
      totalUptime,
      totalDowntime,
      avgSuccessRate,
      isSuccess,
    };
  }, [displayedBreakdown, dailyViewMetric]);

  if (!gatewayId) return null;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <div className="size-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Memuat data performa DVR/NVR...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-[#070e1d] rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
        DVR performance data for gateway {gatewayId} not found.
      </div>
    );
  }

  const d = data;

  const isWhite = (d.type || "").includes("Putih");

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
            title="Close Details"
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

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 font-normal pt-1">
              <div className="grid grid-cols-[100px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Type</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">: {d.type}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">DVR/NVR</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">: {d.dvr_model}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Camera Count</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium">: {d.kamera_channels}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">HDD Capacity</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium">: {d.storage_capacity}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-start">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Location</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">: {d.location}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {/* Card 1: Periode */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-slate-200/80 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <Calendar className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Period</span>
            </div>
            <div className="mt-2.5">
              <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {periodInfo.effectivePeriodStr}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                {d.period_hours}
              </div>
            </div>
          </div>

          {/* Card 2: CPU – DVR Uptime */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-emerald-500/15 flex items-center justify-center text-[#00c875]">
                <Cpu className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">CPU – DVR Uptime</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#00c875] leading-tight">
                {d.cpu_dvr_uptime}
              </div>
              <div className="text-[11px] font-semibold text-[#00c875] mt-0.5">
                {d.cpu_dvr_uptime_pct}
              </div>
            </div>
          </div>

          {/* Card 3: CPU – DVR Offline */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-rose-500/15 flex items-center justify-center text-[#e2445c]">
                <XCircle className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">CPU – DVR Offline</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#e2445c] leading-tight">
                {d.cpu_dvr_offline}
              </div>
              <div className="text-[11px] font-semibold text-[#e2445c] mt-0.5">
                {d.cpu_dvr_offline_pct}
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

          {/* Card 5: Total Incidents */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-amber-500/15 flex items-center justify-center text-[#f59e0b]">
                <AlertCircle className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Total Incidents</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#f59e0b] leading-tight">
                {d.trouble_events?.length || 0} events
              </div>
            </div>
          </div>

          {/* Card 6: Recording Uptime */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-rose-500/15 flex items-center justify-center text-[#e2445c]">
                <Disc className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Recording Uptime</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#e2445c] leading-tight">
                {d.rec_uptime}
              </div>
              <div className="text-[11px] font-semibold text-[#e2445c] mt-0.5">
                {d.rec_uptime_pct}
              </div>
            </div>
          </div>

          {/* Card 7: Not Recording */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-amber-500/15 flex items-center justify-center text-[#f59e0b]">
                <Pause className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Not Recording</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#f59e0b] leading-tight">
                {d.rec_tidak_merekam}
              </div>
              <div className="text-[11px] font-semibold text-[#f59e0b] mt-0.5">
                {d.rec_tidak_merekam_pct}
              </div>
            </div>
          </div>

          {/* Card 8: Recording Error */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-rose-500/15 flex items-center justify-center text-[#e2445c]">
                <AlertCircle className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Recording Error</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#e2445c] leading-tight">
                {d.rec_error}
              </div>
              <div className="text-[11px] font-semibold text-[#e2445c] mt-0.5">
                {d.rec_error_pct}
              </div>
            </div>
          </div>

          {/* Card 9: Storage HDD */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-slate-200/80 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <HardDrive className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Storage HDD</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {d.storage_capacity}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${d.storage_used_pct}%` }}
                    className="h-full bg-[#00c875] rounded-full"
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-700 dark:text-slate-300 font-bold shrink-0">
                  {d.storage_used_pct}%
                </span>
              </div>
            </div>
          </div>

          {/* Card 10: Kamera */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-cyan-500/15 flex items-center justify-center text-[#00d2ff]">
                <Video className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Camera</span>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">
                  {d.kamera_total} Total
                </span>
                <div className="w-16 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    style={{
                      width: `${(d.kamera_online / d.kamera_total) * 100}%`,
                    }}
                    className="h-full bg-[#00c875]"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-1 text-[9px] text-slate-500 dark:text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-[#00c875]" />
                  Online {d.kamera_online}
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-[#f59e0b]" />
                  No Video {d.kamera_no_video}
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-[#e2445c]" />
                  Offline {d.kamera_offline}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Section: Multi-Track Timeline Status, SLA Summary & Riwayat Gangguan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left Column (lg:col-span-6): Multi-Track Timeline + Rincian SLA Harian Table */}
        <div className="lg:col-span-6 flex flex-col gap-3.5">
          {/* Top Card: Multi-Track Timeline (Gateway, Cellular, DVR) with All 31 Days */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div>
              {/* Header with Title & Legend */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Timeline Status ({periodInfo.effectivePeriodStr})
                  </h4>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {periodInfo.endDay - periodInfo.startDay + 1} Days
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#00c875]" />
                    Online
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#e2445c]" />
                    Offline
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-blue-500" />
                    Today
                  </span>
                </div>
              </div>

              {/* Dynamic Multi-Track Timeline Matrix Card */}
              <div className="mt-3.5 p-3.5 rounded-xl bg-white dark:bg-[#070e1d] border border-slate-200/90 dark:border-slate-800/80 shadow-xs space-y-2">
                {/* RULER / HEADER TANGGAL DI ATAS */}
                <div className="flex items-center gap-2">
                  <div className="w-16 shrink-0 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Track
                  </div>
                  <div
                    className="flex-1 grid gap-0.5 sm:gap-1"
                    style={{ gridTemplateColumns: `repeat(${dailyMultiTrack.length}, minmax(0, 1fr))` }}
                  >
                    {dailyMultiTrack.map((item) => (
                      <div
                        key={item.day}
                        onClick={() => {
                          if (item.isFuture) return;
                          const nextDay = selectedBarDay === item.day ? null : item.day;
                          handleSelectDay(nextDay, `${item.dayNumStr} ${periodInfo.monthStr}`);
                        }}
                        onMouseEnter={() => !item.isFuture && setHoveredDay(item)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`text-center select-none ${item.isFuture ? "cursor-default" : "cursor-pointer"}`}
                        title={item.isFuture ? `${item.fullDate}` : item.fullDate}
                      >
                        <span
                          className={`text-[9px] font-mono block leading-none transition-all ${
                            item.isToday
                              ? "font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/20 px-0.5 py-0.5 rounded ring-1 ring-blue-500/50 scale-110 shadow-xs"
                              : (selectedBarDay === item.day || selectedEventDate === item.dateKey)
                              ? "font-bold text-amber-500 dark:text-amber-400"
                              : item.isFuture
                              ? "text-slate-400 dark:text-slate-600 opacity-60"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                          }`}
                        >
                          {item.dayNumStr}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TRACK 1: GATEWAY */}
                <div className="flex items-center gap-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60">
                  <div className="w-16 shrink-0 text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                    Gateway
                  </div>
                  <div
                    className="flex-1 grid gap-0.5 sm:gap-1"
                    style={{ gridTemplateColumns: `repeat(${dailyMultiTrack.length}, minmax(0, 1fr))` }}
                  >
                    {dailyMultiTrack.map((item) => (
                      <div
                        key={item.day}
                        onClick={() => {
                          if (item.isFuture) return;
                          const nextDay = selectedBarDay === item.day ? null : item.day;
                          handleSelectDay(nextDay, `${item.dayNumStr} ${periodInfo.monthStr}`);
                        }}
                        onMouseEnter={() => !item.isFuture && setHoveredDay(item)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`h-5.5 rounded-xs transition-all ${
                          item.isFuture
                            ? "bg-slate-200/30 dark:bg-slate-800/30 cursor-default"
                            : item.gwStatus === "offline"
                            ? "bg-[#e2445c] hover:bg-[#ff4d6d] cursor-pointer"
                            : "bg-[#00c875] hover:bg-[#05e287] cursor-pointer"
                        } ${
                          item.isToday && !item.isFuture
                            ? "ring-1.5 ring-blue-500 shadow-xs"
                            : ""
                        } ${
                          (selectedBarDay === item.day || selectedEventDate === item.dateKey)
                            ? "ring-2 ring-amber-400 scale-105"
                            : !item.isFuture ? "hover:scale-105" : ""
                        }`}
                        title={item.isFuture ? `${item.fullDate}` : `Gateway ${item.dayNumStr} ${periodInfo.monthStr}: ${item.gwStatus === "offline" ? "Offline" : "Online"}`}
                      />
                    ))}
                  </div>
                </div>

                {/* TRACK 2: CELLULAR */}
                <div className="flex items-center gap-2">
                  <div className="w-16 shrink-0 text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                    Cellular
                  </div>
                  <div
                    className="flex-1 grid gap-0.5 sm:gap-1"
                    style={{ gridTemplateColumns: `repeat(${dailyMultiTrack.length}, minmax(0, 1fr))` }}
                  >
                    {dailyMultiTrack.map((item) => (
                      <div
                        key={item.day}
                        onClick={() => {
                          if (item.isFuture) return;
                          const nextDay = selectedBarDay === item.day ? null : item.day;
                          handleSelectDay(nextDay, `${item.dayNumStr} ${periodInfo.monthStr}`);
                        }}
                        onMouseEnter={() => !item.isFuture && setHoveredDay(item)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`h-5.5 rounded-xs transition-all ${
                          item.isFuture
                            ? "bg-slate-200/30 dark:bg-slate-800/30 cursor-default"
                            : item.cellStatus === "offline"
                            ? "bg-[#e2445c] hover:bg-[#ff4d6d] cursor-pointer"
                            : "bg-[#00c875] hover:bg-[#05e287] cursor-pointer"
                        } ${
                          item.isToday && !item.isFuture
                            ? "ring-1.5 ring-blue-500 shadow-xs"
                            : ""
                        } ${
                          (selectedBarDay === item.day || selectedEventDate === item.dateKey)
                            ? "ring-2 ring-amber-400 scale-105"
                            : !item.isFuture ? "hover:scale-105" : ""
                        }`}
                        title={item.isFuture ? `${item.fullDate}` : `Cellular ${item.dayNumStr} ${periodInfo.monthStr}: ${item.cellStatus === "offline" ? "Offline" : "Online"}`}
                      />
                    ))}
                  </div>
                </div>

                {/* TRACK 3: DVR */}
                <div className="flex items-center gap-2">
                  <div className="w-16 shrink-0 text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                    DVR
                  </div>
                  <div
                    className="flex-1 grid gap-0.5 sm:gap-1"
                    style={{ gridTemplateColumns: `repeat(${dailyMultiTrack.length}, minmax(0, 1fr))` }}
                  >
                    {dailyMultiTrack.map((item) => (
                      <div
                        key={item.day}
                        onClick={() => {
                          if (item.isFuture) return;
                          const nextDay = selectedBarDay === item.day ? null : item.day;
                          handleSelectDay(nextDay, `${item.dayNumStr} ${periodInfo.monthStr}`);
                        }}
                        onMouseEnter={() => !item.isFuture && setHoveredDay(item)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`h-5.5 rounded-xs transition-all ${
                          item.isFuture
                            ? "bg-slate-200/30 dark:bg-slate-800/30 cursor-default"
                            : item.dvrStatus === "offline"
                            ? "bg-[#e2445c] hover:bg-[#ff4d6d] cursor-pointer"
                            : "bg-[#00c875] hover:bg-[#05e287] cursor-pointer"
                        } ${
                          item.isToday && !item.isFuture
                            ? "ring-1.5 ring-blue-500 shadow-xs"
                            : ""
                        } ${
                          (selectedBarDay === item.day || selectedEventDate === item.dateKey)
                            ? "ring-2 ring-amber-400 scale-105"
                            : !item.isFuture ? "hover:scale-105" : ""
                        }`}
                        title={item.isFuture ? `${item.fullDate}` : `DVR ${item.dayNumStr} ${periodInfo.monthStr}: ${item.dvrStatus === "offline" ? "Offline" : "Online"}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Hover / Selected Day Real-Time Info Bar */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between text-xs min-h-7">
                  {hoveredDay ? (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {hoveredDay.fullDate}
                        {hoveredDay.isToday && (
                          <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-500/20 text-blue-500">
                            Today
                          </span>
                        )}
                        :
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">
                        Gateway:{" "}
                        <strong className={hoveredDay.gwStatus === "offline" ? "text-[#e2445c]" : "text-[#00c875]"}>
                          {hoveredDay.gwStatus === "offline" ? "Offline" : "Online"}
                        </strong>
                        {" | "}
                        Cellular:{" "}
                        <strong className={hoveredDay.cellStatus === "offline" ? "text-[#e2445c]" : "text-[#00c875]"}>
                          {hoveredDay.cellStatus === "offline" ? "Offline" : "Online"}
                        </strong>
                        {" | "}
                        DVR:{" "}
                        <strong className={hoveredDay.dvrStatus === "offline" ? "text-[#e2445c]" : "text-[#00c875]"}>
                          {hoveredDay.dvrStatus === "offline" ? "Offline" : "Online"}
                        </strong>
                        {hoveredDay.eventsCount > 0 && ` (${hoveredDay.eventsCount} incident events)`}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between w-full">
                      <span>Hover or click a date ({dailyMultiTrack[0]?.dayNumStr || "01"} - {dailyMultiTrack[dailyMultiTrack.length - 1]?.dayNumStr || "30"}) to filter incident details.</span>

                      {(selectedBarDay !== null || selectedEventDate !== "ALL") && (
                        <button
                          onClick={() => handleSelectDay(null)}
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

          {/* Bottom Card: Rincian SLA Harian Table (Directly underneath the timeline card) */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-xs">
            {/* Header: Title, Active Selection Badge & Metric Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-md bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <FileSpreadsheet className="size-3.5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Rincian SLA Harian
                </h4>
                {selectedBarDay !== null ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
                    <span>Tgl {selectedBarDay < 10 ? `0${selectedBarDay}` : selectedBarDay} {periodInfo.monthStr}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectDay(null);
                      }}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                      title="Tampilkan semua hari"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {activeDailyBreakdown.length} Hari
                  </span>
                )}
              </div>

              {/* Metric Toggle */}
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-medium mr-1">Metrik:</span>
                <button
                  type="button"
                  onClick={() => setDailyViewMetric("cpu_dvr")}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                    dailyViewMetric === "cpu_dvr"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  CPU – DVR
                </button>
                <button
                  type="button"
                  onClick={() => setDailyViewMetric("recording")}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                    dailyViewMetric === "recording"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  Rekaman CCTV
                </button>
              </div>
            </div>

            {/* Table (Columns: Tanggal, Uptime (Menit), Downtime (Menit), Success Rate, Status SLA) */}
            <div className="overflow-x-auto mt-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-[#0a1224] shadow-xs">
                  <tr className="text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/60 font-semibold">
                    <th className="py-2 px-3">Tanggal</th>
                    <th className="py-2 px-3 text-right">Uptime (Menit)</th>
                    <th className="py-2 px-3 text-right">Downtime (Menit)</th>
                    <th className="py-2 px-3 text-right">Success Rate</th>
                    <th className="py-2 px-3 text-center">Status SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40 text-[11px]">
                  {displayedBreakdown.map((row) => {
                    const isCpu = dailyViewMetric === "cpu_dvr";
                    const upMin = isCpu
                      ? (row.cpu_dvr_uptime_min ?? row.uptime_min)
                      : (row.rec_uptime_min ?? row.cpu_dvr_uptime_min ?? row.uptime_min);
                    const downMin = isCpu
                      ? (row.cpu_dvr_downtime_min ?? row.downtime_min)
                      : (row.rec_downtime_min ?? row.cpu_dvr_downtime_min ?? row.downtime_min);
                    const sr = isCpu
                      ? (row.cpu_dvr_success_rate ?? row.success_rate)
                      : (row.rec_success_rate ?? row.cpu_dvr_success_rate ?? row.success_rate);
                    const status = isCpu
                      ? (row.cpu_dvr_status_sla ?? row.sla_status)
                      : (row.rec_status_sla ?? row.cpu_dvr_status_sla ?? row.sla_status);
                    const isSuccess = status === "Tercapai";
                    const isSelected = selectedBarDay === row.day;

                    return (
                      <tr
                        key={row.day}
                        onClick={() => handleSelectDay(row.day, `${row.day < 10 ? `0${row.day}` : row.day} ${periodInfo.monthStr}`)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-blue-500/10 dark:bg-blue-500/20 font-medium"
                            : "hover:bg-slate-100/80 dark:hover:bg-slate-800/30"
                        }`}
                        title="Klik untuk memilih tanggal ini"
                      >
                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                          {row.date} ({row.day_name})
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          {upMin.toLocaleString("id-ID")}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold">
                          {downMin > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400">{downMin.toLocaleString("id-ID")}</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {sr.toFixed(1)}%
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          {isSuccess ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-[#00c875] border border-emerald-500/30">
                              Tercapai
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-600 dark:text-[#e2445c] border border-rose-500/30">
                              Tidak Tercapai
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {displayedBreakdown.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500 dark:text-slate-400 text-xs">
                        Tidak ada data rincian SLA harian untuk tanggal yang dipilih.
                      </td>
                    </tr>
                  )}
                </tbody>
                {displayedSummary && (
                  <tfoot className="sticky bottom-0 z-10 bg-slate-200/90 dark:bg-[#070e1d] font-bold text-[11px] border-t-2 border-slate-300 dark:border-slate-700 shadow-md">
                    <tr>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        <span className="text-blue-600 dark:text-blue-400 mr-1.5">Total:</span>
                        {displayedSummary.count} Hari ({displayedSummary.totalObs.toLocaleString("id-ID")}m)
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                        {displayedSummary.totalUptime.toLocaleString("id-ID")}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-rose-600 dark:text-rose-400">
                        {displayedSummary.totalDowntime.toLocaleString("id-ID")}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-900 dark:text-white">
                        {displayedSummary.avgSuccessRate.toFixed(1)}%
                      </td>
                      <td className="py-2 px-3 text-center">
                        {displayedSummary.isSuccess ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-[#00c875] border border-emerald-500/30">
                            Tercapai
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-600 dark:text-[#e2445c] border border-rose-500/30">
                            Tidak Tercapai
                          </span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (lg:col-span-6): Incident History Table with Date Selector & Scrollable 10 Rows */}
        <div className="lg:col-span-6 bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Incident History
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
                  <option value="ALL">Semua Tanggal ({rangeFilteredEvents.length})</option>
                  {uniqueDates.map((dateStr) => {
                    const count = rangeFilteredEvents.filter((e) => e.start_time.startsWith(dateStr)).length;
                    return (
                      <option key={dateStr} value={dateStr}>
                        {dateStr} ({count} events)
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Scrollable Compact Table */}
            <div className="overflow-x-auto mt-2 max-h-87.5 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-[#0a1224] shadow-xs">
                  <tr className="text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/60 font-semibold">
                    <th className="py-2.5 px-2 text-center w-8">No.</th>
                    <th className="py-2.5 px-3">Incident Time</th>
                    <th className="py-2.5 px-3">Incident / Issue</th>
                    <th className="py-2.5 px-3 text-center">Duration</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40 text-[11px]">
                  {filteredEvents.map((event, idx) => {
                    const isStillActive = event.end_time === "-" || event.end_time?.toLowerCase().includes("sekarang");
                    return (
                      <tr
                        key={event.no || idx}
                        className="hover:bg-slate-100/80 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-2.5 px-2 text-center text-slate-500 dark:text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                          <div>{event.start_time}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">to {event.end_time}</div>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                          {event.title || event.description || event.cause}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-xs bg-amber-500/10 dark:bg-amber-500/20 text-[#f59e0b] border border-amber-500/30">
                            {event.duration}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {isStillActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-[#e2445c] border border-rose-500/30 animate-pulse">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-[#00c875] border border-emerald-500/30">
                              Resolved
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredEvents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500 dark:text-slate-400 text-xs">
                        No incident history found for the selected date.
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
