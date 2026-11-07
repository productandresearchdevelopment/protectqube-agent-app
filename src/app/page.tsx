"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useSystemHealthDashboard,
  useCellularDashboard,
  useDVRDashboard,
} from "@/store/api/monitoring";
import { ChartCard } from "@/components/ui";
import {
  Server,
  Radio,
  Video,
  Cpu,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Signal,
  Clock,
  ExternalLink,
  ChevronRight,
  Layers,
  FileSpreadsheet,
  Search,
  RefreshCw,
  SlidersHorizontal,
  Flame,
  Zap,
  ShieldAlert,
  Camera,
  Globe,
  Thermometer,
  Disc,
  Box,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

// Custom Tooltip untuk Grafik SLA Trends
const CustomOverviewTooltip = ({ active, payload, label, unit, color }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900/95 text-slate-900 dark:text-white text-[11px] px-3 py-2 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700/80 font-sans z-50">
        <div className="text-slate-500 dark:text-slate-400 font-mono text-[10px] mb-1">{label}</div>
        {payload.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center gap-2 py-0.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: item.color || color }}
            />
            <span className="text-slate-600 dark:text-slate-300 font-medium">{item.name}:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {item.value}
              {unit || ""}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Custom Tooltips untuk Chart Donut Telemetri
const CustomDonutTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-900/95 dark:bg-slate-900/95 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-xl border border-slate-700/80 backdrop-blur-xs font-sans z-50">
        <div className="flex items-center gap-1.5 font-bold">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: data.payload.color || data.payload.fill }}
          />
          <span>{data.name}</span>
        </div>
        <div className="mt-0.5 text-slate-300 flex justify-between gap-3">
          <span>Total:</span>
          <span className="font-semibold text-white">{data.value.toLocaleString()}</span>
        </div>
        <div className="text-slate-300 flex justify-between gap-3">
          <span>Persentase:</span>
          <span className="font-semibold text-[#00c875]">{data.payload.percent}%</span>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip untuk Chart Line (Sinyal, Suhu)
const CustomLineTooltip = ({ active, payload, label, unit }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 dark:bg-slate-900/95 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-xl border border-slate-700/80 backdrop-blur-xs font-sans z-50">
        <div className="text-slate-400 font-mono text-[10px] mb-0.5">{label}</div>
        <div className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: payload[0].color }}
          />
          <span className="font-medium text-slate-200">{payload[0].name}:</span>
          <span className="font-bold text-white">
            {payload[0].value} {unit}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip untuk Metric Area (CPU, RAM, SD, Storage)
const CustomMetricTooltip = ({ active, payload, label, unit, color }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 dark:bg-slate-900/95 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-xl border border-slate-700/80 backdrop-blur-xs font-sans z-50">
        <div className="text-slate-400 font-mono text-[10px] mb-0.5">{label}</div>
        <div className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: color || payload[0]?.color || "#00c875" }}
          />
          <span className="font-medium text-slate-200">{payload[0].name}:</span>
          <span className="font-bold text-white">
            {payload[0].value}{unit}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

// Tipe data device yang sedang trouble
interface TroubleDevice {
  id: string;
  model: "SmartBox Black" | "SmartBox White";
  location: string;
  category: "cellular" | "dvr" | "system";
  severity: "critical" | "warning";
  alertTitle: string;
  alertDetail: string;
  metric: string;
  duration: string;
  lastUpdated: string;
  reportHref: string;
}

