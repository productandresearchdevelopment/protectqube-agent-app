"use client";

import React, { useState } from "react";
import {
  Server,
  Radio,
  Wifi,
  Thermometer,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  X,
} from "lucide-react";
import {
  useCellularGatewayDetail,
  ICellularGatewayDetailData,
} from "@/store/api/monitoring";

interface CellularDeviceDetailCardProps {
  gatewayId: string | null;
  onClose?: () => void;
}

// Mini Circular Donut Gauge Component
const CircularGauge = ({
  percent,
  strokeColor,
  centerContent,
}: {
  percent: number;
  strokeColor: string;
  centerContent: React.ReactNode;
}) => {
  const radius = 30;
  const strokeWidth = 6.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  return (
    <div className="relative w-18 h-18 flex items-center justify-center shrink-0">
      <svg className="w-18 h-18 -rotate-90 transform" viewBox="0 0 76 76">
        {/* Background Track */}
        <circle
          cx="38"
          cy="38"
          r={radius}
          className="stroke-slate-100 dark:stroke-slate-800/80"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Stroke */}
        <circle
          cx="38"
          cy="38"
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
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {centerContent}
      </div>
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
  const max = Math.max(...points);
  const min = Math.min(...points);
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
      <ellipse cx="80" cy="98" rx="65" ry="10" fill="black" fillOpacity="0.35" />
      <path d="M18 64 L78 96 L144 64 L84 34 Z" fill={rightFace} stroke={strokeCol} strokeWidth="1" />
      <path d="M18 42 L78 74 L78 94 L18 62 Z" fill={leftFace} stroke={strokeCol} strokeWidth="1" />
      <path d="M78 74 L144 42 L144 62 L78 94 Z" fill={rightFace} stroke={strokeCol} strokeWidth="1" />
      <path d="M18 42 L78 12 L144 42 L84 74 Z" fill={topColor} stroke={strokeCol} strokeWidth="1" />
      <path d="M20 42 L78 14 L142 42 L84 72 Z" fill={bevelColor} />

      {/* Ports */}
      <path d="M25 54 L32 58 L32 65 L25 61 Z" fill="#090d16" stroke="#475569" strokeWidth="0.8" />
      <circle cx="28" cy="53" r="1" fill="#f59e0b" />
      <path d="M38 61 L45 65 L45 72 L38 68 Z" fill="#090d16" stroke="#475569" strokeWidth="0.8" />
      <circle cx="41" cy="60" r="1" fill="#10b981" />
      <path d="M51 68 L58 72 L58 79 L51 75 Z" fill="#090d16" stroke="#475569" strokeWidth="0.8" />
      <circle cx="54" cy="67" r="1" fill="#10b981" />
      <path d="M64 75 L71 79 L71 86 L64 82 Z" fill="#090d16" stroke="#475569" strokeWidth="0.8" />
      <circle cx="67" cy="74" r="1" fill="#10b981" />

      <path d="M88 80 L96 76 L96 70 L88 74 Z" fill="#090d16" stroke="#eab308" strokeWidth="0.8" />
      <path d="M104 72 L112 68 L112 62 L104 66 Z" fill="#090d16" stroke="#eab308" strokeWidth="0.8" />
      <path d="M120 64 L128 60 L128 54 L120 58 Z" fill="#090d16" stroke="#eab308" strokeWidth="0.8" />
      <rect x="74" y="38" width="10" height="3" transform="rotate(-26 74 38)" fill="#38bdf8" fillOpacity="0.4" />
    </svg>
  );
};

