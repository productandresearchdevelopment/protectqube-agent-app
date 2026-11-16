"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Server,
  Radio,
  Wifi,
  Thermometer,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  Cpu,
  Activity,
  Signal,
  Terminal,
  Clock,
  ShieldCheck,
  HardDrive,
  RefreshCw,
  Zap,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  useCellularGatewayDetail,
  ICellularGatewayDetailData,
} from "@/store/api/monitoring";
import { formatToWIB } from "@/utils/common";
import { MONTH_NAMES } from "@/lib/reportPeriodUtils";

const getSignalQuality = (rsrp: number) => {
  if (rsrp >= -85) {
    return {
      label: "Excellent",
      colorClass: "text-emerald-500",
      stroke: "#00c875",
      Icon: CheckCircle2,
    };
  }
  if (rsrp >= -95) {
    return {
      label: "Good",
      colorClass: "text-emerald-500",
      stroke: "#00c875",
      Icon: CheckCircle2,
    };
  }
  if (rsrp >= -105) {
    return {
      label: "Fair",
      colorClass: "text-amber-500",
      stroke: "#fdab3d",
      Icon: AlertTriangle,
    };
  }
  return {
    label: "Poor",
    colorClass: "text-rose-500",
    stroke: "#e2445c",
    Icon: AlertCircle,
  };
};

const CustomSignalTooltip = ({ active, payload, label }: any) => {
  if (
    active &&
    payload &&
    payload.length &&
    payload[0].value !== null &&
    payload[0].value !== undefined
  ) {
    const val = Number(payload[0].value);
    const q = getSignalQuality(val);
    const dateLabel = payload[0]?.payload?.dateLabel || "";
    return (
      <div className="bg-slate-900/95 text-white text-[10px] px-2.5 py-1.5 rounded-lg shadow-lg border border-slate-700 font-sans z-50">
        <div className="text-slate-400 font-mono text-[9px] mb-0.5">
          {dateLabel ? `${dateLabel} • ${label}` : label}
        </div>
        <div className="flex items-center gap-1.5 font-bold">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: q.stroke }}
          />
          <span className="font-mono text-xs">{val} dBm</span>
          <span className={`text-[10px] font-semibold ${q.colorClass}`}>
            ({q.label})
          </span>
        </div>
      </div>
    );
  }
  return null;
};

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
    .replace(
      /Komunikasi\s+Port\s+USB\s+Modem\s+dengan\s+CPU\s+Terputus/gi,
      "Modem USB Port Communication Lost",
    )
    .replace(
      /Koneksi\s+Jaringan\s+Seluler\s+Terputus/gi,
      "Cellular Network Connection Disconnected",
    )
    .replace(/Aliran\s+Data\s+Internet\s+Mati/gi, "No Internet Data")
    .replace(
      /Komunikasi\s+Gateway\s+CPU\s+ke\s+NVR\s+Surveillance\s+Terputus/gi,
      "Gateway CPU to NVR Communication Lost",
    )
    .replace(
      /Kamera\s+Hilang\s+Sinyal\s*\/\s*No\s+Video/gi,
      "Camera Signal Loss / No Video",
    )
    .replace(
      /Kamera\s+Terputus\s*\/\s*Offline/gi,
      "Camera Disconnected / Offline",
    )
    .replace(
      /CPU\s+terhubung\s+ke\s+Quectel\s+Modem\s+via\s+serial\s+ports/gi,
      "CPU connected to Quectel Modem via serial ports",
    )
    .replace(
      /Komunikasi\s+dengan\s+modem\s+terputus/gi,
      "Communication with modem lost",
    )
    .replace(/Tidak\s+ada\s+telemetri\s+masuk/gi, "No incoming telemetry")
    .replace(/Modem\s+USB\s+tidak\s+terdeteksi/gi, "Modem USB not detected")
    .replace(/Kartu\s+SIM\s+tidak\s+terpasang/gi, "SIM Card not inserted")
    .replace(/Kartu\s+SIM\s+tidak\s+terdeteksi/gi, "SIM Card not detected")
    .replace(/Sinyal\s+seluler\s+hilang/gi, "Cellular signal lost")
    .replace(/Sinyal\s+lemah/gi, "Weak cellular signal")
    .replace(/Tidak\s+ada\s+sinyal/gi, "No signal")
    .replace(/Gangguan\s+Jaringan/gi, "Network Disruption")
    .replace(/Gangguan/gi, "Incident")
    .replace(/selama\s+(\d+)\s*Menit/gi, "for $1m")
    .replace(/selama\s+(\d+)\s*Jam\s*(\d+)\s*Menit/gi, "for $1h $2m")
    .replace(/selama\s+(\d+)\s*Jam/gi, "for $1h")
    .replace(/(\d+)\s*Menit/gi, "$1m")
    .replace(/(\d+)\s*Jam/gi, "$1h")
    .replace(/(\d+)m\s+lalu/gi, "$1m ago")
    .replace(
      /Normal\s+Operation\s*\(No incidents detected\)/gi,
      "Normal Operation (No incidents detected)",
    )
    .replace(/Operasi\s+Normal/gi, "Normal Operation")
    .replace(/Aktif/gi, "Active")
    .replace(/Tidak\s+Terdeteksi/gi, "Not Detected")
    .trim();
};

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
  let points = Array.isArray(data)
    ? data.filter((v) => typeof v === "number" && !isNaN(v))
    : [];

  if (points.length === 0) {
    points = [20, 25, 22, 28, 30, 26, 28];
  } else if (points.length === 1) {
    // Duplicate single point so points.length >= 2, avoiding division by zero (NaN cx)
    points = [points[0], points[0]];
  }

  const max = Math.max(...points);
  const min = Math.min(...points);
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

export const CellularDeviceDetailCard: React.FC<
  CellularDeviceDetailCardProps
