"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useSystemHealthDashboard,
  useCellularDashboard,
  useDVRDashboard,
} from "@/store/api/monitoring";
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
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
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

// Tipe data device yang sedang trouble
interface TroubleDevice {
  id: string;
  model: "SmartBox Hitam" | "SmartBox Putih";
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
  const [activeTrendTab, setActiveTrendTab] = useState<
    "system" | "cellular" | "dvr" | "uptime"
  >("system");

  // State filter untuk daftar device trouble
  const [activeTroubleCategory, setActiveTroubleCategory] = useState<
    "all" | "critical" | "warning" | "cellular" | "dvr" | "system"
  >("all");
  const [troubleSearchQuery, setTroubleSearchQuery] = useState("");

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

  // Daftar lengkap device yang sedang mengalami gangguan / alert
  const troubleDevices: TroubleDevice[] = [
    {
      id: "gw-dccdec07",
      model: "SmartBox Hitam",
      location: "SmartBox Store 01",
      category: "cellular",
      severity: "critical",
      alertTitle: "Sinyal Drop Ekstrem & Intermittent",
      alertDetail: "RSRP drop ke -110 dBm (Telkomsel), komunikasi paket telemetri terputus-putus.",
      metric: "RSRP: -110 dBm",
      duration: "02:14:30",
      lastUpdated: "5 mnt lalu",
      reportHref: "/reports/cellular",
    },
    {
      id: "gw-3a53d2ff",
      model: "SmartBox Putih",
      location: "RO KALIBATA",
      category: "dvr",
      severity: "warning",
      alertTitle: "Storage HDD Mendekati Penuh",
      alertDetail: "Kapasitas terpakai 3.41 TB / 3.72 TB (92%). Kamera 3 & 4 No Video.",
      metric: "HDD: 92% (3.41 TB)",
      duration: "04:45:12",
      lastUpdated: "12 mnt lalu",
      reportHref: "/reports/dvr",
    },
    {
      id: "697D",
      model: "SmartBox Hitam",
      location: "Alfa Ahmad Dahlan III",
      category: "dvr",
      severity: "critical",
      alertTitle: "DVR Komunikasi Terputus (No Ping)",
      alertDetail: "Hikvision DS-7616NI tidak merespon RTSP / ping port 8000 via switch lokal.",
      metric: "DVR: Offline",
      duration: "05:12:00",
      lastUpdated: "18 mnt lalu",
      reportHref: "/reports/dvr",
    },
    {
      id: "ZR4R",
      model: "SmartBox Putih",
      location: "Alfa Ruko Metland",
      category: "dvr",
      severity: "warning",
      alertTitle: "Kamera Channel 3 No Video",
      alertDetail: "Stream kamera kasir terputus (RTSP timeout), 3 channel lain beroperasi normal.",
      metric: "Kamera: 3/4 Live",
      duration: "06:20:15",
      lastUpdated: "25 mnt lalu",
      reportHref: "/reports/dvr",
    },
    {
      id: "ZJ2B",
      model: "SmartBox Hitam",
      location: "IDM Griya Mustikasari",
      category: "system",
      severity: "warning",
      alertTitle: "Beban CPU Tinggi Berkelanjutan",
      alertDetail: "CPU Load 92% selama >30 menit akibat proses edge visual tracking.",
      metric: "CPU: 92% Spike",
      duration: "01:35:40",
      lastUpdated: "30 mnt lalu",
      reportHref: "/reports/health",
    },
    {
      id: "ZQ81",
      model: "SmartBox Hitam",
      location: "Alfa Raya Hankam Pondok Gede",
      category: "system",
      severity: "critical",
      alertTitle: "Suhu SBC Kritis (Thermal Throttling)",
      alertDetail: "Suhu prosesor mencapai 76°C (Batas aman: 70°C). Kipas pendingin perlu dicek.",
      metric: "Suhu: 76°C",
      duration: "03:10:05",
      lastUpdated: "40 mnt lalu",
      reportHref: "/reports/health",
    },
    {
      id: "ZX33",
      model: "SmartBox Putih",
      location: "IDM Ciledug Raya No. 45",
      category: "cellular",
      severity: "warning",
      alertTitle: "SIM Card Network Flapping",
      alertDetail: "Modem Quectel EC25 sering fallback ke 3G/2G akibat fluktuasi BTS lokal.",
      metric: "Band: 3G Fallback",
      duration: "07:50:00",
      lastUpdated: "1 jam lalu",
      reportHref: "/reports/cellular",
    },
    {
      id: "ZP19",
      model: "SmartBox Hitam",
      location: "Alfa Boulevard Kelapa Gading",
      category: "system",
      severity: "warning",
      alertTitle: "SD Card Endurance Degradasi",
      alertDetail: "Sisa umur kartu memori SD (Wear-out life) tersisa 14%. Rekomendasi pergantian.",
      metric: "SD Life: 14%",
      duration: "12:00:00",
      lastUpdated: "2 jam lalu",
      reportHref: "/reports/health",
    },
    {
      id: "ZB55",
      model: "SmartBox Putih",
      location: "IDM Daan Mogot KM 12",
      category: "dvr",
      severity: "critical",
      alertTitle: "Bad Sector HDD Terdeteksi",
      alertDetail: "SMART status melaporkan 128 reallocated sectors pada hard disk rekaman.",
      metric: "SMART: Bad Sector",
      duration: "08:15:30",
      lastUpdated: "2 jam lalu",
      reportHref: "/reports/dvr",
    },
    {
      id: "ZL04",
      model: "SmartBox Hitam",
      location: "Alfa Veteran Bintaro",
      category: "cellular",
      severity: "critical",
      alertTitle: "Modem Tidak Merespon AT Command",
      alertDetail: "Komunikasi serial USB-to-Modem timeout, koneksi data terputus total.",
      metric: "Port: USB Timeout",
      duration: "09:40:10",
      lastUpdated: "3 jam lalu",
      reportHref: "/reports/cellular",
    },
    {
      id: "ZM11",
      model: "SmartBox Putih",
      location: "IDM Margonda Raya Depok",
      category: "cellular",
      severity: "warning",
      alertTitle: "Latency Seluler RTT Sangat Tinggi",
      alertDetail: "Round-trip time mencapai 1,420 ms (Normal: <250 ms), paket telemetri delay.",
      metric: "RTT: 1,420 ms",
      duration: "01:10:20",
      lastUpdated: "3 jam lalu",
      reportHref: "/reports/cellular",
    },
    {
      id: "ZK88",
      model: "SmartBox Hitam",
      location: "Alfa Cinere Raya",
      category: "dvr",
      severity: "warning",
      alertTitle: "Kamera Channel 2 Frame Drop",
      alertDetail: "FPS video turun ke 4 fps (Target: 25 fps), kualitas rekaman kasir terdegradasi.",
      metric: "FPS: 4 fps (Drop)",
      duration: "03:40:00",
      lastUpdated: "4 jam lalu",
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
    <AppLayout title="Overview">
      <div className="space-y-6 max-w-[1600px] mx-auto pb-12 font-sans transition-colors">
        {/* ========================================================= */}
        {/* 1. SIMPLE CLEAN HEADER */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Ringkasan performa 2,000 SmartBox Gateway, status kesehatan sistem, dan telemetri armada.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Quick Live Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
              <span className="size-2 rounded-full bg-[#00c875] animate-ping" />
              <span className="font-bold text-[#00c875]">{onlinePct}% Online</span>
              <span className="text-slate-400">({onlineCount}/{totalGateways})</span>
            </div>

            <Link
              href="/reports/cellular"
              className="bg-[#0073ea] hover:bg-blue-600 active:scale-95 text-white text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <FileSpreadsheet className="size-3.5" />
              <span>Buka Reports</span>
            </Link>
          </div>
        </div>

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
              <span>Hitam: 1,240 • Putih: 760</span>
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
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Rata-rata CPU</div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white">
                    {systemDashboard?.charts?.cpu?.avg ? `${systemDashboard.charts.cpu.avg}%` : "32%"}
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal ml-1.5">
                      Max {systemDashboard?.charts?.cpu?.max ? `${systemDashboard.charts.cpu.max}%` : "78%"}
                    </span>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Rata-rata RAM</div>
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
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Suhu Sistem</div>
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
                      Cellular Connectivity
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
                    Analisis fluktuasi metrik historis 24 jam di seluruh armada
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
                          ? "Storage Terpakai"
                          : activeTrendTab === "uptime"
                          ? "Fleet Uptime"
                          : "Load Rata-rata"
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
                      <div className="font-bold text-slate-900 dark:text-white">SmartBox Hitam</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">RPi 3B+ / RK3328</div>
                    </div>
                    <span className="text-sm font-extrabold text-blue-500 dark:text-blue-400">1,240</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">SmartBox Putih</div>
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
        {/* 4. DAFTAR DEVICE YANG SEDANG TROUBLE / ALERT */}
        {/* ========================================================= */}
        <div className="pt-4 space-y-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="size-5 text-rose-500 animate-pulse" />
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Daftar Device Bermasalah & Alert Aktif
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Daftar semua unit SmartBox yang sedang mengalami gangguan seluler, DVR/kamera, atau beban sistem kritis.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30">
                {offlineCount} Kritis / Offline
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
                  Semua Trouble ({countAllTrouble})
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
                  Kritis ({countCritical})
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
                  Seluler ({countCellular})
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
                  placeholder="Cari Device ID, lokasi, jenis isu..."
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
                        Telemetri Alert
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
                        <span>Durasi: {device.duration}</span>
                      </div>
                    </div>

                    <Link
                      href={device.reportHref}
                      className="bg-slate-900 hover:bg-[#0073ea] dark:bg-slate-800 dark:hover:bg-[#0073ea] text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all duration-200 cursor-pointer shrink-0"
                    >
                      <span>Buka Report</span>
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
                  Tidak Ada Device Yang Mengalami Gangguan
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Semua device dalam filter ini beroperasi normal atau tidak ada device yang cocok dengan kata kunci pencarian.
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
                Pusat Report Detail Telemetri
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Akses report komprehensif bulanan lengkap dengan detail performa gateway, multi-track timeline, dan riwayat gangguan.
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
                    Report Cellular Connectivity
                    <ArrowUpRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Uptime komunikasi CPU-Modem, koneksi jaringan, analisis sinyal RSRP, temperatur modem, dan timeline gangguan bulanan.
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-4 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-semibold">
                <span>Buka Report & Export CSV</span>
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
                    SLA komunikasi CPU-DVR, retensi storage HDD, 3-track timeline (CPU-DVR, Recording, Kamera), dan riwayat event rekaman.
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-4 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-semibold">
                <span>Buka Report & Export CSV</span>
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
                    Beban rata-rata dan puncak CPU/RAM/SD, wear-out life SD card, grafik tren 24 jam, dan 4-track timeline lonjakan beban.
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-4 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-semibold">
                <span>Buka Report & Export CSV</span>
                <ChevronRight className="size-4 text-[#00c875] group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
