"use client";

import React, { useState } from "react";
import { formatToWIB } from "@/utils/common";
import {
  Server,
  Cpu,
  Database,
  HardDrive,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  Calendar,
  Zap,
  Power,
  ArrowRight,
  Activity,
  CheckCheck,
  Thermometer,
  Info,
  TrendingDown,
  TrendingUp,
  MapPin,
} from "lucide-react";
import {
  useGatewayDetail,
  IGatewayDetailData,
  IDowntimeEvent,
} from "@/store/api/monitoring";
import { getCurrentMonthPeriodStr } from "@/lib/reportPeriodUtils";

const formatDurationEn = (dur?: string) => {
  if (!dur) return "-";
  return dur
    .replace(/menit/gi, "m")
    .replace(/jam/gi, "h")
    .replace(/detik/gi, "s")
    .trim();
};

const formatIncidentEn = (text?: string) => {
  if (!text) return "Normal Operation (No incidents detected)";
  return text
    .replace(/Terdeteksi\s+tegangan\s+listrik\s+drop\s*\((.*?)\)\s+pada\s+adaptor\s+gateway!?/gi, "Detected power voltage drop ($1) on gateway adapter!")
    .replace(/Catu\s+daya\s+adaptor\s+drop\s+di\s+bawah\s+([0-9\.]+V)/gi, "Adapter power supply dropped below $1")
    .replace(/Kapasitas\s+partisi\s*\'(.*?)\'\s+mencapai\s*([0-9\.]+%?)\s*\(Sisa:\s*([^)]+)\)\.?/gi, "Partition '$1' capacity reached $2 (Remaining: $3).")
    .replace(/Kondisi\s+flash\s+storage\s+gateway\s+menurun\s+ke\s*([0-9\.]+%?)\s*\((.*?)\)\.?/gi, "Gateway flash storage health degraded to $1 ($2).")
    .replace(/Komunikasi\s+Port\s+USB\s+Modem\s+dengan\s+CPU\s+Terputus/gi, "Modem USB Port Communication Lost")
    .replace(/Koneksi\s+Jaringan\s+Seluler\s+Terputus/gi, "Cellular Network Connection Disconnected")
    .replace(/Aliran\s+Data\s+Internet\s+Mati/gi, "No Internet Data")
    .replace(/Komunikasi\s+Gateway\s+CPU\s+ke\s+NVR\s+Surveillance\s+Terputus/gi, "Gateway CPU to NVR Communication Lost")
    .replace(/Kamera\s+Hilang\s+Sinyal\s*\/\s*No\s+Video/gi, "Camera Signal Loss / No Video")
    .replace(/Kamera\s+Terputus\s*\/\s*Offline/gi, "Camera Disconnected / Offline")
    .replace(/Gangguan\s+Jaringan/gi, "Network Disruption")
    .replace(/Gangguan/gi, "Incident")
    .replace(/selama\s+(\d+)\s*Menit/gi, "for $1m")
    .replace(/selama\s+(\d+)\s*Jam\s*(\d+)\s*Menit/gi, "for $1h $2m")
    .replace(/selama\s+(\d+)\s*Jam/gi, "for $1h")
    .replace(/(\d+)\s*Menit/gi, "$1m")
    .replace(/(\d+)\s*Jam/gi, "$1h")
    .replace(/Normal\s+Operation\s*\(No incidents detected\)/gi, "Normal Operation (No incidents detected)")
    .replace(/Operasi\s+Normal/gi, "Normal Operation")
    .trim();
};

interface DeviceDetailCardProps {
  gatewayId: string | null;
  onClose?: () => void;
}

// Mini Circular Donut Gauge Component
const CircularGauge = ({
  percent,
  strokeColor,
  label,
  sublabel,
}: {
  percent: number;
  strokeColor: string;
  label?: string;
  sublabel?: string;
}) => {
  const radius = 32;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center my-1 relative">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="w-20 h-20 -rotate-90 transform" viewBox="0 0 80 80">
          {/* Background Track */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            className="stroke-slate-100 dark:stroke-slate-800/80"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Stroke */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            {percent}%
          </span>
          {label && (
            <span className="text-[9px] text-slate-400 font-medium">
              {label}
            </span>
          )}
        </div>
      </div>
      {sublabel && (
        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mt-1">
          {sublabel}
        </span>
      )}
    </div>
  );
};

// Mini Sparkline Wave Chart Component
const SparklineWave = ({
  data,
  color,
  id,
}: {
  data: number[];
  color: string;
  id: string;
}) => {
  let points = Array.isArray(data)
    ? data.filter((v) => typeof v === "number" && !isNaN(v))
    : [];

  if (points.length === 0) {
    points = [20, 25, 22, 28, 30, 26, 28];
  } else if (points.length === 1) {
    // Duplicate single point so points.length >= 2, avoiding division by zero (NaN cx)
    points = [points[0], points[0]];
  }

  const max = Math.max(...points, 100);
  const min = Math.min(...points, 0);
  const range = max - min || 1;

  const width = 120;
  const height = 24;

  const coords = points.map((val, idx) => {
    const divisor = points.length > 1 ? points.length - 1 : 1;
    const rawX = (idx / divisor) * width;
    const rawY = height - ((val - min) / range) * (height - 4) - 2;
    const x = Number.isFinite(rawX) ? Number(rawX.toFixed(1)) : 0;
    const y = Number.isFinite(rawY) ? Number(rawY.toFixed(1)) : height / 2;
    return { x, y };
  });

  const pathD = coords.reduce((acc, curr, idx) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    const prev = coords[idx - 1];
    const rawCx = (prev.x + curr.x) / 2;
    const cx = Number.isFinite(rawCx) ? Number(rawCx.toFixed(1)) : curr.x;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
  }, "");

  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  return (
    <div className="w-full flex justify-center py-1">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-32.5 h-6 overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#grad-${id})`} />
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={Number.isFinite(c.x) ? c.x : 0}
            cy={Number.isFinite(c.y) ? c.y : 0}
            r="1.5"
            fill={color}
            className="opacity-80"
          />
        ))}
      </svg>
    </div>
  );
};

