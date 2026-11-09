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
  FileSpreadsheet,
  Battery,
  BatteryCharging,
  BatteryWarning,
} from "lucide-react";
import {
  useGatewayDetail,
  IGatewayDetailData,
  IDowntimeEvent,
  ISystemHealthEventItem,
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
    .replace(
      /Terdeteksi\s+tegangan\s+listrik\s+drop\s*\((.*?)\)\s+pada\s+adaptor\s+gateway!?/gi,
      "Detected power voltage drop ($1) on gateway adapter!",
    )
    .replace(
      /Catu\s+daya\s+adaptor\s+drop\s+di\s+bawah\s+([0-9\.]+V)/gi,
      "Adapter power supply dropped below $1",
    )
    .replace(
      /Kapasitas\s+partisi\s*\'(.*?)\'\s+mencapai\s*([0-9\.]+%?)\s*\(Sisa:\s*([^)]+)\)\.?/gi,
      "Partition '$1' capacity reached $2 (Remaining: $3).",
    )
    .replace(
      /Kondisi\s+flash\s+storage\s+gateway\s+menurun\s+ke\s*([0-9\.]+%?)\s*\((.*?)\)\.?/gi,
      "Gateway flash storage health degraded to $1 ($2).",
    )
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
    .replace(/Gangguan\s+Jaringan/gi, "Network Disruption")
    .replace(/Gangguan/gi, "Incident")
    .replace(/selama\s+(\d+)\s*Menit/gi, "for $1m")
    .replace(/selama\s+(\d+)\s*Jam\s*(\d+)\s*Menit/gi, "for $1h $2m")
    .replace(/selama\s+(\d+)\s*Jam/gi, "for $1h")
    .replace(/(\d+)\s*Menit/gi, "$1m")
    .replace(/(\d+)\s*Jam/gi, "$1h")
    .replace(
      /Normal\s+Operation\s*\(No incidents detected\)/gi,
      "Normal Operation (No incidents detected)",
    )
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
  percent: number | string;
  strokeColor: string;
  label?: string;
  sublabel?: string;
}) => {
  const isNum = typeof percent === "number" && !isNaN(percent);
  const numVal = isNum ? Math.max(0, Math.min(100, percent)) : 0;
  const radius = 32;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = isNum
    ? circumference - (numVal / 100) * circumference
    : circumference;

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
          {isNum && (
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
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            {isNum ? `${numVal}%` : "-"}
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
  const [selectedEventDate, setSelectedEventDate] = useState<string>("ALL");

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

  const isOffline =
    d.status === "Offline" ||
    d.service_status === "Stopped" ||
    d.service_status === "Offline";

  // Helper for SD Health icon & color
  const isHealthGood =
    !isOffline &&
    (d.sd_health.status === "Good" || d.sd_health.status === "Normal");
  const isHealthCaution =
    !isOffline &&
    (d.sd_health.status === "Caution" ||
      d.sd_health.status === "Wear" ||
      d.sd_health.status === "Warning");
  const healthColor = isOffline
    ? "text-slate-400"
    : isHealthGood
      ? "text-emerald-400"
      : isHealthCaution
        ? "text-amber-400"
        : "text-rose-500";
  const HealthIcon = isOffline
    ? AlertCircle
    : isHealthGood
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

  const isSystemEvent = (ev: ISystemHealthEventItem) => {
    const text = `${ev.title || ""} ${(ev as any).category || ""}`.toLowerCase();
    if (
      ["camera", "kamera", "nvr", "dvr", "cctv", "recording", "merekam", "modem", "cellular", "seluler", "sim:", "signal", "rsrp", "csq"].some((k) =>
        text.includes(k)
      )
    ) {
      return false;
    }
    return true;
  };

  const sortedEvents = (d.events ? d.events.filter(isSystemEvent) : []).sort((a, b) => {
    const epochA =
      typeof (a as any).epoch === "number" && !isNaN((a as any).epoch)
        ? (a as any).epoch
        : a.time
          ? Date.parse(a.time.replace(" WIB", "").trim().replace(" ", "T")) || 0
          : 0;
    const epochB =
      typeof (b as any).epoch === "number" && !isNaN((b as any).epoch)
        ? (b as any).epoch
        : b.time
          ? Date.parse(b.time.replace(" WIB", "").trim().replace(" ", "T")) || 0
          : 0;
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

  const dailyBreakdown =
    dailyUptime.daily_breakdown && dailyUptime.daily_breakdown.length > 0
      ? dailyUptime.daily_breakdown
      : [
          {
            date: dailyUptime.date_str,
            day_name: new Date().toLocaleDateString("en-US", {
              weekday: "short",
            }),
            date_full: `${dailyUptime.date_str} (${new Date().toLocaleDateString("en-US", { weekday: "short" })})`,
            date_iso: new Date().toISOString().split("T")[0],
            uptime_min: dailyUptime.uptime_minutes,
            downtime_min: dailyUptime.downtime_minutes,
            success_rate: dailyUptime.uptime_pct,
            is_sla_met: dailyUptime.is_sla_met,
            sla_status: dailyUptime.is_sla_met ? "Achieved" : "Not Achieved",
            total_observed_min: dailyUptime.total_period_minutes,
          },
        ];

  const breakdownSummary = dailyUptime.summary || {
    count: dailyBreakdown.length,
    total_observed_min: dailyBreakdown.reduce(
      (acc, r) => acc + r.total_observed_min,
      0,
    ),
    total_uptime_min: dailyBreakdown.reduce((acc, r) => acc + r.uptime_min, 0),
    total_downtime_min: dailyBreakdown.reduce(
      (acc, r) => acc + r.downtime_min,
      0,
    ),
    avg_success_rate:
      dailyBreakdown.reduce((acc, r) => acc + r.total_observed_min, 0) > 0
        ? Number(
            (
              (dailyBreakdown.reduce((acc, r) => acc + r.uptime_min, 0) /
                dailyBreakdown.reduce(
                  (acc, r) => acc + r.total_observed_min,
                  0,
                )) *
              100
            ).toFixed(1),
          )
        : 100.0,
    is_sla_met: dailyUptime.is_sla_met,
    sla_status: dailyUptime.is_sla_met ? "Achieved" : "Not Achieved",
  };

  // Filter out any DVR / Camera / Cellular / Modem incidents from System Health:
  const isSystemIncident = (ev: IDowntimeEvent) => {
    const text = `${ev.reason || ""} ${ev.title || ""} ${ev.description || ""} ${ev.category || ""}`.toLowerCase();
    const metric = String((ev as any).metric || "").toLowerCase();
    if (["cellular", "modem", "cpu_modem", "dvr", "cpu_dvr", "recording", "camera", "cctv"].includes(metric)) {
      return false;
    }
    if (["cellular", "modem", "dvr", "camera", "nvr"].includes(String(ev.category || "").toLowerCase())) {
      return false;
    }
    if (["kamera", "camera", "nvr", "dvr", "cctv", "recording", "merekam", "modem", "cellular", "seluler", "sim:", "signal", "rsrp"].some((k) => text.includes(k))) {
      return false;
    }
    return true;
  };

  const rawIncidents = dailyUptime.incidents || d.downtime_events || [];
  const allDowntimeIncidents = rawIncidents.filter(isSystemIncident);

  // Unique dates for the Incident History dropdown
  const uniqueIncidentDates: string[] = Array.from(
    new Set(
      allDowntimeIncidents
        .map((ev) => ev.date_str || (ev.start_time ? ev.start_time.split(" ")[0] : ""))
        .filter((s): s is string => Boolean(s)),
    ),
  );

  // Filtered incidents based on selected date
  const filteredDowntimeEvents =
    selectedEventDate === "ALL"
      ? allDowntimeIncidents
      : allDowntimeIncidents.filter(
          (ev) =>
            (ev.date_str && ev.date_str === selectedEventDate) ||
            (ev.start_time && ev.start_time.startsWith(selectedEventDate)),
        );

  const powerInfo = d.power_info || {
    source: isWhiteDevice ? "AC" : "AC",
    status: isWhiteDevice ? "Full" : "Normal",
    badge: isWhiteDevice ? "100% Full" : "Normal",
    is_drop: false,
    voltage: isWhiteDevice ? "3.7V Li-ion" : "1.2938V",
    adapter_voltage: isWhiteDevice ? "12V 1.5A DC Jack" : "5.10V (Stable)",
    battery_percent: isWhiteDevice ? 100 : null,
    charging_state: isWhiteDevice ? "Full" : "AC Mains",
    raw_text: isWhiteDevice
      ? "Power: AC (Batt: 100% Full) [OK]"
      : "Power: AC (1.2938V) [OK]",
    explanation: isWhiteDevice
      ? "AC mains power active and internal backup UPS battery is fully charged (100%)."
      : "AC Mains Power. 5V adapter supply is stable and Vcore 1.2938V is normal without undervoltage events.",
    broadcom_register: isWhiteDevice
      ? "N/A (Rockchip RK3328 / Power Management AXP)"
      : "0x00000 (Clean / Optimal Power)",
  };

  const downtimeEvents: IDowntimeEvent[] = dailyUptime.incidents || [];

  // Dynamic operational calendar data for current month
  const nowObj = new Date();
  const currentMonthName = nowObj.toLocaleDateString("en-US", {
    month: "short",
  });
  const currentMonthNum = nowObj.getMonth() + 1;
  const currentYear = nowObj.getFullYear();
  const daysInCurrentMonth = new Date(
    currentYear,
    currentMonthNum,
    0,
  ).getDate();
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
                  : d.service_status === "Stopped" || d.service_status === "Offline"
                  ? "bg-rose-500/15 text-rose-500 dark:text-[#e2445c] border border-rose-500/30"
                  : "bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30"
              }`}
            >
              {d.service_status === "Running"
                ? "Online"
                : d.service_status === "Stopped" || d.service_status === "Offline"
                ? "Offline"
                : "Degraded"}
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
                              isOffline
                                ? "bg-rose-500/15 text-rose-600 dark:text-[#e2445c] border-rose-500/30"
                                : d.service_status === "Running"
                                ? "bg-emerald-500/15 text-[#00a862] dark:text-emerald-400 border-emerald-500/30"
                                : "bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/30"
                            }`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${
                                isOffline
                                  ? "bg-rose-500"
                                  : d.service_status === "Running"
                                  ? "bg-emerald-400 animate-pulse"
                                  : "bg-amber-400"
                              }`}
                            />
                            {isOffline ? "Offline" : d.service_status}
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
                          : {isOffline ? "-" : d.uptime}
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
                        {isOffline ? (
                          <span className="text-rose-500 dark:text-[#e2445c] font-semibold flex items-center gap-1.5">
                            : Offline (Stopped)
                          </span>
                        ) : (
                          <span className="text-emerald-500 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                            : Normal Operation
                          </span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className="text-slate-500 dark:text-slate-400 w-24 shrink-0 font-medium">
                          Power / Batt
                        </span>
                        <span className="text-slate-800 dark:text-slate-200 font-medium flex items-center gap-1.5">
                          :{" "}
                          {isOffline ? (
                            <span className="font-mono text-slate-400 font-bold">-</span>
                          ) : (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                powerInfo.is_drop
                                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                  : "bg-emerald-500/15 text-emerald-600 dark:text-[#00c875] border border-emerald-500/30"
                              }`}
                            >
                              {powerInfo.badge}
                            </span>
                          )}
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
                        isOffline
                          ? "bg-slate-500/15 text-slate-500 border-slate-500/30"
                          : isHealthGood
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          : isHealthCaution
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            : "bg-rose-500/15 text-rose-600 dark:text-rose-500 border-rose-500/30"
                      }`}
                    >
                      {isOffline ? "-" : d.sd_health.status}
                    </span>
                  </div>

                  {/* Compact Status Indicator Chip */}
                  <div className="flex items-center justify-center gap-2.5 py-1.5 px-3 bg-white dark:bg-[#070e1c] rounded-lg border border-slate-200 dark:border-slate-800/80 mt-2 mb-2 shadow-xs">
                    <div
                      className={`size-7 rounded-full flex items-center justify-center shrink-0 ${
                        isOffline
                          ? "bg-slate-500/15 text-slate-400"
                          : isHealthGood
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
                        {isOffline
                          ? "Condition: -"
                          : `Condition ${d.sd_health.status} ${
                              d.sd_health.health_percent
                                ? `(${d.sd_health.health_percent}%)`
                                : ""
                            }`}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate">
                        {isOffline
                          ? "Health - • Temp - • Wear -"
                          : `Health ${
                              d.sd_health.health_percent
                                ? `${d.sd_health.health_percent}%`
                                : "100%"
                            } • Temp ${d.sd_health.temperature} • Wear ${d.sd_health.wear_level}`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parameters List */}
                <div className="text-[11px] space-y-1 text-slate-700 dark:text-slate-300 font-medium border-t border-slate-200 dark:border-slate-800/60 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <span
                        className={`size-1.5 rounded-full ${isOffline ? "bg-slate-400" : isHealthGood ? "bg-emerald-400" : "bg-amber-400"}`}
                      />
                      Bad Sector
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      : {isOffline ? "-" : d.sd_health.bad_sector}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <span
                        className={`size-1.5 rounded-full ${isOffline ? "bg-slate-400" : isHealthGood ? "bg-emerald-400" : "bg-amber-400"}`}
                      />
                      Wear Level
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      : {isOffline ? "-" : d.sd_health.wear_level}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <span
                        className={`size-1.5 rounded-full ${isOffline ? "bg-slate-400" : isHealthGood ? "bg-emerald-400" : "bg-amber-400"}`}
                      />
                      Temperature
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      : {isOffline ? "-" : d.sd_health.temperature}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <span
                        className={`size-1.5 rounded-full ${isOffline ? "bg-slate-400" : isHealthGood ? "bg-emerald-400" : "bg-amber-400"}`}
                      />
                      I/O Error
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      : {isOffline ? "-" : d.sd_health.io_error}
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
                      {currentMonthName} {currentYear} ({totalMonthHours} Hours
                      &bull; Cutoff Day {currentDay})
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

            {/* BARIS 2: 4 Kolom (CPU Usage, RAM Usage, Storage Usage, Battery & Power) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 items-stretch">
              {/* Kolom 1 dari 4: CPU Usage */}
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium text-xs">
                  <Cpu className="size-3.5 text-emerald-500 dark:text-emerald-400" />
                  <span className="font-semibold">CPU Usage</span>
                </div>

                <CircularGauge percent={isOffline ? "-" : d.cpu_percent} strokeColor="#00c875" />

                <div>
                  <SparklineWave
                    data={isOffline ? [] : d.cpu_sparkline}
                    color="#00c875"
                    id="cpu"
                  />
                  <div className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium mt-1 font-mono">
                    {isOffline ? "- | -" : `${d.cpu_max} | ${d.cpu_min}`}
                  </div>
                </div>
              </div>

              {/* Kolom 2 dari 4: RAM Usage */}
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium text-xs">
                  <Database className="size-3.5 text-[#0073ea]" />
                  <span className="font-semibold">RAM Usage</span>
                </div>

                <CircularGauge percent={isOffline ? "-" : d.ram_percent} strokeColor="#0073ea" />

                <div>
                  <SparklineWave
                    data={isOffline ? [] : d.ram_sparkline}
                    color="#0073ea"
                    id="ram"
                  />
                  <div className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium mt-1 font-mono">
                    {isOffline ? "- | -" : `${d.ram_max} | ${d.ram_min}`}
                  </div>
                </div>
              </div>

              {/* Kolom 3 dari 4: Storage Usage */}
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium text-xs">
                  <HardDrive className="size-3.5 text-purple-500 dark:text-purple-400" />
                  <span className="font-semibold">Storage Usage</span>
                </div>

                <CircularGauge
                  percent={isOffline ? "-" : d.sd_percent}
                  strokeColor="#a855f7"
                  sublabel={isOffline ? "-" : `${d.sd_used_gb} GB / ${d.sd_total_gb} GB`}
                />

                <div>
                  <SparklineWave
                    data={isOffline ? [] : d.sd_sparkline}
                    color="#a855f7"
                    id="sd"
                  />
                  <div className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium mt-1 font-mono">
                    {isOffline ? "- used of -" : `${d.sd_used_gb} GB used of ${d.sd_total_gb} GB`}
                  </div>
                </div>
              </div>

              {/* Kolom 4 dari 4: Battery & Power Status */}
              <div className="bg-slate-50/70 dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium text-xs">
                    <Zap className="size-3.5 text-amber-500 dark:text-amber-400" />
                    <span className="font-semibold">Battery & Power</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                      isOffline
                        ? "bg-rose-500/15 text-rose-600 dark:text-[#e2445c] border-rose-500/30"
                        : powerInfo.is_drop
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                        : "bg-emerald-500/15 text-emerald-600 dark:text-[#00c875] border-emerald-500/30"
                    }`}
                  >
                    {isOffline ? "Offline" : powerInfo.badge}
                  </span>
                </div>

                {isOffline ? (
                  <div className="my-auto py-3 flex flex-col items-center justify-center text-center">
                    <div className="size-12 rounded-full flex items-center justify-center mb-1.5 border bg-rose-500/15 border-rose-500/30 text-rose-500">
                      <Zap className="size-6" />
                    </div>
                    <div className="text-sm font-bold text-slate-400 font-mono">
                      Offline (-)
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Input Rail: -
                    </div>
                  </div>
                ) : isWhiteDevice ? (
                  <CircularGauge
                    percent={powerInfo.battery_percent ?? 100}
                    strokeColor={
                      powerInfo.status === "Discharging"
                        ? "#e2445c"
                        : powerInfo.status === "Charging"
                        ? "#0073ea"
                        : "#00c875"
                    }
                    sublabel={powerInfo.badge}
                  />
                ) : (
                  <div className="my-auto py-3 flex flex-col items-center justify-center text-center">
                    <div
                      className={`size-12 rounded-full flex items-center justify-center mb-1.5 border ${
                        powerInfo.is_drop
                          ? "bg-amber-500/15 border-amber-500/30 text-amber-500"
                          : "bg-emerald-500/15 border-emerald-500/30 text-[#00c875]"
                      }`}
                    >
                      <Zap className="size-6" />
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                      Vcore {powerInfo.voltage}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Input Rail: {powerInfo.adapter_voltage}
                    </div>
                  </div>
                )}

                <div>
                  <div
                    className="p-1.5 rounded bg-white dark:bg-[#070e1c] border border-slate-200 dark:border-slate-800/80 text-[10px] font-mono text-slate-600 dark:text-slate-400 truncate text-center"
                    title={isOffline ? "Device Offline (No Telemetry)" : powerInfo.raw_text}
                  >
                    {isOffline ? "Device Offline (No Telemetry)" : powerInfo.raw_text}
                  </div>
                  <div
                    className="text-[10px] text-slate-500 dark:text-slate-400 text-center font-medium mt-1 truncate"
                    title={isOffline ? "Gateway is offline and not transmitting telemetry" : powerInfo.explanation}
                  >
                    {isOffline ? "Gateway is offline and not transmitting telemetry" : powerInfo.explanation}
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
            {/* 2 Cards Side-by-Side: Daily SLA Breakdown (Left) & Incident History (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
              {/* Card 1: Daily SLA Breakdown Table (Gateway System) */}
              <div className="lg:col-span-6 bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-xs">
                {/* Header: Title & Count Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-md bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <FileSpreadsheet className="size-3.5" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Daily SLA Breakdown (Gateway System)
                    </h4>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {dailyBreakdown.length}{" "}
                      {dailyBreakdown.length === 1 ? "Day" : "Days"}
                    </span>
                  </div>
                </div>

                {/* Table (Columns: Date, Uptime (Mins), Downtime (Mins), Success Rate, SLA Status) */}
                <div className="overflow-x-auto mt-2 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-[#0a1224] shadow-xs">
                      <tr className="text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/60 font-semibold">
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3 text-right">Uptime (Mins)</th>
                        <th className="py-2 px-3 text-right">
                          Downtime (Mins)
                        </th>
                        <th className="py-2 px-3 text-right">Success Rate</th>
                        <th className="py-2 px-3 text-center">SLA Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40 text-[11px]">
                      {dailyBreakdown.map((row) => {
                        const upMin = row.uptime_min;
                        const downMin = row.downtime_min;
                        const sr = row.success_rate;
                        const isSuccess = row.is_sla_met;
                        const isSelected = selectedEventDate === row.date;

                        return (
                          <tr
                            key={row.date_iso || row.date}
                            onClick={() => {
                              setSelectedEventDate((prev) =>
                                prev === row.date ? "ALL" : row.date,
                              );
                            }}
                            className={`transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-blue-500/10 dark:bg-blue-500/20 font-medium"
                                : "hover:bg-slate-100/80 dark:hover:bg-slate-800/30"
                            }`}
                            title="Click to filter incident history for this date"
                          >
                            <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                              {row.date_full || `${row.date} (${row.day_name})`}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                              {upMin.toLocaleString("id-ID", {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 1,
                              })}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold">
                              {downMin > 0 ? (
                                <span className="text-rose-600 dark:text-rose-400">
                                  {downMin.toLocaleString("id-ID", {
                                    minimumFractionDigits: 1,
                                    maximumFractionDigits: 1,
                                  })}
                                </span>
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
                    </tbody>
                    <tfoot className="sticky bottom-0 z-10 bg-slate-200/90 dark:bg-[#070e1d] font-bold text-[11px] border-t-2 border-slate-300 dark:border-slate-700 shadow-md">
                      <tr>
                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          <span className="text-blue-600 dark:text-blue-400 mr-1.5">
                            Total:
                          </span>
                          {breakdownSummary.count}{" "}
                          {breakdownSummary.count === 1 ? "Day" : "Days"} (
                          {breakdownSummary.total_observed_min.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 1,
                              maximumFractionDigits: 1,
                            },
                          )}
                          m)
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                          {breakdownSummary.total_uptime_min.toLocaleString(
                            "id-ID",
                            {
                              minimumFractionDigits: 1,
                              maximumFractionDigits: 1,
                            },
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold">
                          {breakdownSummary.total_downtime_min > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400">
                              {breakdownSummary.total_downtime_min.toLocaleString(
                                "id-ID",
                                {
                                  minimumFractionDigits: 1,
                                  maximumFractionDigits: 1,
                                },
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">
                              0
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-900 dark:text-white">
                          {breakdownSummary.avg_success_rate.toFixed(1)}%
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          {breakdownSummary.is_sla_met ? (
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
                  </table>
                </div>
              </div>

              {/* Card 2: Incident History (Right) */}
              <div className="lg:col-span-6 bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs h-full min-h-[220px]">
                <div className="flex flex-col h-full">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60 shrink-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Incident History
                      </h4>
                      <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                        {filteredDowntimeEvents.length} event
                      </span>
                    </div>

                    {/* Date Selector Dropdown for Daily Filtering */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        Filter Date:
                      </span>
                      <select
                        value={selectedEventDate}
                        onChange={(e) => setSelectedEventDate(e.target.value)}
                        className="text-xs font-medium bg-white dark:bg-[#070e1d] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs"
                      >
                        <option value="ALL">
                          All Dates ({allDowntimeIncidents.length})
                        </option>
                        {uniqueIncidentDates.map((dateStr) => {
                          const count = allDowntimeIncidents.filter(
                            (e) =>
                              (e.date_str && e.date_str === dateStr) ||
                              e.start_time.startsWith(dateStr),
                          ).length;
                          return (
                            <option key={dateStr} value={dateStr}>
                              {dateStr} ({count})
                            </option>
                          );
                        })}
                      </select>
                      {selectedEventDate !== "ALL" && (
                        <button
                          type="button"
                          onClick={() => setSelectedEventDate("ALL")}
                          className="text-xs text-blue-500 hover:underline font-medium cursor-pointer ml-1"
                        >
                          Reset Filter
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Incident History Table */}
                  <div
                    className={`overflow-x-auto mt-2 pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 flex-1 min-h-[160px] flex flex-col justify-start ${
                      filteredDowntimeEvents.length > 5
                        ? "max-h-[380px] overflow-y-auto"
                        : "h-full"
                    }`}
                  >
                    <table
                      className="w-full text-left text-xs border-collapse h-full flex-1"
                      style={{ height: "100%" }}
                    >
                      <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-[#0a1224] shadow-xs shrink-0">
                        <tr className="text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/60 font-semibold h-8">
                          <th className="py-2.5 px-2 text-center w-8">No.</th>
                          <th className="py-2.5 px-3">Incident Time</th>
                          <th className="py-2.5 px-3">Incident / Issue</th>
                          <th className="py-2.5 px-3 text-center">Duration</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody
                        className={`divide-y divide-slate-200 dark:divide-slate-800/40 text-[11px] ${
                          filteredDowntimeEvents.length <= 1 ? "h-full" : ""
                        }`}
                        style={{ height: "100%" }}
                      >
                        {filteredDowntimeEvents.length > 0 ? (
                          filteredDowntimeEvents.map((event, idx) => {
                            const isStillActive =
                              event.status === "Active" ||
                              event.end_time === "-" ||
                              event.end_time
                                ?.toLowerCase()
                                .includes("sekarang");
                            return (
                              <tr
                                key={event.no || idx}
                                className="hover:bg-slate-100/80 dark:hover:bg-slate-800/30 transition-colors"
                              >
                                <td className="py-2.5 px-2 text-center text-slate-500 dark:text-slate-400 font-mono align-middle">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap align-middle">
                                  <div>{event.start_time}</div>
                                  {event.end_time && event.end_time !== "-" ? (
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                      to {event.end_time}
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-rose-500 dark:text-[#e2445c] font-semibold">
                                      to Ongoing (Active)
                                    </div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100 align-middle">
                                  {formatIncidentEn(
                                    event.reason ||
                                      event.title ||
                                      event.category,
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center whitespace-nowrap align-middle">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-xs bg-amber-500/10 dark:bg-amber-500/20 text-[#f59e0b] border border-amber-500/30">
                                    {formatDurationEn(event.duration)}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center whitespace-nowrap align-middle">
                                  {!isStillActive ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#00a862] dark:text-[#00c875]">
                                      <span className="size-1.5 rounded-full bg-[#00c875]" />
                                      {event.status || "Resolved"}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-600 dark:text-[#e2445c] border border-rose-500/30">
                                      <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                                      {event.status || "Active"}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td
                              colSpan={5}
                              className="py-16 text-center text-slate-500 dark:text-slate-400 text-xs"
                            >
                              No incident history found for the selected date.
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
                    {isOffline || typeof d.cpu_percent !== "number" ? "-" : `${d.cpu_percent}%`}
                  </span>
                </div>
                <CircularGauge percent={isOffline ? "-" : d.cpu_percent} strokeColor="#00c875" />
                <SparklineWave
                  data={isOffline ? [] : d.cpu_sparkline}
                  color="#00c875"
                  id="cpu-detail"
                />
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 border-t border-slate-200 dark:border-slate-800/60 pt-2 font-mono">
                  <div className="flex justify-between">
                    <span>Architecture:</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-sans">
                      ARMv8 Cortex-A53 4-Core
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Peak Max:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {isOffline ? "-" : d.cpu_max}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Idle Min:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {isOffline ? "-" : d.cpu_min}
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
                    {isOffline || typeof d.ram_percent !== "number" ? "-" : `${d.ram_percent}%`}
                  </span>
                </div>
                <CircularGauge percent={isOffline ? "-" : d.ram_percent} strokeColor="#0073ea" />
                <SparklineWave
                  data={isOffline ? [] : d.ram_sparkline}
                  color="#0073ea"
                  id="ram-detail"
                />
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 border-t border-slate-200 dark:border-slate-800/60 pt-2 font-mono">
                  <div className="flex justify-between">
                    <span>Total Capacity:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {isOffline ? "-" : d.ram_total_gb ? `${d.ram_total_gb} GB` : "1 GB (SBC RAM)"}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Used:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {isOffline
                        ? "-"
                        : d.ram_used_gb !== undefined
                        ? `${d.ram_used_gb} GB`
                        : typeof d.ram_percent === "number"
                        ? `${((Number(d.ram_total_gb) || 1) * (d.ram_percent / 100)).toFixed(1)} GB`
                        : "-"}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Available:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {isOffline
                        ? "-"
                        : d.ram_free_gb !== undefined
                        ? `${d.ram_free_gb} GB`
                        : typeof d.ram_percent === "number"
                        ? `${((Number(d.ram_total_gb) || 1) * (1 - d.ram_percent / 100)).toFixed(1)} GB`
                        : "-"}
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
                  percent={isOffline ? "-" : d.sd_percent}
                  strokeColor="#a855f7"
                  sublabel={isOffline ? "-" : `${d.sd_used_gb} GB / ${d.sd_total_gb} GB`}
                />
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 border-t border-slate-200 dark:border-slate-800/60 pt-2 font-mono">
                  <div className="flex justify-between">
                    <span>Total Storage:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {isOffline ? "-" : `${d.sd_total_gb} GB Flash Storage`}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Used:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {isOffline ? "-" : `${d.sd_used_gb} GB (${d.sd_percent}%)`}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Free Space:</span>
                    <strong className="text-[#00a862] dark:text-emerald-400">
                      {isOffline
                        ? "-"
                        : typeof d.sd_total_gb === "number" && typeof d.sd_used_gb === "number"
                        ? `${Math.max(0, d.sd_total_gb - d.sd_used_gb)} GB Free`
                        : "-"}
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
                      {isOffline
                        ? "-"
                        : `${d.sd_health.status} ${
                            d.sd_health.health_percent
                              ? `(${d.sd_health.health_percent}%)`
                              : ""
                          }`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      Bad Sectors:
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono">
                      {isOffline ? "-" : d.sd_health.bad_sector}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      Wear Leveling:
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono">
                      {isOffline ? "-" : d.sd_health.wear_level}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      Operating Temperature:
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono">
                      {isOffline ? "-" : d.sd_health.temperature}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      I/O Error Count:
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono">
                      {isOffline ? "-" : d.sd_health.io_error}
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
                  {isOffline ? "-" : d.sd_health.temperature}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isOffline ? "Offline" : "Normal (< 70°C)"}
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
                        {evt.duration &&
                          evt.duration !== "-" &&
                          evt.duration !== "0m" && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              {formatDurationEn(evt.duration)}
                            </span>
                          )}
                        <span className="text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {evt.time ? evt.time.replace(/\s*WIB/gi, "") : "-"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-slate-400 text-xs">
                    No hardware or system events recorded for this gateway
                    today.
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
