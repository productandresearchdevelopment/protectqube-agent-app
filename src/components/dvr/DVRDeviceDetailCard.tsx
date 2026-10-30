"use client";

import React, { useState } from "react";
import {
  Server,
  Video,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Pause,
  Maximize2,
  Film,
  Clock,
  Terminal,
  Activity,
  Wifi,
  Disc,
  Info,
} from "lucide-react";
import {
  useDVRGatewayDetail,
  IDVRGatewayDetailData,
  ICameraChannelPreview,
} from "@/store/api/monitoring";
import { formatToWIB } from "@/utils/common";

interface DVRDeviceDetailCardProps {
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

// Realistic CCTV Stream Viewport Component
const CCTVViewport = ({
  camera,
  onExpand,
}: {
  camera: ICameraChannelPreview;
  onExpand: (camera: ICameraChannelPreview) => void;
}) => {
  const [isPlaying, setIsPlaying] = useState(true);

  return (
    <div className="relative group bg-[#060a14] border border-slate-800 rounded-lg overflow-hidden shadow-md flex flex-col justify-between aspect-video transition-all hover:border-slate-700">
      {/* CCTV Screen Texture / Simulation Background */}
      <div className="absolute inset-0 bg-linear-to-br from-slate-900 via-[#0a1122] to-[#040812] opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-size-[16px_16px] opacity-25" />

      {/* Top Header Overlay: Camera Name & REC badge */}
      <div className="relative z-10 p-2 flex items-center justify-between text-[10px] text-white bg-linear-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-1.5 font-bold tracking-tight">
          <span className="px-1.5 py-0.5 rounded-xs bg-slate-800/90 text-cyan-400 font-mono text-[9px] border border-slate-700">
            CH{camera.channel}
          </span>
          <span className="truncate max-w-35 font-sans drop-shadow-xs">
            {camera.name}
          </span>
        </div>

        {camera.is_recording ? (
          <div className="flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded-xs border border-rose-500/30">
            <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[9px] font-bold text-rose-400 font-mono">
              REC
            </span>
          </div>
        ) : (
          <span className="text-[9px] font-semibold text-slate-400 font-mono">
            IDLE
          </span>
        )}
      </div>

      {/* Center Simulated Perspective Wireframe & Room Marker */}
      <div className="relative z-0 flex-1 flex flex-col items-center justify-center pointer-events-none opacity-40">
        <svg
          viewBox="0 0 100 60"
          className="w-24 h-auto text-slate-600 stroke-current"
          fill="none"
        >
          <path
            d="M 0 0 L 30 20 L 70 20 L 100 0"
            strokeWidth="0.5"
            strokeDasharray="2 2"
          />
          <path
            d="M 30 20 L 30 40 L 70 40 L 70 20"
            strokeWidth="0.5"
            strokeDasharray="2 2"
          />
          <path d="M 30 40 L 0 60" strokeWidth="0.5" strokeDasharray="2 2" />
          <path d="M 70 40 L 100 60" strokeWidth="0.5" strokeDasharray="2 2" />
        </svg>
        <span className="text-[10px] text-slate-400 font-mono mt-1">
          {camera.status === "Online" ? "● LIVE FEED" : "● NO SIGNAL"}
        </span>
      </div>

      {/* Hover Control Buttons Overlay */}
      <div className="absolute inset-0 z-20 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="size-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="size-4" />
          ) : (
            <Play className="size-4 ml-0.5" />
          )}
        </button>
        <button
          onClick={() => onExpand(camera)}
          className="size-8 rounded-full bg-[#0073ea] hover:bg-blue-600 text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-md"
          title="Fullscreen / Playback Detail"
        >
          <Maximize2 className="size-4" />
        </button>
      </div>

      {/* Bottom Footer Overlay: Timecode & Stream Specs */}
      <div className="relative z-10 px-2 py-1.5 flex items-center justify-between text-[9px] font-mono text-slate-300 bg-linear-to-t from-black/90 via-black/40 to-transparent">
        <span className="drop-shadow-xs">{formatToWIB(camera.timestamp)}</span>
        <span className="text-slate-400">{camera.resolution}</span>
      </div>
    </div>
  );
};