// Isometric Realistic 3D SVG of the SmartBox Gateway Device (Hitam or Putih)
const SmartBoxIllustration = ({ isWhite }: { isWhite?: boolean }) => {
  const topColor = isWhite ? "#e2e8f0" : "#253248";
  const bevelColor = isWhite ? "#cbd5e1" : "#1e293b";
  const leftFace = isWhite ? "#94a3b8" : "#1b2438";
  const rightFace = isWhite ? "#64748b" : "#0f172a";
  const strokeCol = isWhite ? "#475569" : "#334155";

  return (
    <svg
      viewBox="0 0 160 110"
      className="w-28 sm:w-32 h-auto drop-shadow-md select-none shrink-0"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse
        cx="80"
        cy="98"
        rx="65"
        ry="10"
        fill="black"
        fillOpacity="0.35"
      />
      <path
        d="M18 64 L78 96 L144 64 L84 34 Z"
        fill={rightFace}
        stroke={strokeCol}
        strokeWidth="1"
      />
      <path
        d="M18 42 L78 74 L78 94 L18 62 Z"
        fill={leftFace}
        stroke={strokeCol}
        strokeWidth="1"
      />
      <path
        d="M78 74 L144 42 L144 62 L78 94 Z"
        fill={rightFace}
        stroke={strokeCol}
        strokeWidth="1"
      />
      <path
        d="M18 42 L78 12 L144 42 L84 74 Z"
        fill={topColor}
        stroke={strokeCol}
        strokeWidth="1"
      />
      <path d="M20 42 L78 14 L142 42 L84 72 Z" fill={bevelColor} />

      {/* Ports */}
      <path
        d="M25 54 L32 58 L32 65 L25 61 Z"
        fill="#090d16"
        stroke="#475569"
        strokeWidth="0.8"
      />
      <circle cx="28" cy="53" r="1" fill="#f59e0b" />
      <path
        d="M38 61 L45 65 L45 72 L38 68 Z"
        fill="#090d16"
        stroke="#475569"
        strokeWidth="0.8"
      />
      <circle cx="41" cy="60" r="1" fill="#10b981" />
      <path
        d="M51 68 L58 72 L58 79 L51 75 Z"
        fill="#090d16"
        stroke="#475569"
        strokeWidth="0.8"
      />
      <circle cx="54" cy="67" r="1" fill="#10b981" />
      <path
        d="M64 75 L71 79 L71 86 L64 82 Z"
        fill="#090d16"
        stroke="#475569"
        strokeWidth="0.8"
      />
      <circle cx="67" cy="74" r="1" fill="#10b981" />

      <path
        d="M88 80 L96 76 L96 70 L88 74 Z"
        fill="#090d16"
        stroke="#eab308"
        strokeWidth="0.8"
      />
      <path
        d="M104 72 L112 68 L112 62 L104 66 Z"
        fill="#090d16"
        stroke="#eab308"
        strokeWidth="0.8"
      />
      <path
        d="M120 64 L128 60 L128 54 L120 58 Z"
        fill="#090d16"
        stroke="#eab308"
        strokeWidth="0.8"
      />
      <rect
        x="74"
        y="38"
        width="10"
        height="3"
        transform="rotate(-26 74 38)"
        fill="#38bdf8"
        fillOpacity="0.4"
      />
    </svg>
  );
};

