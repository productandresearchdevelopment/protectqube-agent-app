"use client";

import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  Clock,
  BarChart2,
  TrendingUp,
  Thermometer,
  Info,
  X,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  useHealthReportGatewayDetail,
  IHealthReportGatewayDetail,
} from "@/store/api/monitoring";
import { SmartBoxIsometricIllustration } from "@/components/ui/SmartBoxIllustration";
import { parseReportPeriod } from "@/lib/reportPeriodUtils";


interface HealthReportDetailCardProps {
  gatewayId: string | null;
  dateRange?: string;
  onClose?: () => void;
}

const CustomChartTooltip = ({ active, payload, label, unit, color }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 text-white text-[10px] px-2 py-1 rounded shadow-lg border border-slate-700 font-sans z-50">
        <div className="text-slate-400 font-mono text-[9px] mb-0.5">{label}</div>
        <div className="flex items-center gap-1 font-bold">
          <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
          <span>{payload[0].value}{unit}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const HealthReportDetailCard: React.FC<HealthReportDetailCardProps> = ({
  gatewayId,
  dateRange,
  onClose,
}) => {
  const { data, isLoading } = useHealthReportGatewayDetail(gatewayId, dateRange);
  const [hoveredDay, setHoveredDay] = useState<{
    day: number;
    dayNumStr: string;
    dateKey: string;
    fullDate: string;
    gwStatus: "online" | "offline" | "future";
    cellStatus: "online" | "offline" | "future";
    dvrStatus: "online" | "offline" | "future";
    eventsCount: number;
    isToday: boolean;
    isFuture?: boolean;
  } | null>(null);
  const [activeEventTab, setActiveEventTab] = useState<"all" | "downtime">("all");
  const [selectedEventDate, setSelectedEventDate] = useState<string>("ALL");

  const rawEvents = data?.events || [];

  const periodInfo = useMemo(() => {
    return parseReportPeriod(data?.period || dateRange);
  }, [data?.period, dateRange]);

  // Generate dynamic daily status points for Gateway, Cellular, and DVR based on active report month (full month, status only up to today)
  const dailyMultiTrack = useMemo(() => {
    const { daysInMonth, monthStr, yearStr, todayDay, isCurrentMonth } = periodInfo;
    const minDay = periodInfo.startDay;
    const maxDay = periodInfo.endDay;
    const events = rawEvents;

    const list = [];
    for (let day = minDay; day <= maxDay; day++) {
      const dayNumStr = day < 10 ? `0${day}` : `${day}`;
      const dateKey = `${dayNumStr} ${monthStr}`;
      const fullDate = `${dayNumStr} ${monthStr} ${yearStr}`;

      const isFuture = Boolean(isCurrentMonth && todayDay && day > todayDay);

      const dayEvents = isFuture
        ? []
        : events.filter((ev: any) => {
            const trimmed = (ev.start_time || "").trim();
            return trimmed.startsWith(dateKey) || trimmed.startsWith(`${day} ${monthStr}`);
          });

      // Status per track
      let gwStatus: "online" | "offline" | "future" = isFuture ? "future" : "online";
      let cellStatus: "online" | "offline" | "future" = isFuture ? "future" : "online";
      let dvrStatus: "online" | "offline" | "future" = isFuture ? "future" : "online";

      if (!isFuture) {
        for (const ev of dayEvents) {
          const cat = (ev.category || "").toLowerCase();
          const desc = (ev.description || "").toLowerCase();
          if (cat.includes("gateway") || desc.includes("gateway") || desc.includes("power") || desc.includes("loss")) {
            gwStatus = "offline";
          }
          if (cat.includes("cellular") || desc.includes("sim") || desc.includes("modem")) {
            cellStatus = "offline";
          }
          if (cat.includes("dvr") || cat.includes("camera") || desc.includes("recording") || desc.includes("nvr")) {
            dvrStatus = "offline";
          }
        }

        // If gateway is down, all downstream are impacted
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
        isFuture,
      });
    }

    return list;
  }, [rawEvents, periodInfo]);


  // Extract unique dates for dropdown (top-level hook)
  const uniqueDates = useMemo(() => {
    const dates = new Set<string>();
    rawEvents.forEach((ev: any) => {
      if (ev.start_time) {
        const parts = ev.start_time.split(" ");
        if (parts.length >= 2) {
          dates.add(`${parts[0]} ${parts[1]}`);
        }
      }
    });
    return Array.from(dates);
  }, [rawEvents]);

  // Filter events by tab and selected date (top-level hook)
  const filteredEvents = useMemo(() => {
    let list = rawEvents;
    if (activeEventTab === "downtime") {
      list = list.filter(
        (e: any) =>
          e.category?.toLowerCase().includes("offline") ||
          e.category?.toLowerCase().includes("mati") ||
          e.description?.toLowerCase().includes("loss") ||
          e.description?.toLowerCase().includes("terputus")
      );
    }
    if (selectedEventDate !== "ALL") {
      list = list.filter((e: any) => e.start_time?.startsWith(selectedEventDate));
    }
    return list;
  }, [rawEvents, activeEventTab, selectedEventDate]);

  const downtimeCount = useMemo(() => {
    return rawEvents.filter(
      (e: any) =>
        e.category?.toLowerCase().includes("offline") ||
        e.category?.toLowerCase().includes("mati") ||
        e.description?.toLowerCase().includes("loss") ||
        e.description?.toLowerCase().includes("terputus")
    ).length;
  }, [rawEvents]);

  if (!gatewayId) return null;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <div className="size-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Memuat data performa kesehatan sistem...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-[#070e1d] rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
        Health performance data for gateway {gatewayId} not found.
      </div>
    );
  }

  const d = data;
  const isWhite = (d.type || "").includes("Putih");

  // SLA 99.5% & Monthly Accumulation calculations (1 Month = 744 hours)
  const periodHoursNum = 744;
  const uptimePctNum = parseFloat((d.uptime_pct || "96.8%").replace("%", "")) || 96.8;
  const downtimePctNum = parseFloat((100 - uptimePctNum).toFixed(1));
  const slaTargetPct = Number(d.sla_target) || 99.5;
  const isSLAMet = uptimePctNum >= slaTargetPct;
  const slaDiffPct = (uptimePctNum - slaTargetPct).toFixed(1);

  const formatHoursMinutes = (totalHours: number) => {
    const h = Math.floor(totalHours);
    const m = Math.round((totalHours - h) * 60);
    return `${h}h ${m.toString().padStart(2, "0")}m`;
  };

  const uptimeHoursCalculated = periodHoursNum * (uptimePctNum / 100);
  const downtimeHoursCalculated = periodHoursNum * (downtimePctNum / 100);
  const slaMinUptimeHours = periodHoursNum * (slaTargetPct / 100); // 740.28h
  const slaMaxDowntimeHours = periodHoursNum * ((100 - slaTargetPct) / 100); // 3.72h

  const uptimeDurationText = d.uptime_duration || formatHoursMinutes(uptimeHoursCalculated);
  const downtimeDurationText = d.downtime_duration || formatHoursMinutes(downtimeHoursCalculated);
  const slaTargetHoursText = d.sla_target_hours || formatHoursMinutes(slaMinUptimeHours);
  const slaDowntimeAllowedText = d.sla_downtime_allowed || formatHoursMinutes(slaMaxDowntimeHours);

  const downtimeDiffHours = downtimeHoursCalculated - slaMaxDowntimeHours;
  const downtimeDiffText = downtimeDiffHours > 0
    ? `Downtime exceeded tolerance limit by ${formatHoursMinutes(downtimeDiffHours)}`
    : `Downtime within tolerance limit (${formatHoursMinutes(Math.abs(downtimeDiffHours))} remaining)`;

  const getCategoryColor = (cat: string) => {
    if (cat.includes("CPU")) return "text-[#f59e0b]";
    if (cat.includes("SD")) return "text-[#e2445c]";
    if (cat.includes("RAM")) return "text-[#f97316]";
    if (cat.includes("Suhu")) return "text-[#eab308]";
    return "text-slate-300";
  };

  return (
    <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-5 space-y-4 font-sans transition-all duration-300">
      {/* 1. Header Bar: Title, Status Badge, Close Button */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <FileSpreadsheet className="size-4" />
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Detail Performa Gateway &ndash; {d.location || d.id}
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#00c875]/20 text-[#00a862] dark:text-[#00c875] border border-[#00c875]/30">
            {d.status}
          </span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Close Details"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* 2. Top Section: Device Profile & 7 Metric Cards + 3 Line Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 items-stretch">
        {/* Left Column (xl:col-span-3): Device Profile Card */}
        <div className="xl:col-span-3 bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row xl:flex-col gap-3.5 items-center sm:items-start justify-between shadow-xs">
          <div className="flex flex-col items-center justify-center shrink-0 w-full pt-1">
            <SmartBoxIsometricIllustration isWhite={isWhite} />
          </div>

          <div className="flex-1 min-w-0 space-y-1.5 w-full">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide leading-tight truncate" title={d.location}>
                {d.location}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium truncate" title={d.id}>
                {d.id}
              </p>
            </div>

            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 font-normal pt-1">
              <div className="grid grid-cols-[70px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Type</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">: {d.type}</span>
              </div>
              <div className="grid grid-cols-[70px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">CPU</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">: {d.cpu_spec}</span>
              </div>
              <div className="grid grid-cols-[70px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">RAM</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">: {d.ram_spec}</span>
              </div>
              <div className="grid grid-cols-[70px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">SD Card</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">: {d.sd_spec}</span>
              </div>
              <div className="grid grid-cols-[70px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Modem</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">: {d.modem_spec}</span>
              </div>
              <div className="grid grid-cols-[70px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Provider</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">: {d.provider_spec}</span>
              </div>
              <div className="grid grid-cols-[70px_1fr] items-start">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Location</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">: {d.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (xl:col-span-9): 7 KPI Cards & 3 Realtime Trend Charts */}
        <div className="xl:col-span-9 space-y-3 flex flex-col justify-between">
          {/* Top Sub-row: 8 KPI Cards with SLA Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {/* Card 1: Periode & Total Waktu */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                  <Calendar className="size-3" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">Period</span>
              </div>
              <div className="mt-2">
                <div className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight truncate">
                  {periodInfo.effectivePeriodStr}
                </div>
                <div className="text-[9px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                  Total {periodHoursNum} Hours
                </div>
              </div>
            </div>

            {/* Card 2: Accumulated Uptime */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded bg-emerald-500/15 flex items-center justify-center text-[#00a862] dark:text-[#00c875]">
                  <CheckCircle2 className="size-3" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">Accumulated Uptime</span>
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-[#00a862] dark:text-[#00c875] leading-tight font-mono">
                  {uptimeDurationText}
                </div>
                <div className="text-[10px] font-semibold text-[#00a862] dark:text-[#00c875] mt-0.5">
                  {uptimePctNum}%
                </div>
              </div>
            </div>

            {/* Card 3: Accumulated Downtime */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded bg-rose-500/15 flex items-center justify-center text-[#e2445c]">
                  <Clock className="size-3" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">Accumulated Downtime</span>
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-[#e2445c] leading-tight font-mono">
                  {downtimeDurationText}
                </div>
                <div className="text-[10px] font-semibold text-[#e2445c] mt-0.5">
                  {downtimePctNum}%
                </div>
              </div>
            </div>

            {/* Card 4: Target SLA 99.5% */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className={`size-5 rounded flex items-center justify-center ${
                  isSLAMet ? "bg-emerald-500/15 text-[#00a862] dark:text-[#00c875]" : "bg-rose-500/15 text-[#e2445c]"
                }`}>
                  {isSLAMet ? <CheckCircle2 className="size-3" /> : <AlertTriangle className="size-3" />}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">SLA 99.5%</span>
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {uptimePctNum}% <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">/ 99.5%</span>
                </div>
                <div className={`text-[10px] font-bold mt-0.5 truncate ${
                  isSLAMet ? "text-[#00a862] dark:text-[#00c875]" : "text-[#e2445c]"
                }`}>
                  {isSLAMet ? "Tercapai" : `Breach (${slaDiffPct}%)`}
                </div>
              </div>
            </div>

            {/* Card 5: Average CPU */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded bg-rose-500/15 flex items-center justify-center text-[#e2445c]">
                  <BarChart2 className="size-3" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">Average CPU</span>
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-[#e2445c] leading-tight">
                  {d.cpu_avg}%
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Max {d.cpu_max}%
                </div>
              </div>
            </div>

            {/* Card 6: Average RAM */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded bg-emerald-500/15 flex items-center justify-center text-[#00a862] dark:text-[#00c875]">
                  <BarChart2 className="size-3" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">Average RAM</span>
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-[#00a862] dark:text-[#00c875] leading-tight">
                  {d.ram_avg}%
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Max {d.ram_max}%
                </div>
              </div>
            </div>

            {/* Card 7: Average SD */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-[#f59e0b]">
                  <TrendingUp className="size-3" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">Average SD</span>
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-amber-600 dark:text-[#f59e0b] leading-tight">
                  {d.sd_avg}%
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Max {d.sd_max}%
                </div>
              </div>
            </div>

            {/* Card 8: SD Health & Suhu */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-[#00d2ff]">
                  <Thermometer className="size-3" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">Health & Temp</span>
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-[#00a862] dark:text-[#00c875] leading-tight">
                  {d.sd_health_status} ({d.sd_life_pct}%)
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {d.temp_avg}°C (Max {d.temp_max}°C)
                </div>
              </div>
            </div>
          </div>

          {/* Dedicated Panel: Akumulasi Operasional & Pencapaian SLA 99.5% (1 Bulan) */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 space-y-3 shadow-xs">
            {/* Header: Title + SLA Status Badge */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className={`size-6 rounded-md flex items-center justify-center ${
                  isSLAMet ? "bg-emerald-500/15 text-[#00a862] dark:text-[#00c875]" : "bg-rose-500/15 text-[#e2445c]"
                }`}>
                  <Clock className="size-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    Accumulated Operational Uptime & 99.5% SLA Performance
                    <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 hidden sm:inline">
                      (1 Month Period: 31 Days &times; 24 Hours = {periodHoursNum} Hours)
                    </span>
                  </h4>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  isSLAMet 
                    ? "bg-[#00c875]/15 text-[#00a862] dark:text-[#00c875] border-[#00c875]/30" 
                    : "bg-[#e2445c]/15 text-rose-600 dark:text-[#e2445c] border-[#e2445c]/30"
                }`}>
                  <span className={`size-1.5 rounded-full ${isSLAMet ? "bg-[#00c875]" : "bg-[#e2445c] animate-pulse"}`} />
                  {isSLAMet ? `SLA 99.5% Achieved (+${slaDiffPct}%)` : `SLA 99.5% Breach (${slaDiffPct}%)`}
                </span>
              </div>
            </div>

            {/* Visual Accumulation Bar with SLA Target Line (99.5%) */}
            <div className="space-y-1.5">
              <div className="relative h-4 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden flex border border-slate-300 dark:border-slate-800">
                {/* Uptime Green Segment */}
                <div 
                  style={{ width: `${uptimePctNum}%` }} 
                  className="h-full bg-linear-to-r from-emerald-600 to-[#00c875] transition-all duration-500"
                  title={`Uptime: ${uptimeDurationText} (${uptimePctNum}%)`}
                />
                {/* Downtime Red Segment */}
                <div 
                  style={{ width: `${downtimePctNum}%` }} 
                  className="h-full bg-linear-to-r from-rose-500 to-[#e2445c] transition-all duration-500"
                  title={`Downtime: ${downtimeDurationText} (${downtimePctNum}%)`}
                />
                {/* SLA 99.5% Target Marker */}
                <div 
                  style={{ left: "99.5%" }} 
                  className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-10 shadow-[0_0_6px_rgba(250,204,21,0.9)]"
                  title="Target SLA 99.5% (Min. 740h 17m)"
                />
              </div>

              {/* Bar Subtitle / Legend */}
              <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-[#00c875]" />
                    Total Uptime: <strong className="text-slate-900 dark:text-emerald-400 font-mono">{uptimeDurationText}</strong> ({uptimePctNum}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-[#e2445c]" />
                    Total Downtime: <strong className="text-slate-900 dark:text-rose-400 font-mono">{downtimeDurationText}</strong> ({downtimePctNum}%)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-yellow-400 font-medium">
                  <span className="w-2.5 h-0.5 bg-yellow-400 inline-block" />
                  Target SLA: 99.5% (Min. {slaTargetHoursText} &bull; Max Downtime Tolerance {slaDowntimeAllowedText})
                </div>
              </div>
            </div>

            {/* 4 Detail Metric Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200 dark:border-slate-800/60">
              <div className="bg-white dark:bg-[#070e1c] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-2xs">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Total Calendar Period</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">{periodHoursNum} Hours (1 Month)</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400">31 calendar days &times; 24 hours</span>
              </div>

              <div className="bg-white dark:bg-[#070e1c] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-2xs">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Accumulated Uptime</span>
                <span className="text-xs font-bold text-[#00a862] dark:text-[#00c875] font-mono mt-0.5 block">
                  {uptimeDurationText} ({uptimePctNum}%)
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400">Target Min: {slaTargetHoursText}</span>
              </div>

              <div className="bg-white dark:bg-[#070e1c] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-2xs">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Accumulated Downtime</span>
                <span className={`text-xs font-bold font-mono mt-0.5 block ${isSLAMet ? "text-slate-700 dark:text-slate-300" : "text-[#e2445c]"}`}>
                  {downtimeDurationText} ({downtimePctNum}%)
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400">Max Limit: {slaDowntimeAllowedText}</span>
              </div>

              <div className="bg-white dark:bg-[#070e1c] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-2xs">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">SLA Status & Tolerance</span>
                <span className={`text-xs font-bold font-mono mt-0.5 block ${isSLAMet ? "text-[#00a862] dark:text-[#00c875]" : "text-[#e2445c]"}`}>
                  {isSLAMet ? `Achieved (+${slaDiffPct}%)` : `Deficit ${slaDiffPct}%`}
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 truncate block" title={downtimeDiffText}>
                  {downtimeDiffText}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Sub-row: 3 Line Trend Charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {/* Chart 1: CPU Usage */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 shadow-xs">
              <div className="flex items-center justify-between pb-1 text-[11px]">
                <span className="font-bold text-slate-900 dark:text-white">CPU Usage (%)</span>
                <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                  Average: <strong className="text-slate-900 dark:text-white">{d.cpu_avg}%</strong> | Max: {d.cpu_max}%
                </span>
              </div>
              <div className="h-24 w-full mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={d.cpu_trend} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 8, fill: "#94a3b8" }} axisLine={{ stroke: "#94a3b8" }} tickLine={false} />
                    <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 8, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomChartTooltip unit="%" color="#00c875" />} />
                    <Line type="monotone" dataKey="value" stroke="#00c875" strokeWidth={1.8} dot={{ r: 2, fill: "#00c875" }} activeDot={{ r: 3.5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: RAM Usage */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 shadow-xs">
              <div className="flex items-center justify-between pb-1 text-[11px]">
                <span className="font-bold text-slate-900 dark:text-white">RAM Usage (%)</span>
                <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                  Average: <strong className="text-[#00a862] dark:text-[#00c875]">{d.ram_avg}%</strong> | Max: {d.ram_max}%
                </span>
              </div>
              <div className="h-24 w-full mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={d.ram_trend} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 8, fill: "#94a3b8" }} axisLine={{ stroke: "#94a3b8" }} tickLine={false} />
                    <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 8, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomChartTooltip unit="%" color="#f59e0b" />} />
                    <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={1.8} dot={{ r: 2, fill: "#f59e0b" }} activeDot={{ r: 3.5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: SD Card Usage */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 shadow-xs">
              <div className="flex items-center justify-between pb-1 text-[11px]">
                <span className="font-bold text-slate-900 dark:text-white">SD Card Usage (%)</span>
                <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                  Average: <strong className="text-[#0073ea] dark:text-[#38bdf8]">{d.sd_avg}%</strong> | Max: {d.sd_max}%
                </span>
              </div>
              <div className="h-24 w-full mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={d.sd_trend} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 8, fill: "#94a3b8" }} axisLine={{ stroke: "#94a3b8" }} tickLine={false} />
                    <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 8, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomChartTooltip unit="%" color="#0073ea" />} />
                    <Line type="monotone" dataKey="value" stroke="#0073ea" strokeWidth={1.8} dot={{ r: 2, fill: "#0073ea" }} activeDot={{ r: 3.5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Section: Multi-Track Timeline Status & Riwayat Event */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left Column (lg:col-span-6): 31-Day Multi-Track Timeline Matrix Status */}
        <div className="lg:col-span-6 bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            {/* Header with Title & Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Timeline Status ({periodInfo.effectivePeriodStr})
                </h4>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {dailyMultiTrack.length} Days
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
                        if (selectedEventDate === item.dateKey) {
                          setSelectedEventDate("ALL");
                        } else {
                          setSelectedEventDate(item.dateKey);
                        }
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
                            : selectedEventDate === item.dateKey
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
                        if (selectedEventDate === item.dateKey) {
                          setSelectedEventDate("ALL");
                        } else {
                          setSelectedEventDate(item.dateKey);
                        }
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
                        selectedEventDate === item.dateKey
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
                        if (selectedEventDate === item.dateKey) {
                          setSelectedEventDate("ALL");
                        } else {
                          setSelectedEventDate(item.dateKey);
                        }
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
                        selectedEventDate === item.dateKey
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
                        if (selectedEventDate === item.dateKey) {
                          setSelectedEventDate("ALL");
                        } else {
                          setSelectedEventDate(item.dateKey);
                        }
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
                        selectedEventDate === item.dateKey
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
        </div>        {/* Right Column (lg:col-span-6): Incident History Table with Date Selector & Scrollable 10 Rows */}
        <div className="lg:col-span-6 bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60">
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#070e1c] p-1 rounded-lg border border-slate-200 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setActiveEventTab("all")}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    activeEventTab === "all"
                      ? "bg-[#0073ea] text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  All Incidents ({rawEvents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEventTab("downtime")}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    activeEventTab === "downtime"
                      ? "bg-[#e2445c] text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Offline Incidents ({downtimeCount})
                </button>
              </div>

              {/* Date Selector Dropdown for Daily Filtering */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Filter Date:</span>
                <select
                  value={selectedEventDate}
                  onChange={(e) => setSelectedEventDate(e.target.value)}
                  className="text-xs font-medium bg-white dark:bg-[#070e1d] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs"
                >
                  <option value="ALL">All Dates ({rawEvents.length})</option>
                  {uniqueDates.map((dateStr) => {
                    const count = rawEvents.filter((e: any) => e.start_time?.startsWith(dateStr)).length;
                    return (
                      <option key={dateStr} value={dateStr}>
                        {dateStr} ({count} events)
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
                    <th className="py-2.5 px-2 text-center w-8">No.</th>
                    <th className="py-2.5 px-3">Incident Time</th>
                    <th className="py-2.5 px-3">Incident / Issue</th>
                    <th className="py-2.5 px-3 text-center">Duration</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40 text-[11px]">
                  {filteredEvents.map((event: any, idx: number) => {
                    const isResolved = (event.status || "").toLowerCase() === "resolved";
                    const isOngoing = (event.status || "").toLowerCase() === "active" || (event.end_time || "").includes("Active") || event.end_time === "-";
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
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                          {event.title || event.description || event.cause}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-xs ${
                            isOngoing
                              ? "bg-rose-500/15 text-rose-500 dark:text-rose-400 border border-rose-500/30 animate-pulse"
                              : "bg-amber-500/10 dark:bg-amber-500/20 text-[#f59e0b] border border-amber-500/30"
                          }`}>
                            {event.duration}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {isOngoing ? (
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
                        No incident history found for the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
                {activeEventTab === "downtime" && filteredEvents.length > 0 && (
                  <tfoot className="border-t-2 border-slate-300 dark:border-slate-700/80 bg-slate-100 dark:bg-[#081022] font-semibold text-xs text-slate-800 dark:text-slate-200">
                    <tr>
                      <td colSpan={2} className="py-2 px-2 text-right text-slate-500 dark:text-slate-400">Total Cumulative Downtime:</td>
                      <td className="py-2 px-2 text-slate-900 dark:text-white font-medium">-</td>
                      <td className="py-2 px-2 text-center text-[#e2445c] font-bold font-mono">{downtimeDurationText}</td>
                      <td className="py-2 px-2 text-slate-600 dark:text-slate-300 font-mono text-[11px] text-center">
                        Remaining: <strong className="text-[#00a862] dark:text-[#00c875]">{uptimeDurationText} ({uptimePctNum}%)</strong>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