export default function OverviewPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTrendTab, setActiveTrendTab] = useState<
    "system" | "cellular" | "dvr" | "uptime"
  >("system");

  // State domain chart switcher untuk 12 chart yang dipindahkan dari Cellular, DVR, System Health
  const [activeDomainChartTab, setActiveDomainChartTab] = useState<
    "all" | "cellular" | "dvr" | "system"
  >("all");

  // State filter untuk daftar device trouble
  const [activeTroubleCategory, setActiveTroubleCategory] = useState<
    "all" | "critical" | "warning" | "cellular" | "dvr" | "system"
  >("all");
  const [troubleSearchQuery, setTroubleSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ambil data dashboard real-time
  const { data: systemDashboard } = useSystemHealthDashboard({
    page: 1,
    pageSize: 6,
  });
  const { data: cellularDashboard } = useCellularDashboard({
    page: 1,
    pageSize: 6,
  });
  const { data: dvrDashboard } = useDVRDashboard({
    page: 1,
    pageSize: 6,
  });

  const sysSummary = systemDashboard?.summary;
  const cellSummary = cellularDashboard?.summary;
  const dvrSummary = dvrDashboard?.summary;

  const totalGateways = cellSummary?.total_gateways ?? sysSummary?.total_gateways ?? 2000;
  const onlineCount = cellSummary?.online ?? sysSummary?.healthy ?? 1928;
  const degradedCount = cellSummary?.degraded ?? sysSummary?.warning ?? 44;
  const offlineCount = cellSummary?.offline ?? sysSummary?.critical ?? 28;
  const onlinePct = cellSummary?.online_percent ?? sysSummary?.healthy_percent ?? 96.4;
  const totalTrouble = degradedCount + offlineCount; // 72

  // Chart data resolution based on active tab
  const getChartData = () => {
    if (activeTrendTab === "cellular") {
      return (
        cellularDashboard?.charts?.signal_strength?.timeline || [
          { time: "00:00", value: -76 },
          { time: "04:00", value: -79 },
          { time: "08:00", value: -77 },
          { time: "12:00", value: -80 },
          { time: "16:00", value: -78 },
          { time: "20:00", value: -75 },
          { time: "23:59", value: -77 },
        ]
      );
    }
    if (activeTrendTab === "dvr") {
      return (
        dvrDashboard?.charts?.storage_usage?.timeline || [
          { time: "00:00", value: 64 },
          { time: "04:00", value: 65 },
          { time: "08:00", value: 66 },
          { time: "12:00", value: 67 },
          { time: "16:00", value: 68 },
          { time: "20:00", value: 68 },
          { time: "23:59", value: 69 },
        ]
      );
    }
    if (activeTrendTab === "uptime") {
      return (
        systemDashboard?.charts?.uptime?.timeline || [
          { time: "00:00", value: 99.2 },
          { time: "04:00", value: 98.9 },
          { time: "08:00", value: 97.5 },
          { time: "12:00", value: 96.8 },
          { time: "16:00", value: 97.2 },
          { time: "20:00", value: 98.1 },
          { time: "23:59", value: 98.4 },
        ]
      );
    }
    // Default: system CPU & RAM
    return (
      systemDashboard?.charts?.cpu?.timeline || [
        { time: "00:00", value: 24 },
        { time: "04:00", value: 28 },
        { time: "08:00", value: 36 },
        { time: "12:00", value: 42 },
        { time: "16:00", value: 38 },
        { time: "20:00", value: 30 },
        { time: "23:59", value: 26 },
      ]
    );
  };

  // --- 1. DATASET GRAFIK SELULER (Dipindahkan dari Cellular Connectivity) ---
  const cellCharts = cellularDashboard?.charts;
  const cpuModemData = cellCharts?.cpu_modem_comm?.slices.map((s) => ({
    name: s.label,
    value: s.count,
    percent: s.percent,
    color: s.color,
  })) || [
    { name: "Connected", value: 1960, percent: 98.0, color: "#00c875" },
    { name: "Not Detected", value: 20, percent: 1.0, color: "#e2445c" },
    { name: "No Response", value: 12, percent: 0.6, color: "#fdab3d" },
    { name: "Driver Error", value: 8, percent: 0.4, color: "#579bfc" },
  ];

  const networkStatusData = cellCharts?.modem_network_status?.slices.map((s) => ({
    name: s.label,
    value: s.count,
    percent: s.percent,
    color: s.color,
  })) || [
    { name: "Online", value: 1720, percent: 86.0, color: "#00c875" },
    { name: "Searching", value: 50, percent: 2.5, color: "#fdab3d" },
    { name: "No Service", value: 120, percent: 6.0, color: "#e2445c" },
    { name: "SIM Error", value: 40, percent: 2.0, color: "#a855f7" },
    { name: "Roaming", value: 70, percent: 3.5, color: "#f59e0b" },
  ];

  const cellRsrpTimeline = cellCharts?.signal_strength?.timeline || [
    { time: "00:00", value: -88 },
    { time: "04:00", value: -85 },
    { time: "08:00", value: -82 },
    { time: "12:00", value: -84 },
    { time: "16:00", value: -86 },
    { time: "20:00", value: -85 },
  ];

  const cellTempTimeline = cellCharts?.modem_temperature?.timeline || [
    { time: "00:00", value: 38 },
    { time: "04:00", value: 42 },
    { time: "08:00", value: 46 },
    { time: "12:00", value: 48 },
    { time: "16:00", value: 47 },
    { time: "20:00", value: 41 },
  ];

  // --- 2. DATASET GRAFIK DVR & RECORDING (Dipindahkan dari DVR Recording) ---
  const dvrCharts = dvrDashboard?.charts;
  const cpuDvrData = dvrCharts?.cpu_dvr_comm?.slices.map((s) => ({
    name: s.label,
    value: s.count,
    percent: s.percent,
    color: s.color,
  })) || [
    { name: "Connected", value: 1850, percent: 92.5, color: "#00c875" },
    { name: "Timeout", value: 90, percent: 4.5, color: "#fdab3d" },
    { name: "Auth Failed", value: 40, percent: 2.0, color: "#e2445c" },
    { name: "Port Closed", value: 20, percent: 1.0, color: "#579bfc" },
  ];

  const statusKameraData = dvrCharts?.status_kamera?.slices.map((s) => ({
    name: s.label,
    value: s.count,
    percent: s.percent,
    color: s.color,
  })) || [
    { name: "Online", value: 7350, percent: 90.2, color: "#00c875" },
    { name: "No Video", value: 450, percent: 5.5, color: "#fdab3d" },
    { name: "Offline", value: 350, percent: 4.3, color: "#e2445c" },
  ];

  const recordingStatusData = dvrCharts?.recording_status?.slices.map((s) => ({
    name: s.label,
    value: s.count,
    percent: s.percent,
    color: s.color,
  })) || [
    { name: "Recording", value: 1765, percent: 88.3, color: "#00c875" },
    { name: "Not Recording", value: 140, percent: 7.0, color: "#fdab3d" },
    { name: "Error/Corrupt", value: 95, percent: 4.7, color: "#e2445c" },
  ];

  const dvrStorageTimeline = dvrCharts?.storage_usage?.timeline || [
    { time: "00:00", value: 71 },
    { time: "04:00", value: 72 },
    { time: "08:00", value: 73 },
    { time: "12:00", value: 74 },
    { time: "16:00", value: 74 },
    { time: "20:00", value: 75 },
  ];

  // --- 3. DATASET GRAFIK SYSTEM HEALTH (Dipindahkan dari System Health) ---
  const sysCharts = systemDashboard?.charts;
  const sysCpuTimeline = sysCharts?.cpu?.timeline || [
    { time: "00:00", value: 32 },
    { time: "04:00", value: 28 },
    { time: "08:00", value: 45 },
    { time: "12:00", value: 58 },
    { time: "16:00", value: 52 },
    { time: "20:00", value: 38 },
  ];

  const sysRamTimeline = sysCharts?.ram?.timeline || [
    { time: "00:00", value: 54 },
    { time: "04:00", value: 52 },
    { time: "08:00", value: 61 },
    { time: "12:00", value: 68 },
    { time: "16:00", value: 65 },
    { time: "20:00", value: 58 },
  ];

  const sysSdTimeline = sysCharts?.sd_card?.timeline || [
    { time: "00:00", value: 42 },
    { time: "04:00", value: 42 },
    { time: "08:00", value: 43 },
    { time: "12:00", value: 43 },
    { time: "16:00", value: 44 },
    { time: "20:00", value: 44 },
  ];

  const sysUptimeTimeline = sysCharts?.uptime?.timeline || [
    { time: "00:00", value: 99.2 },
    { time: "04:00", value: 99.0 },
    { time: "08:00", value: 98.4 },
    { time: "12:00", value: 97.9 },
    { time: "16:00", value: 98.2 },
    { time: "20:00", value: 98.8 },
  ];

  // Daftar lengkap device yang sedang mengalami gangguan / alert
  const troubleDevices: TroubleDevice[] = [
    {
      id: "gw-dccdec07",
      model: "SmartBox Black",
      location: "SmartBox Store 01",
      category: "cellular",
      severity: "critical",
      alertTitle: "Extreme Signal Drop & Intermittent",
      alertDetail: "RSRP dropped to -110 dBm (Telkomsel), telemetry communication intermittent.",
      metric: "RSRP: -110 dBm",
      duration: "02:14:30",
      lastUpdated: "5 mins ago",
      reportHref: "/reports/cellular",
    },
    {
      id: "gw-3a53d2ff",
      model: "SmartBox White",
      location: "RO KALIBATA",
      category: "dvr",
      severity: "warning",
      alertTitle: "HDD Storage Nearing Capacity",
      alertDetail: "Used capacity 3.41 TB / 3.72 TB (92%). Camera 3 & 4 No Video.",
      metric: "HDD: 92% (3.41 TB)",
      duration: "04:45:12",
      lastUpdated: "12 mins ago",
      reportHref: "/reports/dvr",
    },
    {
      id: "697D",
      model: "SmartBox Black",
      location: "Alfa Ahmad Dahlan III",
      category: "dvr",
      severity: "critical",
      alertTitle: "DVR Communication Disconnected (No Ping)",
      alertDetail: "Hikvision DS-7616NI not responding to RTSP / ping port 8000 via local switch.",
      metric: "DVR: Offline",
      duration: "05:12:00",
      lastUpdated: "18 mins ago",
      reportHref: "/reports/dvr",
    },
    {
      id: "ZR4R",
      model: "SmartBox White",
      location: "Alfa Ruko Metland",
      category: "dvr",
      severity: "warning",
      alertTitle: "Camera Channel 3 No Video",
      alertDetail: "Cashier camera stream lost (RTSP timeout), other 3 channels normal.",
      metric: "Camera: 3/4 Live",
      duration: "06:20:15",
      lastUpdated: "25 mins ago",
      reportHref: "/reports/dvr",
    },
    {
      id: "ZJ2B",
      model: "SmartBox Black",
      location: "IDM Griya Mustikasari",
      category: "system",
      severity: "warning",
      alertTitle: "Sustained High CPU Load",
      alertDetail: "CPU Load 92% for >30 minutes due to edge visual tracking process.",
      metric: "CPU: 92% Spike",
      duration: "01:35:40",
      lastUpdated: "30 mins ago",
      reportHref: "/reports/health",
    },
    {
      id: "ZQ81",
      model: "SmartBox Black",
      location: "Alfa Raya Hankam Pondok Gede",
      category: "system",
      severity: "critical",
      alertTitle: "Critical SBC Temperature (Thermal Throttling)",
      alertDetail: "Processor temp reached 76°C (Safe limit: 70°C). Check cooling fan.",
      metric: "Temp: 76°C",
      duration: "03:10:05",
      lastUpdated: "40 mins ago",
      reportHref: "/reports/health",
    },
    {
      id: "ZX33",
      model: "SmartBox White",
      location: "IDM Ciledug Raya No. 45",
      category: "cellular",
      severity: "warning",
      alertTitle: "SIM Card Network Flapping",
      alertDetail: "Quectel EC25 modem frequently falls back to 3G/2G due to local tower fluctuations.",
      metric: "Band: 3G Fallback",
      duration: "07:50:00",
      lastUpdated: "1 hour ago",
      reportHref: "/reports/cellular",
    },
    {
      id: "ZP19",
      model: "SmartBox Black",
      location: "Alfa Boulevard Kelapa Gading",
      category: "system",
      severity: "warning",
      alertTitle: "SD Card Endurance Degradation",
      alertDetail: "Remaining SD card wear-out life at 14%. Replacement recommended.",
      metric: "SD Life: 14%",
      duration: "12:00:00",
      lastUpdated: "2 hours ago",
      reportHref: "/reports/health",
    },
    {
      id: "ZB55",
      model: "SmartBox White",
      location: "IDM Daan Mogot KM 12",
      category: "dvr",
      severity: "critical",
      alertTitle: "HDD Bad Sectors Detected",
      alertDetail: "SMART status reports 128 reallocated sectors on recording hard drive.",
      metric: "SMART: Bad Sector",
      duration: "08:15:30",
      lastUpdated: "2 hours ago",
      reportHref: "/reports/dvr",
    },
    {
      id: "ZL04",
      model: "SmartBox Black",
      location: "Alfa Veteran Bintaro",
      category: "cellular",
      severity: "critical",
      alertTitle: "Modem Not Responding to AT Commands",
      alertDetail: "Serial USB-to-Modem communication timed out, data connection lost.",
      metric: "Port: USB Timeout",
      duration: "09:40:10",
      lastUpdated: "3 hours ago",
      reportHref: "/reports/cellular",
    },
    {
      id: "ZM11",
      model: "SmartBox White",
      location: "IDM Margonda Raya Depok",
      category: "cellular",
      severity: "warning",
      alertTitle: "Very High Cellular RTT Latency",
      alertDetail: "Round-trip time reached 1,420 ms (Normal: <250 ms), telemetry packets delayed.",
      metric: "RTT: 1,420 ms",
      duration: "01:10:20",
      lastUpdated: "3 hours ago",
      reportHref: "/reports/cellular",
    },
    {
      id: "ZK88",
      model: "SmartBox Black",
      location: "Alfa Cinere Raya",
      category: "dvr",
      severity: "warning",
      alertTitle: "Camera Channel 2 Frame Drop",
      alertDetail: "Video FPS dropped to 4 fps (Target: 25 fps), cashier recording quality degraded.",
      metric: "FPS: 4 fps (Drop)",
      duration: "03:40:00",
      lastUpdated: "4 hours ago",
      reportHref: "/reports/dvr",
    },
  ];

  // Hitungan trouble
  const countAllTrouble = troubleDevices.length;
  const countCritical = troubleDevices.filter((d) => d.severity === "critical").length;
  const countWarning = troubleDevices.filter((d) => d.severity === "warning").length;
  const countCellular = troubleDevices.filter((d) => d.category === "cellular").length;
  const countDVR = troubleDevices.filter((d) => d.category === "dvr").length;
  const countSystem = troubleDevices.filter((d) => d.category === "system").length;

  // Filter device trouble berdasarkan tab dan search
  const filteredTroubleDevices = useMemo(() => {
    return troubleDevices.filter((item) => {
      if (activeTroubleCategory === "critical" && item.severity !== "critical") return false;
      if (activeTroubleCategory === "warning" && item.severity !== "warning") return false;
      if (activeTroubleCategory === "cellular" && item.category !== "cellular") return false;
      if (activeTroubleCategory === "dvr" && item.category !== "dvr") return false;
      if (activeTroubleCategory === "system" && item.category !== "system") return false;

      if (troubleSearchQuery.trim() !== "") {
        const q = troubleSearchQuery.toLowerCase();
        const matchId = item.id.toLowerCase().includes(q);
        const matchLoc = item.location.toLowerCase().includes(q);
        const matchTitle = item.alertTitle.toLowerCase().includes(q);
        const matchDetail = item.alertDetail.toLowerCase().includes(q);
        const matchMetric = item.metric.toLowerCase().includes(q);
        return matchId || matchLoc || matchTitle || matchDetail || matchMetric;
      }
      return true;
    });
  }, [troubleDevices, activeTroubleCategory, troubleSearchQuery]);

  return (
    <AppLayout
      title="Overview"
      headerRight={
        <div className="flex items-center gap-2.5">
          {/* Quick Live Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
            <span className="size-2 rounded-full bg-[#00c875] animate-ping" />
            <span className="font-bold text-[#00c875]">{onlinePct}% Online</span>
            <span className="text-slate-400">({onlineCount}/{totalGateways})</span>
          </div>

          <Link
            href="/reports/cellular"
            className="bg-[#0073ea] hover:bg-blue-600 active:scale-95 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
          >
            <FileSpreadsheet className="size-3.5" />
            <span>Open Reports</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-6 max-w-[1600px] mx-auto pb-12 font-sans transition-colors">

        {/* ========================================================= */}
        {/* 2. 4 BENTO STAT CARDS UTAMA (CORE PILLARS) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card 1: Fleet Operational Overview */}
          <div className="bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-700 transition-all group">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-blue-500/10 text-[#0073ea] flex items-center justify-center">
                    <Server className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Fleet Overview
                    </h3>
                    <p className="text-[11px] text-slate-400">Total Deployment</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-blue-400 px-2 py-0.5 rounded-md bg-blue-600/20 border border-blue-500/30">
                  {totalGateways.toLocaleString()} Units
                </span>
              </div>

              {/* Stat breakdown */}
              <div className="grid grid-cols-3 gap-2 py-3 text-center">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg py-1.5 px-1">
                  <div className="text-[10px] text-slate-400 font-medium">Online</div>
                  <div className="text-sm font-extrabold text-[#00c875] mt-0.5">
                    {onlineCount}
                  </div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg py-1.5 px-1">
                  <div className="text-[10px] text-slate-400 font-medium">Degraded</div>
                  <div className="text-sm font-extrabold text-[#f59e0b] mt-0.5">
                    {degradedCount}
                  </div>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg py-1.5 px-1">
                  <div className="text-[10px] text-slate-400 font-medium">Offline</div>
                  <div className="text-sm font-extrabold text-[#e2445c] mt-0.5">
                    {offlineCount}
                  </div>
                </div>
              </div>

              {/* Proportional Strip */}
              <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 mt-1">
                <div style={{ width: `${onlinePct}%` }} className="bg-[#00c875]" />
                <div style={{ width: "2.2%" }} className="bg-[#f59e0b]" />
                <div style={{ width: "1.4%" }} className="bg-[#e2445c]" />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Black: 1,240 • White: 760</span>
              <span className="text-[#00c875] font-semibold">{onlinePct}% Uptime</span>
            </div>
          </div>

          {/* Card 2: System Health Pillar */}
          <div className="bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-700 transition-all group">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-emerald-500/10 text-[#00c875] flex items-center justify-center">
                    <Cpu className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      System Health (SBC)
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Compute & SD Endurance</p>
                  </div>
                </div>
                <Link
                  href="/reports/health"
                  className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ArrowUpRight className="size-4" />
                </Link>
              </div>

              {/* 2x2 Metric Grid */}
              <div className="grid grid-cols-2 gap-2.5 py-3">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Average CPU</div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white">
                    {systemDashboard?.charts?.cpu?.avg ? `${systemDashboard.charts.cpu.avg}%` : "32%"}
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal ml-1.5">
                      Max {systemDashboard?.charts?.cpu?.max ? `${systemDashboard.charts.cpu.max}%` : "78%"}
                    </span>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Average RAM</div>
                  <div className="text-base font-extrabold text-[#00c875]">
                    {systemDashboard?.charts?.ram?.avg ? `${systemDashboard.charts.ram.avg}%` : "43%"}
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal ml-1.5">
                      Max {systemDashboard?.charts?.ram?.max ? `${systemDashboard.charts.ram.max}%` : "81%"}
                    </span>
                  </div>
                </div>
                <div className="space-y-0.5 pt-1 border-t border-slate-100 dark:border-slate-800/50">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">SD Card Health</div>
                  <div className="text-xs font-bold text-[#00c875]">
                    Good (Life 92%)
                  </div>
                </div>
                <div className="space-y-0.5 pt-1 border-t border-slate-100 dark:border-slate-800/50">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">System Temp</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    45°C (Max 62°C)
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Rockchip & RPi 3B+</span>
              <Link
                href="/reports/health"
                className="text-[#0073ea] hover:underline font-semibold flex items-center gap-1"
              >
                Lihat Report
                <ChevronRight className="size-3" />
              </Link>
            </div>
          </div>

          {/* Card 3: Cellular Connectivity Pillar */}
          <div className="bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-700 transition-all group">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-cyan-500/10 text-[#00d2ff] flex items-center justify-center">
                    <Radio className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Cellular
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Quectel 4G LTE Fleet</p>
                  </div>
                </div>
                <Link
                  href="/reports/cellular"
                  className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ArrowUpRight className="size-4" />
                </Link>
              </div>

              {/* 2x2 Metric Grid */}
              <div className="grid grid-cols-2 gap-2.5 py-3">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Avg Signal (RSRP)</div>
                  <div className="text-base font-extrabold text-[#00d2ff]">
                    -78 dBm
                    <span className="text-[10px] text-[#00c875] font-semibold ml-1.5">
                      Good
                    </span>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">CPU-Modem SLA</div>
                  <div className="text-base font-extrabold text-[#00c875]">
                    98.5%
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal ml-1.5">
                      Uptime
                    </span>
                  </div>
                </div>
                <div className="space-y-0.5 pt-1 border-t border-slate-100 dark:border-slate-800/50">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Top Provider</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Telkomsel (58%)
                  </div>
                </div>
                <div className="space-y-0.5 pt-1 border-t border-slate-100 dark:border-slate-800/50">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Avg Response</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    220 ms
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">EC200E / EC25 / SIM7600</span>
              <Link
                href="/reports/cellular"
                className="text-[#0073ea] hover:underline font-semibold flex items-center gap-1"
              >
                Lihat Report
                <ChevronRight className="size-3" />
              </Link>
            </div>
          </div>

          {/* Card 4: DVR & Video Surveillance Pillar */}
          <div className="bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-700 transition-all group">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-orange-500/10 text-[#fdab3d] flex items-center justify-center">
                    <Video className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      DVR & Recording
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">CCTV Stream & Storage</p>
                  </div>
                </div>
                <Link
                  href="/reports/dvr"
                  className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ArrowUpRight className="size-4" />
                </Link>
              </div>

              {/* 2x2 Metric Grid */}
              <div className="grid grid-cols-2 gap-2.5 py-3">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">CCTV Channels</div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white">
                    7,840
                    <span className="text-[10px] text-[#00c875] font-semibold ml-1.5">
                      98.2% Live
                    </span>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Recording Uptime</div>
                  <div className="text-base font-extrabold text-[#00c875]">
                    95.8%
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal ml-1.5">
                      708h+
                    </span>
                  </div>
                </div>
                <div className="space-y-0.5 pt-1 border-t border-slate-100 dark:border-slate-800/50">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Total Storage</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    7.2 PB (68% Used)
                  </div>
                </div>
                <div className="space-y-0.5 pt-1 border-t border-slate-100 dark:border-slate-800/50">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Top Brands</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Hikvision / Dahua
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">4-8 Ch HD Video Stream</span>
              <Link
                href="/reports/dvr"
                className="text-[#0073ea] hover:underline font-semibold flex items-center gap-1"
              >
                Lihat Report
                <ChevronRight className="size-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. VISUAL ANALYTICS: INTERACTIVE TREND & 3-PILLAR HEALTH RADAR */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Panel (7 cols): Fleet Performance SLA Trends */}
          <div className="lg:col-span-7 bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              {/* Header with Metric Tab Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/70">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Fleet SLA & Diagnostic Trends
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Fleet-wide 24-hour historical metric fluctuation analysis
                  </p>
                </div>

                {/* Pill Switcher */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#060c18] p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setActiveTrendTab("system")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTrendTab === "system"
                        ? "bg-[#0073ea] text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    SBC CPU/RAM
                  </button>
                  <button
                    onClick={() => setActiveTrendTab("cellular")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTrendTab === "cellular"
                        ? "bg-[#0073ea] text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    RSRP Signal
                  </button>
                  <button
                    onClick={() => setActiveTrendTab("dvr")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTrendTab === "dvr"
                        ? "bg-[#0073ea] text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Storage
                  </button>
                  <button
                    onClick={() => setActiveTrendTab("uptime")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTrendTab === "uptime"
                        ? "bg-[#0073ea] text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Uptime %
                  </button>
                </div>
              </div>

              {/* Trend Chart Area */}
              <div className="h-60 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fleetAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={
                            activeTrendTab === "cellular"
                              ? "#00d2ff"
                              : activeTrendTab === "dvr"
                              ? "#fdab3d"
                              : "#00c875"
                          }
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor={
                            activeTrendTab === "cellular"
                              ? "#00d2ff"
                              : activeTrendTab === "dvr"
                              ? "#fdab3d"
                              : "#00c875"
                          }
                          stopOpacity={0.0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      axisLine={{ stroke: "#94a3b8", strokeWidth: 0.5, opacity: 0.3 }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) =>
                        activeTrendTab === "cellular" ? `${v}dBm` : `${v}%`
                      }
                    />
                    <Tooltip
                      content={
                        <CustomOverviewTooltip
                          unit={activeTrendTab === "cellular" ? " dBm" : "%"}
                          color={
                            activeTrendTab === "cellular"
                              ? "#00d2ff"
                              : activeTrendTab === "dvr"
                              ? "#fdab3d"
                              : "#00c875"
                          }
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      name={
                        activeTrendTab === "cellular"
                          ? "Signal (RSRP)"
                          : activeTrendTab === "dvr"
                          ? "Used Storage"
                          : activeTrendTab === "uptime"
                          ? "Fleet Uptime"
                          : "Average Load"
                      }
                      dataKey="value"
                      stroke={
                        activeTrendTab === "cellular"
                          ? "#00d2ff"
                          : activeTrendTab === "dvr"
                          ? "#fdab3d"
                          : "#00c875"
                      }
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#fleetAreaGrad)"
                      activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Meta Stats */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#00c875]" />
                  Sampling: Real-time Telemetri
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-blue-500 dark:bg-blue-400" />
                  MQTT & WebSocket Connected
                </span>
              </div>
              <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                Updated: just now
              </span>
            </div>
          </div>

          {/* Right Panel (5 cols): Diagnostic Radar & Hardware Distribution */}
          <div className="lg:col-span-5 bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800/70 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Diagnostic Domain Radar
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Skor kepatuhan SLA 3 pilar utama sistem
                  </p>
                </div>
                <span className="size-2 rounded-full bg-[#00c875] animate-pulse" />
              </div>

              {/* 3 Domain Health Progress Bars */}
              <div className="space-y-4 pt-4">
                {/* Pillar 1 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Cpu className="size-3.5 text-emerald-500 dark:text-emerald-400" />
                      1. SBC System Health SLA
                    </span>
                    <span className="font-extrabold text-[#00c875]">96.8%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="w-[96.8%] h-full bg-[#00c875] rounded-full" />
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 flex justify-between">
                    <span>CPU, RAM, SD Card endurance</span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Target &gt; 95%</span>
                  </div>
                </div>

                {/* Pillar 2 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Radio className="size-3.5 text-cyan-500 dark:text-cyan-400" />
                      2. Cellular Network SLA
                    </span>
                    <span className="font-extrabold text-[#00d2ff]">97.4%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="w-[97.4%] h-full bg-[#00d2ff] rounded-full" />
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 flex justify-between">
                    <span>Quectel Modem & Provider 4G LTE</span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Target &gt; 95%</span>
                  </div>
                </div>

                {/* Pillar 3 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Video className="size-3.5 text-amber-500 dark:text-amber-400" />
                      3. DVR & CCTV Recording SLA
                    </span>
                    <span className="font-extrabold text-[#fdab3d]">95.2%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="w-[95.2%] h-full bg-[#fdab3d] rounded-full" />
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 flex justify-between">
                    <span>Active stream & storage write integrity</span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Target &gt; 95%</span>
                  </div>
                </div>
              </div>

              {/* Hardware Deployment Distribution */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/60 space-y-2">
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Hardware Model Distribution
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">SmartBox Black</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">RPi 3B+ / RK3328</div>
                    </div>
                    <span className="text-sm font-extrabold text-blue-500 dark:text-blue-400">1,240</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">SmartBox White</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Quectel EC25 Model</div>
                    </div>
                    <span className="text-sm font-extrabold text-slate-700 dark:text-slate-300">760</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-3 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>All 3 monitoring agents aktif</span>
              <span className="text-[#00c875] font-semibold">Zero Fatal Kernel Panics</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. REAL-TIME DOMAIN TELEMETRY CHARTS (CELLULAR, DVR, SYSTEM HEALTH) */}
        {/* ========================================================= */}
        <div className="pt-4 space-y-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="size-5 text-[#0073ea]" />
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Real-Time Domain Telemetry Charts
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Monitoring grafik operasional real-time untuk Cellular Connectivity, DVR Recording, dan System Health.
              </p>
            </div>

            {/* Domain Switcher Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveDomainChartTab("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  activeDomainChartTab === "all"
                    ? "bg-[#0073ea] text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <Layers className="size-3.5" />
                All Domains (12)
              </button>
              <button
                type="button"
                onClick={() => setActiveDomainChartTab("cellular")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  activeDomainChartTab === "cellular"
                    ? "bg-cyan-600 text-white shadow-xs"
                    : "bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 border border-cyan-500/20"
                }`}
              >
                <Radio className="size-3.5" />
                Cellular (4)
              </button>
              <button
                type="button"
                onClick={() => setActiveDomainChartTab("dvr")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  activeDomainChartTab === "dvr"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20"
                }`}
              >
                <Video className="size-3.5" />
                DVR & Recording (4)
              </button>
              <button
                type="button"
                onClick={() => setActiveDomainChartTab("system")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  activeDomainChartTab === "system"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20"
                }`}
              >
                <Cpu className="size-3.5" />
                System Health (4)
              </button>
            </div>
          </div>

          {/* 4.A CELLULAR CONNECTIVITY CHARTS (4 CHARTS) */}
          {(activeDomainChartTab === "all" || activeDomainChartTab === "cellular") && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#00d2ff]" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Cellular Telemetry
                  </span>
                </div>
                <Link
                  href="/cellular"
                  className="text-[11px] font-semibold text-[#0073ea] hover:underline flex items-center gap-1"
                >
                  Go to Cellular Page <ChevronRight className="size-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
                {/* Cell Chart 1: CPU - Modem Comm Donut */}
                <ChartCard
                  title="Komunikasi CPU – Modem"
                  subtitle="Status Handshake Hardware"
                  icon={Cpu}
                >
                  <div className="flex items-center gap-2 h-40">
                    <div className="w-32 h-32 relative shrink-0">
                      {mounted && (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip content={<CustomDonutTooltip />} />
                            <Pie
                              data={cpuModemData}
                              cx="50%"
                              cy="50%"
                              innerRadius={32}
                              outerRadius={50}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {cpuModemData.map((entry, index) => (
                                <Cell key={`cell-cpu-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-sm font-black text-slate-900 dark:text-white leading-none">
                          98.0%
                        </span>
                        <span className="text-[9px] text-slate-400">Connected</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1.5 text-xs">
                      {cpuModemData.map((d) => (
                        <div key={d.name} className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate">
                            <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                            {d.name}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{d.percent}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </ChartCard>

                {/* Cell Chart 2: Modem Network Status Donut */}
                <ChartCard
                  title="Koneksi Jaringan"
                  subtitle="Distribusi Status Jaringan"
                  icon={Globe}
                >
                  <div className="flex items-center gap-2 h-40">
                    <div className="w-32 h-32 relative shrink-0">
                      {mounted && (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip content={<CustomDonutTooltip />} />
                            <Pie
                              data={networkStatusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={32}
                              outerRadius={50}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {networkStatusData.map((entry, index) => (
                                <Cell key={`cell-net-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-sm font-black text-slate-900 dark:text-white leading-none">
                          86.0%
                        </span>
                        <span className="text-[9px] text-slate-400">Online</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1.5 text-xs">
                      {networkStatusData.map((d) => (
                        <div key={d.name} className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate">
                            <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                            {d.name}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{d.percent}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </ChartCard>

                {/* Cell Chart 3: Signal RSRP Trend */}
                <ChartCard
                  title="Signal Strength (RSRP)"
                  subtitle="24-Hour Average"
                  icon={Signal}
                >
                  <div className="flex items-stretch gap-1.5 h-40">
                    <div className="flex-1 h-full relative">
                      {mounted && (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={cellRsrpTimeline} margin={{ top: 8, right: 0, left: -4, bottom: 0 }}>
                            <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={{ stroke: "#334155", strokeWidth: 0.5 }} tickLine={false} />
                            <YAxis width={28} domain={[-120, -60]} ticks={[-120, -90, -60]} tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={(v) => `${v}`} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomLineTooltip unit="dBm" />} />
                            <Line type="monotone" name="RSRP" dataKey="value" stroke="#0073ea" strokeWidth={2} dot={{ r: 2, fill: "#0073ea" }} activeDot={{ r: 4 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="w-14 shrink-0 flex flex-col justify-between py-1 border-l border-slate-100 dark:border-slate-800/80 pl-1.5">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium leading-none">Avg</div>
                        <div className="text-xs font-bold text-[#0073ea] mt-0.5">{cellCharts?.signal_strength?.avg ?? "-85"} dBm</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium leading-none">Min</div>
                        <div className="text-xs font-bold text-[#e2445c] mt-0.5">{cellCharts?.signal_strength?.min ?? "-110"} dBm</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium leading-none">Max</div>
                        <div className="text-xs font-bold text-[#00c875] mt-0.5">{cellCharts?.signal_strength?.max ?? "-72"} dBm</div>
                      </div>
                    </div>
                  </div>
                </ChartCard>

                {/* Cell Chart 4: Modem Temperature Trend */}
                <ChartCard
                  title="Modem Temperature"
                  subtitle="24-Hour Average"
                  icon={Thermometer}
                >
                  <div className="flex items-stretch gap-1.5 h-40">
                    <div className="flex-1 h-full relative">
                      {mounted && (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={cellTempTimeline} margin={{ top: 8, right: 0, left: -4, bottom: 0 }}>
                            <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={{ stroke: "#334155", strokeWidth: 0.5 }} tickLine={false} />
                            <YAxis width={28} domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={(v) => `${v}°C`} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomLineTooltip unit="°C" />} />
                            <Line type="monotone" name="Temperature" dataKey="value" stroke="#e2445c" strokeWidth={2} dot={{ r: 2, fill: "#e2445c" }} activeDot={{ r: 4 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="w-14 shrink-0 flex flex-col justify-between py-1 border-l border-slate-100 dark:border-slate-800/80 pl-1.5">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium leading-none">Avg</div>
                        <div className="text-xs font-bold text-[#fdab3d] mt-0.5">{cellCharts?.modem_temperature?.avg ?? "43.5"}°C</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium leading-none">Max</div>
                        <div className="text-xs font-bold text-[#e2445c] mt-0.5">{cellCharts?.modem_temperature?.max ?? "62.0"}°C</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium leading-none">Min</div>
                        <div className="text-xs font-bold text-[#00c875] mt-0.5">{cellCharts?.modem_temperature?.min ?? "28.0"}°C</div>
                      </div>
                    </div>
                  </div>
                </ChartCard>
              </div>
            </div>
          )}

          {/* 4.B DVR & RECORDING CHARTS (4 CHARTS) */}
          {(activeDomainChartTab === "all" || activeDomainChartTab === "dvr") && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#fdab3d]" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    DVR & CCTV Recording Telemetry
                  </span>
                </div>
                <Link
                  href="/dvr-recording"
                  className="text-[11px] font-semibold text-[#0073ea] hover:underline flex items-center gap-1"
                >
                  Go to DVR Page <ChevronRight className="size-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
                {/* DVR Chart 1: CPU - DVR Comm Donut */}
                <ChartCard
                  title="Komunikasi CPU – DVR"
                  subtitle="Status Handshake Hardware"
                  icon={Cpu}
                >
                  <div className="flex items-center gap-2 h-40">
                    <div className="w-32 h-32 relative shrink-0">
                      {mounted && (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip content={<CustomDonutTooltip />} />
                            <Pie
                              data={cpuDvrData}
                              cx="50%"
                              cy="50%"
                              innerRadius={32}
                              outerRadius={50}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {cpuDvrData.map((entry, index) => (
                                <Cell key={`cell-dvr-cpu-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-sm font-black text-slate-900 dark:text-white leading-none">
                          92.5%
                        </span>
                        <span className="text-[9px] text-slate-400">Connected</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1.5 text-xs">
                      {cpuDvrData.map((d) => (
                        <div key={d.name} className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate">
                            <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                            {d.name}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{d.percent}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </ChartCard>

                {/* DVR Chart 2: Status Kamera Donut */}
                <ChartCard
                  title="Camera Status"
                  subtitle="CCTV Channel Distribution"
                  icon={Video}
                >
                  <div className="flex items-center gap-2 h-40">
                    <div className="w-32 h-32 relative shrink-0">
                      {mounted && (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip content={<CustomDonutTooltip />} />
                            <Pie
                              data={statusKameraData}
                              cx="50%"
                              cy="50%"
                              innerRadius={32}
                              outerRadius={50}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {statusKameraData.map((entry, index) => (
                                <Cell key={`cell-dvr-cam-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-sm font-black text-slate-900 dark:text-white leading-none">
                          90.2%
                        </span>
                        <span className="text-[9px] text-slate-400">Online</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1.5 text-xs">
                      {statusKameraData.map((d) => (
                        <div key={d.name} className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate">
                            <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                            {d.name}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{d.percent}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </ChartCard>

                {/* DVR Chart 3: Recording Status Donut */}
                <ChartCard
                  title="Status Recording"
                  subtitle="Distribusi Status Stream"
                  icon={Disc}
                >
                  <div className="flex items-center gap-2 h-40">
                    <div className="w-32 h-32 relative shrink-0">
                      {mounted && (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip content={<CustomDonutTooltip />} />
                            <Pie
                              data={recordingStatusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={32}
                              outerRadius={50}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {recordingStatusData.map((entry, index) => (
                                <Cell key={`cell-dvr-rec-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-sm font-black text-slate-900 dark:text-white leading-none">
                          88.3%
                        </span>
                        <span className="text-[9px] text-slate-400">Recording</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1.5 text-xs">
                      {recordingStatusData.map((d) => (
                        <div key={d.name} className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate">
                            <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                            {d.name}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{d.percent}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </ChartCard>

                {/* DVR Chart 4: Storage Usage Trend AreaChart */}
                <ChartCard
                  title="Storage Usage Trend"
                  subtitle="24-Hour Capacity"
                  icon={HardDrive}
                >
                  <div className="flex items-stretch gap-1.5 h-40">
                    <div className="flex-1 h-full relative">
                      {mounted && (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={dvrStorageTimeline} margin={{ top: 8, right: 0, left: -4, bottom: 0 }}>
                            <defs>
                              <linearGradient id="ovDvrStorageGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#c084fc" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#c084fc" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={{ stroke: "#334155", strokeWidth: 0.5 }} tickLine={false} />
                            <YAxis width={28} domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomMetricTooltip unit="%" color="#c084fc" />} />
                            <Area type="monotone" name="Storage" dataKey="value" stroke="#c084fc" strokeWidth={2} fillOpacity={1} fill="url(#ovDvrStorageGrad)" activeDot={{ r: 4, fill: "#c084fc" }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="w-14 shrink-0 flex flex-col justify-between py-1 border-l border-slate-100 dark:border-slate-800/80 pl-1.5">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium leading-none">Avg</div>
                        <div className="text-xs font-bold text-purple-400 mt-0.5">{dvrCharts?.storage_usage?.avg ?? "72.0"}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium leading-none">Max</div>
                        <div className="text-xs font-bold text-[#e2445c] mt-0.5">{dvrCharts?.storage_usage?.max ?? "88.0"}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium leading-none">Min</div>
                        <div className="text-xs font-bold text-[#00c875] mt-0.5">{dvrCharts?.storage_usage?.min ?? "65.0"}%</div>
                      </div>
                    </div>
                  </div>
                </ChartCard>
              </div>
            </div>
          )}

          {/* 4.C SYSTEM HEALTH CHARTS (4 CHARTS) */}
          {(activeDomainChartTab === "all" || activeDomainChartTab === "system") && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#00c875]" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    SBC System Health Telemetry
                  </span>
                </div>
                <Link
                  href="/system-health"
                  className="text-[11px] font-semibold text-[#0073ea] hover:underline flex items-center gap-1"
                >
                  Go to System Health Page <ChevronRight className="size-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
                {/* Sys Chart 1: CPU Usage */}
                <ChartCard
                  title="CPU Usage"
                  subtitle="All Units Average"
                  icon={Cpu}
                >
                  <div className="flex items-stretch gap-1.5 h-40">
                    <div className="flex-1 h-full relative">
                      {mounted && (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={sysCpuTimeline} margin={{ top: 8, right: 0, left: -4, bottom: 0 }}>
                            <defs>
                              <linearGradient id="ovSysCpuGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00c875" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#00c875" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={{ stroke: "#334155", strokeWidth: 0.5 }} tickLine={false} />
                            <YAxis width={28} domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomMetricTooltip unit="%" color="#00c875" />} />
                            <Area type="monotone" name="CPU Usage" dataKey="value" stroke="#00c875" strokeWidth={2} fillOpacity={1} fill="url(#ovSysCpuGrad)" activeDot={{ r: 4, fill: "#00c875", stroke: "#fff", strokeWidth: 2 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="w-12 shrink-0 flex flex-col justify-between py-1 border-l border-slate-100 dark:border-slate-800/80 pl-1.5">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium leading-none">Avg</div>
                        <div className="text-xs font-bold text-[#00c875] mt-1">{sysCharts?.cpu?.avg ?? "43.2%"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium leading-none">Max</div>
                        <div className="text-xs font-bold text-[#e2445c] mt-1">{sysCharts?.cpu?.max ?? "88.0%"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium leading-none">Min</div>
                        <div className="text-xs font-bold text-[#0073ea] mt-1">{sysCharts?.cpu?.min ?? "12.4%"}</div>
                      </div>
                    </div>
                  </div>
                </ChartCard>

                {/* Sys Chart 2: RAM Usage */}
                <ChartCard
                  title="RAM Usage"
                  subtitle="All Units Average"
                  icon={Cpu}
                >
                  <div className="flex items-stretch gap-1.5 h-40">
                    <div className="flex-1 h-full relative">
                      {mounted && (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={sysRamTimeline} margin={{ top: 8, right: 0, left: -4, bottom: 0 }}>
                            <defs>
                              <linearGradient id="ovSysRamGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0073ea" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#0073ea" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={{ stroke: "#334155", strokeWidth: 0.5 }} tickLine={false} />
                            <YAxis width={28} domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomMetricTooltip unit="%" color="#0073ea" />} />
                            <Area type="monotone" name="RAM Usage" dataKey="value" stroke="#0073ea" strokeWidth={2} fillOpacity={1} fill="url(#ovSysRamGrad)" activeDot={{ r: 4, fill: "#0073ea", stroke: "#fff", strokeWidth: 2 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="w-12 shrink-0 flex flex-col justify-between py-1 border-l border-slate-100 dark:border-slate-800/80 pl-1.5">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium leading-none">Avg</div>
                        <div className="text-xs font-bold text-[#0073ea] mt-1">{sysCharts?.ram?.avg ?? "61.5%"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium leading-none">Max</div>
                        <div className="text-xs font-bold text-[#e2445c] mt-1">{sysCharts?.ram?.max ?? "91.2%"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium leading-none">Min</div>
                        <div className="text-xs font-bold text-[#00c875] mt-1">{sysCharts?.ram?.min ?? "34.0%"}</div>
                      </div>
                    </div>
                  </div>
                </ChartCard>

                {/* Sys Chart 3: SD Card Storage */}
                <ChartCard
                  title="SD Card Storage"
                  subtitle="Average Capacity"
                  icon={HardDrive}
                >
                  <div className="flex items-stretch gap-1.5 h-40">
                    <div className="flex-1 h-full relative">
                      {mounted && (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={sysSdTimeline} margin={{ top: 8, right: 0, left: -4, bottom: 0 }}>
                            <defs>
                              <linearGradient id="ovSysSdGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#fdab3d" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#fdab3d" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={{ stroke: "#334155", strokeWidth: 0.5 }} tickLine={false} />
                            <YAxis width={28} domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomMetricTooltip unit="%" color="#fdab3d" />} />
                            <Area type="monotone" name="SD Storage" dataKey="value" stroke="#fdab3d" strokeWidth={2} fillOpacity={1} fill="url(#ovSysSdGrad)" activeDot={{ r: 4, fill: "#fdab3d", stroke: "#fff", strokeWidth: 2 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="w-12 shrink-0 flex flex-col justify-between py-1 border-l border-slate-100 dark:border-slate-800/80 pl-1.5">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium leading-none">Avg</div>
                        <div className="text-xs font-bold text-[#fdab3d] mt-1">{sysCharts?.sd_card?.avg ?? "42.8%"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium leading-none">Max</div>
                        <div className="text-xs font-bold text-[#e2445c] mt-1">{sysCharts?.sd_card?.max ?? "74.0%"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium leading-none">Min</div>
                        <div className="text-xs font-bold text-[#00c875] mt-1">{sysCharts?.sd_card?.min ?? "20.1%"}</div>
                      </div>
                    </div>
                  </div>
                </ChartCard>

                {/* Sys Chart 4: Uptime Trend */}
                <ChartCard
                  title="Uptime Trend"
                  subtitle="Average Availability"
                  icon={Clock}
                >
                  <div className="flex items-stretch gap-1.5 h-40">
                    <div className="flex-1 h-full relative">
                      {mounted && (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={sysUptimeTimeline} margin={{ top: 8, right: 0, left: -4, bottom: 0 }}>
                            <defs>
                              <linearGradient id="ovSysUpGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0073ea" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#0073ea" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={{ stroke: "#334155", strokeWidth: 0.5 }} tickLine={false} />
                            <YAxis width={28} domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomMetricTooltip unit="%" color="#0073ea" />} />
                            <Area type="monotone" name="Uptime" dataKey="value" stroke="#0073ea" strokeWidth={2} fillOpacity={1} fill="url(#ovSysUpGrad)" activeDot={{ r: 4, fill: "#0073ea", stroke: "#fff", strokeWidth: 2 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="w-12 shrink-0 flex flex-col justify-between py-1 border-l border-slate-100 dark:border-slate-800/80 pl-1.5">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium leading-none">Avg</div>
                        <div className="text-xs font-bold text-[#0073ea] mt-1">{sysCharts?.uptime?.avg ?? "48.5%"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium leading-none">Max</div>
                        <div className="text-xs font-bold text-[#00c875] mt-1">{sysCharts?.uptime?.max ?? "99.8%"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium leading-none">Min</div>
                        <div className="text-xs font-bold text-[#e2445c] mt-1">{sysCharts?.uptime?.min ?? "18.2%"}</div>
                      </div>
                    </div>
                  </div>
                </ChartCard>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* 5. DAFTAR DEVICE YANG SEDANG TROUBLE / ALERT */}
        {/* ========================================================= */}
        <div className="pt-4 space-y-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="size-5 text-rose-500 animate-pulse" />
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Troubled Devices & Active Alerts
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                List of all SmartBox units experiencing cellular issues, DVR/camera alerts, or critical system loads.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30">
                {offlineCount} Critical / Offline
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                {degradedCount} Warning
              </span>
            </div>
          </div>

          {/* Filter Bar & Search Input */}
          <div className="bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-4 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <button
                  onClick={() => setActiveTroubleCategory("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    activeTroubleCategory === "all"
                      ? "bg-[#0073ea] text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  All Issues ({countAllTrouble})
                </button>
                <button
                  onClick={() => setActiveTroubleCategory("critical")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    activeTroubleCategory === "critical"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20"
                  }`}
                >
                  <XCircle className="size-3.5" />
                  Critical ({countCritical})
                </button>
                <button
                  onClick={() => setActiveTroubleCategory("warning")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    activeTroubleCategory === "warning"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20"
                  }`}
                >
                  <AlertTriangle className="size-3.5" />
                  Warning ({countWarning})
                </button>
                <button
                  onClick={() => setActiveTroubleCategory("cellular")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    activeTroubleCategory === "cellular"
                      ? "bg-cyan-600 text-white shadow-xs"
                      : "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20"
                  }`}
                >
                  <Radio className="size-3.5" />
                  Cellular ({countCellular})
                </button>
                <button
                  onClick={() => setActiveTroubleCategory("dvr")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    activeTroubleCategory === "dvr"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
                  }`}
                >
                  <Video className="size-3.5" />
                  DVR/CCTV ({countDVR})
                </button>
                <button
                  onClick={() => setActiveTroubleCategory("system")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    activeTroubleCategory === "system"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                  }`}
                >
                  <Cpu className="size-3.5" />
                  SBC/System ({countSystem})
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-80 shrink-0">
                <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Device ID, location, issue type..."
                  value={troubleSearchQuery}
                  onChange={(e) => setTroubleSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#060c18] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* List Trouble Devices Card Items */}
          <div className="grid grid-cols-1 gap-3">
            {filteredTroubleDevices.map((device) => {
              const isCrit = device.severity === "critical";

              return (
                <div
                  key={device.id}
                  className={`bg-white dark:bg-[#0a1224] rounded-2xl p-4 sm:p-5 border transition-all duration-200 hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isCrit
                      ? "border-rose-500/30 hover:border-rose-500/70 bg-linear-to-r from-rose-500/3 to-transparent"
                      : "border-amber-500/30 hover:border-amber-500/70 bg-linear-to-r from-amber-500/3 to-transparent"
                  }`}
                >
                  {/* Left: Device Info, Location & Alert Details */}
                  <div className="flex items-start gap-3.5">
                    {/* Icon */}
                    <div
                      className={`size-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isCrit
                          ? "bg-rose-500/15 text-rose-500 border border-rose-500/30"
                          : "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                      }`}
                    >
                      {device.category === "cellular" ? (
                        <Radio className="size-5" />
                      ) : device.category === "dvr" ? (
                        <Video className="size-5" />
                      ) : (
                        <Cpu className="size-5" />
                      )}
                    </div>

                    <div className="space-y-1">
                      {/* Baris Device ID + Tags */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                          {device.id}
                        </span>

                        {/* Tag Kategori Domain */}
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            device.category === "cellular"
                              ? "bg-cyan-500/15 text-[#00d2ff] border border-cyan-500/30"
                              : device.category === "dvr"
                              ? "bg-amber-500/15 text-[#fdab3d] border border-amber-500/30"
                              : "bg-emerald-500/15 text-[#00c875] border border-emerald-500/30"
                          }`}
                        >
                          {device.category}
                        </span>

                        {/* Tag Severity */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1 ${
                            isCrit
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {isCrit ? (
                            <XCircle className="size-3" />
                          ) : (
                            <AlertTriangle className="size-3" />
                          )}
                          {device.severity}
                        </span>

                        {/* Model */}
                        <span className="text-[11px] text-slate-400 font-medium">
                          • {device.model}
                        </span>
                      </div>

                      {/* Lokasi Outlet */}
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        📍 {device.location}
                      </p>

                      {/* Deskripsi Isu */}
                      <div className="pt-0.5">
                        <span className="text-xs font-bold text-rose-400 dark:text-rose-300">
                          {device.alertTitle}:{" "}
                        </span>
                        <span className="text-xs text-slate-600 dark:text-slate-300">
                          {device.alertDetail}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Metrik Telemetri, Durasi & Tombol Aksi */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between md:justify-end gap-5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left md:text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">
                        Telemetry Alert
                      </div>
                      <div
                        className={`text-sm font-extrabold font-mono mt-0.5 ${
                          isCrit ? "text-rose-400" : "text-amber-400"
                        }`}
                      >
                        {device.metric}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 md:justify-end">
                        <Clock className="size-3 text-slate-500" />
                        <span>Duration: {device.duration}</span>
                      </div>
                    </div>

                    <Link
                      href={device.reportHref}
                      className="bg-slate-900 hover:bg-[#0073ea] dark:bg-slate-800 dark:hover:bg-[#0073ea] text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all duration-200 cursor-pointer shrink-0"
                    >
                      <span>View Report</span>
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}

            {filteredTroubleDevices.length === 0 && (
              <div className="bg-white dark:bg-[#0a1224] rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="size-10 text-[#00c875] mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  No Devices with Active Incidents
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  All devices in this filter are operating normally or no devices match the search keyword.
                </p>
                <button
                  onClick={() => {
                    setActiveTroubleCategory("all");
                    setTroubleSearchQuery("");
                  }}
                  className="mt-4 px-4 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-white hover:bg-slate-700 cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 5. PUSAT REPORT DETAIL TELEMETRI (DI PALING BAWAH SENDIRI) */}
        {/* ========================================================= */}
        <div className="pt-4 space-y-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Telemetry Reports Hub
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Access comprehensive monthly reports with detailed gateway performance, multi-track timelines, and incident history.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Launchpad 1: Cellular Report */}
            <Link
              href="/reports/cellular"
              className="bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800 hover:border-cyan-500/60 rounded-2xl p-5 shadow-xs transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/5 group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-xl bg-cyan-500/10 text-[#00d2ff] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Radio className="size-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-[#00d2ff] border border-cyan-500/30">
                    2,000 SIM Cards
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                    Report Cellular
                    <ArrowUpRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    CPU-Modem communication uptime, network connectivity, RSRP signal analysis, modem temperature, and monthly incident timeline.
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-4 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-semibold">
                <span>Open Report & Export CSV</span>
                <ChevronRight className="size-4 text-[#00d2ff] group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Launchpad 2: DVR Report */}
            <Link
              href="/reports/dvr"
              className="bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800 hover:border-orange-500/60 rounded-2xl p-5 shadow-xs transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/5 group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-xl bg-orange-500/10 text-[#fdab3d] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Video className="size-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-[#fdab3d] border border-orange-500/30">
                    7,840 Cameras
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                    Report DVR & Recording
                    <ArrowUpRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    CPU-DVR communication SLA, HDD storage retention, 3-track timeline (CPU-DVR, Recording, Camera), and recording event history.
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-4 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-semibold">
                <span>Open Report & Export CSV</span>
                <ChevronRight className="size-4 text-[#fdab3d] group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Launchpad 3: System Health Report */}
            <Link
              href="/reports/health"
              className="bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 rounded-2xl p-5 shadow-xs transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-xl bg-emerald-500/10 text-[#00c875] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Cpu className="size-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-[#00c875] border border-emerald-500/30">
                    2,000 SBCs
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                    Report System Health
                    <ArrowUpRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Average and peak CPU/RAM/SD loads, SD card wear-out life, 24-hour trend charts, and 4-track load spike timeline.
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-4 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-semibold">
                <span>Open Report & Export CSV</span>
                <ChevronRight className="size-4 text-[#00c875] group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