export const DeviceDetailCard: React.FC<DeviceDetailCardProps> = ({
  gatewayId,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    | "Overview"
    | "CPU & RAM"
    | "Storage"
    | "Uptime & Downtime"
    | "Temperature"
    | "Event Log"
  >("Overview");

  // Fetch telemetry detail for selected gateway from FastAPI
  const { data, isLoading } = useGatewayDetail(gatewayId);

  if (!gatewayId) return null;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <div className="size-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading System Health telemetry detail...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-6 text-center text-slate-500 text-sm">
        System Health data for gateway {gatewayId} not found.
      </div>
    );
  }

  const d: IGatewayDetailData = data;

  const tabs: Array<
    | "Overview"
    | "CPU & RAM"
    | "Storage"
    | "Uptime & Downtime"
    | "Temperature"
    | "Event Log"
  > = [
    "Overview",
    "CPU & RAM",
    "Storage",
    "Uptime & Downtime",
    "Temperature",
    "Event Log",
  ];

  const isWhiteDevice = d.type.includes("Putih");
  const hardwareModel = d.model.includes("(")
    ? d.model.replace(/^.*\((.*)\).*$/, "$1")
    : d.model;

  // Helper for SD Health icon & color
  const isHealthGood = d.sd_health.status === "Good";
  const isHealthCaution =
    d.sd_health.status === "Caution" || d.sd_health.status === "Wear";
  const healthColor = isHealthGood
    ? "text-emerald-400"
    : isHealthCaution
      ? "text-amber-400"
      : "text-rose-500";
  const HealthIcon = isHealthGood
    ? CheckCircle2
    : isHealthCaution
      ? AlertTriangle
      : AlertCircle;

  // Monthly SLA 99.5% & Accumulation metrics (744 hours in October: 31 days x 24h)
  const totalMonthHours = d.month_total_hours || 744;
  const uptimePctNum =
    parseFloat((d.uptime_pct || "96.8%").replace("%", "")) || 96.8;
  const downtimePctNum = parseFloat((100 - uptimePctNum).toFixed(1));
  const slaTargetPct = d.sla_target || 99.5;
  const isSLAMet = uptimePctNum >= slaTargetPct;
  const slaDiffPct = (uptimePctNum - slaTargetPct).toFixed(1);

  const formatHoursMinutes = (totalHours: number) => {
    const h = Math.floor(totalHours);
    const m = Math.round((totalHours - h) * 60);
    return `${h}h ${m.toString().padStart(2, "0")}m`;
  };

  const sortedEvents = (d.events ? [...d.events] : []).sort((a, b) => {
    const epochA = typeof (a as any).epoch === "number" && !isNaN((a as any).epoch)
      ? (a as any).epoch
      : (a.time ? Date.parse(a.time.replace(" WIB", "").trim().replace(" ", "T")) || 0 : 0);
    const epochB = typeof (b as any).epoch === "number" && !isNaN((b as any).epoch)
      ? (b as any).epoch
      : (b.time ? Date.parse(b.time.replace(" WIB", "").trim().replace(" ", "T")) || 0 : 0);
    return epochB - epochA;
  });

  const uptimeHoursCalculated = totalMonthHours * (uptimePctNum / 100);
  const downtimeHoursCalculated = totalMonthHours * (downtimePctNum / 100);
  const slaMinUptimeHours = totalMonthHours * (slaTargetPct / 100); // 740.28h = 740h 17m
  const slaMaxDowntimeHours = totalMonthHours * ((100 - slaTargetPct) / 100); // 3.72h = 3h 43m

  const uptimeDurationText =
    d.uptime_duration || formatHoursMinutes(uptimeHoursCalculated);
  const downtimeDurationText =
    d.downtime_duration || formatHoursMinutes(downtimeHoursCalculated);
  const slaTargetHoursText =
    d.sla_target_hours || formatHoursMinutes(slaMinUptimeHours);
  const slaDowntimeAllowedText =
    d.sla_downtime_allowed || formatHoursMinutes(slaMaxDowntimeHours);

  const downtimeDiffHours = downtimeHoursCalculated - slaMaxDowntimeHours;
  const downtimeDiffText =
    downtimeDiffHours > 0
      ? `Downtime exceeded tolerance limit by ${formatHoursMinutes(downtimeDiffHours)}`
      : `Downtime within tolerance limit (${formatHoursMinutes(Math.abs(downtimeDiffHours))} remaining)`;

  const dailyUptime = d.daily_uptime || {
    date_str: d.last_update?.split(" ")[0] || "Today",
    total_period_hours: 24.0,
    total_period_str: "24.0 Hours",
    total_period_minutes: 1440,
    uptime_minutes: 1440,
    uptime_text: d.uptime_duration || "24h 0m",
    uptime_pct: uptimePctNum,
    downtime_minutes: 0,
    downtime_text: d.downtime_duration || "0m",
    downtime_pct: downtimePctNum,
    sla_target_pct: 99.5,
    sla_min_uptime_text: "23h 53m",
    sla_max_down_text: "7m",
    is_sla_met: isSLAMet,
    sla_diff_pct: isSLAMet ? `+${slaDiffPct}` : `${slaDiffPct}`,
    tolerance_text: downtimeDiffText,
    incidents: d.downtime_events || [],
  };

  const downtimeEvents: IDowntimeEvent[] = dailyUptime.incidents || [];

  // Dynamic operational calendar data for current month
  const nowObj = new Date();
  const currentMonthName = nowObj.toLocaleDateString("en-US", { month: "short" });
  const currentMonthNum = nowObj.getMonth() + 1;
  const currentYear = nowObj.getFullYear();
  const daysInCurrentMonth = new Date(currentYear, currentMonthNum, 0).getDate();
  const currentDay = nowObj.getDate();

  const daysInMonth = Array.from({ length: daysInCurrentMonth }, (_, i) => {
    const day = i + 1;
    let isDown = false;
    let downDuration = "";
    let upDuration = "24 Hours";
    let incident = "";

    const evForDay = downtimeEvents.find((ev) => {
      if (!ev.start_time) return false;
      const m = ev.start_time.match(/(\d{1,2})\s+([A-Za-z]+)/);
      if (m && parseInt(m[1], 10) === day) return true;
      return false;
    });

    if (evForDay) {
      isDown = true;
      downDuration = `${evForDay.duration} Downtime`;
      incident = `${evForDay.category} (${evForDay.start_time} - ${evForDay.end_time || "Now"})`;
    }

    return {
      day,
      dateLabel: `${day.toString().padStart(2, "0")} ${currentMonthName}`,
      isDown,
      downDuration,
      upDuration,
      incident,
      isFuture: day > currentDay,
    };
  });

  return (
    <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-300">
      {/* Top Header Bar */}
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800/90 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 dark:bg-[#0a1224]">
        {/* Left: Device Title & Status Badge */}
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400">
            <Server className="size-4" />
          </div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Device Detail
            </h2>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                d.service_status === "Running"
                  ? "bg-emerald-500/15 text-[#00c875] border border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30"
              }`}
            >
              {d.service_status === "Running" ? "Online" : "Degraded"}
            </span>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-[#070e1c] p-1 rounded-lg border border-slate-200 dark:border-slate-800/80">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#0073ea] text-white font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800/50"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Right: Close Button */}
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Details"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* ========================================================= */}
        {/* TAB 1: RINGKASAN (DEFAULT VIEW) */}
        {/* ========================================================= */}
        {activeTab === "Overview" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* BARIS 1: col-6 Profile & Specs + col-3 SD Card Health + col-3 Uptime */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
              {/* Kolom 1 (col-6): Device Profile & Specs */}
              <div className="lg:col-span-6 col-span-12 bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                  {/* 3D SmartBox Model */}
                  <div className="flex flex-col items-center justify-center shrink-0 w-28 sm:w-32">
                    <SmartBoxIllustration isWhite={isWhiteDevice} />
                    <div className="mt-1.5 text-center">
                      <div className="text-[10px] text-slate-500 font-mono">
                        v1.0.0
                      </div>
                      <div className="text-[11px] font-bold text-[#0073ea] dark:text-[#00d2ff] leading-tight">
                        Protect<span className="text-[#ff7a59]">Q</span>ube
                        AIOps
                      </div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight">
                        SmartBox Fleet
                      </div>
                    </div>
                  </div>

                  {/* Header & Clean 2-Column Specs */}
                  <div className="flex-1 min-w-0 space-y-2 w-full">
                    {/* Header: ID, Status Badge, Location */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-200 dark:border-slate-800/70 pb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3
                            className="text-xl font-bold text-slate-900 dark:text-white tracking-wide truncate"
                            title={d.location}
                          >
                            {d.location}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                              d.service_status === "Running"
                                ? "bg-emerald-500/15 text-[#00a862] dark:text-emerald-400 border-emerald-500/30"
                                : "bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/30"
                            }`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${
                                d.service_status === "Running"
                                  ? "bg-emerald-400 animate-pulse"
                                  : "bg-amber-400"
                              }`}
                            />
                            {d.service_status}
                          </span>
                        </div>
                        <p
                          className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium flex items-center gap-1.5 mt-0.5 truncate"
                          title={d.id}
                        >
                          <span className="truncate">{d.id}</span>
                        </p>
                      </div>
                    </div>

                    {/* Specs List: 1 Kolom ke Bawah dengan Kolon Sejajar */}
                    <div className="space-y-1 text-xs pt-0.5">
                      <div className="flex items-center">
                        <span className="text-slate-500 dark:text-slate-400 w-24 shrink-0 font-medium">
                          Type
                        </span>
                        <span
                          className="text-slate-800 dark:text-slate-200 font-medium truncate"
                          title={d.type}
                        >
                          : {d.type}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-slate-500 dark:text-slate-400 w-24 shrink-0 font-medium">
                          Hardware
                        </span>
                        <span
                          className="text-slate-800 dark:text-slate-200 font-medium truncate"
                          title={hardwareModel}
                        >
                          : {hardwareModel}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-slate-500 dark:text-slate-400 w-24 shrink-0 font-medium">
                          IP Address
                        </span>
                        <span className="text-slate-800 dark:text-slate-200 font-mono">
                          : {d.ip_address}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-slate-500 dark:text-slate-400 w-24 shrink-0 font-medium">
                          Uptime
                        </span>
                        <span className="text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                          : {d.uptime}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-slate-500 dark:text-slate-400 w-24 shrink-0 font-medium whitespace-nowrap">
                          Last Update
                        </span>
                        <span className="text-slate-800 dark:text-slate-200 font-mono text-[11px] whitespace-nowrap">
                          : {formatToWIB(d.last_update)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-slate-500 dark:text-slate-400 w-24 shrink-0 font-medium">
                          Service
                        </span>
                        <span className="text-emerald-500 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                          : Normal Operation
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kolom 2 (col-3): Storage Health Card */}
              <div className="lg:col-span-3 col-span-12 bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
                <div>
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium text-xs">
                      <ShieldCheck className="size-3.5 text-emerald-500 dark:text-emerald-400" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Storage Health
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isHealthGood
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          : isHealthCaution
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            : "bg-rose-500/15 text-rose-600 dark:text-rose-500 border-rose-500/30"
                      }`}
                    >
                      {d.sd_health.status}
                    </span>
                  </div>

                  {/* Compact Status Indicator Chip */}
                  <div className="flex items-center justify-center gap-2.5 py-1.5 px-3 bg-white dark:bg-[#070e1c] rounded-lg border border-slate-200 dark:border-slate-800/80 mt-2 mb-2 shadow-xs">
                    <div
                      className={`size-7 rounded-full flex items-center justify-center shrink-0 ${
                        isHealthGood
                          ? "bg-emerald-500/20 text-emerald-500 dark:text-emerald-400"
                          : isHealthCaution
                            ? "bg-amber-500/20 text-amber-500 dark:text-amber-400"
                            : "bg-rose-500/20 text-rose-500"
                      }`}
                    >
                      <HealthIcon className={`size-4 ${healthColor}`} />
                    </div>
                    <div className="min-w-0">
                      <div
                        className={`text-sm font-bold tracking-tight leading-none ${healthColor}`}
                      >
                        Condition {d.sd_health.status} {d.sd_health.health_percent ? `(${d.sd_health.health_percent}%)` : ""}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate">
                        Health {d.sd_health.health_percent ? `${d.sd_health.health_percent}%` : "100%"} &bull; Temp {d.sd_health.temperature} &bull; Wear{" "}
                        {d.sd_health.wear_level}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parameters List */}
                <div className="text-[11px] space-y-1 text-slate-700 dark:text-slate-300 font-medium border-t border-slate-200 dark:border-slate-800/60 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <span
                        className={`size-1.5 rounded-full ${isHealthGood ? "bg-emerald-400" : "bg-amber-400"}`}
                      />
                      Bad Sector
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      : {d.sd_health.bad_sector}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <span
                        className={`size-1.5 rounded-full ${isHealthGood ? "bg-emerald-400" : "bg-amber-400"}`}
                      />
                      Wear Level
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      : {d.sd_health.wear_level}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <span
                        className={`size-1.5 rounded-full ${isHealthGood ? "bg-emerald-400" : "bg-amber-400"}`}
                      />
                      Temperature
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      : {d.sd_health.temperature}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <span
                        className={`size-1.5 rounded-full ${isHealthGood ? "bg-emerald-400" : "bg-amber-400"}`}
                      />
                      I/O Error
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      : {d.sd_health.io_error}
                    </span>
                  </div>
                </div>
              </div>

              {/* Kolom 3 (col-3): Uptime & SLA 99.5% Card */}
              <div className="lg:col-span-3 col-span-12 bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
                <div>
                  {/* Header: Title + SLA Status Badge */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium text-xs">
                      <Clock className="size-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Uptime & SLA
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                        isSLAMet
                          ? "bg-emerald-500/15 text-[#00a862] dark:text-[#00c875] border-emerald-500/30"
                          : "bg-rose-500/15 text-rose-500 dark:text-rose-400 border-rose-500/30"
                      }`}
                    >
                      {isSLAMet
                        ? `SLA OK (+${slaDiffPct}%)`
                        : `Breach (${slaDiffPct}%)`}
                    </span>
                  </div>

                  {/* Monthly Period & SLA Target */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-2 mb-1">
                    <span className="font-medium">
                      {currentMonthName} {currentYear} ({totalMonthHours} Hours &bull; Cutoff Day {currentDay})
                    </span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      Target 99.5%
                    </span>
                  </div>

                  {/* Dual Proportional Bar */}
                  <div className="relative h-2 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden flex border border-slate-300 dark:border-slate-800">
                    <div
                      style={{ width: `${uptimePctNum}%` }}
                      className="h-full bg-[#00c875]"
                      title={`Uptime: ${uptimeDurationText} (${uptimePctNum}%)`}
                    />
                    <div
                      style={{ width: `${downtimePctNum}%` }}
                      className="h-full bg-[#e2445c]"
                      title={`Downtime: ${downtimeDurationText} (${downtimePctNum}%)`}
                    />
                    <div
                      style={{ left: "99.5%" }}
                      className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-10"
                      title="Target SLA 99.5%"
                    />
                  </div>

                  {/* Total Nyala & Total Mati Chips */}
                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    <div className="bg-white dark:bg-[#070e1c] px-2 py-1 rounded border border-slate-200 dark:border-slate-800/80 shadow-xs">
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                        <span className="size-1.5 rounded-full bg-[#00c875]" />
                        Total Uptime
                      </div>
                      <div className="text-[11px] font-bold text-[#00a862] dark:text-[#00c875] font-mono mt-0.5">
                        {uptimeDurationText}{" "}
                        <span className="text-[9px] font-normal text-slate-500 dark:text-slate-400">
                          ({uptimePctNum}%)
                        </span>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-[#070e1c] px-2 py-1 rounded border border-slate-200 dark:border-slate-800/80 shadow-xs">
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                        <span className="size-1.5 rounded-full bg-[#e2445c]" />
                        Total Downtime
                      </div>
                      <div className="text-[11px] font-bold text-[#e2445c] font-mono mt-0.5">
                        {downtimeDurationText}{" "}
                        <span className="text-[9px] font-normal text-slate-500 dark:text-slate-400">
                          ({downtimePctNum}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SLA Target & Limit Metrics */}
                  <div className="text-[10px] space-y-1 text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/60 pt-1.5 mt-2">
                    <div className="flex items-center justify-between">
                      <span>Target Uptime (99.5%):</span>
                      <span className="text-slate-800 dark:text-slate-200 font-mono font-medium">
                        Min. {slaTargetHoursText}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Downtime Tolerance:</span>
                      <span className="text-slate-700 dark:text-slate-300 font-mono">
                        Max. {slaDowntimeAllowedText}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>This Month Status:</span>
                      <span
                        className={`font-semibold font-mono ${
                          isSLAMet
                            ? "text-[#00a862] dark:text-[#00c875]"
                            : "text-[#e2445c]"
                        }`}
                      >
                        {isSLAMet
                          ? `Achieved (+${slaDiffPct}%)`
                          : `Over: +${formatHoursMinutes(downtimeDiffHours)}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Link to Uptime Detail View */}
                <button
                  type="button"
                  onClick={() => setActiveTab("Uptime & Downtime")}
                  className="w-full mt-2 py-1 px-2 bg-blue-500/10 hover:bg-blue-500/20 active:scale-[0.99] border border-blue-500/25 hover:border-blue-500/40 rounded-lg text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs group"
                >
                  <span>
                    Downtime Incident Details ({downtimeEvents.length})
                  </span>
                  <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* BARIS 2: 3 Kolom Rata Semua (CPU Usage, RAM Usage, SD Card Usage) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch">
              {/* Kolom 1 dari 3: CPU Usage */}
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium text-xs">
                  <Cpu className="size-3.5 text-emerald-500 dark:text-emerald-400" />
                  <span className="font-semibold">CPU Usage</span>
                </div>

                <CircularGauge percent={d.cpu_percent} strokeColor="#00c875" />

                <div>
                  <SparklineWave
                    data={d.cpu_sparkline}
                    color="#00c875"
                    id="cpu"
                  />
                  <div className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium mt-1">
                    {d.cpu_max} | {d.cpu_min}
                  </div>
                </div>
              </div>

              {/* Kolom 2 dari 3: RAM Usage */}
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium text-xs">
                  <Database className="size-3.5 text-[#0073ea]" />
                  <span className="font-semibold">RAM Usage</span>
                </div>

                <CircularGauge percent={d.ram_percent} strokeColor="#0073ea" />

                <div>
                  <SparklineWave
                    data={d.ram_sparkline}
                    color="#0073ea"
                    id="ram"
                  />
                  <div className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium mt-1">
                    {d.ram_max} | {d.ram_min}
                  </div>
                </div>
              </div>

              {/* Kolom 3 dari 3: Storage Usage */}
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium text-xs">
                  <HardDrive className="size-3.5 text-purple-500 dark:text-purple-400" />
                  <span className="font-semibold">Storage Usage</span>
                </div>

                <CircularGauge
                  percent={d.sd_percent}
                  strokeColor="#a855f7"
                  sublabel={`${d.sd_used_gb} GB / ${d.sd_total_gb} GB`}
                />

                <div>
                  <SparklineWave
                    data={d.sd_sparkline}
                    color="#a855f7"
                    id="sd"
                  />
                  <div className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium mt-1">
                    {d.sd_used_gb} GB used of {d.sd_total_gb} GB
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: DAILY UPTIME & DOWNTIME (FROM SYSTEM LOGS) */}
        {/* ========================================================= */}
        {activeTab === "Uptime & Downtime" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header: Title, Description, and Back Button */}
            <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Clock className="size-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Daily Uptime & Downtime Analysis – Gateway {d.id}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      dailyUptime.is_sla_met
                        ? "bg-emerald-500/15 text-[#00a862] dark:text-[#00c875] border-emerald-500/30"
                        : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${dailyUptime.is_sla_met ? "bg-[#00c875]" : "bg-rose-500 animate-pulse"}`}
                    />
                    {dailyUptime.is_sla_met
                      ? `SLA 99.5% Achieved (${dailyUptime.sla_diff_pct}%)`
                      : `SLA 99.5% Breach (${dailyUptime.sla_diff_pct}%)`}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Observation Date:{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {dailyUptime.date_str}
                  </strong>{" "}
                  &bull; Total Period:{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {dailyUptime.total_period_str}
                  </strong>{" "}
                  &bull; Calculated per-minute from gateway system logs ([MQTT OK] heartbeats vs gaps)
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("Overview")}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
              >
                <span>&larr; Back to Overview</span>
              </button>
            </div>

            {/* 4 Scorecard KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Target SLA 99.5% */}
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Contract SLA Target
                  </span>
                  <div className="size-6 rounded-md bg-yellow-500/15 text-amber-600 dark:text-yellow-400 flex items-center justify-center">
                    <CheckCheck className="size-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {dailyUptime.sla_target_pct}%
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Minimum Uptime:</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-mono">
                        {dailyUptime.sla_min_uptime_text}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Downtime Limit:</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-mono">
                        {dailyUptime.sla_max_down_text}
                      </strong>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/50 pt-1.5">
                  Formula: {dailyUptime.total_period_str} &times; 99.5% = {dailyUptime.sla_min_uptime_text}
                </div>
              </div>

              {/* Card 2: Accumulated Daily Uptime */}
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Daily Uptime
                  </span>
                  <div className="size-6 rounded-md bg-emerald-500/15 text-[#00a862] dark:text-[#00c875] flex items-center justify-center">
                    <CheckCircle2 className="size-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#00a862] dark:text-[#00c875] tracking-tight font-mono">
                    {dailyUptime.uptime_text}
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                    {dailyUptime.uptime_pct}% active today
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/50 pt-1.5 flex items-center justify-between">
                  <span>Heartbeat source:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-mono">
                    {dailyUptime.uptime_minutes} MQTT OK beats
                  </span>
                </div>
              </div>

              {/* Card 3: Accumulated Daily Downtime */}
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Daily Downtime
                  </span>
                  <div className="size-6 rounded-md bg-rose-500/15 text-[#e2445c] flex items-center justify-center">
                    <Power className="size-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#e2445c] tracking-tight font-mono">
                    {dailyUptime.downtime_text}
                  </div>
                  <div className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1">
                    {dailyUptime.downtime_pct}% downtime today
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/50 pt-1.5 flex items-center justify-between">
                  <span>Downtime outages:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-mono font-semibold">
                    {dailyUptime.incidents.length} incident(s)
                  </span>
                </div>
              </div>

              {/* Card 4: SLA Realization & Deviation */}
              <div
                className={`bg-slate-50/70 dark:bg-[#0a1226] border rounded-xl p-4 flex flex-col justify-between space-y-2 shadow-xs ${
                  dailyUptime.is_sla_met ? "border-emerald-500/40" : "border-rose-500/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    SLA 99.5% Daily Status
                  </span>
                  <div
                    className={`size-6 rounded-md flex items-center justify-center ${
                      dailyUptime.is_sla_met
                        ? "bg-emerald-500/15 text-[#00a862] dark:text-[#00c875]"
                        : "bg-rose-500/15 text-[#e2445c]"
                    }`}
                  >
                    {dailyUptime.is_sla_met ? (
                      <CheckCircle2 className="size-3.5" />
                    ) : (
                      <AlertTriangle className="size-3.5" />
                    )}
                  </div>
                </div>
                <div>
                  <div
                    className={`text-2xl font-bold tracking-tight font-mono ${
                      dailyUptime.is_sla_met
                        ? "text-[#00a862] dark:text-[#00c875]"
                        : "text-[#e2445c]"
                    }`}
                  >
                    {dailyUptime.sla_diff_pct}%
                  </div>
                  <div
                    className={`text-xs font-semibold mt-1 ${
                      dailyUptime.is_sla_met ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {dailyUptime.is_sla_met ? "SLA Target Achieved" : "SLA Target Breached"}
                  </div>
                </div>
                <div
                  className="text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/50 pt-1.5 truncate"
                  title={dailyUptime.tolerance_text}
                >
                  {dailyUptime.tolerance_text}
                </div>
              </div>
            </div>

            {/* Proportional Dual Bar */}
            <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Activity className="size-3.5 text-blue-600 dark:text-blue-400" />
                  Daily Uptime vs Downtime Ratio ({dailyUptime.total_period_str})
                </span>
                <span className="text-amber-600 dark:text-yellow-400 font-mono text-[11px]">
                  Daily SLA Target: 99.5% (Min. {dailyUptime.sla_min_uptime_text})
                </span>
              </div>

              <div className="relative h-4 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden flex border border-slate-300 dark:border-slate-800">
                <div
                  style={{ width: `${dailyUptime.uptime_pct}%` }}
                  className="h-full bg-linear-to-r from-emerald-600 to-[#00c875] transition-all duration-500"
                  title={`Uptime: ${dailyUptime.uptime_text} (${dailyUptime.uptime_pct}%)`}
                />
                <div
                  style={{ width: `${dailyUptime.downtime_pct}%` }}
                  className="h-full bg-linear-to-r from-rose-500 to-[#e2445c] transition-all duration-500"
                  title={`Downtime: ${dailyUptime.downtime_text} (${dailyUptime.downtime_pct}%)`}
                />
                <div
                  style={{ left: "99.5%" }}
                  className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-10 shadow-[0_0_8px_rgba(250,204,21,1)]"
                  title="Target SLA 99.5%"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#00c875]" />
                    Total Uptime:{" "}
                    <strong className="text-slate-900 dark:text-white font-mono">
                      {dailyUptime.uptime_text}
                    </strong>{" "}
                    ({dailyUptime.uptime_pct}%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#e2445c]" />
                    Total Downtime:{" "}
                    <strong className="text-slate-900 dark:text-white font-mono">
                      {dailyUptime.downtime_text}
                    </strong>{" "}
                    ({dailyUptime.downtime_pct}%)
                  </span>
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Daily Downtime Tolerance:{" "}
                  <strong className="text-amber-600 dark:text-yellow-400 font-mono">
                    {dailyUptime.sla_max_down_text}
                  </strong>{" "}
                  (0.5%)
                </div>
              </div>
            </div>

            {/* Table: Daily Downtime Incident Logs */}
            <div className="bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-xs">
              <div className="p-3.5 border-b border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-[#070e1c]">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Power className="size-3.5 text-rose-500" />
                    Daily Downtime Incident Logs & Telemetry Gaps
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Calculated directly from system logs where [MQTT OK] was interrupted or telemetry stopped
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 font-mono shadow-2xs">
                  {dailyUptime.incidents.length} Outages Recorded
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-100 dark:bg-[#081022] text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Downtime Start</th>
                      <th className="py-2.5 px-3">Restored Time</th>
                      <th className="py-2.5 px-3">Duration</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Root Cause</th>
                      <th className="py-2.5 px-3">SLA Impact</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
                    {dailyUptime.incidents.length > 0 ? (
                      dailyUptime.incidents.map((evt) => (
                        <tr
                          key={evt.no}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400">
                            {evt.no}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {evt.start_time}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {evt.end_time}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#e2445c] whitespace-nowrap">
                            {formatDurationEn(evt.duration)}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60">
                              {evt.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 min-w-50">
                            {formatIncidentEn(evt.reason || evt.title)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-rose-600 dark:text-rose-400 whitespace-nowrap">
                            -{evt.sla_impact_pct}%
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#00a862] dark:text-[#00c875]">
                              <span className="size-1.5 rounded-full bg-[#00c875]" />
                              {evt.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                          No downtime incidents or telemetry gaps recorded today. Gateway running with 100% normal uptime.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {dailyUptime.incidents.length > 0 && (
                    <tfoot className="bg-slate-100 dark:bg-[#081022] font-semibold text-slate-800 dark:text-slate-200 border-t-2 border-slate-300 dark:border-slate-700/80">
                      <tr>
                        <td
                          colSpan={3}
                          className="py-2.5 px-3 text-right text-xs uppercase text-slate-500 dark:text-slate-400 tracking-wider"
                        >
                          Total Daily Summary ({dailyUptime.total_period_str}):
                        </td>
                        <td className="py-2.5 px-3 font-mono text-sm font-bold text-[#e2445c]">
                          {dailyUptime.downtime_text}
                        </td>
                        <td
                          colSpan={4}
                          className="py-2.5 px-3 text-xs text-slate-600 dark:text-slate-300"
                        >
                          Total Daily Uptime:{" "}
                          <strong className="text-[#00a862] dark:text-[#00c875] font-mono">
                            {dailyUptime.uptime_text} ({dailyUptime.uptime_pct}%)
                          </strong>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* AIOps Summary Box */}
            <div className="bg-linear-to-r from-blue-50 via-indigo-50/50 to-slate-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-slate-900 border border-blue-200 dark:border-blue-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start gap-3 shadow-xs">
              <div className="size-8 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Info className="size-4" />
              </div>
              <div className="text-xs space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  Daily Uptime & SLA 99.5% Summary
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  Based on the daily <strong>99.5%</strong> SLA standard, the gateway
                  must be active for a minimum of{" "}
                  <strong>{dailyUptime.sla_min_uptime_text}</strong> with a maximum downtime
                  tolerance of <strong>{dailyUptime.sla_max_down_text}</strong> out of{" "}
                  <strong>{dailyUptime.total_period_str}</strong> today.
                  Gateway <strong>{d.id}</strong> recorded total daily downtime
                  of <strong>{dailyUptime.downtime_text}</strong>,
                  resulting in a daily uptime performance of{" "}
                  <strong className={dailyUptime.is_sla_met ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                    {dailyUptime.uptime_pct}% ({dailyUptime.is_sla_met ? "SLA Achieved" : "SLA Breach"})
                  </strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: CPU & RAM */}
        {/* ========================================================= */}
        {activeTab === "CPU & RAM" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="size-4 text-emerald-500 dark:text-emerald-400" />
                Detailed CPU & RAM Memory Telemetry
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab("Overview")}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-xs cursor-pointer"
              >
                &larr; Overview
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-white text-xs">
                    CPU Utilization
                  </span>
                  <span className="text-[#00a862] dark:text-emerald-400 font-mono font-bold text-sm">
                    {d.cpu_percent}%
                  </span>
                </div>
                <CircularGauge percent={d.cpu_percent} strokeColor="#00c875" />
                <SparklineWave
                  data={d.cpu_sparkline}
                  color="#00c875"
                  id="cpu-detail"
                />
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 border-t border-slate-200 dark:border-slate-800/60 pt-2">
                  <div className="flex justify-between">
                    <span>Architecture:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      ARMv8 Cortex-A53 4-Core
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Peak Max:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {d.cpu_max}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Idle Min:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {d.cpu_min}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-white text-xs">
                    RAM Memory Usage
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-mono font-bold text-sm">
                    {d.ram_percent}%
                  </span>
                </div>
                <CircularGauge percent={d.ram_percent} strokeColor="#0073ea" />
                <SparklineWave
                  data={d.ram_sparkline}
                  color="#0073ea"
                  id="ram-detail"
                />
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 border-t border-slate-200 dark:border-slate-800/60 pt-2">
                  <div className="flex justify-between">
                    <span>Total Capacity:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {d.ram_total_gb ? `${d.ram_total_gb} GB` : "1 GB"} (SBC RAM)
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Used:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {d.ram_used_gb !== undefined ? `${d.ram_used_gb} GB` : `${((d.ram_total_gb || 1) * (d.ram_percent / 100)).toFixed(1)} GB`}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Available:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {d.ram_free_gb !== undefined ? `${d.ram_free_gb} GB` : `${((d.ram_total_gb || 1) * (1 - d.ram_percent / 100)).toFixed(1)} GB`}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: STORAGE */}
        {/* ========================================================= */}
        {activeTab === "Storage" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HardDrive className="size-4 text-purple-600 dark:text-purple-400" />
                Storage Telemetry & Health Check
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab("Overview")}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-xs cursor-pointer"
              >
                &larr; Overview
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-3 shadow-xs">
                <span className="font-bold text-slate-900 dark:text-white text-xs">
                  Storage Capacity
                </span>
                <CircularGauge
                  percent={d.sd_percent}
                  strokeColor="#a855f7"
                  sublabel={`${d.sd_used_gb} GB / ${d.sd_total_gb} GB`}
                />
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 border-t border-slate-200 dark:border-slate-800/60 pt-2">
                  <div className="flex justify-between">
                    <span>Total Storage:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {d.sd_total_gb} GB Flash Storage
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Used:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {d.sd_used_gb} GB ({d.sd_percent}%)
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Free Space:</span>
                    <strong className="text-[#00a862] dark:text-emerald-400">
                      {Math.max(0, d.sd_total_gb - d.sd_used_gb)} GB Free
                    </strong>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-3 shadow-xs">
                <span className="font-bold text-slate-900 dark:text-white text-xs">
                  Health Diagnostic Details
                </span>
                <div className="space-y-2 text-xs pt-1">
                  <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      Overall Health:
                    </span>
                    <span className="text-[#00a862] dark:text-emerald-400 font-bold">
                      {d.sd_health.status} {d.sd_health.health_percent ? `(${d.sd_health.health_percent}%)` : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      Bad Sectors:
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono">
                      {d.sd_health.bad_sector}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      Wear Leveling:
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono">
                      {d.sd_health.wear_level}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      Operating Temperature:
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono">
                      {d.sd_health.temperature}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      I/O Error Count:
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono">
                      {d.sd_health.io_error}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: TEMPERATURE */}
        {/* ========================================================= */}
        {activeTab === "Temperature" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Thermometer className="size-4 text-amber-500 dark:text-amber-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  CPU Temperature
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("Overview")}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-xs cursor-pointer"
              >
                &larr; Overview
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 text-center space-y-1 shadow-xs">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  CPU Temperature
                </span>
                <div className="text-3xl font-bold text-[#00a862] dark:text-emerald-400 font-mono">
                  {d.sd_health.temperature}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Normal (&lt; 70°C)
                </span>
              </div>
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 text-center space-y-1 shadow-xs">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Warning Threshold
                </span>
                <div className="text-3xl font-bold text-amber-600 dark:text-yellow-400 font-mono">
                  70°C
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  High Temperature Warning
                </span>
              </div>
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 text-center space-y-1 shadow-xs">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Critical Threshold
                </span>
                <div className="text-3xl font-bold text-[#e2445c] font-mono">
                  85°C
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Critical / Overheat
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: EVENT LOG */}
        {/* ========================================================= */}
        {activeTab === "Event Log" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Activity className="size-3.5 text-purple-500" />
                    System & Hardware Event History Log
                  </div>
                  <span className="text-[10px] font-semibold bg-blue-500/10 text-[#0073ea] dark:text-[#00d2ff] border border-blue-500/20 px-2 py-0.5 rounded-full">
                    Today Only (
                    {new Date().toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    )
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">
                    Total {(d.events && d.events.length) || 0} Events Today
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("Overview")}
                    className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-xs cursor-pointer ml-2"
                  >
                    &larr; Overview
                  </button>
                </div>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
                {sortedEvents.length > 0 ? (
                  sortedEvents.map((evt, idx) => (
                    <div
                      key={evt.id || idx}
                      className="py-2.5 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`size-2 rounded-full shrink-0 ${
                            evt.status === "error"
                              ? "bg-rose-500"
                              : evt.status === "warning"
                                ? "bg-amber-500"
                                : evt.status === "info"
                                  ? "bg-sky-500"
                                  : "bg-emerald-500"
                          }`}
                        />
                        <span className="text-slate-800 dark:text-slate-200 font-medium truncate">
                          {formatIncidentEn(evt.title)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {evt.duration && evt.duration !== "-" && evt.duration !== "0m" && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            {formatDurationEn(evt.duration)}
                          </span>
                        )}
                        <span className="text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {evt.time && evt.time.includes("WIB") ? evt.time : `${evt.time} WIB`}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-slate-400 text-xs">
                    No hardware or system events recorded for this gateway today.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