export const DVRDeviceDetailCard: React.FC<DVRDeviceDetailCardProps> = ({
  gatewayId,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    | "Ringkasan"
    | "CPU – DVR"
    | "Kamera"
    | "Recording & Storage"
    | "Event Log"
    | "DVR/NVR Info"
  >("Ringkasan");

  const [activeCamModal, setActiveCamModal] =
    useState<ICameraChannelPreview | null>(null);

  // Carousel slide state: 4 cameras per slide so it fits in ONE page without tall scrolling
  const [currentSlide, setCurrentSlide] = useState(0);

  // Fetch telemetry detail for selected gateway from FastAPI
  const { data, isLoading } = useDVRGatewayDetail(gatewayId);

  if (!gatewayId) return null;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <div className="size-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Memuat data detail telemetri DVR/NVR...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-6 text-center text-slate-500 text-sm">
        Data DVR untuk gateway {gatewayId} tidak ditemukan.
      </div>
    );
  }

  const d: IDVRGatewayDetailData = data;

  const tabs: Array<
    | "Ringkasan"
    | "CPU – DVR"
    | "Kamera"
    | "Recording & Storage"
    | "Event Log"
    | "DVR/NVR Info"
  > = [
    "Ringkasan",
    "CPU – DVR",
    "Kamera",
    "Recording & Storage",
    "Event Log",
    "DVR/NVR Info",
  ];

  // Carousel calculation: 4 cameras per slide
  const camsPerSlide = 4;
  const totalSlides = Math.max(1, Math.ceil(d.cameras.length / camsPerSlide));
  const currentCameras = d.cameras.slice(
    currentSlide * camsPerSlide,
    (currentSlide + 1) * camsPerSlide,
  );

  const isWhiteDevice = d.type.includes("Putih");

  // Helper for CPU - DVR Status badge styling & icon
  const isCpuConnected = d.cpu_dvr.status === "Connected";
  const cpuStatusColor = isCpuConnected
    ? "text-emerald-400"
    : d.cpu_dvr.status === "No Response"
      ? "text-rose-500"
      : "text-amber-400";
  const CpuIcon = isCpuConnected
    ? CheckCircle2
    : d.cpu_dvr.status === "No Response"
      ? AlertTriangle
      : AlertCircle;

  // Helper for Health Status styling & icon
  const isHealthGood = d.dvr_health.status === "Good";
  const healthColor = isHealthGood
    ? "text-emerald-400"
    : d.dvr_health.status === "Warning"
      ? "text-amber-400"
      : "text-rose-500";
  const HealthIcon = isHealthGood
    ? CheckCircle2
    : d.dvr_health.status === "Warning"
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

      {/* Main Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* ========================================================= */}
        {/* TAB 1: RINGKASAN */}
        {/* ========================================================= */}
        {activeTab === "Ringkasan" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* BARIS 1: 2 Kolom (9 Kolom Profile & Specs + 3 Kolom CPU-DVR Communication) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 items-stretch">
              {/* Kolom 1 (9 col): Device & DVR Profile (Spacious & Clean, No Text Overflow!) */}
              <div className="xl:col-span-9 col-span-12 bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
                <div className="flex flex-col md:flex-row gap-5 items-center md:items-start">
                  {/* 3D SmartBox Illustration */}
                  <div className="flex flex-col items-center shrink-0">
                    <SmartBoxIllustration isWhite={isWhiteDevice} />
                    <div className="mt-2 text-center">
                      <div className="text-[10px] text-slate-500 font-mono">
                        v1.0.0
                      </div>
                      <div className="text-[11px] font-bold text-[#0073ea] dark:text-[#00d2ff]">
                        Protect<span className="text-[#ff7a59]">Q</span>ube
                        AIOps
                      </div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight">
                        SmartBox Fleet
                      </div>
                    </div>
                  </div>

                  {/* Title & Specs Grid (2 Wide Columns so nothing clips!) */}
                  <div className="flex-1 min-w-0 space-y-3 w-full">
                    <div>
                      <h3
                        className="text-xl font-bold text-slate-900 dark:text-white tracking-wide truncate"
                        title={d.location}
                      >
                        {d.location}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
                        {d.id}
                      </p>
                    </div>

                    {/* 2-Column Specs Layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs font-mono text-slate-700 dark:text-slate-300">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1">
                          <span className="text-slate-500 dark:text-slate-400 font-sans">
                            Tipe
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 font-sans font-medium text-right truncate">
                            {d.model}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1">
                          <span className="text-slate-500 dark:text-slate-400 font-sans">
                            DVR/NVR
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 font-sans font-medium text-right truncate">
                            {d.dvr_model}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1">
                          <span className="text-slate-500 dark:text-slate-400 font-sans">
                            IP DVR
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 font-mono text-right">
                            {d.ip_address}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1">
                          <span className="text-slate-500 dark:text-slate-400 font-sans">
                            Kapasitas
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 font-sans font-medium text-right">
                            {d.camera_status.total} Channel NVR
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1">
                          <span className="text-slate-500 dark:text-slate-400 font-sans">
                            Last Update
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 font-sans text-right">
                            {formatToWIB(d.last_update)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1">
                          <span className="text-slate-500 dark:text-slate-400 font-sans">
                            Service Status
                          </span>
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

              {/* Kolom 2 (3 col): CPU – DVR Communication Card */}
              <div className="xl:col-span-3 col-span-12 bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium text-xs">
                    <Server className="size-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      CPU – DVR Communication
                    </span>
                  </div>

                  <div className="my-3">
                    <div className="flex items-center gap-2">
                      <CpuIcon className={`size-6 ${cpuStatusColor}`} />
                      <span
                        className={`text-lg font-bold tracking-tight ${cpuStatusColor}`}
                      >
                        {d.cpu_dvr.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-1.5">
                      {d.cpu_dvr.message}
                    </p>
                  </div>
                </div>

                <div className="text-[11px] space-y-1.5 text-slate-700 dark:text-slate-300 font-mono border-t border-slate-200 dark:border-slate-800/60 pt-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">
                      Port:
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono">
                      {d.cpu_dvr.port}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">
                      Latency:
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono">
                      {d.cpu_dvr.response_time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">
                      Packet Loss:
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono">
                      {d.cpu_dvr.packet_loss}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">
                      Last Sync:
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono">
                      {formatToWIB(d.cpu_dvr.last_check)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* BARIS 2: 3 Kolom Rata Semua (Status Kamera, Recording & Storage, Kesehatan DVR) */}
            {/* ========================================================= */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch">
              {/* Kolom 1 dari 3: Status Kamera */}
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium text-xs">
                  <Video className="size-3.5 text-emerald-500 dark:text-emerald-400" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Status Kamera
                  </span>
                </div>

                <div className="flex items-center justify-around gap-3 my-3">
                  <CircularGauge
                    percent={d.camera_status.percent}
                    strokeColor="#00c875"
                    centerContent={
                      <div className="text-center">
                        <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                          {d.camera_status.online}/{d.camera_status.total}
                        </span>
                        <div className="text-[8px] text-slate-500 dark:text-slate-400 font-mono -mt-0.5">
                          ONLINE
                        </div>
                      </div>
                    }
                  />

                  <div className="text-xs space-y-1.5 font-medium text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      <span className="text-slate-800 dark:text-slate-200 font-semibold">
                        {d.camera_status.online} Online
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-amber-500" />
                      <span className="text-slate-700 dark:text-slate-300">
                        {d.camera_status.no_video} No Video
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-rose-500" />
                      <span className="text-slate-700 dark:text-slate-300">
                        {d.camera_status.offline} Offline
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <SparklineWave
                    data={d.camera_status.sparkline}
                    color="#00c875"
                    id="cams"
                  />
                </div>
              </div>

              {/* Kolom 2 dari 3: Recording & Storage */}
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium text-xs">
                  <HardDrive className="size-3.5 text-[#0073ea]" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Recording & Storage
                  </span>
                </div>

                <div className="flex items-center justify-around gap-3 my-3">
                  <CircularGauge
                    percent={d.recording_storage.percent}
                    strokeColor="#0073ea"
                    centerContent={
                      <div className="text-center">
                        <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                          {d.recording_storage.percent}%
                        </span>
                        <div className="text-[8px] text-slate-500 dark:text-slate-400 font-mono -mt-0.5">
                          STORAGE
                        </div>
                      </div>
                    }
                  />

                  <div className="text-xs space-y-1.5 font-mono text-slate-700 dark:text-slate-300 flex-1 min-w-0 max-w-52.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-sans">
                        Status:
                      </span>
                      <span
                        className={`font-semibold font-sans text-[11px] px-2 py-0.5 rounded-full ${
                          d.recording_storage.status === "Normal"
                            ? "bg-emerald-500/15 text-[#00a862] dark:text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {d.recording_storage.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-sans">
                        Terpakai:
                      </span>
                      <span className="text-slate-800 dark:text-slate-200">
                        {d.recording_storage.used_tb} TB /{" "}
                        {d.recording_storage.total_tb} TB
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-sans">
                        Retention:
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-sans">
                        {d.recording_storage.retention_days} Hari
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <SparklineWave
                    data={d.recording_storage.sparkline}
                    color="#0073ea"
                    id="storage"
                  />
                </div>
              </div>

              {/* Kolom 3 dari 3: Kesehatan DVR */}
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium text-xs">
                  <ShieldCheck className="size-3.5 text-emerald-500 dark:text-emerald-400" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Kesehatan DVR
                  </span>
                </div>

                <div className="flex items-center gap-2.5 my-3 justify-center">
                  <div
                    className={`size-8 rounded-full flex items-center justify-center ${
                      isHealthGood
                        ? "bg-emerald-500/20 text-[#00a862] dark:text-emerald-400"
                        : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    <HealthIcon className={`size-5 ${healthColor}`} />
                  </div>
                  <span
                    className={`text-xl font-bold tracking-tight ${healthColor}`}
                  >
                    {d.dvr_health.status}
                  </span>
                </div>

                <div className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300 font-medium px-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">
                      HDD S.M.A.R.T:
                    </span>
                    <span
                      className={`font-semibold ${isHealthGood ? "text-[#00a862] dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}
                    >
                      {d.dvr_health.hdd_status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">
                      Suhu DVR:
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {d.dvr_health.temperature}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">
                      Kipas Pendingin:
                    </span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {d.dvr_health.fan_status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">
                      Bad Sector:
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {d.dvr_health.bad_sector}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* BARIS 3: Preview Rekaman DVR (Compact 1-Page with Carousel Slider) */}
            {/* ========================================================= */}
            <div className="bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-3 shadow-xs">
              {/* Header of Preview Row with Slider Navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/70 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#00a862] dark:text-emerald-400">
                    <Film className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <span>Preview Rekaman CCTV & DVR</span>
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                        ({d.dvr_model} — Total {d.cameras.length} Kamera)
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Tampilan 1 halaman dengan slide navigator untuk{" "}
                      {d.cameras.length} kamera
                    </p>
                  </div>
                </div>

                {/* Slider Controls: Page Indicator & Arrow Buttons */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono mr-1">
                    Slide {currentSlide + 1} / {totalSlides}
                  </span>

                  {/* Jump Pills for Quick Navigation */}
                  <div className="hidden md:flex items-center gap-1">
                    {Array.from({ length: totalSlides }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-medium transition-colors cursor-pointer ${
                          currentSlide === idx
                            ? "bg-[#0073ea] text-white font-bold"
                            : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        CH {idx * camsPerSlide + 1}-
                        {Math.min((idx + 1) * camsPerSlide, d.cameras.length)}
                      </button>
                    ))}
                  </div>

                  {/* Prev / Next Slide Arrows */}
                  <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
                    <button
                      disabled={currentSlide === 0}
                      onClick={() =>
                        setCurrentSlide((prev) => Math.max(0, prev - 1))
                      }
                      className="size-7 rounded-md bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                      title="Slide Kamera Sebelumnya"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <button
                      disabled={currentSlide >= totalSlides - 1}
                      onClick={() =>
                        setCurrentSlide((prev) =>
                          Math.min(totalSlides - 1, prev + 1),
                        )
                      }
                      className="size-7 rounded-md bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                      title="Slide Kamera Berikutnya"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => setActiveCamModal(d.cameras[0])}
                    className="px-2.5 py-1 rounded-md bg-[#0073ea] hover:bg-blue-600 text-xs text-white font-medium transition-colors flex items-center gap-1 cursor-pointer shadow-xs ml-1"
                  >
                    <Maximize2 className="size-3" />
                    <span>Playback Center</span>
                  </button>
                </div>
              </div>

              {/* Current Slide Cameras Grid (Exact 4 Viewports per slide: fits in 1 screen view!) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in duration-200">
                {currentCameras.map((cam) => (
                  <CCTVViewport
                    key={cam.channel}
                    camera={cam}
                    onExpand={(c) => setActiveCamModal(c)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: CPU – DVR */}
        {/* ========================================================= */}
        {activeTab === "CPU – DVR" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <Terminal className="size-4 text-[#0073ea]" />
                  <span>Protokol & Endpoint Komunikasi DVR</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      Status Komunikasi
                    </span>
                    <span className="font-semibold text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="size-3.5" /> {d.cpu_dvr.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      Endpoint NVR
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                      {d.ip_address}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      Port Layanan ISAPI
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {d.cpu_dvr.port}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      Waktu Respon (Ping)
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {d.cpu_dvr.response_time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      Packet Loss
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {d.cpu_dvr.packet_loss}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">
                      Last Telemetry Sync
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {formatToWIB(d.cpu_dvr.last_check)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <Activity className="size-4 text-emerald-500" />
                  <span>Diagnostik Konektivitas ISAPI/SDK</span>
                </div>
                <div className="bg-slate-900 text-slate-200 font-mono text-[11px] p-3 rounded-lg space-y-1.5">
                  <div className="text-slate-400">
                    # Probe ISAPI Endpoint ({d.ip_address}:{d.cpu_dvr.port}):
                  </div>
                  <div className="text-emerald-400">
                    &gt; GET /ISAPI/System/deviceInfo
                  </div>
                  <div className="text-slate-300">
                    HTTP/1.1 200 OK (Device: {d.dvr_model}, Firmware V4.20.000)
                  </div>
                  <div className="text-emerald-400">
                    &gt; GET /ISAPI/ContentMgmt/Storage
                  </div>
                  <div className="text-slate-300">
                    HTTP/1.1 200 OK ({d.dvr_health.hdd_status})
                  </div>
                  <div className="text-emerald-400">
                    &gt; GET /ISAPI/Streaming/channels
                  </div>
                  <div className="text-slate-300">
                    HTTP/1.1 200 OK ({d.camera_status.online} Channels Live, 25
                    FPS)
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  {d.cpu_dvr.message}
                </p>
              </div>
            </div>

            <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Daftar Port Terbuka NVR
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-400 font-mono">Port 80 (HTTP)</div>
                  <div className="font-semibold text-emerald-500">
                    ISAPI REST API (Aktif)
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-400 font-mono">
                    Port 554 (RTSP)
                  </div>
                  <div className="font-semibold text-emerald-500">
                    Video Streaming H.265+
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-400 font-mono">
                    Port 8000 (SDK)
                  </div>
                  <div className="font-semibold text-emerald-500">
                    Hikvision Control Port
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: KAMERA */}
        {/* ========================================================= */}
        {activeTab === "Kamera" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Seluruh Channel Kamera NVR ({d.cameras.length} Channel)
                </h4>
                <p className="text-xs text-slate-500">
                  {d.camera_status.online} Online • {d.camera_status.no_video}{" "}
                  No Video • {d.camera_status.offline} Offline
                </p>
              </div>
              <button
                onClick={() => setActiveCamModal(d.cameras[0])}
                className="px-3 py-1.5 rounded-lg bg-[#0073ea] hover:bg-blue-600 text-xs text-white font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Maximize2 className="size-3.5" />
                <span>Buka Live Playback Center</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {d.cameras.map((cam) => (
                <CCTVViewport
                  key={cam.channel}
                  camera={cam}
                  onExpand={(c) => setActiveCamModal(c)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: RECORDING & STORAGE */}
        {/* ========================================================= */}
        {activeTab === "Recording & Storage" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-2">
                <span className="text-xs text-slate-500 font-medium">
                  Status Perekaman NVR
                </span>
                <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="size-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{d.recording_storage.status}</span>
                </div>
                <div className="text-xs text-emerald-500 font-semibold">
                  Mode Kontinu (CMR 24/7)
                </div>
              </div>
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-2">
                <span className="text-xs text-slate-500 font-medium">
                  Kapasitas Terpakai
                </span>
                <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                  {d.recording_storage.used_tb} / {d.recording_storage.total_tb}{" "}
                  TB
                </div>
                <div className="text-xs text-slate-500">
                  {d.recording_storage.percent}% Digunakan
                </div>
              </div>
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-2">
                <span className="text-xs text-slate-500 font-medium">
                  Estimasi Retensi Video
                </span>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {d.recording_storage.retention_days} Hari
                </div>
                <div className="text-xs text-slate-500">
                  Auto-overwrite FIFO aktif
                </div>
              </div>
            </div>

            <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <HardDrive className="size-4 text-[#0073ea]" />
                <span>Kondisi Hard Disk (HDD Surveillance)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-slate-400">SMART Health</div>
                  <div className="font-semibold text-emerald-500">
                    {d.dvr_health.hdd_status}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-slate-400">Suhu Hard Disk</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {d.dvr_health.temperature} (Normal)
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-slate-400">Bad Sector Count</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {d.dvr_health.bad_sector} Bad Blocks
                  </div>
                </div>
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
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Riwayat Kejadian & Aktivitas DVR
                </div>
                <span className="text-[11px] text-slate-400">
                  Total 5 Log Terakhir
                </span>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      Protokol ISAPI sinkronisasi berhasil dengan {d.dvr_model}{" "}
                      ({d.ip_address})
                    </span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {formatToWIB(d.last_update)}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      Perekaman video kontinu (24/7 CMR) aktif pada Channel 1
                      &amp; 2
                    </span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {formatToWIB(d.last_update)}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-amber-500" />
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      Kamera Ch 3 &amp; Ch 4 terdeteksi No Video signal (Kabel
                      kamera belum terpasang)
                    </span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {formatToWIB(d.last_update)}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      Pemeriksaan SMART status disk SATA HDD hdd1 (3.64 TB):
                      PASSED (0 Bad Sector)
                    </span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {formatToWIB(d.last_update)}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-sky-500" />
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      Heartbeat keepalive probe NVR surveillance aktif (Response
                      latency &lt; 15 ms)
                    </span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {formatToWIB(d.last_update)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: DVR/NVR INFO */}
        {/* ========================================================= */}
        {activeTab === "DVR/NVR Info" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <Info className="size-4 text-[#0073ea]" />
                  <span>Informasi Spesifikasi NVR Hardware</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      Model DVR / NVR
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {d.dvr_model}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      Firmware Version
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                      V4.20.000
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      Tipe Perangkat
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      Surveillance NVR / IPC Hub
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      Total Channel Didukung
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {d.camera_status.total} Channel Input
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">
                      Status Operasi
                    </span>
                    <span className="font-semibold text-emerald-500">
                      {d.service_status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <Wifi className="size-4 text-emerald-500" />
                  <span>Jaringan & Konfigurasi Host</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      Alamat IP Host NVR
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                      {d.ip_address}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      Port ISAPI (HTTP)
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {d.cpu_dvr.port}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      Subnet Mask
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      255.255.255.0
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      Lokasi / Site
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {d.location}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">
                      Gateway Hardware
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {d.model}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Modal: Camera Playback & Timeline Scrubber */}
      {activeCamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0b1329] border border-slate-700 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-[#0e1730]">
              <div className="flex items-center gap-2.5">
                <Video className="size-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  {activeCamModal.name} — Playback & Live Stream
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {activeCamModal.resolution}
                </span>
              </div>
              <button
                onClick={() => setActiveCamModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Video Player Viewport */}
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-size-[20px_20px] opacity-30" />
              <div className="text-center space-y-2 relative z-10">
                <div className="size-16 rounded-full bg-[#0073ea]/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto shadow-lg">
                  <Play className="size-8 ml-1" />
                </div>
                <div className="text-sm font-semibold text-white tracking-wide">
                  Live Stream Feed Connected
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {formatToWIB(activeCamModal.timestamp)} • 25.0 FPS • 2048 Kbps
                  (H.265+)
                </div>
              </div>

              {/* Watermark overlay */}
              <div className="absolute top-4 left-4 text-xs font-mono text-white/80 bg-black/50 px-2 py-1 rounded-xs">
                {activeCamModal.name}
              </div>
              <div className="absolute top-4 right-4 text-xs font-mono text-emerald-400 bg-black/50 px-2 py-1 rounded-xs flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                REC 24H
              </div>
            </div>

            {/* Playback Timeline Scrubber */}
            <div className="p-4 bg-[#0a1122] border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Clock className="size-3.5 text-blue-400" />
                  <span className="font-mono">Timecode: 14:32:10</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                    <span className="size-2 bg-emerald-400 rounded-xs" />{" "}
                    Merekam Normal
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-amber-400">
                    <span className="size-2 bg-amber-400 rounded-xs" /> Motion
                    Event
                  </span>
                </div>
              </div>

              {/* 24-Hour Timeline Bar */}
              <div className="relative w-full h-6 bg-slate-900 rounded-md overflow-hidden border border-slate-800 flex items-center">
                <div className="absolute inset-y-0 left-0 w-[65%] bg-emerald-600/40 border-r border-emerald-400" />
                <div className="absolute inset-y-0 left-[60%] w-0.5 bg-rose-500 z-10 shadow-[0_0_8px_rgba(244,63,94,1)]">
                  <div className="size-2 rounded-full bg-rose-500 -ml-0.75 -mt-0.5" />
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>00:00</span>
                <span>04:00</span>
                <span>08:00</span>
                <span>12:00</span>
                <span className="text-white font-bold">14:32 (NOW)</span>
                <span>16:00</span>
                <span>20:00</span>
                <span>23:59</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