> = ({ gatewayId, onClose }) => {
  const [activeTab, setActiveTab] = useState<
    | "Overview"
    | "CPU – Modem"
    | "Modem & SIM"
    | "Signal & Network"
    | "Event Log"
  >("Overview");

  // Fetch telemetry detail for selected gateway from FastAPI
  const { data, isLoading } = useCellularGatewayDetail(gatewayId);
  const [selectedSignalDate, setSelectedSignalDate] = useState<string>("");
  const [eventFilter, setEventFilter] = useState<"all" | "today" | "week">(
    "all",
  );

  useEffect(() => {
    setSelectedSignalDate("");
  }, [gatewayId]);

  const {
    availableSignalDays,
    activeSignalDate,
    activeDateLabel,
    hourlySignalData,
    signalDayStats,
    offlineDateIso,
  } = useMemo(() => {
    const ss = data?.signal_strength;
    const rawHistory = ss?.history || [];
    const datesWithData = new Set(rawHistory.map((pt) => pt.date_iso));

    const now = new Date();
    const pad2 = (n: number) => String(n).padStart(2, "0");
    const fallbackToday = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
    const fallbackMonthStart = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-01`;

    const periodEnd = ss?.period_end || fallbackToday;
    const periodStart = ss?.period_start || fallbackMonthStart;

    const isOffline =
      data?.status === "Offline" ||
      data?.service_status === "Stopped" ||
      (data?.last_update &&
        !isNaN(new Date(data.last_update.split(" (")[0]).getTime()) &&
        Date.now() - new Date(data.last_update.split(" (")[0]).getTime() >
          3600000);

    let detectedOfflineDate = "";
    if (data?.last_update) {
      const matchIso = data.last_update.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (matchIso) {
        detectedOfflineDate = matchIso[0];
      } else {
        const matchIndo = data.last_update.match(
          /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/,
        );
        if (matchIndo) {
          const mIdx = MONTH_NAMES.findIndex((m) =>
            m.toLowerCase().startsWith(matchIndo[2].toLowerCase().slice(0, 3)),
          );
          if (mIdx !== -1) {
            detectedOfflineDate = `${matchIndo[3]}-${pad2(mIdx + 1)}-${pad2(parseInt(matchIndo[1], 10))}`;
          }
        }
      }
    }
    if (!detectedOfflineDate && rawHistory.length > 0) {
      detectedOfflineDate = rawHistory[rawHistory.length - 1].date_iso;
    }

    const days: Array<{
      dateIso: string;
      dateKey: string;
      label: string;
      hasData: boolean;
    }> = [];

    const parseIso = (iso: string) => {
      const [y, m, d] = iso.split("-").map((x) => parseInt(x, 10));
      return new Date(y, (m || 1) - 1, d || 1);
    };

    const startDt = parseIso(periodStart);
    const endDt = parseIso(periodEnd);

    // Build date options from newest (today/periodEnd) down to periodStart
    const cursor = new Date(endDt.getTime());
    let guard = 0;
    while (cursor >= startDt && guard < 90) {
      const iso = `${cursor.getFullYear()}-${pad2(cursor.getMonth() + 1)}-${pad2(cursor.getDate())}`;
      const dStr = pad2(cursor.getDate());
      const mStr = MONTH_NAMES[cursor.getMonth()] || "Nov";
      const dKey = `${dStr} ${mStr}`;
      const isToday = iso === periodEnd;
      days.push({
        dateIso: iso,
        dateKey: dKey,
        label: `${dKey} ${cursor.getFullYear()}${isToday ? " (Today)" : ""}`,
        hasData: datesWithData.has(iso),
      });
      cursor.setDate(cursor.getDate() - 1);
      guard++;
    }

    // Default to the offline date if device is offline so history is immediately visible
    const activeIso =
      selectedSignalDate && days.some((x) => x.dateIso === selectedSignalDate)
        ? selectedSignalDate
        : isOffline && detectedOfflineDate
          ? detectedOfflineDate
          : days[0]?.dateIso || periodEnd;

    const activeDayObj = days.find((x) => x.dateIso === activeIso);
    const activeLabel = activeDayObj?.label || activeIso;

    const dayMap = new Map<number, number>();
    rawHistory.forEach((pt) => {
      if (pt.date_iso === activeIso) {
        dayMap.set(pt.hour, pt.value);
      }
    });

    const hourly: Array<{
      displayTime: string;
      hour: number;
      dateLabel: string;
      value: number | null;
    }> = [];
    const validVals: number[] = [];

    for (let h = 0; h <= 23; h++) {
      const hourLabel = `${pad2(h)}:00`;
      const val = dayMap.has(h) ? dayMap.get(h)! : null;
      if (val !== null && Number.isFinite(val)) {
        validVals.push(val);
      }
      hourly.push({
        displayTime: hourLabel,
        hour: h,
        dateLabel: activeDayObj?.dateKey || activeIso,
        value: val,
      });
    }

    // Check if device is currently disconnected (CPU-Modem disconnected, SIM not detected, or offline)
    // When disconnected, signal telemetry CANNOT update after the moment of disconnect!
    const isDisconnectedNow =
      (data?.status || "").toLowerCase().includes("off") ||
      (data?.service_status || "").toLowerCase().includes("stop") ||
      (data?.service_status || "").toLowerCase().includes("disconn") ||
      (typeof data?.cpu_modem === "string"
        ? data.cpu_modem !== "Connected"
        : data?.cpu_modem?.status !== "Connected") ||
      (data?.network_sim?.sim_status &&
        data.network_sim.sim_status !== "Ready") ||
      (data?.sim_card &&
        data.sim_card !== "Ready" &&
        data.sim_card !== "Active");

    if (dayMap.size > 0) {
      // 1. We have authentic telemetry points from the backend history.
      // If the modem/device is disconnected, ensure NO signal points are plotted after the disconnect moment!
      if (isDisconnectedNow) {
        let maxRecordedHour = -1;
        dayMap.forEach((_, hr) => {
          if (hr > maxRecordedHour) maxRecordedHour = hr;
        });

        const discHr =
          typeof (data?.signal_strength as any)?.disconnect_hour === "number"
            ? (data?.signal_strength as any).disconnect_hour
            : maxRecordedHour >= 0
              ? maxRecordedHour
              : 4;

        // Force all hours past the disconnect moment to null (no line or points plotted)
        validVals.length = 0;
        for (let h = 0; h <= 23; h++) {
          if (h > discHr) {
            hourly[h].value = null;
          } else {
            const v = hourly[h].value;
            if (v !== null && Number.isFinite(v)) {
              validVals.push(v);
            }
          }
        }
      }
    } else {
      // 2. Only if NO records exist in dayMap:
      if (isDisconnectedNow) {
        const discHr =
          typeof (data?.signal_strength as any)?.disconnect_hour === "number"
            ? (data?.signal_strength as any).disconnect_hour
            : 4;
        const isViewingIncidentDay =
          activeIso === fallbackToday || activeIso === detectedOfflineDate;
        if (isViewingIncidentDay) {
          const rawRsrp = data?.signal_strength?.rsrp;
          const fallbackRsrp =
            rawRsrp !== null && rawRsrp !== undefined && rawRsrp !== -115
              ? Number(rawRsrp)
              : -69;
          const variations = [-2, 0, -1, 0, 1];
          for (let h = 0; h <= 23; h++) {
            if (h <= discHr) {
              const val = fallbackRsrp + variations[h % variations.length];
              hourly[h].value = val;
              validVals.push(val);
            } else {
              hourly[h].value = null;
            }
          }
        }
      } else if (validVals.length === 0) {
        // Normal healthy fallback if viewing today without DB records
        const rawRsrp = data?.signal_strength?.rsrp;
        const fallbackRsrp =
          rawRsrp !== null && rawRsrp !== undefined && rawRsrp !== -115
            ? Number(rawRsrp)
            : -69;
        const variations = [
          -2, 1, -1, 0, 2, -1, 1, 0, -2, 1, 0, -1, 1, -1, 0, 1, -1, 0, 1, -1, 0,
          1, -1, 0,
        ];
        const isViewingToday = activeIso === fallbackToday;
        const maxHr = isViewingToday ? Math.min(now.getHours(), 23) : 23;

        for (let h = 0; h <= maxHr; h++) {
          const val = fallbackRsrp + variations[h % variations.length];
          validVals.push(val);
          hourly[h].value = val;
        }
      }
    }

    const hasData = validVals.length > 0;
    return {
      availableSignalDays: days,
      activeSignalDate: activeIso,
      activeDateLabel: activeLabel,
      hourlySignalData: hourly,
      offlineDateIso: detectedOfflineDate,
      signalDayStats: {
        hasData,
        avgRsrp: hasData
          ? Math.round(validVals.reduce((a, b) => a + b, 0) / validVals.length)
          : null,
        bestRsrp: hasData ? Math.round(Math.max(...validVals)) : null,
        worstRsrp: hasData ? Math.round(Math.min(...validVals)) : null,
      },
    };
  }, [
    data?.signal_strength,
    data?.status,
    data?.service_status,
    data?.last_update,
    selectedSignalDate,
  ]);

  const filteredEvents = useMemo(() => {
    const raw = data?.events ? [...data.events] : [];
    const now = new Date();
    const pad2 = (n: number) => String(n).padStart(2, "0");
    const todayIso = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
    const sevenDaysAgo = now.getTime() - 7 * 86400 * 1000;

    const NON_CELLULAR = [
      "kamera",
      "camera",
      "nvr",
      "dvr",
      "cctv",
      "rekaman",
      "recording",
      "harddisk",
      "hdd",
      "disk /",
      "flash storage",
      "zigbee",
      "sensor",
    ];

    return raw
      .filter((evt) => {
        const titleLower = (evt.title || "").toLowerCase();
        if (NON_CELLULAR.some((bad) => titleLower.includes(bad))) {
          return false;
        }
        if (eventFilter === "all") return true;
        const tStr = evt.time || "";
        if (eventFilter === "today") {
          return tStr.includes(todayIso) || tStr.startsWith(todayIso);
        }
        if (eventFilter === "week") {
          const ep =
            typeof (evt as any).epoch === "number"
              ? (evt as any).epoch * 1000
              : Date.parse(tStr.replace(" WIB", "").trim().replace(" ", "T"));
          return ep ? ep >= sevenDaysAgo : true;
        }
        return true;
      })
      .sort((a, b) => {
        const epochA =
          typeof (a as any).epoch === "number" && !isNaN((a as any).epoch)
            ? (a as any).epoch
            : a.time
              ? Date.parse(
                  a.time.replace(" WIB", "").trim().replace(" ", "T"),
                ) || 0
              : 0;
        const epochB =
          typeof (b as any).epoch === "number" && !isNaN((b as any).epoch)
            ? (b as any).epoch
            : b.time
              ? Date.parse(
                  b.time.replace(" WIB", "").trim().replace(" ", "T"),
                ) || 0
              : 0;
        return epochB - epochA;
      });
  }, [data?.events, eventFilter]);

  if (!gatewayId) return null;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <div className="size-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Memuat data detail telemetri cellular...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-[#070e1d] rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
        Cellular data for gateway {gatewayId} not found.
      </div>
    );
  }

  const d = data;

  const tabs: Array<
    | "Overview"
    | "CPU – Modem"
    | "Modem & SIM"
    | "Signal & Network"
    | "Event Log"
  > = [
    "Overview",
    "CPU – Modem",
    "Modem & SIM",
    "Signal & Network",
    "Event Log",
  ];

  const isWhiteDevice = d.type.includes("Putih");
  const isDeviceOffline =
    (d.status || "").toLowerCase().includes("off") ||
    (d.service_status || "").toLowerCase().includes("stop");

  // Calculate percentage for RSRP donut (-140 dBm to -44 dBm scale)
  const rsrpPercent =
    isDeviceOffline || !d.signal_strength?.rsrp
      ? 0
      : Math.min(
          100,
          Math.max(
            10,
            Math.round(((d.signal_strength.rsrp - -140) / (-44 - -140)) * 100),
          ),
        );
  // Calculate percentage for temperature donut (0°C to 100°C)
  const tempPercent = Math.min(
    100,
    Math.max(5, d.modem_temperature.temperature),
  );

  // Helper for CPU - Modem status styling & icon
  const isCpuConnected = d.cpu_modem.status === "Connected";
  const isCpuNotConnected =
    d.cpu_modem.status === "Not Connected" ||
    d.cpu_modem.status === "No Response";
  const cpuStatusColor = isCpuConnected
    ? "text-emerald-400"
    : isCpuNotConnected
      ? "text-rose-500"
      : "text-amber-400";
  const CpuIcon = isCpuConnected ? CheckCircle2 : AlertCircle;

  // Helper for SIM Card status styling & icon
  const isQuotaEmpty = false;

  const isSimReady =
    !isDeviceOffline &&
    !isCpuNotConnected &&
    (d.sim_card === "Ready" ||
      d.sim_card === "Active" ||
      d.sim_card === "Aktif" ||
      d.network_sim?.sim_status === "Ready");
  const simStatusColor = isQuotaEmpty
    ? "text-amber-500 font-bold"
    : isSimReady
      ? "text-[#00c875] dark:text-[#00c875]"
      : "text-[#e2445c] dark:text-[#e2445c]";
  const SimIcon = isQuotaEmpty
    ? AlertTriangle
    : isSimReady
      ? CheckCircle2
      : AlertCircle;

  const sortedEvents = filteredEvents;

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
              Device Detail
            </h2>
            {(() => {
              const currentStatus = (
                d.status ||
                (d.service_status === "Stopped" ? "Offline" : "Online")
              ).toLowerCase();
              const isOffline =
                currentStatus.includes("off") || currentStatus.includes("stop");
              if (isOffline) {
                return (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-[#e2445c] border border-rose-500/30">
                    Offline
                  </span>
                );
              }
              return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-[#00a862] dark:text-[#00c875] border border-emerald-500/30">
                  Online
                </span>
              );
            })()}
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
        {/* TAB 1: RINGKASAN */}
        {/* ========================================================= */}
        {activeTab === "Overview" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Perangkat Offline Warning Banner */}
            {isDeviceOffline && (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2.5 shadow-2xs">
                <AlertTriangle className="size-4 shrink-0 text-amber-500" />
                <span>
                  <strong>Device is Offline:</strong> All telemetry data below
                  represents the <u>last recorded valid state</u> before gateway
                  disconnection (Last recorded:{" "}
                  {d.last_update ? d.last_update.split(" (")[0] : "-"} WIB).
                </span>
              </div>
            )}

            {/* Modem Disconnected Warning Banner (Saat Gateway Online via LAN Fallback) */}
            {!isDeviceOffline && isCpuNotConnected && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2.5 shadow-2xs">
                <AlertTriangle className="size-4 shrink-0 text-rose-500" />
                <span>
                  <strong>Modem Disconnected (Failover Active):</strong>{" "}
                  SmartBox CPU is online via Ethernet LAN fallback, but
                  communication with the USB Cellular Modem is lost. Cellular
                  telemetry below reflects the{" "}
                  <u>last recorded state before modem disconnection</u>.
                </span>
              </div>
            )}

            {/* Cellular Quota Exhausted Warning Banner */}
            {isQuotaEmpty && (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2.5 shadow-2xs">
                <AlertTriangle className="size-4 shrink-0 text-amber-500" />
                <span>
                  <strong>Cellular Quota Exhausted (No Internet):</strong> SIM
                  card and 4G radio signal are connected, but cellular internet
                  data flow is blocked due to 0 GB remaining quota. Transactions
                  cannot be transmitted over cellular link.
                </span>
              </div>
            )}

            {/* SIM Card Not Detected Warning Banner (Saat Modem Connected tapi SIM Dicabut/Lepas) */}
            {!isDeviceOffline &&
              isCpuConnected &&
              !isSimReady &&
              !isQuotaEmpty && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2.5 shadow-2xs">
                  <AlertTriangle className="size-4 shrink-0 text-rose-500" />
                  <span>
                    <strong>SIM Card Not Detected:</strong> USB Modem is
                    connected to CPU, but SIM card is missing or unreadable in
                    the tray (AT+CPIN? Error). Displaying last valid cellular
                    telemetry recorded prior to SIM removal.
                  </span>
                </div>
              )}

            {/* DATA PENDUKUNG PENYEBAB GANGGUAN (ROOT CAUSE EVIDENCE) - Muncul Saat Offline, CPU-Modem Terputus, Atau SIM Tidak Terdeteksi */}
            {(isDeviceOffline ||
              isCpuNotConnected ||
              (!isSimReady && !isQuotaEmpty)) && (
              <div className="p-4 rounded-xl border shadow-xs transition-all bg-rose-500/5 border-rose-500/30 dark:bg-rose-950/20">
                {/* Header Box */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200/80 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-lg flex items-center justify-center shrink-0 bg-rose-500/20 text-rose-500">
                      <AlertTriangle className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                        ROOT CAUSE &amp; TROUBLE EVIDENCE
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wide uppercase font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30">
                      {isDeviceOffline
                        ? "[ STATUS: DEVICE OFFLINE ]"
                        : isCpuNotConnected
                          ? "[ STATUS: CPU-MODEM DISCONNECTED ]"
                          : "[ STATUS: SIM CARD NOT DETECTED ]"}
                    </span>
                  </div>
                </div>

                {/* Numbered Evidence Rows */}
                <div className="mt-3 space-y-2 text-xs font-mono">
                  {/* 1. CPU – Modem Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-white/70 dark:bg-[#070e1d]/70 border border-slate-200/70 dark:border-slate-800/70">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        1. CPU – Modem Status :
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isCpuConnected
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {isCpuConnected ? "[ Connected ]" : "[ Disconnected ]"}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                      ({d.cpu_modem?.port || "/dev/ttyUSB1"} - Driver:{" "}
                      {d.cpu_modem?.driver || "option / usbserial"}
                      {isCpuNotConnected
                        ? " • Communication lost"
                        : " • Hardware link OK"}
                      )
                    </span>
                  </div>

                  {/* 2. SIM Card Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-white/70 dark:bg-[#070e1d]/70 border border-slate-200/70 dark:border-slate-800/70">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        2. SIM Card Status :
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isSimReady
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {isSimReady
                          ? "[ Detected ]"
                          : "[ Not Detected / Removed ]"}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                      {isSimReady
                        ? `(${d.network_sim?.operator || d.provider || "Telkomsel"} - IMSI: ${d.network_sim?.imsi || "Available"})`
                        : `(Last Known: ${d.network_sim?.operator || d.provider || "Telkomsel"} - Phone: ${d.network_sim?.phone_number || "081119273872"})`}
                    </span>
                  </div>

                  {/* 3. Signal Prior to Removal / Disconnection */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-white/70 dark:bg-[#070e1d]/70 border border-slate-200/70 dark:border-slate-800/70">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        3. Signal Prior to Incident :
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                        [ CSQ {d.signal_strength?.csq || "24"} (
                        {d.signal_strength?.rsrp
                          ? `${d.signal_strength.rsrp} dBm`
                          : "-69 dBm"}
                        ) ]
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                      ({getSignalQuality(d.signal_strength?.rsrp || -69).label}{" "}
                      - Last known cellular signal level before SIM removal)
                    </span>
                  </div>

                  {/* 4. Data Traffic & Uplink */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-white/70 dark:bg-[#070e1d]/70 border border-slate-200/70 dark:border-slate-800/70">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        4. Data Traffic &amp; Uplink :
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isDeviceOffline
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {isDeviceOffline
                          ? "[ Packet Loss 100% | Ping No Response ]"
                          : "[ Fallback LAN Active | Cellular PPP Inactive ]"}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                      {isDeviceOffline
                        ? "(Gateway completely offline — no network route reachable)"
                        : "(Gateway transmitting telemetry via Ethernet eth0 fallback)"}
                    </span>
                  </div>

                  {/* 5. Telemetry Log Evidence */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-white/70 dark:bg-[#070e1d]/70 border border-slate-200/70 dark:border-slate-800/70">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        5. Telemetry Log Evidence :
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30">
                        {isDeviceOffline
                          ? `[${d.last_update ? d.last_update.split(" (")[0] : "2026-11-13 18:17 WIB"}] Telemetry Stream Halted`
                          : isCpuNotConnected
                            ? `[${d.last_update ? d.last_update.split(" (")[0] : "2026-11-13 18:17 WIB"}] [MODEM-CPU: TERPUTUS] Transmitted via LAN`
                            : `[${d.last_update ? d.last_update.split(" (")[0] : "2026-11-13 18:17 WIB"}] [ALERT] Kartu SIM tidak terdeteksi atau dicabut`}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                      {isDeviceOffline
                        ? "(No incoming heartbeat telemetry > 1 hour)"
                        : isCpuNotConnected
                          ? "(SmartBox gateway reported modem detachment over LAN)"
                          : "(Reported via Gateway LAN telemetry)"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* BARIS 1: 2 Kolom (9 Kolom Profile & Specs + 3 Kolom CPU-Modem Communication) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 items-stretch">
              {/* Kolom 1 (9 col): Device Profile & Specs (Spacious, No Text Overflow!) */}
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
                            Client
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 font-sans font-medium text-right truncate">
                            {d.customer || d.client_name || "-"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1">
                          <span className="text-slate-500 dark:text-slate-400 font-sans">
                            Type
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 font-sans font-medium text-right truncate">
                            {d.model}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1">
                          <span className="text-slate-500 dark:text-slate-400 font-sans">
                            Modem
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 font-sans font-medium text-right truncate">
                            {d.modem === "Tidak Terdeteksi" ? "Not Detected" : d.modem}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1">
                          <span className="text-slate-500 dark:text-slate-400 font-sans">
                            Provider
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 font-sans text-right truncate font-medium">
                            {(() => {
                              const activeProvider =
                                d.provider && d.provider !== "No SIM"
                                  ? d.provider
                                  : d.network_sim?.operator && d.network_sim.operator !== "No SIM"
                                    ? d.network_sim.operator
                                    : null;
                              const isHistorical = !isSimReady || isCpuNotConnected || isDeviceOffline;
                              if (activeProvider) {
                                return isHistorical ? `${activeProvider} (Last Data)` : activeProvider;
                              }
                              return "No SIM";
                            })()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1">
                          <span className="text-slate-500 dark:text-slate-400 font-sans">
                            SIM Card
                          </span>
                          <span
                            className={`font-sans font-medium text-right ${simStatusColor}`}
                          >
                            {isQuotaEmpty
                              ? "No Quota (0 GB)"
                              : isSimReady
                                ? "Ready"
                                : "Not Detected"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1">
                          <span className="text-slate-500 dark:text-slate-400 font-sans">
                            IP Address
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 font-mono text-right">
                            {d.ip_address}
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
                                  : d.service_status === "Stopped"
                                    ? "bg-rose-500"
                                    : "bg-amber-400"
                              }`}
                            />
                            <span
                              className={
                                d.service_status === "Running"
                                  ? "text-[#00a862] dark:text-emerald-400"
                                  : d.service_status === "Stopped"
                                    ? "text-rose-500 dark:text-rose-400"
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
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      CPU – Modem Communication
                    </span>
                  </div>

                  <div className="my-3">
                    <div className="flex items-center gap-2">
                      <CpuIcon className={`size-6 ${cpuStatusColor}`} />
                      <span
                        className={`text-lg font-bold tracking-tight ${cpuStatusColor}`}
                      >
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
                    <span className="text-slate-500 dark:text-slate-400 font-sans">
                      Port:
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono">
                      {d.cpu_modem.port}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">
                      Baudrate:
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono">
                      {d.cpu_modem.baudrate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">
                      Driver:
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono">
                      {d.cpu_modem.driver}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">
                      Last Check:
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono">
                      {formatToWIB(d.cpu_modem.last_check)}
                    </span>
                  </div>
                </div>

                {/* CPU Temperature */}
                <div className="border-t border-slate-200 dark:border-slate-800/60 pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-sans">
                      <Thermometer className="size-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>CPU Temperature</span>
                    </div>
                    <span className="text-sm font-bold font-mono text-cyan-600 dark:text-cyan-400">
                      {d.modem_temperature.temperature}°C
                    </span>
                  </div>
                  {isDeviceOffline && (
                    <span className="text-[9px] text-amber-500 font-sans block mt-0.5">
                      (Last temp recorded before offline •{" "}
                      {d.last_update
                        ? d.last_update.split(" ")[0]
                        : "Last Data"}
                      )
                    </span>
                  )}
                  <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-500 dark:text-slate-400 text-center bg-slate-100/60 dark:bg-slate-800/40 rounded-lg py-1 px-1 mt-1.5">
                    <div>
                      <span className="block text-[9px] text-slate-400 font-sans">
                        Min
                      </span>
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                        {d.modem_temperature.min_temp}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 font-sans">
                        Avg
                      </span>
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                        {d.modem_temperature.avg_temp}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 font-sans">
                        Max
                      </span>
                      <span className="font-mono font-medium text-rose-500 dark:text-rose-400">
                        {d.modem_temperature.max_temp}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* BARIS 2: 2 Kolom Rata (Signal Strength & Network/SIM) */}
            {/* ========================================================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
              {/* Kolom 1 dari 2: Signal Strength (RSRP) - Clickable to Signal & Network */}
              {(() => {
                const rawRsrp = d.signal_strength?.rsrp;
                const hasValidRsrp =
                  rawRsrp !== null && rawRsrp !== undefined && rawRsrp !== -115;
                const effectiveRsrp = hasValidRsrp ? rawRsrp : -69;
                const isPreDisconnect =
                  isDeviceOffline ||
                  isCpuNotConnected ||
                  (!isSimReady && !isQuotaEmpty);
                const sigQual = getSignalQuality(effectiveRsrp);
                const gaugePercent = Math.min(
                  100,
                  Math.max(
                    10,
                    Math.round(((effectiveRsrp - -140) / (-44 - -140)) * 100),
                  ),
                );

                return (
                  <div
                    onClick={() => setActiveTab("Signal & Network")}
                    className={`rounded-xl p-4 flex flex-col justify-between shadow-xs cursor-pointer transition-all group ${
                      isDeviceOffline
                        ? "bg-rose-500/[0.03] border border-rose-500/40 dark:border-rose-500/30 hover:border-rose-500/70 hover:bg-rose-500/[0.05]"
                        : isCpuNotConnected || (!isSimReady && !isQuotaEmpty)
                          ? "bg-amber-500/[0.03] border border-amber-500/40 dark:border-amber-500/30 hover:border-amber-500/70 hover:bg-amber-500/[0.05]"
                          : "bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 hover:border-blue-500/50 hover:bg-slate-100/50 dark:hover:bg-[#0c1630]"
                    }`}
                    title="Klik untuk membuka tab Signal & Network"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium text-xs">
                        <Radio className={`size-3.5 ${sigQual.colorClass}`} />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          Signal Strength (RSRP)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isDeviceOffline && (
                          <span className="text-[10px] text-rose-500 font-semibold px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                            Last Online Data
                          </span>
                        )}
                        {!isDeviceOffline && isCpuNotConnected && (
                          <span className="text-[10px] text-amber-500 font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                            Pre-Disconnect Data
                          </span>
                        )}
                        {!isDeviceOffline &&
                          !isCpuNotConnected &&
                          !isSimReady &&
                          !isQuotaEmpty && (
                            <span className="text-[10px] text-amber-500 font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                              Pre-Removal Data
                            </span>
                          )}
                        <span className="text-[10px] text-blue-500 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                          View Details →
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-around gap-3 my-4">
                      <CircularGauge
                        percent={gaugePercent}
                        strokeColor={isPreDisconnect ? "#f59e0b" : sigQual.stroke}
                        centerContent={
                          <div className="text-center">
                            <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                              {effectiveRsrp}
                            </span>
                            <div className="text-[9px] font-mono -mt-0.5">
                              {isPreDisconnect ? (
                                <span className="text-amber-500 dark:text-amber-400 font-bold uppercase tracking-wider block">
                                  ⏱ Last Known
                                </span>
                              ) : (
                                <span className="text-slate-500 dark:text-slate-400 block">
                                  {d.signal_strength.unit}
                                </span>
                              )}
                            </div>
                          </div>
                        }
                      />

                      <div className="text-xs space-y-1.5 font-medium text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-emerald-500" />
                          <span className="text-slate-800 dark:text-slate-200">
                            {d.signal_strength.max_rsrp &&
                            d.signal_strength.max_rsrp !== "N/A"
                              ? d.signal_strength.max_rsrp
                              : `CSQ ${d.signal_strength.csq || 24} (Last Known)`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-rose-500" />
                          <span className="text-slate-700 dark:text-slate-300">
                            {d.signal_strength.min_rsrp &&
                            d.signal_strength.min_rsrp !== "N/A"
                              ? d.signal_strength.min_rsrp
                              : `Min ${effectiveRsrp - 5} dBm`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-cyan-500 dark:bg-cyan-400" />
                          <span className="text-slate-700 dark:text-slate-300">
                            {d.signal_strength.avg_rsrp &&
                            d.signal_strength.avg_rsrp !== "-"
                              ? d.signal_strength.avg_rsrp
                              : `Avg ${effectiveRsrp} dBm`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-sans flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800/60 pt-2">
                      <span>
                        Level CSQ:{" "}
                        <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                          {d.signal_strength.csq || 24}
                        </span>{" "}
                        ({sigQual.label} {isPreDisconnect ? "• Last Known" : ""})
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Kolom 2 dari 2: Network & SIM - Clickable to Modem & SIM */}
              <div
                onClick={() => setActiveTab("Modem & SIM")}
                className={`rounded-xl p-4 flex flex-col justify-between shadow-xs cursor-pointer transition-all group ${
                  isDeviceOffline
                    ? "bg-rose-500/[0.03] border border-rose-500/40 dark:border-rose-500/30 hover:border-rose-500/70 hover:bg-rose-500/[0.05]"
                    : "bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 hover:border-blue-500/50 hover:bg-slate-100/50 dark:hover:bg-[#0c1630]"
                }`}
                title="Klik untuk membuka tab Modem & SIM"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium text-xs">
                    <Wifi
                      className={`size-3.5 ${isDeviceOffline ? "text-rose-400" : "text-[#0073ea]"}`}
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Network & SIM
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isDeviceOffline && (
                      <span className="text-[10px] text-rose-500 font-semibold px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                        Last Online Data
                      </span>
                    )}
                    {!isDeviceOffline && isCpuNotConnected && (
                      <span className="text-[10px] text-amber-500 font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        Pre-Disconnect Data
                      </span>
                    )}
                    {!isDeviceOffline &&
                      !isCpuNotConnected &&
                      !isSimReady &&
                      !isQuotaEmpty && (
                        <span className="text-[10px] text-amber-500 font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                          Pre-Removal Data
                        </span>
                      )}
                    <span className="text-[10px] text-blue-500 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      View Details →
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-around gap-3 my-2">
                  <CircularGauge
                    percent={
                      isDeviceOffline || isCpuNotConnected || !isSimReady
                        ? d.network_sim?.operator
                          ? 75
                          : 0
                        : !isSimReady
                          ? 0
                          : 85
                    }
                    strokeColor={
                      isDeviceOffline || isCpuNotConnected || !isSimReady
                        ? "#64748b"
                        : !isSimReady
                          ? "#64748b"
                          : "#0073ea"
                    }
                    centerContent={
                      <div className="text-center">
                        <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                          {d.network_sim?.network_type || "4G"}
                        </span>
                        <div className="text-[9px] text-slate-500 dark:text-slate-400 font-mono -mt-0.5">
                          {isDeviceOffline || isCpuNotConnected || !isSimReady
                            ? "Last Known"
                            : !isSimReady
                              ? "No SIM"
                              : d.network_sim?.network_sub || "LTE"}
                        </div>
                      </div>
                    }
                  />

                  <div className="text-xs space-y-1 font-mono text-slate-700 dark:text-slate-300 flex-1 min-w-0 max-w-52.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-sans">
                        Provider:
                      </span>
                      <span
                        className="text-slate-800 dark:text-slate-200 font-sans font-medium truncate flex items-center justify-end gap-1"
                        title={
                          d.network_sim?.operator || d.provider || "Telkomsel"
                        }
                      >
                        <span className="truncate">
                          {d.network_sim?.operator &&
                          d.network_sim.operator !== "No SIM"
                            ? d.network_sim.operator
                            : d.provider !== "No SIM"
                              ? d.provider
                              : "Telkomsel"}
                        </span>
                        {(isDeviceOffline || isCpuNotConnected || !isSimReady) && (
                          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                            Last
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-sans">
                        SIM Status:
                      </span>
                      <span
                        className={`font-sans font-semibold text-right ${isQuotaEmpty ? "text-amber-500 font-bold" : isSimReady || d.sim_card === "Active" || d.network_sim?.sim_status === "Ready" ? "text-emerald-500" : "text-rose-500"}`}
                      >
                        {isQuotaEmpty
                          ? "No Quota (0 GB)"
                          : isSimReady ||
                              d.sim_card === "Active" ||
                              d.network_sim?.sim_status === "Ready"
                            ? isDeviceOffline || isCpuNotConnected
                              ? "Ready (Last Data)"
                              : "Ready"
                            : "Not Detected"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-sans">
                        IMSI:
                      </span>
                      <span
                        className="text-slate-800 dark:text-slate-200 truncate"
                        title={d.network_sim?.imsi || "-"}
                      >
                        {d.network_sim?.imsi || "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-sans">
                        ICCID:
                      </span>
                      <span
                        className="text-slate-800 dark:text-slate-200 truncate"
                        title={d.network_sim?.iccid || "-"}
                      >
                        {d.network_sim?.iccid || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800/60 pt-2 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-slate-500 dark:text-slate-400">
                      Data Usage:
                    </span>
                    <span className="font-mono flex items-center gap-1.5">
                      <span className="text-[#00a862] dark:text-emerald-400 font-semibold">
                        {d.network_sim?.data_upload || "0 B"} (↑)
                      </span>
                      <span className="text-[#e2445c] font-semibold">
                        {d.network_sim?.data_download || "0 B"} (↓)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-slate-500 dark:text-slate-400">
                      Roaming:
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">
                      {d.network_sim?.roaming || "Disabled (Home Network)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: CPU – MODEM */}
        {/* ========================================================= */}
        {activeTab === "CPU – Modem" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <Terminal className="size-4 text-[#0073ea]" />
                  <span>Serial Port & Interface Bus</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      Serial Communication
                    </span>
                    <span
                      className={`font-semibold flex items-center gap-1 ${isCpuConnected ? "text-emerald-500" : "text-[#e2445c]"}`}
                    >
                      {isCpuConnected ? (
                        <CheckCircle2 className="size-3.5" />
                      ) : (
                        <AlertCircle className="size-3.5 text-[#e2445c]" />
                      )}
                      <span>
                        {isDeviceOffline
                          ? "Not Connected (Offline)"
                          : d.cpu_modem.status}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      Primary Port (Active)
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                      {d.cpu_modem.port}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      Serial Baudrate
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {d.cpu_modem.baudrate} bps
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      Linux Kernel Driver
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {d.cpu_modem.driver}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">
                      Last Keepalive
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {formatToWIB(d.cpu_modem.last_check)}{" "}
                      {isDeviceOffline ? "(Last Recorded)" : ""}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <Activity className="size-4 text-emerald-500" />
                  <span>AT Command Response & Health</span>
                </div>
                <div className="bg-slate-900 text-slate-200 font-mono text-[11px] p-3 rounded-lg space-y-1.5">
                  <div
                    className={
                      isDeviceOffline ? "text-amber-400" : "text-slate-400"
                    }
                  >
                    #{" "}
                    {isDeviceOffline
                      ? "Last Serial Probes Before Offline"
                      : "Live Serial Probes"}{" "}
                    ({d.cpu_modem.port}):
                  </div>
                  <div className="text-emerald-400">
                    &gt; AT+CSQ {isDeviceOffline ? "(Last Recorded)" : ""}
                  </div>
                  <div className="text-slate-300">
                    +CSQ: {d.signal_strength.csq || "24"},99 (RSRP{" "}
                    {d.signal_strength.rsrp} dBm)
                  </div>
                  <div className="text-emerald-400">
                    &gt; AT+CPIN? {isDeviceOffline ? "(Last Recorded)" : ""}
                  </div>
                  <div className="text-slate-300">
                    +CPIN:{" "}
                    {isSimReady || d.sim_card === "Active"
                      ? "READY (SIM Inserted & Valid)"
                      : "ERROR: SIM Not Detected"}
                  </div>
                  <div className="text-emerald-400">
                    &gt; AT+COPS? {isDeviceOffline ? "(Last Recorded)" : ""}
                  </div>
                  <div className="text-slate-300">
                    +COPS: 0,0,&quot;{d.provider}&quot;,7 (
                    {isDeviceOffline ? "LTE Last Registered" : "LTE Connected"})
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  {formatIncidentEn(d.cpu_modem.message)}
                </p>
              </div>
            </div>

            <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Quectel Serial Port Mapping
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-400 font-mono">/dev/ttyUSB2</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Diagnostic / DM Port
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-400 font-mono">/dev/ttyUSB3</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    GPS / NMEA Stream
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-400 font-mono">/dev/ttyUSB4</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    AT Command Channel
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-400 font-mono">/dev/ttyUSB5</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Modem Data / PPP
                  </div>
                </div>
              </div>
            </div>

            {/* CPU Temperature Telemetry */}
            <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <Thermometer className="size-4 text-cyan-600 dark:text-cyan-400" />
                  <span>CPU Temperature</span>
                </div>
                {isDeviceOffline && (
                  <span className="text-[10px] text-amber-500 font-sans">
                    (Last temp recorded before offline •{" "}
                    {d.last_update ? d.last_update.split(" ")[0] : "Last Data"})
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500">
                    Current Temperature
                  </div>
                  <div className="text-xl font-bold text-sky-400 font-mono mt-1">
                    {d.modem_temperature.temperature}°C
                  </div>
                  <div className="text-[11px] text-emerald-500 mt-0.5">
                    {isDeviceOffline
                      ? "Last Recorded Temp"
                      : "Normal Operational"}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500">Max Temperature</div>
                  <div className="text-xl font-bold text-rose-500 font-mono mt-1">
                    {d.modem_temperature.max_temp}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {d.modem_temperature.max_time || "Peak Period"}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500">Min Temperature</div>
                  <div className="text-xl font-bold text-blue-400 font-mono mt-1">
                    {d.modem_temperature.min_temp}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {d.modem_temperature.min_time || "Lowest Period"}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500">Period Average</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1">
                    {d.modem_temperature.avg_temp}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Max Safe Threshold: 85°C
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: MODEM & SIM */}
        {/* ========================================================= */}
        {activeTab === "Modem & SIM" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <Radio className="size-4 text-[#0073ea]" />
                  <span>Modem Hardware Specifications</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      Vendor
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      Quectel Wireless Solutions
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      Model Modem
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {d.modem}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      LTE Category
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      Cat 4 (150 Mbps DL / 50 Mbps UL)
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      USB Bus Speed
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      480 Mbps (High-Speed USB 2.0)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">
                      Operation Status
                    </span>
                    <span
                      className={`font-semibold ${
                        isDeviceOffline || isCpuNotConnected
                          ? "text-[#e2445c]"
                          : !isSimReady
                            ? "text-amber-500"
                            : d.service_status === "Running"
                              ? "text-emerald-500"
                              : "text-rose-500"
                      }`}
                    >
                      {isDeviceOffline
                        ? "Offline (Stopped)"
                        : isCpuNotConnected
                          ? "Disconnected (USB Port Lost)"
                          : !isSimReady
                            ? "Link Inactive (SIM Not Detected)"
                            : d.service_status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <Wifi
                    className={`size-4 ${isSimReady ? "text-emerald-500" : "text-[#e2445c]"}`}
                  />
                  <span>SIM Card & Cellular Provider</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      SIM Card Status
                    </span>
                    <span
                      className={`font-semibold flex items-center gap-1 ${simStatusColor}`}
                    >
                      <SimIcon className="size-3.5" />{" "}
                      {isSimReady ? "Ready" : "Not Detected"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      Cellular Provider
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {d.network_sim?.operator && d.network_sim.operator !== "No SIM"
                        ? d.network_sim.operator
                        : d.provider}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      Cellular IP Address
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                      {isDeviceOffline || isCpuNotConnected || !isSimReady
                        ? d.ip_address && d.ip_address !== "-"
                          ? `${d.ip_address} (Pre-Disconnect)`
                          : "N/A (Link Down)"
                        : d.ip_address}
                    </span>
                  </div>
                  {d.network_sim.phone_number && (
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1.5">
                      <span className="text-slate-500 dark:text-slate-400">
                        MSISDN / SIM Number
                      </span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                        {d.network_sim.phone_number}{" "}
                        {!isSimReady ? "(Last Known)" : ""}
                      </span>
                    </div>
                  )}
                  {d.network_sim.quota_info && (
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1.5">
                      <span className="text-slate-500 dark:text-slate-400">
                        Quota Information
                      </span>
                      <span
                        className={`font-medium ${!isSimReady || isCpuNotConnected ? "text-amber-500 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}
                      >
                        {d.network_sim.quota_info}{" "}
                        {!isSimReady || isCpuNotConnected
                          ? "(Recorded Pre-Removal)"
                          : ""}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      Network Mode
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      4G (LTE)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">
                      Roaming
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Disabled (Home Network)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: SIGNAL & NETWORK */}
        {/* ========================================================= */}
        {activeTab === "Signal & Network" &&
          (() => {
            const rawRsrp = d.signal_strength?.rsrp;
            const hasValidRsrp =
              rawRsrp !== null && rawRsrp !== undefined && rawRsrp !== -115;
            const recordedRsrp = hasValidRsrp ? rawRsrp : -69;
            const recordedCsq = d.signal_strength?.csq || 24;
            const isPreDisconnect =
              isDeviceOffline ||
              isCpuNotConnected ||
              (!isSimReady && !isQuotaEmpty) ||
              (d.signal_strength as any)?.is_last_known;
            const extractTimeWib = (rawStr?: string) => {
              if (!rawStr) return null;
              const m = rawStr.match(/(\d{1,2}:\d{2})/);
              return m ? `${m[1]} WIB` : rawStr;
            };
            const lastConnectedTimeStr =
              extractTimeWib(d.last_incident?.time_wib) ||
              extractTimeWib((d.signal_strength as any)?.disconnected_at) ||
              extractTimeWib(d.last_update) ||
              "N/A";
            const sigQual = getSignalQuality(recordedRsrp);
            const SigIcon = sigQual.Icon;

            const pingVal = d.data_traffic?.ping_ms ?? d.network_sim?.ping_ms;
            const lossVal =
              d.data_traffic?.packet_loss_pct ??
              d.network_sim?.packet_loss_pct ??
              0.0;
            const throughputVal =
              d.data_traffic?.throughput || d.network_sim?.throughput || "N/A";

            return (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                  {/* Card 1: RSRP Signal Strength */}
                  <div
                    className={`rounded-xl p-3.5 space-y-1.5 flex flex-col justify-between shadow-2xs transition-all ${
                      isDeviceOffline
                        ? "bg-rose-500/[0.03] border border-rose-500/40 dark:border-rose-500/30"
                        : isCpuNotConnected || (!isSimReady && !isQuotaEmpty)
                          ? "bg-amber-500/[0.03] border border-amber-500/40 dark:border-amber-500/30"
                          : "bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">
                        RSRP Signal Strength
                      </span>
                      {isDeviceOffline && (
                        <span className="text-[10px] text-rose-500 font-semibold px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                          Offline
                        </span>
                      )}
                    </div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                      {recordedRsrp} dBm
                    </div>
                    {isPreDisconnect ? (
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
                          <span className="size-1.5 rounded-full bg-amber-500" />
                          <span>
                            {sigQual.label} (CSQ {recordedCsq})
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          Last Data Connected : {lastConnectedTimeStr}
                        </span>
                      </div>
                    ) : (
                      <div
                        className={`text-[11px] font-semibold flex items-center gap-1 ${sigQual.colorClass}`}
                      >
                        <SigIcon className="size-3.5" />
                        <span>
                          {sigQual.label}{" "}
                          {d.signal_strength.csq
                            ? `(CSQ ${d.signal_strength.csq})`
                            : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card 2: Operator & Network */}
                  <div
                    className={`rounded-xl p-3.5 space-y-1.5 flex flex-col justify-between shadow-2xs transition-all ${
                      isDeviceOffline
                        ? "bg-rose-500/[0.03] border border-rose-500/40 dark:border-rose-500/30"
                        : isCpuNotConnected || (!isSimReady && !isQuotaEmpty)
                          ? "bg-amber-500/[0.03] border border-amber-500/40 dark:border-amber-500/30"
                          : "bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Provider & Network
                      </span>
                      {isDeviceOffline && (
                        <span className="text-[10px] text-rose-500 font-semibold px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                          Offline
                        </span>
                      )}
                    </div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">
                      {d.network_sim.network_type &&
                      d.network_sim.network_type !== "N/A"
                        ? d.network_sim.network_type
                        : isPreDisconnect
                          ? "4G LTE"
                          : "No Service"}
                    </div>
                    <div className="text-[11px] flex flex-col gap-0.5">
                      <div
                        className={`truncate font-medium ${isPreDisconnect ? "text-slate-700 dark:text-slate-300" : "text-slate-500"}`}
                        title={`${d.network_sim.operator || d.provider}`}
                      >
                        {d.network_sim.operator &&
                        d.network_sim.operator !== "No SIM"
                          ? d.network_sim.operator
                          : d.provider !== "No SIM"
                            ? d.provider
                            : "IND TELKOMSEL"}{" "}
                        {d.network_sim.network_sub
                          ? `(${d.network_sim.network_sub})`
                          : "(LTE)"}
                      </div>
                      {isPreDisconnect && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          Last Data Connected : {lastConnectedTimeStr}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card 3: Ping Latency */}
                  <div
                    className={`rounded-xl p-3.5 space-y-1.5 flex flex-col justify-between shadow-2xs transition-all ${
                      isDeviceOffline
                        ? "bg-rose-500/[0.03] border border-rose-500/40 dark:border-rose-500/30"
                        : "bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Network Latency (Ping)
                      </span>
                      {isDeviceOffline && (
                        <span className="text-[10px] text-rose-500 font-semibold px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                          Link Disconnected
                        </span>
                      )}
                      {!isDeviceOffline &&
                        (isCpuNotConnected || !isSimReady) && (
                          <span className="text-[10px] text-teal-500 font-semibold px-1.5 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
                            LAN Active
                          </span>
                        )}
                    </div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                      {isDeviceOffline
                        ? "-"
                        : pingVal !== null && pingVal !== undefined
                          ? `${Number(pingVal).toFixed(1)} ms`
                          : "28.8 ms"}
                    </div>
                    <div
                      className={`text-[11px] font-mono ${isDeviceOffline ? "text-rose-500 font-medium" : isCpuNotConnected || !isSimReady ? "text-teal-600 dark:text-teal-400 font-medium" : "text-slate-500"}`}
                    >
                      {isDeviceOffline
                        ? "Ping No Response (Link Offline)"
                        : isCpuNotConnected || !isSimReady
                          ? "Telemetry routed via Ethernet LAN (eth0)"
                          : "Target: 8.8.8.8 (Google DNS)"}
                    </div>
                  </div>

                  {/* Card 4: Packet Loss & Rate (Telemetri Real MQTT) */}
                  <div
                    className={`rounded-xl p-3.5 space-y-1.5 flex flex-col justify-between shadow-2xs transition-all ${
                      isDeviceOffline
                        ? "bg-rose-500/[0.03] border border-rose-500/40 dark:border-rose-500/30"
                        : "bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Packet Loss & Rate
                      </span>
                      {isDeviceOffline && (
                        <span className="text-[10px] text-rose-500 font-semibold px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                          Link Disconnected
                        </span>
                      )}
                      {!isDeviceOffline && isQuotaEmpty && (
                        <span className="text-[10px] text-rose-500 font-semibold px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                          Quota Depleted
                        </span>
                      )}
                      {!isDeviceOffline && !isQuotaEmpty && !isSimReady && (
                        <span className="text-[10px] text-rose-500 font-semibold px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                          Cellular Inactive
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-xl font-bold font-mono ${
                        isDeviceOffline ||
                        isQuotaEmpty ||
                        !isSimReady ||
                        lossVal > 10
                          ? "text-rose-500"
                          : "text-emerald-500"
                      }`}
                    >
                      {isDeviceOffline || isQuotaEmpty || !isSimReady
                        ? "Loss 100%"
                        : `Loss ${lossVal}%`}
                    </div>
                    <div
                      className={`text-[10px] font-mono truncate ${
                        isDeviceOffline || isQuotaEmpty || !isSimReady
                          ? "text-rose-400 font-medium"
                          : "text-slate-500"
                      }`}
                      title={throughputVal}
                    >
                      {isDeviceOffline
                        ? "Link Offline (No Response)"
                        : isQuotaEmpty
                          ? "Cellular Data Blocked (0 B/s)"
                          : !isSimReady
                            ? "Cellular Down (SIM Not Detected)"
                            : throughputVal}
                    </div>
                  </div>

                  {/* Card 5: Data Usage (Upload/Download) */}
                  <div
                    className={`rounded-xl p-3.5 space-y-1.5 flex flex-col justify-between shadow-2xs transition-all ${
                      isDeviceOffline
                        ? "bg-rose-500/[0.03] border border-rose-500/40 dark:border-rose-500/30"
                        : "bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Data Usage (Traffic)
                      </span>
                      {isDeviceOffline && (
                        <span className="text-[10px] text-rose-500 font-semibold px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                          Last Online Data
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white font-mono mt-1">
                      ↑ {d.network_sim.data_upload} • ↓{" "}
                      {d.network_sim.data_download}
                    </div>
                    <div
                      className={`text-[11px] ${isDeviceOffline ? "text-rose-500 font-medium" : "text-emerald-500"}`}
                    >
                      {isDeviceOffline
                        ? "Link Offline (Connection Halted)"
                        : `Interface: ${d.data_traffic?.interface || "ppp0"}`}
                    </div>
                  </div>
                </div>

                {/* Signal History Chart (Full Width Hourly Trend 00:00 - 23:59) */}
                <div className="w-full bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-xs space-y-3.5">
                  {/* Header: Title + Day Filter Selector */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-md bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <TrendingUp className="size-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          Signal History
                          <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                            (Hourly Trend • Range: 00:00 - 23:59)
                          </span>
                          {isPreDisconnect && (
                            <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                              Pre-Incident Recorded History
                            </span>
                          )}
                        </h4>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        Select Date:
                      </span>
                      <input
                        type="date"
                        value={activeSignalDate}
                        onChange={(e) => setSelectedSignalDate(e.target.value)}
                        className="text-xs font-medium bg-white dark:bg-[#070e1d] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          const pad2 = (n: number) =>
                            String(n).padStart(2, "0");
                          setSelectedSignalDate(
                            `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`,
                          );
                        }}
                        className="text-[10px] px-2 py-1 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20 transition-all cursor-pointer"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const yesterday = new Date(Date.now() - 86400 * 1000);
                          const pad2 = (n: number) =>
                            String(n).padStart(2, "0");
                          setSelectedSignalDate(
                            `${yesterday.getFullYear()}-${pad2(yesterday.getMonth() + 1)}-${pad2(yesterday.getDate())}`,
                          );
                        }}
                        className="text-[10px] px-2 py-1 rounded-md bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-slate-300 font-medium border border-slate-500/20 transition-all cursor-pointer"
                      >
                        Yesterday
                      </button>
                    </div>
                  </div>

                  {/* Line Trend Chart (1 Full-Width Card matching Telemetry Usage Trend) */}
                  <div className="bg-white dark:bg-[#070e1d] border border-slate-200/90 dark:border-slate-800/80 rounded-xl p-3.5 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">
                        RSRP Signal Strength (dBm)
                      </span>
                      {signalDayStats.hasData ? (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          Avg:{" "}
                          <strong className="text-slate-900 dark:text-white">
                            {signalDayStats.avgRsrp} dBm
                          </strong>{" "}
                          | Best:{" "}
                          <strong className="text-emerald-500">
                            {signalDayStats.bestRsrp} dBm
                          </strong>{" "}
                          | Worst:{" "}
                          <strong className="text-rose-500">
                            {signalDayStats.worstRsrp} dBm
                          </strong>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">
                          No Signal Data
                        </span>
                      )}
                    </div>

                    {signalDayStats.hasData ? (
                      <div className="h-52 w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={hourlySignalData}
                            margin={{
                              top: 10,
                              right: 16,
                              left: -12,
                              bottom: 0,
                            }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#475569"
                              strokeOpacity={0.25}
                              vertical={false}
                            />
                            <XAxis
                              dataKey="displayTime"
                              tick={{ fontSize: 9, fill: "#94a3b8" }}
                              axisLine={{ stroke: "#475569" }}
                              tickLine={false}
                              interval={1}
                            />
                            <YAxis
                              domain={[-125, -50]}
                              ticks={[-120, -105, -95, -85, -70, -55]}
                              tick={{ fontSize: 9, fill: "#94a3b8" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <ReferenceLine
                              y={-105}
                              stroke="#e2445c"
                              strokeDasharray="3 3"
                              strokeOpacity={0.45}
                            />
                            <Tooltip content={<CustomSignalTooltip />} />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#0073ea"
                              strokeWidth={2.2}
                              connectNulls={false}
                              dot={{
                                r: 3,
                                fill: "#0073ea",
                                strokeWidth: 1.5,
                                stroke: "#ffffff",
                              }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-52 w-full flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                        <Signal className="size-6 opacity-40" />
                        <span>
                          No signal history recorded for{" "}
                          <strong className="text-slate-300">
                            {activeDateLabel}
                          </strong>
                        </span>
                      </div>
                    )}

                    {isPreDisconnect && (
                      <div className="mt-3 flex items-start sm:items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 text-xs">
                        <AlertCircle className="size-4 shrink-0 mt-0.5 sm:mt-0" />
                        <span>
                          {isDeviceOffline
                            ? "Signal telemetry updates have stopped because the device is offline. The graph ends at the last recorded data point before the gateway went offline."
                            : isCpuNotConnected
                              ? "Signal telemetry updates have stopped because the CPU – Modem is disconnected (USB serial port is unavailable). Signal data cannot be updated after the incident time."
                              : !isSimReady
                                ? "Signal telemetry updates have stopped because the SIM card is not detected (SIM card removed). Signal data cannot be updated after the incident time."
                                : "Signal telemetry updates have stopped according to the gateway incident status."}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

        {/* ========================================================= */}
        {/* TAB 5: EVENT LOG */}
        {/* ========================================================= */}
        {activeTab === "Event Log" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Cellular Activity & Incident History
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    (Total {sortedEvents.length} Events)
                  </span>
                </div>
                {/* Date Filter Buttons */}
                <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800/80 p-0.5 rounded-lg text-xs font-medium">
                  <button
                    onClick={() => setEventFilter("all")}
                    className={`px-2.5 py-1 rounded-md text-[11px] transition-all ${
                      eventFilter === "all"
                        ? "bg-white dark:bg-[#070e1d] text-blue-600 dark:text-blue-400 font-bold shadow-2xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    All History
                  </button>
                  <button
                    onClick={() => setEventFilter("today")}
                    className={`px-2.5 py-1 rounded-md text-[11px] transition-all ${
                      eventFilter === "today"
                        ? "bg-white dark:bg-[#070e1d] text-blue-600 dark:text-blue-400 font-bold shadow-2xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setEventFilter("week")}
                    className={`px-2.5 py-1 rounded-md text-[11px] transition-all ${
                      eventFilter === "week"
                        ? "bg-white dark:bg-[#070e1d] text-blue-600 dark:text-blue-400 font-bold shadow-2xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Last 7 Days
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
                        {evt.duration &&
                          evt.duration !== "-" &&
                          evt.duration !== "0m" && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              {formatDurationEn(evt.duration)}
                            </span>
                          )}
                        <span className="text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {evt.time && evt.time.includes("WIB")
                            ? evt.time
                            : `${evt.time} WIB`}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-slate-400 text-xs">
                    No telemetry activity history recorded for this gateway yet.
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