export const CellularDeviceDetailCard: React.FC<CellularDeviceDetailCardProps> = ({
  gatewayId,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    | "Ringkasan"
    | "CPU – Modem"
    | "Modem & SIM"
    | "Signal & Network"
    | "Temperatur"
    | "Event Log"
  >("Ringkasan");

  // Fetch telemetry detail for selected gateway from FastAPI
  const { data } = useCellularGatewayDetail(gatewayId);

  if (!gatewayId) return null;

  // Fallback defaults matching screenshot
  const d: ICellularGatewayDetailData = data || {
    id: gatewayId,
    location: "Alfa H Sapri Pondok Aren",
    type: "SmartBox Hitam",
    model: "SmartBox Hitam (Raspberry Pi 3B+)",
    modem: "Quectel EC200E",
    provider: "Telkomsel",
    sim_card: "Aktif",
    ip_address: "10.10.72.15",
    last_update: "26 Oct 2026 14:32:10",
    service_status: "Running",
    cpu_modem: {
      status: "Connected",
      message: "CPU dapat berkomunikasi dengan modem (driver OK)",
      port: "/dev/ttyUSB2",
      baudrate: 115200,
      driver: "qmi_wwan",
      last_check: "26 Oct 2026 14:32:05",
    },
    signal_strength: {
      rsrp: -78,
      unit: "dBm",
      max_rsrp: "Max -62 dBm",
      min_rsrp: "Min -118 dBm",
      avg_rsrp: "Avg -85 dBm",
      sparkline: [-85, -82, -80, -78, -79, -77, -78],
    },
    network_sim: {
      network_type: "4G",
      network_sub: "(LTE)",
      operator: "Telkomsel",
      sim_status: "Aktif",
      imsi: "510100123456789",
      iccid: "8962101234567890 0123",
      data_upload: "1.2 GB",
      data_download: "3.8 GB",
      roaming: "Tidak",
    },
    modem_temperature: {
      temperature: 45,
      unit: "°C",
      max_temp: "Max 62°C",
      min_temp: "Min 28°C",
      avg_temp: "Avg 42°C",
      sparkline: [38, 40, 42, 45, 44, 46, 45],
    },
  };

  const tabs: Array<
    | "Ringkasan"
    | "CPU – Modem"
    | "Modem & SIM"
    | "Signal & Network"
    | "Temperatur"
    | "Event Log"
  > = [
    "Ringkasan",
    "CPU – Modem",
    "Modem & SIM",
    "Signal & Network",
    "Temperatur",
    "Event Log",
  ];

  const isWhiteDevice = d.type.includes("Putih");

  // Calculate percentage for RSRP donut (-140 dBm to -44 dBm scale)
  const rsrpPercent = Math.min(
    100,
    Math.max(10, Math.round(((d.signal_strength.rsrp - -140) / (-44 - -140)) * 100))
  );
  // Calculate percentage for temperature donut (0°C to 100°C)
  const tempPercent = Math.min(100, Math.max(5, d.modem_temperature.temperature));

  // Helper for CPU - Modem status styling & icon
  const isCpuConnected = d.cpu_modem.status === "Connected";
  const cpuStatusColor = isCpuConnected
    ? "text-emerald-400"
    : d.cpu_modem.status === "No Response"
    ? "text-rose-500"
    : "text-amber-400";
  const CpuIcon = isCpuConnected
    ? CheckCircle2
    : d.cpu_modem.status === "No Response"
    ? AlertTriangle
    : AlertCircle;

  return (
    <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-300">
      {/* Top Header Bar */}
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800/90 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 dark:bg-[#0a1224]">
        {/* Left: Device Title & Status Badge */}
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Server className="size-4" />
          </div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Device Detail – {d.id}
            </h2>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                d.service_status === "Running"
                  ? "bg-emerald-500/20 text-[#00a862] dark:text-[#00c875] border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
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

      {/* Main Body (User Structured: 2 Kolom Baris 1 -> 3 Kolom Rata Baris 2) */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* ========================================================= */}
        {/* BARIS 1: 2 Kolom (9 Kolom Profile & Specs + 3 Kolom CPU-Modem Communication) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 items-stretch">
          {/* Kolom 1 (9 col): Device Profile & Specs (Spacious, No Text Overflow!) */}
          <div className="xl:col-span-9 col-span-12 bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex flex-col md:flex-row gap-5 items-center md:items-start">
              {/* 3D SmartBox Illustration */}
              <div className="flex flex-col items-center shrink-0">
                <SmartBoxIllustration isWhite={isWhiteDevice} />
                <div className="mt-2 text-center">
                  <div className="text-[10px] text-slate-500 font-mono">v1.0.0</div>
                  <div className="text-[11px] font-bold text-[#0073ea] dark:text-[#00d2ff]">
                    Protect<span className="text-[#ff7a59]">Q</span>ube AI Ops
                  </div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight">
                    SmartBox Fleet
                  </div>
                </div>
              </div>

              {/* Title & Specs Grid (2 Wide Columns so nothing clips!) */}
              <div className="flex-1 min-w-0 space-y-3 w-full">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">
                    {d.id}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {d.location}
                  </p>
                </div>

                {/* 2-Column Specs Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs font-mono text-slate-700 dark:text-slate-300">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1">
                      <span className="text-slate-500 dark:text-slate-400 font-sans">Tipe</span>
                      <span className="text-slate-800 dark:text-slate-200 font-sans font-medium text-right truncate">
                        {d.model}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1">
                      <span className="text-slate-500 dark:text-slate-400 font-sans">Modem</span>
                      <span className="text-slate-800 dark:text-slate-200 font-sans font-medium text-right truncate">
                        {d.modem}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1">
                      <span className="text-slate-500 dark:text-slate-400 font-sans">Provider</span>
                      <span className="text-slate-800 dark:text-slate-200 font-sans text-right">
                        {d.provider}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1">
                      <span className="text-slate-500 dark:text-slate-400 font-sans">SIM Card</span>
                      <span className="text-[#00a862] dark:text-emerald-400 font-sans font-medium text-right">
                        {d.sim_card}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1">
                      <span className="text-slate-500 dark:text-slate-400 font-sans">IP Address</span>
                      <span className="text-slate-800 dark:text-slate-200 font-mono text-right">
                        {d.ip_address}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1">
                      <span className="text-slate-500 dark:text-slate-400 font-sans">Last Update</span>
                      <span className="text-slate-800 dark:text-slate-200 font-sans text-right">
                        {d.last_update}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1">
                      <span className="text-slate-500 dark:text-slate-400 font-sans">Service Status</span>
                      <span className="flex items-center gap-1.5 font-bold font-sans">
                        <span
                          className={`size-2 rounded-full ${
                            d.service_status === "Running"
                              ? "bg-emerald-400 animate-pulse"
                              : "bg-amber-400"
                          }`}
                        />
                        <span
                          className={
                            d.service_status === "Running"
                              ? "text-[#00a862] dark:text-emerald-400"
                              : "text-amber-600 dark:text-amber-400"
                          }
                        >
                          {d.service_status}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Kolom 2 (3 col): CPU – Modem Communication Card */}
          <div className="xl:col-span-3 col-span-12 bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium text-xs">
                <Server className="size-3.5 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">CPU – Modem Communication</span>
              </div>

              <div className="my-3">
                <div className="flex items-center gap-2">
                  <CpuIcon className={`size-6 ${cpuStatusColor}`} />
                  <span className={`text-lg font-bold tracking-tight ${cpuStatusColor}`}>
                    {d.cpu_modem.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-1.5">
                  {d.cpu_modem.message}
                </p>
              </div>
            </div>

            <div className="text-[11px] space-y-1.5 text-slate-700 dark:text-slate-300 font-mono border-t border-slate-200 dark:border-slate-800/60 pt-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-sans">Port:</span>
                <span className="text-slate-800 dark:text-slate-200 font-mono">{d.cpu_modem.port}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-sans">Baudrate:</span>
                <span className="text-slate-800 dark:text-slate-200 font-mono">{d.cpu_modem.baudrate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-sans">Driver:</span>
                <span className="text-slate-800 dark:text-slate-200 font-mono">{d.cpu_modem.driver}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-sans">Last Check:</span>
                <span className="text-slate-800 dark:text-slate-200 font-mono">{d.cpu_modem.last_check}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BARIS 2: 3 Kolom Rata Semua (Signal Strength, Network & SIM, Modem Temperature) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch">
          {/* Kolom 1 dari 3: Signal Strength (RSRP) */}
          <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium text-xs">
              <Radio className="size-3.5 text-emerald-500 dark:text-emerald-400" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Signal Strength (RSRP)</span>
            </div>

            <div className="flex items-center justify-around gap-3 my-3">
              <CircularGauge
                percent={rsrpPercent}
                strokeColor="#00c875"
                centerContent={
                  <div className="text-center">
                    <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      {d.signal_strength.rsrp}
                    </span>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 font-mono -mt-0.5">
                      {d.signal_strength.unit}
                    </div>
                  </div>
                }
              />

              <div className="text-xs space-y-1.5 font-medium text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-800 dark:text-slate-200">{d.signal_strength.max_rsrp}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-rose-500" />
                  <span className="text-slate-700 dark:text-slate-300">{d.signal_strength.min_rsrp}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-cyan-500 dark:bg-cyan-400" />
                  <span className="text-slate-700 dark:text-slate-300">{d.signal_strength.avg_rsrp}</span>
                </div>
              </div>
            </div>

            <div>
              <SparklineWave
                data={d.signal_strength.sparkline}
                color="#00c875"
                id="rsrp"
              />
            </div>
          </div>

          {/* Kolom 2 dari 3: Network & SIM */}
          <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium text-xs">
              <Wifi className="size-3.5 text-[#0073ea]" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Network & SIM</span>
            </div>

            <div className="flex items-center justify-around gap-3 my-2">
              <CircularGauge
                percent={85}
                strokeColor="#0073ea"
                centerContent={
                  <div className="text-center">
                    <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      {d.network_sim.network_type}
                    </span>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 font-mono -mt-0.5">
                      {d.network_sim.network_sub}
                    </div>
                  </div>
                }
              />

              <div className="text-xs space-y-1 font-mono text-slate-700 dark:text-slate-300 flex-1 min-w-0 max-w-52.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-sans">Operator:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-sans font-medium">{d.network_sim.operator}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-sans">SIM Status:</span>
                  <span className="text-[#00a862] dark:text-emerald-400 font-sans font-semibold">{d.network_sim.sim_status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-sans">IMSI:</span>
                  <span className="text-slate-800 dark:text-slate-200 truncate">{d.network_sim.imsi}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-sans">ICCID:</span>
                  <span className="text-slate-800 dark:text-slate-200 truncate">{d.network_sim.iccid}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800/60 pt-2 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="text-slate-500 dark:text-slate-400">Data Usage (Today):</span>
                <span className="font-mono flex items-center gap-1.5">
                  <span className="text-[#00a862] dark:text-emerald-400 font-semibold">
                    {d.network_sim.data_upload} (↑)
                  </span>
                  <span className="text-[#e2445c] font-semibold">
                    {d.network_sim.data_download} (↓)
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="text-slate-500 dark:text-slate-400">Roaming:</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">{d.network_sim.roaming}</span>
              </div>
            </div>
          </div>

          {/* Kolom 3 dari 3: Modem Temperature */}
          <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium text-xs">
              <Thermometer className="size-3.5 text-cyan-600 dark:text-cyan-400" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Modem Temperature</span>
            </div>

            <div className="flex items-center justify-around gap-3 my-3">
              <CircularGauge
                percent={tempPercent}
                strokeColor="#00a3ff"
                centerContent={
                  <div className="text-center">
                    <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      {d.modem_temperature.temperature}°C
                    </span>
                  </div>
                }
              />

              <div className="text-xs space-y-1.5 font-medium text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-blue-500" />
                  <span className="text-slate-800 dark:text-slate-200">{d.modem_temperature.max_temp}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-rose-500" />
                  <span className="text-slate-700 dark:text-slate-300">{d.modem_temperature.min_temp}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-cyan-500 dark:bg-cyan-400" />
                  <span className="text-slate-700 dark:text-slate-300">{d.modem_temperature.avg_temp}</span>
                </div>
              </div>
            </div>

            <div>
              <SparklineWave
                data={d.modem_temperature.sparkline}
                color="#00a3ff"
                id="temp"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
