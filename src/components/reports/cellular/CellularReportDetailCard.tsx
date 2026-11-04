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
} from "@/store/api/monitoring";
import { SmartBoxIsometricIllustration } from "@/components/ui/SmartBoxIllustration";
import { parseReportPeriod } from "@/lib/reportPeriodUtils";

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
  const [selectedBarDay, setSelectedBarDay] = useState<number | null>(null);
  const [dailyViewMetric, setDailyViewMetric] = useState<"cpu_modem" | "cellular">("cpu_modem");
  const [selectedEventDate, setSelectedEventDate] = useState<string>("ALL");
  const [hoveredDay, setHoveredDay] = useState<{
    day: number;
    dayNumStr: string;
    dateKey: string;
    fullDate: string;
    status: "online" | "offline" | "degraded" | "future";
    uptimePct: number;
    downtimePct: number;
    visualUpPct?: number;
    visualDownPct?: number;
    eventCount: number;
    totalDurationStr: string;
    isToday: boolean;
    isFuture?: boolean;
  } | null>(null);

  const periodInfo = useMemo(() => {
    return parseReportPeriod(data?.period || dateRange);
  }, [data?.period, dateRange]);

  // Synchronized date selection handler across Timeline, Rincian SLA, and Incident History
  const handleSelectDay = (day: number | null, dateKey?: string) => {
    if (day === null || (selectedBarDay === day && (!dateKey || selectedEventDate === dateKey))) {
      setSelectedBarDay(null);
      setSelectedEventDate("ALL");
    } else {
      setSelectedBarDay(day);
      if (dateKey) {
        setSelectedEventDate(dateKey);
      } else {
        const dayNumStr = day < 10 ? `0${day}` : `${day}`;
        setSelectedEventDate(`${dayNumStr} ${periodInfo.monthStr}`);
      }
    }
  };

  const handleDropdownDateChange = (val: string) => {
    setSelectedEventDate(val);
    if (val === "ALL") {
      setSelectedBarDay(null);
    } else {
      const parts = val.trim().split(" ");
      const dNum = parseInt(parts[0], 10);
      if (!isNaN(dNum)) {
        setSelectedBarDay(dNum);
      } else {
        setSelectedBarDay(null);
      }
    }
  };

  // Generate dynamic daily status bar chart items: full month timeline (1 s/d 30/31+), bars only appear for filtered dates
  const dailyStatusList = useMemo(() => {
    const { daysInMonth, monthStr, yearStr, todayDay, isCurrentMonth } = periodInfo;
    const minDay = periodInfo.startDay;
    const maxDay = periodInfo.endDay;
    const breakdown = data?.daily_breakdown || [];

    const totalDays = Math.max(daysInMonth, maxDay);
    const list = [];
    for (let day = 1; day <= totalDays; day++) {
      const dayNumStr = day < 10 ? `0${day}` : `${day}`;
      const dateKey = `${dayNumStr} ${monthStr}`;
      const fullDate = `${dayNumStr} ${monthStr} ${yearStr}`;

      // Bar is filled only if date is within selected filter range and not a future date
      const isInRange = day >= minDay && day <= maxDay;
      const isFutureDate = Boolean(isCurrentMonth && todayDay && day > todayDay);
      const hasBar = isInRange && !isFutureDate;

      const daySla = breakdown.find((r) => r.day === day);

      let status: "online" | "offline" | "future" = !hasBar ? "future" : "online";
      let uptimePct = 100;
      let downtimePct = 0;
      let visualDownPct = 0;
      let visualUpPct = 100;
      let totalDurationStr = "0m";

      if (hasBar) {
        if (daySla) {
          const isCpu = dailyViewMetric === "cpu_modem";
          const downMin = isCpu ? daySla.cpu_modem_downtime_min : daySla.cellular_downtime_min;
          const upMin = isCpu ? daySla.cpu_modem_uptime_min : daySla.cellular_uptime_min;
          const sr = isCpu ? daySla.cpu_modem_success_rate : daySla.cellular_success_rate;
          
          const totalObs = upMin + downMin;
          if (totalObs > 0) {
            uptimePct = Number(((upMin / totalObs) * 100).toFixed(1));
            downtimePct = Number(((downMin / totalObs) * 100).toFixed(1));
          } else {
            uptimePct = Number(sr.toFixed(1));
            downtimePct = Number((100 - uptimePct).toFixed(1));
          }

          if (downMin > 0 || downtimePct > 0) {
            status = "offline";
            totalDurationStr = `${Math.round(downMin)}m`;
            if (downtimePct <= 0 && downMin > 0) {
              downtimePct = 0.1;
              uptimePct = 99.9;
            }
            if (uptimePct <= 0) {
              visualDownPct = 100;
              visualUpPct = 0;
            } else {
              // Ensure visible red height (minimum 6%, maximum 95%) so short downtime is clearly visible
              visualDownPct = Math.max(6, Math.min(95, downtimePct));
              visualUpPct = 100 - visualDownPct;
            }
          } else {
            status = "online";
            uptimePct = 100;
            downtimePct = 0;
            visualDownPct = 0;
            visualUpPct = 100;
            totalDurationStr = "0m";
          }
        } else {
          uptimePct = 100;
          downtimePct = 0;
          visualDownPct = 0;
          visualUpPct = 100;
          status = "online";
          totalDurationStr = "0m";
        }
      }

      list.push({
        day,
        dayNumStr,
        dateKey,
        fullDate,
        status,
        uptimePct,
        downtimePct,
        visualUpPct,
        visualDownPct,
        eventCount: (downtimePct > 0 || (daySla && (dailyViewMetric === "cpu_modem" ? daySla.cpu_modem_downtime_min : daySla.cellular_downtime_min) > 0)) ? 1 : 0,
        totalDurationStr,
        isToday: day === todayDay,
        isFuture: !hasBar,
        isInRange,
      });
    }

    return list;
  }, [data?.daily_breakdown, periodInfo, dailyViewMetric]);

  // 1. Filter trouble events strictly within the active date range & metric
  const rangeFilteredEvents = useMemo(() => {
    const rawEvents = data?.trouble_events || [];
    const minDay = periodInfo.startDay;
    const maxDay = periodInfo.endDay || periodInfo.effectiveDays;
    const month = periodInfo.monthStr.toLowerCase();

    return rawEvents.filter((ev) => {
      // Metric filter based on active tab [CPU - Modem] vs [Cellular / Network]
      const m = (ev.metric || ev.category || ev.cause || ev.description || "").toLowerCase();
      if (dailyViewMetric === "cpu_modem") {
        const isCpu = m === "cpu_modem" || m === "power" || m.includes("modem") || m.includes("power") || m.includes("reboot");
        if (!isCpu) return false;
      } else if (dailyViewMetric === "cellular") {
        const isCell = m === "cellular" || m === "power" || m === "network" || m.includes("cellular") || m.includes("seluler") || m.includes("network") || m.includes("power") || m.includes("reboot");
        if (!isCell) return false;
      }

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
  }, [data?.trouble_events, periodInfo.startDay, periodInfo.endDay, periodInfo.effectiveDays, periodInfo.monthStr, dailyViewMetric]);

  // 2. Extract distinct dates from range-filtered events for dropdown
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
    return rangeFilteredEvents.filter((ev) => ev.start_time.trim().startsWith(selectedEventDate));
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
    const isCpu = dailyViewMetric === "cpu_modem";
    const count = displayedBreakdown.length;
    if (count === 0) return null;

    let totalUptime = 0;
    let totalDowntime = 0;
    displayedBreakdown.forEach((r) => {
      totalUptime += isCpu ? r.cpu_modem_uptime_min : r.cellular_uptime_min;
      totalDowntime += isCpu ? r.cpu_modem_downtime_min : r.cellular_downtime_min;
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
          <span>Loading gateway performance data...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-[#070e1d] rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
        Performance data for gateway {gatewayId} not found.
      </div>
    );
  }

  const d = data;
  const isWhite = (d.type || "").includes("Putih");

  return (
    <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-4 sm:p-5 space-y-4 font-sans transition-all duration-300">
      {/* 1. Header with Gateway Location & Status */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <FileSpreadsheet className="size-4" />
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Gateway Performance Details &ndash; {d.location || d.id}
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

      {/* 2. Top Section: Gateway Isometric Illustration & 10 KPI Metric Cards */}
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
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Type</span>
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
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Remaining Quota</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium font-mono">
                  : {d.quota_main_gb !== undefined && d.quota_main_gb !== null ? `${d.quota_main_gb} GB` : "-"}
                </span>
              </div>
              <div className="grid grid-cols-[80px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">IP Address</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-mono">: {d.ip_address}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] items-start">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Location</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">: {d.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (xl:col-span-8): 10 KPI Metric Cards */}
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

          {/* Card 3: CPU – Modem Downtime */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-rose-500/15 flex items-center justify-center text-[#e2445c]">
                <XCircle className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">CPU – Modem Downtime</span>
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

          {/* Card 7: Network Downtime */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-rose-500/15 flex items-center justify-center text-[#e2445c]">
                <XCircle className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Network Downtime</span>
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

          {/* Card 10: Total Incidents */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-amber-500/15 flex items-center justify-center text-[#f59e0b]">
                <AlertCircle className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Total Incidents</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#f59e0b] leading-tight">
                {rangeFilteredEvents.length} {rangeFilteredEvents.length === 1 ? "incident" : "incidents"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Section: Left Column (Timeline + Daily SLA Breakdown) & Right Column (Incident History) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left Column (lg:col-span-6): Stack of Daily Status Timeline Card & Daily SLA Breakdown Table Card */}
        <div className="lg:col-span-6 space-y-3.5">
          {/* Top Card: Daily Status Timeline (01 Nov 2026 - 04 Nov 2026) */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-xs">
            {/* Header with Title & Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Daily Status Timeline ({periodInfo.effectivePeriodStr})
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
                  Incident / Offline
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-blue-500" />
                  Today
                </span>
              </div>
            </div>

            {/* Daily Bar Chart Card with Date Labels on TOP and Bars on BOTTOM */}
            <div className="mt-3.5 p-3.5 rounded-xl bg-white dark:bg-[#070e1d] border border-slate-200/90 dark:border-slate-800/80 shadow-xs">
              {/* Dynamic Columns Grid */}
              <div
                className="grid gap-1 sm:gap-1.5 items-end pt-1"
                style={{
                  gridTemplateColumns: `repeat(${dailyStatusList.length}, minmax(0, 1fr))`
                }}
              >
                {dailyStatusList.map((item) => {
                  const isSelected = selectedBarDay === item.day;
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
                        if (item.isFuture) return;
                        handleSelectDay(item.day, item.dateKey);
                      }}
                      onMouseEnter={() => !item.isFuture && setHoveredDay(item)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`flex flex-col items-center gap-2 ${
                        item.isFuture ? "cursor-default" : "cursor-pointer group"
                      }`}
                      title={
                        item.isFuture
                          ? `${item.fullDate}`
                          : `${item.fullDate}: ${
                              item.status === "offline" ? "Incident / Offline" : "Online Normal"
                            }`
                      }
                    >
                      {/* 1. DATE LABELS ON TOP */}
                      <span
                        className={`text-[9px] sm:text-[10px] font-mono block leading-none transition-all select-none ${
                          item.isToday
                            ? "font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/20 px-1 py-0.5 rounded ring-1 ring-blue-500/50 scale-110 shadow-xs"
                            : isSelected
                            ? "font-bold text-amber-500 dark:text-amber-400 bg-amber-500/20 px-1 py-0.5 rounded ring-1 ring-amber-500/50 scale-110"
                            : item.isFuture
                            ? "text-slate-400 dark:text-slate-600 opacity-60"
                            : "text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200"
                        }`}
                      >
                        {item.dayNumStr}
                      </span>

                      {/* 2. BARS UNDERNEATH (FILLED ACCORDING TO DATE FILTER, REMAINING ARE EMPTY) */}
                      <div className="w-full h-20 sm:h-24 bg-slate-100 dark:bg-slate-900/60 rounded-md p-0.5 flex flex-col justify-end border border-slate-200/60 dark:border-slate-800/60">
                        {!item.isFuture && item.isInRange ? (
                          <div
                            className={`w-full h-full rounded-xs overflow-hidden flex flex-col justify-end transition-all duration-200 ${
                              item.isToday
                                ? "ring-2 ring-blue-500 shadow-md shadow-blue-500/35"
                                : ""
                            } ${
                              isSelected
                                ? "ring-2 ring-amber-400 shadow-md shadow-amber-400/35 scale-105"
                                : "group-hover:scale-105"
                            }`}
                          >
                            {/* Downtime (Red segment on top) */}
                            {item.visualDownPct > 0 && (
                              <div
                                style={{ height: `${item.visualDownPct}%` }}
                                className="w-full bg-[#e2445c] hover:bg-[#ff4d6d] transition-all duration-200 shrink-0 rounded-t-xs"
                                title={`Downtime: ${item.downtimePct}% (${item.totalDurationStr})`}
                              />
                            )}
                            {/* Uptime (Green segment at bottom) */}
                            {item.visualUpPct > 0 && (
                              <div
                                style={{ height: `${item.visualUpPct}%` }}
                                className="w-full flex-1 bg-[#00c875] hover:bg-[#05e287] transition-all duration-200 shrink-0"
                                title={`Uptime: ${item.uptimePct}%`}
                              />
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-1 bg-slate-200/40 dark:bg-slate-800/40 rounded-xs mb-0.5" />
                        )}
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
                          Today
                        </span>
                      )}
                      :
                    </span>
                    <span
                      className={`font-medium ${
                        (hoveredDay.downtimePct ?? 0) > 0
                          ? "text-[#e2445c]"
                          : "text-[#00c875]"
                      }`}
                    >
                      {(hoveredDay.downtimePct ?? 0) > 0
                        ? `Uptime ${hoveredDay.uptimePct}% | Downtime ${hoveredDay.downtimePct}% (${hoveredDay.totalDurationStr})`
                        : `Normal Online (100% Uptime)`}
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between w-full">
                    <span>
                      {selectedBarDay !== null ? (
                        <span className="text-amber-500 dark:text-amber-400 font-semibold">
                          Active filter: Date {selectedBarDay < 10 ? `0${selectedBarDay}` : selectedBarDay} {periodInfo.monthStr}
                        </span>
                      ) : (
                        `Hover or click a date (${dailyStatusList[0]?.dayNumStr || "01"} - ${dailyStatusList[dailyStatusList.length - 1]?.dayNumStr || periodInfo.effectiveDays}) to inspect details.`
                      )}
                    </span>

                    {selectedBarDay !== null && (
                      <button
                        onClick={() => handleSelectDay(null)}
                        className="text-blue-500 hover:underline text-[11px] font-semibold cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Card: Daily SLA Breakdown Table (Directly underneath the timeline card) */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-xs">
            {/* Header: Title, Active Selection Badge & Metric Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-md bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <FileSpreadsheet className="size-3.5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Daily SLA Breakdown
                </h4>
                {selectedBarDay !== null ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
                    <span>Date {selectedBarDay < 10 ? `0${selectedBarDay}` : selectedBarDay} {periodInfo.monthStr}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectDay(null);
                      }}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                      title="Show all days"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {activeDailyBreakdown.length} Days
                  </span>
                )}
              </div>

              {/* Metric Toggle */}
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-medium mr-1">Metric:</span>
                <button
                  type="button"
                  onClick={() => setDailyViewMetric("cpu_modem")}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                    dailyViewMetric === "cpu_modem"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  CPU – Modem
                </button>
                <button
                  type="button"
                  onClick={() => setDailyViewMetric("cellular")}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                    dailyViewMetric === "cellular"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  Cellular / Network
                </button>
              </div>
            </div>

            {/* Table (Columns: Date, Uptime (Mins), Downtime (Mins), Success Rate, SLA Status) */}
            <div className="overflow-x-auto mt-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-[#0a1224] shadow-xs">
                  <tr className="text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/60 font-semibold">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3 text-right">Uptime (Mins)</th>
                    <th className="py-2 px-3 text-right">Downtime (Mins)</th>
                    <th className="py-2 px-3 text-right">Success Rate</th>
                    <th className="py-2 px-3 text-center">SLA Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40 text-[11px]">
                  {displayedBreakdown.map((row) => {
                    const isCpu = dailyViewMetric === "cpu_modem";
                    const upMin = isCpu ? row.cpu_modem_uptime_min : row.cellular_uptime_min;
                    const downMin = isCpu ? row.cpu_modem_downtime_min : row.cellular_downtime_min;
                    const sr = isCpu ? row.cpu_modem_success_rate : row.cellular_success_rate;
                    const status = isCpu ? row.cpu_modem_status_sla : row.cellular_status_sla;
                    const isSuccess = status === "Tercapai" || status === "Achieved" || sr >= 98.0;
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
                        title="Click to select this date"
                      >
                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                          {row.date} ({row.day_name})
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          {upMin.toLocaleString("en-US")}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold">
                          {downMin > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400">{downMin.toLocaleString("en-US")}</span>
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
                              Achieved
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-600 dark:text-[#e2445c] border border-rose-500/30">
                              Not Achieved
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {displayedBreakdown.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500 dark:text-slate-400 text-xs">
                        No daily SLA breakdown data available for the selected date.
                      </td>
                    </tr>
                  )}
                </tbody>
                {displayedSummary && (
                  <tfoot className="sticky bottom-0 z-10 bg-slate-200/90 dark:bg-[#070e1d] font-bold text-[11px] border-t-2 border-slate-300 dark:border-slate-700 shadow-md">
                    <tr>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        <span className="text-blue-600 dark:text-blue-400 mr-1.5">Total:</span>
                        {displayedSummary.count} Days ({displayedSummary.totalObs.toLocaleString("en-US")}m)
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                        {displayedSummary.totalUptime.toLocaleString("en-US")}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-rose-600 dark:text-rose-400">
                        {displayedSummary.totalDowntime.toLocaleString("en-US")}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-900 dark:text-white">
                        {displayedSummary.avgSuccessRate.toFixed(1)}%
                      </td>
                      <td className="py-2 px-3 text-center">
                        {displayedSummary.isSuccess ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-[#00c875] border border-emerald-500/30">
                            Achieved
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-600 dark:text-[#e2445c] border border-rose-500/30">
                            Not Achieved
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

        {/* Right Column (lg:col-span-6): Restored Standalone Incident History */}
        <div className="lg:col-span-6 bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            {/* Header: Title, Event Count Badge & Filter Dropdown */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-md bg-amber-500/15 flex items-center justify-center text-[#f59e0b]">
                  <Clock className="size-3.5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Incident History
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  {filteredEvents.length}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Filter Date:</span>
                <select
                  value={selectedEventDate}
                  onChange={(e) => handleDropdownDateChange(e.target.value)}
                  className="text-xs font-medium bg-white dark:bg-[#070e1d] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs"
                >
                  <option value="ALL">All Dates ({rangeFilteredEvents.length})</option>
                  {uniqueDates.map((dateStr) => {
                    const count = rangeFilteredEvents.filter((e) => e.start_time.startsWith(dateStr)).length;
                    return (
                      <option key={dateStr} value={dateStr}>
                        {dateStr} ({count} {count === 1 ? 'incident' : 'incidents'})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto mt-2 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-[#0a1224] shadow-xs">
                  <tr className="text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/60 font-semibold">
                    <th className="py-2.5 px-2 text-center w-8">No.</th>
                    <th className="py-2.5 px-3">Incident Time</th>
                    <th className="py-2.5 px-3">Incident / Disturbance</th>
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
                      <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
                        No incident history available for the selected date.
                        {selectedEventDate !== "ALL" && (
                          <button
                            onClick={() => handleSelectDay(null)}
                            className="block mx-auto mt-2 text-blue-500 hover:underline font-semibold cursor-pointer"
                          >
                            Show All Incident History
                          </button>
                        )}
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
