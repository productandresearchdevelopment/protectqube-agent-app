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
  ChevronDown,
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
  Layers,
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
  const points = data && data.length > 0 ? data : [20, 25, 22, 28, 30, 26, 28];
  const max = Math.max(...points, 100);
  const min = Math.min(...points, 0);
  const range = max - min || 1;

  const width = 120;
  const height = 24;

  const coords = points.map((val, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return { x, y };
  });

  const pathD = coords.reduce((acc, curr, idx) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    const prev = coords[idx - 1];
    const cx = (prev.x + curr.x) / 2;
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
            cx={c.x}
            cy={c.y}
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
    | "Ringkasan"
    | "CPU & RAM"
    | "SD Card"
    | "Uptime"
    | "Temperature"
    | "Proses"
    | "Event Log"
  >("Ringkasan");

  // Fetch telemetry detail for selected gateway from FastAPI
  const { data, isLoading } = useGatewayDetail(gatewayId);

  if (!gatewayId) return null;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <div className="size-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Memuat data detail telemetri System Health...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-6 text-center text-slate-500 text-sm">
        Data System Health untuk gateway {gatewayId} tidak ditemukan.
      </div>
    );
  }

  const d: IGatewayDetailData = data;

  const tabs: Array<
    | "Ringkasan"
    | "CPU & RAM"
    | "SD Card"
    | "Uptime"
    | "Temperature"
    | "Proses"
    | "Event Log"
  > = [
    "Ringkasan",
    "CPU & RAM",
    "SD Card",
    "Uptime",
    "Temperature",
    "Proses",
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
      ? `Mati melebihi batas toleransi ${formatHoursMinutes(downtimeDiffHours)}`
      : `Downtime dalam batas toleransi (${formatHoursMinutes(Math.abs(downtimeDiffHours))} sisa)`;

  const downtimeEvents: IDowntimeEvent[] =
    d.downtime_events && d.downtime_events.length > 0
      ? d.downtime_events
      : [
          {
            no: 1,
            start_time: "04 Oct 2026 02:15",
            end_time: "04 Oct 2026 08:30",
            duration: "6h 15m",
            accumulated_hours: "6h 15m",
            category: "Listrik Padam (PLN)",
            reason: "Gangguan suplai daya PLN area Pondok Aren",
            sla_impact_pct: 0.84,
            status: "Resolved",
          },
          {
            no: 2,
            start_time: "12 Oct 2026 11:20",
            end_time: "12 Oct 2026 15:05",
            duration: "3h 45m",
            accumulated_hours: "10h 00m",
            category: "MCB / Power Trip",
            reason: "MCB switch toko trip saat beban puncak",
            sla_impact_pct: 0.5,
            status: "Resolved",
          },
          {
            no: 3,
            start_time: "19 Oct 2026 23:40",
            end_time: "20 Oct 2026 09:10",
            duration: "9h 30m",
            accumulated_hours: "19h 30m",
            category: "Maintenance Gedung",
            reason: "Pemeliharaan panel daya & kelistrikan toko",
            sla_impact_pct: 1.28,
            status: "Resolved",
          },
          {
            no: 4,
            start_time: "27 Oct 2026 14:10",
            end_time: "27 Oct 2026 18:25",
            duration: "4h 15m",
            accumulated_hours: "23h 45m",
            category: "Hard Reboot & OS Recovery",
            reason: "Pemulihan sistem otomatis paska tegangan drop",
            sla_impact_pct: 0.57,
            status: "Resolved",
          },
        ];

  // 31-Day operational calendar data (1-31 Oct 2026)
  const daysInMonth = Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    let isDown = false;
    let downDuration = "";
    let upDuration = "24 Jam";
    let incident = "";

    if (day === 4) {
      isDown = true;
      downDuration = "6h 15m Mati";
      upDuration = "17h 45m Nyala";
      incident = "PLN Outage (02:15 - 08:30)";
    } else if (day === 12) {
      isDown = true;
      downDuration = "3h 45m Mati";
      upDuration = "20h 15m Nyala";
      incident = "MCB Trip (11:20 - 15:05)";
    } else if (day === 19) {
      isDown = true;
      downDuration = "0h 20m Mati";
      upDuration = "23h 40m Nyala";
      incident = "Gedung Maintenance (23:40 - 24:00)";
    } else if (day === 20) {
      isDown = true;
      downDuration = "9h 10m Mati";
      upDuration = "14h 50m Nyala";
      incident = "Gedung Maintenance (00:00 - 09:10)";
    } else if (day === 27) {
      isDown = true;
      downDuration = "4h 15m Mati";
      upDuration = "19h 45m Nyala";
      incident = "Hard Reboot (14:10 - 18:25)";
    }

    return {
      day,
      dateLabel: `${day.toString().padStart(2, "0")} Oct`,
      isDown,
      downDuration,
      upDuration,
      incident,
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
              Device Detail – {d.id}
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

        {/* Right: Remote Action Menu & Close */}
        <div className="flex items-center gap-2">
          <button className="bg-[#0073ea] hover:bg-blue-600 active:scale-95 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer">
            <span>Remote Action</span>
            <ChevronDown className="size-3.5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup Detail"
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
        {activeTab === "Ringkasan" && (
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
                          Tipe
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

              {/* Kolom 2 (col-3): SD Card Health Card */}
              <div className="lg:col-span-3 col-span-12 bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
                <div>
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium text-xs">
                      <ShieldCheck className="size-3.5 text-emerald-500 dark:text-emerald-400" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        SD Card Health
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
                        Kondisi {d.sd_health.status}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate">
                        Suhu {d.sd_health.temperature} &bull; Wear{" "}
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
                      Okt 2026 ({totalMonthHours} Jam)
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
                      title={`Nyala: ${uptimeDurationText} (${uptimePctNum}%)`}
                    />
                    <div
                      style={{ width: `${downtimePctNum}%` }}
                      className="h-full bg-[#e2445c]"
                      title={`Mati: ${downtimeDurationText} (${downtimePctNum}%)`}
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
                        Total Nyala
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
                        Total Mati
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
                      <span>Target Nyala (99.5%):</span>
                      <span className="text-slate-800 dark:text-slate-200 font-mono font-medium">
                        Min. {slaTargetHoursText}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Toleransi Mati:</span>
                      <span className="text-slate-700 dark:text-slate-300 font-mono">
                        Maks. {slaDowntimeAllowedText}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Status Bulan Ini:</span>
                      <span
                        className={`font-semibold font-mono ${
                          isSLAMet
                            ? "text-[#00a862] dark:text-[#00c875]"
                            : "text-[#e2445c]"
                        }`}
                      >
                        {isSLAMet
                          ? `Tercapai (+${slaDiffPct}%)`
                          : `Over: +${formatHoursMinutes(downtimeDiffHours)}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Link to Uptime Detail View */}
                <button
                  type="button"
                  onClick={() => setActiveTab("Uptime")}
                  className="w-full mt-2 py-1 px-2 bg-blue-500/10 hover:bg-blue-500/20 active:scale-[0.99] border border-blue-500/25 hover:border-blue-500/40 rounded-lg text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs group"
                >
                  <span>Rincian Insiden Mati ({downtimeEvents.length})</span>
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

              {/* Kolom 3 dari 3: SD Card Usage */}
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium text-xs">
                  <HardDrive className="size-3.5 text-purple-500 dark:text-purple-400" />
                  <span className="font-semibold">SD Card Usage</span>
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
                    {d.sd_used_gb} GB terpakai dari {d.sd_total_gb} GB
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: UPTIME & SLA 99.5% DETAIL */}
        {/* ========================================================= */}
        {activeTab === "Uptime" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header: Title, Description, and Back Button */}
            <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Clock className="size-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Analisis Uptime & SLA 99.5% – Gateway {d.id}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      isSLAMet
                        ? "bg-emerald-500/15 text-[#00a862] dark:text-[#00c875] border-emerald-500/30"
                        : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${isSLAMet ? "bg-[#00c875]" : "bg-rose-500 animate-pulse"}`}
                    />
                    {isSLAMet
                      ? `SLA 99.5% Tercapai (+${slaDiffPct}%)`
                      : `SLA 99.5% Breach (${slaDiffPct}%)`}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Periode:{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {d.month_period || "01 Oct 2026 - 31 Oct 2026"}
                  </strong>{" "}
                  &bull; Total Periode:{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {totalMonthHours} Jam
                  </strong>{" "}
                  (31 Hari &times; 24 Jam)
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("Ringkasan")}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
              >
                <span>&larr; Kembali ke Ringkasan</span>
              </button>
            </div>

            {/* 4 Scorecard KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Target SLA 99.5% */}
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Target SLA Kontrak
                  </span>
                  <div className="size-6 rounded-md bg-yellow-500/15 text-amber-600 dark:text-yellow-400 flex items-center justify-center">
                    <CheckCheck className="size-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    99.5%
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Minimal Nyala:</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-mono">
                        {slaTargetHoursText}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Toleransi Mati:</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-mono">
                        {slaDowntimeAllowedText}
                      </strong>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/50 pt-1.5">
                  Formula: {totalMonthHours} Jam &times; 99.5% = 740.28 Jam
                </div>
              </div>

              {/* Card 2: Akumulasi Jam Nyala (Uptime) */}
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Akumulasi Jam Nyala
                  </span>
                  <div className="size-6 rounded-md bg-emerald-500/15 text-[#00a862] dark:text-[#00c875] flex items-center justify-center">
                    <CheckCircle2 className="size-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#00a862] dark:text-[#00c875] tracking-tight font-mono">
                    {uptimeDurationText}
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                    {uptimePctNum}% tercapai dari total waktu
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/50 pt-1.5 flex items-center justify-between">
                  <span>Sesi berjalan:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-mono">
                    {d.uptime_days}d {d.uptime_hours}h
                  </span>
                </div>
              </div>

              {/* Card 3: Akumulasi Jam Mati (Downtime) */}
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Akumulasi Jam Mati
                  </span>
                  <div className="size-6 rounded-md bg-rose-500/15 text-[#e2445c] flex items-center justify-center">
                    <Power className="size-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#e2445c] tracking-tight font-mono">
                    {downtimeDurationText}
                  </div>
                  <div className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1">
                    {downtimePctNum}% downtime
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/50 pt-1.5 flex items-center justify-between">
                  <span>Total kejadian:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-mono font-semibold">
                    {downtimeEvents.length} kali mati
                  </span>
                </div>
              </div>

              {/* Card 4: Status Realisasi & Deviasi */}
              <div
                className={`bg-slate-50/70 dark:bg-[#0a1226] border rounded-xl p-4 flex flex-col justify-between space-y-2 shadow-xs ${
                  isSLAMet ? "border-emerald-500/40" : "border-rose-500/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Status SLA 99.5%
                  </span>
                  <div
                    className={`size-6 rounded-md flex items-center justify-center ${
                      isSLAMet
                        ? "bg-emerald-500/15 text-[#00a862] dark:text-[#00c875]"
                        : "bg-rose-500/15 text-[#e2445c]"
                    }`}
                  >
                    {isSLAMet ? (
                      <CheckCircle2 className="size-3.5" />
                    ) : (
                      <AlertTriangle className="size-3.5" />
                    )}
                  </div>
                </div>
                <div>
                  <div
                    className={`text-2xl font-bold tracking-tight font-mono ${
                      isSLAMet
                        ? "text-[#00a862] dark:text-[#00c875]"
                        : "text-[#e2445c]"
                    }`}
                  >
                    {isSLAMet ? `+${slaDiffPct}%` : `${slaDiffPct}%`}
                  </div>
                  <div
                    className={`text-xs font-semibold mt-1 ${isSLAMet ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                  >
                    {isSLAMet
                      ? "Target SLA Tercapai"
                      : "SLA Breach (Tidak Tercapai)"}
                  </div>
                </div>
                <div
                  className="text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/50 pt-1.5 truncate"
                  title={downtimeDiffText}
                >
                  {downtimeDiffText}
                </div>
              </div>
            </div>

            {/* Proportional Dual Bar */}
            <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Activity className="size-3.5 text-blue-600 dark:text-blue-400" />
                  Rasio Akumulasi Nyala vs Mati dalam {totalMonthHours} Jam
                </span>
                <span className="text-amber-600 dark:text-yellow-400 font-mono text-[11px]">
                  Target SLA: 99.5% (Min. {slaTargetHoursText})
                </span>
              </div>

              <div className="relative h-4 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden flex border border-slate-300 dark:border-slate-800">
                <div
                  style={{ width: `${uptimePctNum}%` }}
                  className="h-full bg-linear-to-r from-emerald-600 to-[#00c875] transition-all duration-500"
                  title={`Nyala (Uptime): ${uptimeDurationText} (${uptimePctNum}%)`}
                />
                <div
                  style={{ width: `${downtimePctNum}%` }}
                  className="h-full bg-linear-to-r from-rose-500 to-[#e2445c] transition-all duration-500"
                  title={`Mati (Downtime): ${downtimeDurationText} (${downtimePctNum}%)`}
                />
                <div
                  style={{ left: "99.5%" }}
                  className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-10 shadow-[0_0_8px_rgba(250,204,21,1)]"
                  title="Target SLA 99.5% (Min. 740h 17m)"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#00c875]" />
                    Total Nyala:{" "}
                    <strong className="text-slate-900 dark:text-white font-mono">
                      {uptimeDurationText}
                    </strong>{" "}
                    ({uptimePctNum}%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#e2445c]" />
                    Total Mati:{" "}
                    <strong className="text-slate-900 dark:text-white font-mono">
                      {downtimeDurationText}
                    </strong>{" "}
                    ({downtimePctNum}%)
                  </span>
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Toleransi Mati Maks:{" "}
                  <strong className="text-amber-600 dark:text-yellow-400 font-mono">
                    {slaDowntimeAllowedText}
                  </strong>{" "}
                  (0.5%)
                </div>
              </div>
            </div>

            {/* Visual 31-Day Operational Calendar Strip */}
            <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Calendar className="size-3.5 text-blue-600 dark:text-blue-400" />
                    Kalender Uptime Harian (01 Oct – 31 Oct 2026)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Status operasional per hari dalam bulan ini (31 Hari). Kotak
                    merah menandai hari saat terjadi pemadaman / insiden mati.
                  </p>
                </div>

                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className="size-2.5 rounded-full bg-[#00c875]" />
                    24 Jam Nyala (27 Hari)
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className="size-2.5 rounded-full bg-[#e2445c]" />
                    Ada Insiden Mati (4 Hari)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-7 sm:grid-cols-11 md:grid-cols-16 lg:grid-cols-31 gap-1.5 pt-1">
                {daysInMonth.map((dItem) => (
                  <div
                    key={dItem.day}
                    className={`rounded-lg p-1.5 border flex flex-col items-center justify-between text-center transition-all cursor-default select-none ${
                      dItem.isDown
                        ? "bg-rose-500/15 border-rose-500/40 hover:bg-rose-500/25 shadow-xs"
                        : "bg-emerald-500/10 border-emerald-500/25 hover:bg-emerald-500/20"
                    }`}
                    title={`${dItem.dateLabel}: ${dItem.isDown ? `${dItem.downDuration} (${dItem.incident})` : "24 Jam Penuh Nyala Normal (100% OK)"}`}
                  >
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                      {dItem.day.toString().padStart(2, "0")}
                    </span>
                    <span
                      className={`size-2 rounded-full my-1 ${
                        dItem.isDown
                          ? "bg-[#e2445c] animate-pulse"
                          : "bg-[#00c875]"
                      }`}
                    />
                    <span
                      className={`text-[9px] font-bold font-mono leading-tight ${
                        dItem.isDown
                          ? "text-rose-600 dark:text-rose-300"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {dItem.isDown ? "DOWN" : "OK"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Table: Rincian Log Kejadian Mati & Akumulasi Downtime */}
            <div className="bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-xs">
              <div className="p-3.5 border-b border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-[#070e1c]">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Power className="size-3.5 text-rose-500" />
                    Rincian Log Insiden Mati & Akumulasi Waktu Downtime
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Rekam jejak setiap kali gateway mati/padam, waktu pulih
                    kembali, akumulasi jam mati, dan dampak ke SLA 99.5%
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 font-mono shadow-2xs">
                  {downtimeEvents.length} Insiden Terdata
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-100 dark:bg-[#081022] text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Waktu Mati (Offline)</th>
                      <th className="py-2.5 px-3">Waktu Nyala (Restored)</th>
                      <th className="py-2.5 px-3">Durasi Mati</th>
                      <th className="py-2.5 px-3">Akumulasi Mati</th>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3">Penyebab / Root Cause</th>
                      <th className="py-2.5 px-3">Dampak SLA</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
                    {downtimeEvents.map((evt) => (
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
                          {evt.duration}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-rose-600 dark:text-rose-300 whitespace-nowrap">
                          {evt.accumulated_hours}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60">
                            {evt.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 min-w-50">
                          {evt.reason}
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
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 dark:bg-[#081022] font-semibold text-slate-800 dark:text-slate-200 border-t-2 border-slate-300 dark:border-slate-700/80">
                    <tr>
                      <td
                        colSpan={3}
                        className="py-2.5 px-3 text-right text-xs uppercase text-slate-500 dark:text-slate-400 tracking-wider"
                      >
                        Total Akumulasi Sebulan ({totalMonthHours} Jam):
                      </td>
                      <td className="py-2.5 px-3 font-mono text-sm font-bold text-[#e2445c]">
                        {downtimeDurationText}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs text-rose-600 dark:text-rose-400">
                        {downtimePctNum}%
                      </td>
                      <td
                        colSpan={4}
                        className="py-2.5 px-3 text-xs text-slate-600 dark:text-slate-300"
                      >
                        Total Waktu Nyala:{" "}
                        <strong className="text-[#00a862] dark:text-[#00c875] font-mono">
                          {uptimeDurationText} ({uptimePctNum}%)
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
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
                  Kesimpulan & Analisis Realisasi SLA 99.5%
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  Berdasarkan standar SLA <strong>99.5%</strong>, gateway wajib
                  aktif minimal <strong>{slaTargetHoursText}</strong> dengan
                  batas toleransi mati maksimal{" "}
                  <strong>{slaDowntimeAllowedText}</strong> dari total{" "}
                  <strong>{totalMonthHours} Jam</strong> sebulan. Gateway{" "}
                  <strong>{d.id}</strong> mencatat waktu mati terakumulasi{" "}
                  <strong>{downtimeDurationText}</strong> (melebihi batas
                  toleransi maksimal sebesar{" "}
                  <strong>{formatHoursMinutes(downtimeDiffHours)}</strong>),
                  sehingga realisasi akhir adalah{" "}
                  <strong>{uptimePctNum}% (Status: SLA Breach)</strong>.
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  &bull; Kontribusi downtime terbesar berasal dari pemadaman
                  listrik PLN (6h 15m) dan pemeliharaan panel gedung toko (9h
                  30m) yang menyumbang 66.3% dari total downtime. Gateway
                  SmartBox berhasil melakukan auto-recovery secara mandiri
                  segera setelah suplai daya kembali normal.
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
                Telemetri Terperinci CPU & Memori RAM
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab("Ringkasan")}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-xs cursor-pointer"
              >
                &larr; Ringkasan
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
                    <span>Arsitektur:</span>
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
                    <span>Total Kapasitas:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      8 GB LPDDR4
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Terpakai:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {(8 * (d.ram_percent / 100)).toFixed(1)} GB
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Tersedia:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {(8 * (1 - d.ram_percent / 100)).toFixed(1)} GB
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: SD CARD */}
        {/* ========================================================= */}
        {activeTab === "SD Card" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HardDrive className="size-4 text-purple-600 dark:text-purple-400" />
                Telemetri SD Card Storage & Health Check
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab("Ringkasan")}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-xs cursor-pointer"
              >
                &larr; Ringkasan
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
                      {d.sd_total_gb} GB Class 10 U3
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Terpakai:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {d.sd_used_gb} GB ({d.sd_percent}%)
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Sisa Ruang:</span>
                    <strong className="text-[#00a862] dark:text-emerald-400">
                      {d.sd_total_gb - d.sd_used_gb} GB Bebas
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
                      {d.sd_health.status}
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
        {/* TAB 5: TEMPERATURE */}
        {/* ========================================================= */}
        {activeTab === "Temperature" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Thermometer className="size-4 text-amber-500 dark:text-amber-400" />
                Telemetri Termal & Sensor Suhu
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab("Ringkasan")}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-xs cursor-pointer"
              >
                &larr; Ringkasan
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 text-center space-y-1 shadow-xs">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Suhu Sensor Sekarang
                </span>
                <div className="text-3xl font-bold text-[#00a862] dark:text-emerald-400 font-mono">
                  {d.sd_health.temperature}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Status Termal Normal
                </span>
              </div>
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 text-center space-y-1 shadow-xs">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Batas Threshold Peringatan
                </span>
                <div className="text-3xl font-bold text-amber-600 dark:text-yellow-400 font-mono">
                  70°C
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Peringatan High Temp
                </span>
              </div>
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 text-center space-y-1 shadow-xs">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Thermal Throttling Target
                </span>
                <div className="text-3xl font-bold text-[#e2445c] font-mono">
                  85°C
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Auto Frequency Throttling
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: PROSES */}
        {/* ========================================================= */}
        {activeTab === "Proses" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="size-4 text-blue-600 dark:text-blue-400" />
                Daftar Proses & Service Aktif (Daemon Telemetry)
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab("Ringkasan")}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-xs cursor-pointer"
              >
                &larr; Ringkasan
              </button>
            </div>
            <div className="bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-[#081022] text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">PID</th>
                    <th className="py-2.5 px-3">Nama Service</th>
                    <th className="py-2.5 px-3">CPU %</th>
                    <th className="py-2.5 px-3">RAM Usage</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                      1024
                    </td>
                    <td className="py-2.5 px-3 text-slate-900 dark:text-white font-sans font-medium">
                      pq-aiops-agent.service
                    </td>
                    <td className="py-2.5 px-3 text-[#00a862] dark:text-emerald-400">
                      4.2%
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      128 MB
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="text-[#00a862] dark:text-[#00c875] text-[11px] font-semibold">
                        Active (Running)
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                      1102
                    </td>
                    <td className="py-2.5 px-3 text-slate-900 dark:text-white font-sans font-medium">
                      quectel-cm.service (Cellular)
                    </td>
                    <td className="py-2.5 px-3 text-[#00a862] dark:text-emerald-400">
                      0.8%
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      34 MB
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="text-[#00a862] dark:text-[#00c875] text-[11px] font-semibold">
                        Active (Connected)
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                      1240
                    </td>
                    <td className="py-2.5 px-3 text-slate-900 dark:text-white font-sans font-medium">
                      rtsp-dvr-streamer.service
                    </td>
                    <td className="py-2.5 px-3 text-amber-600 dark:text-amber-400">
                      14.5%
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      256 MB
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="text-[#00a862] dark:text-[#00c875] text-[11px] font-semibold">
                        Active (Streaming)
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                      980
                    </td>
                    <td className="py-2.5 px-3 text-slate-900 dark:text-white font-sans font-medium">
                      mosquitto-client.service
                    </td>
                    <td className="py-2.5 px-3 text-[#00a862] dark:text-emerald-400">
                      0.2%
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      18 MB
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="text-[#00a862] dark:text-[#00c875] text-[11px] font-semibold">
                        Active (Idle)
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: EVENT LOG */}
        {/* ========================================================= */}
        {activeTab === "Event Log" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="size-4 text-purple-600 dark:text-purple-400" />
                System & Hardware Event History Log
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab("Ringkasan")}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-xs cursor-pointer"
              >
                &larr; Ringkasan
              </button>
            </div>
            <div className="bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 space-y-2.5 text-xs shadow-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start justify-between shadow-2xs">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    System Auto-Recovery Complete
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Perangkat pulih otomatis setelah pemadaman daya eksternal
                    toko.
                  </p>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  27 Oct 18:25
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start justify-between shadow-2xs">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    SD Card Health Check Passed
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Integritas filesystem ext4 OK, 0 bad sector, wear level 12%.
                  </p>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  26 Oct 00:00
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start justify-between shadow-2xs">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Memory Pool Reclaimed
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Buffer cache dibersihkan oleh kernel, 1.2 GB memori
                    dibebaskan.
                  </p>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  22 Oct 10:15
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
