"use client";

import React, { useState } from "react";
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
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [activeEventTab, setActiveEventTab] = useState<"downtime" | "telemetry">("downtime");

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
      <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-6 text-center text-slate-500 text-sm">
        Data performa kesehatan untuk gateway {gatewayId} tidak ditemukan.
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
    ? `Mati melebihi batas toleransi ${formatHoursMinutes(downtimeDiffHours)}`
    : `Downtime dalam batas toleransi (${formatHoursMinutes(Math.abs(downtimeDiffHours))} sisa)`;

  const getSegmentBg = (status: string) => {
    switch (status) {
      case "normal":
        return "bg-[#00c875]";
      case "cpu_high":
        return "bg-[#f59e0b]";
      case "ram_high":
        return "bg-[#f97316]";
      case "sd_high":
      case "suhu_high":
      case "offline":
        return "bg-[#e2445c]";
      case "no_data":
        return "bg-[#6366f1]";
      default:
        return "bg-[#00c875]";
    }
  };

  const getCategoryColor = (cat: string) => {
    if (cat.includes("CPU")) return "text-[#f59e0b]";
    if (cat.includes("SD")) return "text-[#e2445c]";
    if (cat.includes("RAM")) return "text-[#f97316]";
    if (cat.includes("Suhu")) return "text-[#eab308]";
    return "text-slate-300";
  };

  const dateTicks = [
    "01 Oct", "03 Oct", "05 Oct", "07 Oct", "09 Oct", "11 Oct", "13 Oct", "15 Oct",
    "17 Oct", "19 Oct", "21 Oct", "23 Oct", "25 Oct", "27 Oct", "29 Oct", "31 Oct",
  ];

  const downtimeEvents = [
    {
      no: 1,
      start_time: "04 Oct 2026 02:15",
      end_time: "04 Oct 2026 08:30",
      duration: "6h 15m",
      accumulated: "6h 15m",
      category: "Listrik Padam (PLN)",
      reason: "Gangguan suplai daya PLN area Pondok Aren",
      sla_impact: "-0.84%",
      status: "Resolved",
    },
    {
      no: 2,
      start_time: "12 Oct 2026 11:20",
      end_time: "12 Oct 2026 15:05",
      duration: "3h 45m",
      accumulated: "10h 00m",
      category: "MCB / Power Trip",
      reason: "MCB switch toko trip saat beban puncak",
      sla_impact: "-0.50%",
      status: "Resolved",
    },
    {
      no: 3,
      start_time: "19 Oct 2026 23:40",
      end_time: "20 Oct 2026 09:10",
      duration: "9h 30m",
      accumulated: "19h 30m",
      category: "Maintenance Gedung",
      reason: "Pemeliharaan panel daya & kelistrikan toko",
      sla_impact: "-1.28%",
      status: "Resolved",
    },
    {
      no: 4,
      start_time: "27 Oct 2026 14:10",
      end_time: "27 Oct 2026 18:25",
      duration: "4h 15m",
      accumulated: "23h 45m",
      category: "Hard Reboot & OS Recovery",
      reason: "Pemulihan sistem otomatis paska tegangan drop",
      sla_impact: "-0.57%",
      status: "Resolved",
    },
  ];

  return (
    <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-5 space-y-4 font-sans transition-all duration-300">
      {/* 1. Header Bar: Title, Status Badge, Close Button */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <FileSpreadsheet className="size-4" />
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Detail Performa Gateway &ndash; {d.id}
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#00c875]/20 text-[#00a862] dark:text-[#00c875] border border-[#00c875]/30">
            {d.status}
          </span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Tutup Detail"
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
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Tipe</span>
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
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Lokasi</span>
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
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">Periode</span>
              </div>
              <div className="mt-2">
                <div className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight truncate">
                  {d.period}
                </div>
                <div className="text-[9px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                  Total {periodHoursNum} Jam
                </div>
              </div>
            </div>

            {/* Card 2: Akumulasi Nyala (Uptime) */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded bg-emerald-500/15 flex items-center justify-center text-[#00a862] dark:text-[#00c875]">
                  <CheckCircle2 className="size-3" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">Akumulasi Nyala</span>
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

            {/* Card 3: Akumulasi Mati (Downtime) */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded bg-rose-500/15 flex items-center justify-center text-[#e2445c]">
                  <Clock className="size-3" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">Akumulasi Mati</span>
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
            <div className={`bg-slate-50/70 dark:bg-[#0a1224] border rounded-xl p-2.5 flex flex-col justify-between shadow-xs ${
              isSLAMet ? "border-emerald-500/40" : "border-rose-500/40"
            }`}>
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

            {/* Card 5: Rata-rata CPU */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded bg-rose-500/15 flex items-center justify-center text-[#e2445c]">
                  <BarChart2 className="size-3" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">Rata-rata CPU</span>
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

            {/* Card 6: Rata-rata RAM */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded bg-emerald-500/15 flex items-center justify-center text-[#00a862] dark:text-[#00c875]">
                  <BarChart2 className="size-3" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">Rata-rata RAM</span>
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

            {/* Card 7: Rata-rata SD */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-[#f59e0b]">
                  <TrendingUp className="size-3" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">Rata-rata SD</span>
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
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">Health & Suhu</span>
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
                    Akumulasi Waktu Operasional & Pencapaian SLA 99.5%
                    <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 hidden sm:inline">
                      (Periode 1 Bulan: 31 Hari &times; 24 Jam = {periodHoursNum} Jam)
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
                  {isSLAMet ? `SLA 99.5% Tercapai (+${slaDiffPct}%)` : `SLA 99.5% Breach (${slaDiffPct}%)`}
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
                  title={`Nyala (Uptime): ${uptimeDurationText} (${uptimePctNum}%)`}
                />
                {/* Downtime Red Segment */}
                <div 
                  style={{ width: `${downtimePctNum}%` }} 
                  className="h-full bg-linear-to-r from-rose-500 to-[#e2445c] transition-all duration-500"
                  title={`Mati (Downtime): ${downtimeDurationText} (${downtimePctNum}%)`}
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
                    Total Nyala: <strong className="text-slate-900 dark:text-emerald-400 font-mono">{uptimeDurationText}</strong> ({uptimePctNum}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-[#e2445c]" />
                    Total Mati: <strong className="text-slate-900 dark:text-rose-400 font-mono">{downtimeDurationText}</strong> ({downtimePctNum}%)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-yellow-400 font-medium">
                  <span className="w-2.5 h-0.5 bg-yellow-400 inline-block" />
                  Target SLA: 99.5% (Min. {slaTargetHoursText} &bull; Toleransi Mati maks. {slaDowntimeAllowedText})
                </div>
              </div>
            </div>

            {/* 4 Detail Metric Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200 dark:border-slate-800/60">
              <div className="bg-white dark:bg-[#070e1c] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-2xs">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Total Periode Kalender</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">{periodHoursNum} Jam (1 Bulan)</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400">31 hari kalender &times; 24 jam</span>
              </div>

              <div className="bg-white dark:bg-[#070e1c] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-2xs">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Akumulasi Nyala (Uptime)</span>
                <span className="text-xs font-bold text-[#00a862] dark:text-[#00c875] font-mono mt-0.5 block">
                  {uptimeDurationText} ({uptimePctNum}%)
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400">Target Min: {slaTargetHoursText}</span>
              </div>

              <div className="bg-white dark:bg-[#070e1c] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-2xs">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Akumulasi Mati (Downtime)</span>
                <span className={`text-xs font-bold font-mono mt-0.5 block ${isSLAMet ? "text-slate-700 dark:text-slate-300" : "text-[#e2445c]"}`}>
                  {downtimeDurationText} ({downtimePctNum}%)
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400">Batas Maks: {slaDowntimeAllowedText}</span>
              </div>

              <div className="bg-white dark:bg-[#070e1c] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-2xs">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Status & Toleransi SLA</span>
                <span className={`text-xs font-bold font-mono mt-0.5 block ${isSLAMet ? "text-[#00a862] dark:text-[#00c875]" : "text-[#e2445c]"}`}>
                  {isSLAMet ? `Tercapai (+${slaDiffPct}%)` : `Defisit ${slaDiffPct}%`}
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
                  Rata-rata: <strong className="text-slate-900 dark:text-white">{d.cpu_avg}%</strong> | Max: {d.cpu_max}%
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
                  Rata-rata: <strong className="text-[#00a862] dark:text-[#00c875]">{d.ram_avg}%</strong> | Max: {d.ram_max}%
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
                  Rata-rata: <strong className="text-[#0073ea] dark:text-[#38bdf8]">{d.sd_avg}%</strong> | Max: {d.sd_max}%
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
        {/* Left Column (lg:col-span-6): Timeline Status (CPU, RAM, SD, Suhu) */}
        <div className="lg:col-span-6 bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            {/* Header with Title & Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Timeline Status Selama Periode
                </h4>
                <Info className="size-3 text-slate-400 cursor-pointer" />
              </div>

              {/* Legend Pills */}
              <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-[#00c875]" />
                  Normal
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-[#f59e0b]" />
                  CPU High
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-[#f97316]" />
                  RAM High
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-[#e2445c]" />
                  SD High
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-[#6366f1]" />
                  No Data
                </span>
              </div>
            </div>

            {/* 4 Tracks of Timeline (CPU, RAM, SD Card, Suhu) */}
            <div className="mt-4 space-y-2.5">
              {d.timeline_tracks.map((track, tIdx) => (
                <div key={tIdx} className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 min-w-13.75 truncate">
                    {track.track_name}
                  </span>

                  <div className="flex-1 h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 relative">
                    {track.segments.map((seg, sIdx) => (
                      <div
                        key={sIdx}
                        style={{ width: `${seg.width_pct}%` }}
                        className={`h-full ${getSegmentBg(seg.status)} transition-opacity hover:opacity-85 cursor-pointer relative group`}
                        onMouseEnter={() =>
                          setHoveredSegment(`${track.track_name}: ${seg.period} | ${seg.label}`)
                        }
                        onMouseLeave={() => setHoveredSegment(null)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Hover Tooltip display */}
            <div className="h-4 mt-2 pl-17 text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {hoveredSegment || "Arahkan kursor ke timeline untuk melihat detail"}
            </div>

            {/* Date Scale Ticks Beneath Timeline */}
            <div className="mt-1 pl-17 flex justify-between text-[9px] text-slate-500 dark:text-slate-400 font-mono select-none">
              {dateTicks.map((tick, idx) => (
                <span key={idx} className="hidden sm:inline-block">
                  {tick}
                </span>
              ))}
              <span className="sm:hidden">01 Oct</span>
              <span className="sm:hidden">08 Oct</span>
              <span className="sm:hidden">16 Oct</span>
              <span className="sm:hidden">24 Oct</span>
              <span className="sm:hidden">31 Oct</span>
            </div>
          </div>
        </div>

        {/* Right Column (lg:col-span-6): Riwayat Event Table with Toggle */}
        <div className="lg:col-span-6 bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="pb-3 border-b border-slate-200 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#070e1c] p-1 rounded-lg border border-slate-200 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setActiveEventTab("downtime")}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    activeEventTab === "downtime"
                      ? "bg-[#e2445c] text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Insiden Mati (Downtime 4)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEventTab("telemetry")}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    activeEventTab === "telemetry"
                      ? "bg-[#0073ea] text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Event Telemetri ({d.events.length})
                </button>
              </div>

              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {activeEventTab === "downtime" ? `Akumulasi: ${downtimeDurationText}` : "Alert Hardware"}
              </span>
            </div>

            {/* If activeEventTab === "downtime" */}
            {activeEventTab === "downtime" && (
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-[11px] text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/60 font-semibold">
                      <th className="py-2 px-2 text-center w-8">No.</th>
                      <th className="py-2 px-2.5">Waktu Mati</th>
                      <th className="py-2 px-2.5">Waktu Nyala</th>
                      <th className="py-2 px-2 text-center">Durasi Mati</th>
                      <th className="py-2 px-2.5">Kategori</th>
                      <th className="py-2 px-2.5">Akar Masalah</th>
                      <th className="py-2 px-2 text-center">Dampak SLA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40 text-[11px]">
                    {downtimeEvents.map((evt) => (
                      <tr key={evt.no} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-2 px-2 text-center text-slate-500 dark:text-slate-400 font-mono">{evt.no}</td>
                        <td className="py-2 px-2.5 text-slate-800 dark:text-slate-300 font-mono whitespace-nowrap">{evt.start_time}</td>
                        <td className="py-2 px-2.5 text-slate-800 dark:text-slate-300 font-mono whitespace-nowrap">{evt.end_time}</td>
                        <td className="py-2 px-2 text-center font-bold text-[#e2445c] whitespace-nowrap font-mono">{evt.duration}</td>
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60">
                            {evt.category}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-slate-700 dark:text-slate-300 truncate max-w-37.5">{evt.reason}</td>
                        <td className="py-2 px-2 text-center font-mono text-rose-600 dark:text-rose-400 whitespace-nowrap">{evt.sla_impact}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-300 dark:border-slate-700/80 bg-slate-100 dark:bg-[#081022] font-semibold text-xs text-slate-800 dark:text-slate-200">
                    <tr>
                      <td colSpan={3} className="py-2 px-2 text-right text-slate-500 dark:text-slate-400">Total Akumulasi Mati:</td>
                      <td className="py-2 px-2 text-center text-[#e2445c] font-bold font-mono">{downtimeDurationText}</td>
                      <td colSpan={3} className="py-2 px-2 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                        Sisa Nyala: <strong className="text-[#00a862] dark:text-[#00c875]">{uptimeDurationText} ({uptimePctNum}%)</strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* If activeEventTab === "telemetry" */}
            {activeEventTab === "telemetry" && (
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-[11px] text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/60 font-semibold">
                      <th className="py-2 px-2 text-center w-8">No.</th>
                      <th className="py-2 px-2.5">Mulai</th>
                      <th className="py-2 px-2.5">Selesai</th>
                      <th className="py-2 px-2 text-center">Durasi</th>
                      <th className="py-2 px-2.5">Kategori</th>
                      <th className="py-2 px-2 text-center">Nilai</th>
                      <th className="py-2 px-2.5">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40 text-[11px]">
                    {d.events.map((event) => (
                      <tr
                        key={event.no}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-2 px-2 text-center text-slate-500 dark:text-slate-400 font-mono">
                          {event.no}
                        </td>
                        <td className="py-2 px-2.5 text-slate-800 dark:text-slate-300 font-mono whitespace-nowrap">
                          {event.start_time}
                        </td>
                        <td className="py-2 px-2.5 text-slate-800 dark:text-slate-300 font-mono whitespace-nowrap">
                          {event.end_time}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-[#f59e0b] whitespace-nowrap font-mono">
                          {event.duration}
                        </td>
                        <td className={`py-2 px-2.5 font-bold whitespace-nowrap ${getCategoryColor(event.category)}`}>
                          {event.category}
                        </td>
                        <td className={`py-2 px-2 text-center font-bold whitespace-nowrap ${event.value.includes("°C") ? "text-[#e2445c]" : "text-slate-700 dark:text-slate-300"}`}>
                          {event.value}
                        </td>
                        <td className="py-2 px-2.5 text-slate-700 dark:text-slate-300 truncate max-w-37.5">
                          {event.description}
                        </td>
                      </tr>
                    ))}
                    {d.events.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-4 text-center text-slate-500 dark:text-slate-400 text-xs">
                          Tidak ada riwayat event pada periode ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
