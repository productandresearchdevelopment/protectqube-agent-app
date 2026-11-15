"use client";

import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Calendar,
  Cpu,
  Wifi,
  XCircle,
  CheckCircle2,
  Clock,
  Radio,
  Signal,
  Thermometer,
  AlertCircle,
  AlertTriangle,
  X,
  FileDown,
  Loader2,
  ExternalLink,
  Database,
  History,
} from "lucide-react";
import {
  useCellularReportGatewayDetail,
  exportCellularDetailPdfUrl,
  downloadReportFile,
} from "@/store/api/monitoring";
import { SmartBoxIsometricIllustration } from "@/components/ui/SmartBoxIllustration";
import { parseReportPeriod, MONTH_NAMES } from "@/lib/reportPeriodUtils";

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

const cleanIncidentTitle = (text?: string) => {
  const formatted = formatIncidentEn(text);
  return formatted
    .replace(/\s+for\s+\d+h\s*\d+m/gi, "")
    .replace(/\s+for\s+\d+h/gi, "")
    .replace(/\s+for\s+\d+m/gi, "")
    .replace(/\s+for\s+\d+s/gi, "")
    .trim();
};

const formatIncidentTime = (startStr?: string, endStr?: string) => {
  if (!startStr) return { dateStr: "-", timeStr: "-" };

  const sClean = startStr.trim();
  const sParts = sClean.split(" ");
  const sDate = sParts[0]; // e.g. "2026-11-12"
  const sTime = sParts[1] ? sParts[1].slice(0, 5) : ""; // "19:25"

  let startDateLabel = sDate;
  if (sDate.includes("-")) {
    const [y, m, d] = sDate.split("-");
    const mIdx = parseInt(m, 10) - 1;
    const monthName = MONTH_NAMES[mIdx] || m;
    startDateLabel = `${parseInt(d, 10)} ${monthName} ${y}`;
  }

  if (
    !endStr ||
    endStr === "-" ||
    endStr.toLowerCase().includes("present") ||
    endStr.toLowerCase().includes("now") ||
    endStr.toLowerCase().includes("ongoing") ||
    endStr.toLowerCase().includes("active") ||
    endStr.toLowerCase().includes("sekarang")
  ) {
    return {
      dateStr: startDateLabel,
      timeStr: sTime ? `${sTime} — Present` : "Present",
    };
  }

  const eClean = endStr.trim();
  const eParts = eClean.split(" ");
  const eDate = eParts[0];
  const eTime = eParts[1] ? eParts[1].slice(0, 5) : "";

  let endDateLabel = eDate;
  if (eDate.includes("-")) {
    const [y, m, d] = eDate.split("-");
    const mIdx = parseInt(m, 10) - 1;
    const monthName = MONTH_NAMES[mIdx] || m;
    endDateLabel = `${parseInt(d, 10)} ${monthName} ${y}`;
  }

  if (sDate === eDate) {
    return {
      dateStr: startDateLabel,
      timeStr:
        sTime && eTime
          ? `${sTime} — ${eTime}`
          : `${sTime || "00:00"} — ${eTime || "23:59"}`,
    };
  } else {
    return {
      dateStr: `${startDateLabel} – ${endDateLabel}`,
      timeStr: sTime && eTime ? `${sTime} — ${eTime}` : "-",
    };
  }
};

const getIncidentScope = (event: any): "cpu_modem" | "cellular" | "both" => {
  const m = (
    event.metric ||
    event.category ||
    event.cause ||
    event.description ||
    event.title ||
    ""
  ).toLowerCase();

  // Gateway total outage / telemetry stopped affects both subsystems simultaneously
  if (
    m.includes("gateway offline") ||
    m.includes("telemetry disconnected") ||
    m.includes("telemetry stopped") ||
    m.includes("power") ||
    m.includes("blackout") ||
    m.includes("mati total") ||
    m.includes("gateway")
  ) {
    return "both";
  }

  // Modem hardware connection loss cascades to cellular network disconnection:
  // When modem USB communication is lost, the cellular network is also disconnected.
  // Both subsystems experience downtime, so modem outages appear in both views.
  if (
    m === "cpu_modem" ||
    m.includes("modem-cpu") ||
    m.includes("usb port") ||
    m.includes("serial") ||
    m.includes("terputus")
  ) {
    return "both";
  }
  return "cellular";
};

const parseIncidentEvidence = (event: any, gatewayData?: any) => {
  const raw =
    `${event.title || ""} ${event.description || ""} ${event.cause || ""} ${event.category || ""} ${event.metric || ""}`.toLowerCase();

  const startTimeStr = event.start_time || "the incident onset";

  // 1. Hardware USB CPU–Modem communication loss
  if (
    raw.includes("modem-cpu") ||
    raw.includes("usb port") ||
    raw.includes("serial") ||
    raw.includes("option") ||
    raw.includes("driver") ||
    raw.includes("terputus")
  ) {
    return {
      scope: "CPU – Modem Communication",
      scopeBadgeClass:
        "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
      detectionSystem: "Internal Hardware Interface",
      detectedCondition:
        "Communication lost between Gateway Processor and Cellular Modem",
      title: formatIncidentEn(
        event.title ||
          event.description ||
          "Modem USB Port Communication Lost ([MODEM-CPU: TERPUTUS])",
      ),
      triggerContext: `At ${startTimeStr}, internal communication between the gateway CPU and cellular modem was lost ([MODEM-CPU: TERPUTUS]). While the gateway remained powered on, the modem was unreachable until the connection recovered.`,
      metrics: [
        {
          label: "Interface",
          value: "Internal USB",
          status: "default",
        },
        {
          label: "CPU Status",
          value: "Normal",
          status: "success",
        },
        {
          label: "Modem Status",
          value: "Disconnected",
          status: "danger",
        },
        {
          label: "Connection",
          value: "Lost",
          status: "danger",
        },
      ],
      rootCauseReason:
        "The gateway processor temporarily lost communication with the built-in cellular modem module. While the device remained powered on, it was unable to send commands or transfer data through the modem.",
      impact:
        "Cellular transmission was temporarily interrupted until internal communication recovered.",
    };
  }

  // 2. Total Gateway Offline
  if (
    raw.includes("gateway offline") ||
    raw.includes("telemetry disconnected") ||
    raw.includes("telemetry stopped") ||
    raw.includes("power") ||
    raw.includes("offline")
  ) {
    return {
      scope: "Cellular / Carrier Network",
      scopeBadgeClass:
        "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
      detectionSystem: "Central Monitoring System",
      detectedCondition:
        "Gateway device stopped responding / No data received for over 1 hour",
      title: formatIncidentEn(
        event.title ||
          event.description ||
          "Gateway Offline / Telemetry Disconnected",
      ),
      triggerContext: `At ${startTimeStr}, the gateway stopped sending all telemetry data and became unreachable. No heartbeats were received by the central platform until power or network recovered.`,
      metrics: [
        {
          label: "Provider",
          value: gatewayData?.provider || "Telkomsel",
          status: "default",
        },
        {
          label: "Last Signal",
          value: gatewayData?.network_avg_rsrp
            ? `${gatewayData.network_avg_rsrp} dBm`
            : "-75 dBm",
          status: "default",
        },
        {
          label: "SIM Status",
          value: gatewayData?.sim_status || "Active",
          status: "success",
        },
        {
          label: "Connection",
          value: "Disconnected",
          status: "danger",
        },
      ],
      rootCauseReason:
        "The gateway stopped transmitting data entirely to the central monitoring platform, typically indicating a site electrical power outage or an unplugged power adapter.",
      impact:
        "Data transmission and device telemetry were paused during this outage window.",
    };
  }

  // 3. SIM Card issues
  if (
    raw.includes("sim") ||
    raw.includes("cpin") ||
    raw.includes("no sim") ||
    raw.includes("kartu")
  ) {
    return {
      scope: "Cellular / Carrier Network",
      scopeBadgeClass:
        "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
      detectionSystem: "SIM Card Interface",
      detectedCondition: "SIM card not detected by modem",
      title: formatIncidentEn(
        event.title || event.description || "SIM Card Not Detected",
      ),
      triggerContext: `At ${startTimeStr}, the modem failed to detect a valid SIM card (+CPIN: NOT INSERTED), preventing the gateway from registering on the cellular operator network.`,
      metrics: [
        {
          label: "Provider",
          value: "No SIM",
          status: "default",
        },
        {
          label: "Modem Status",
          value: "Normal",
          status: "success",
        },
        {
          label: "SIM Status",
          value: "Not Detected",
          status: "danger",
        },
        {
          label: "Connection",
          value: "No Service",
          status: "danger",
        },
      ],
      rootCauseReason:
        "The modem was unable to establish contact with the SIM card chip, typically caused by physical vibration or loose placement in the SIM tray.",
      impact:
        "The device could not authenticate on the cellular network during this period.",
    };
  }

  // 4. BTS Signal Quality
  if (
    raw.includes("signal") ||
    raw.includes("rsrp") ||
    raw.includes("csq") ||
    raw.includes("blankspot") ||
    raw.includes("bts")
  ) {
    return {
      scope: "Cellular / Carrier Network",
      scopeBadgeClass:
        "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
      detectionSystem: "Cellular Signal Interface",
      detectedCondition: "Carrier signal dropped below normal operating level",
      title: formatIncidentEn(
        event.title || event.description || "Cellular Signal Warning",
      ),
      triggerContext: `At ${startTimeStr}, cellular radio signal dropped to critical levels (RSRP < -115 dBm), causing data transmission delays and connection instability.`,
      metrics: [
        {
          label: "Provider",
          value: gatewayData?.provider || "Telkomsel",
          status: "default",
        },
        {
          label: "Signal",
          value: gatewayData?.network_avg_rsrp
            ? `${gatewayData.network_avg_rsrp} dBm`
            : "Critical Drop",
          status: "danger",
        },
        {
          label: "SIM Status",
          value: gatewayData?.sim_status || "Active",
          status: "success",
        },
        {
          label: "Connection",
          value: "Weak Signal",
          status: "warning",
        },
      ],
      rootCauseReason:
        "The device experienced weak radio signal coverage from the operator's cell tower, causing elevated transmission retries and unstable connectivity.",
      impact:
        "Slower data transmission speeds and potential momentary packet loss.",
    };
  }

  // 5. Default Network Disruption
  return {
    scope: "Cellular / Carrier Network",
    scopeBadgeClass:
      "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
    detectionSystem: "Mobile Network Interface",
    detectedCondition: "Cellular operator data transmission interrupted",
    title: formatIncidentEn(
      event.title || event.description || "Cellular Network Disconnected",
    ),
    triggerContext: `At ${startTimeStr}, the cellular data connection was interrupted by the operator network, temporarily pausing data transfer until the session reconnected.`,
    metrics: [
      {
        label: "Provider",
        value: gatewayData?.provider || "Telkomsel",
        status: "default",
      },
      {
        label: "Last Signal",
        value: gatewayData?.network_avg_rsrp
          ? `${gatewayData.network_avg_rsrp} dBm`
          : "-75 dBm",
        status: "default",
      },
      {
        label: "SIM Status",
        value: gatewayData?.sim_status || "Active",
        status: "success",
      },
      {
        label: "Connection",
        value: event.status === "Active" ? "Offline" : "Recovered",
        status: event.status === "Active" ? "danger" : "success",
      },
    ],
    rootCauseReason: formatIncidentEn(
      event.cause ||
        "The cellular data connection was temporarily suspended by the carrier before returning to normal service.",
    ),
    impact:
      "Data packets were temporarily delayed until the cellular connection re-established.",
  };
};

interface IncidentDetailModalProps {
  incident: any;
  gatewayData?: any;
  onClose: () => void;
}

const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  gatewayData,
  onClose,
}) => {
  const evidence = parseIncidentEvidence(incident, gatewayData);
  const isStillActive =
    incident.end_time === "-" ||
    incident.end_time?.toLowerCase().includes("sekarang") ||
    incident.end_time?.toLowerCase().includes("present");

  const fullTitle = cleanIncidentTitle(
    incident.title || incident.description || evidence.title,
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#0c1527] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Clean, No Subtitle) */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-xs">
              <AlertTriangle className="size-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Incident Details
            </h3>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* 1. Category & Title Banner */}
          <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${evidence.scopeBadgeClass}`}
              >
                {evidence.scope}
              </span>
              {isStillActive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-[#e2445c] border border-rose-500/30 animate-pulse">
                  <span className="size-1.5 rounded-full bg-rose-500" />
                  Active Outage
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-[#00c875] border border-emerald-500/30">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Resolved
                </span>
              )}
            </div>
            <h4 className="font-bold text-sm md:text-base text-slate-900 dark:text-white">
              {fullTitle}
            </h4>
          </div>

          {/* 2. Timeline Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                Start Time
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono mt-1 block">
                {incident.start_time || "-"}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                End Time
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono mt-1 block">
                {isStillActive ? "Present" : incident.end_time || "-"}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium block">
                Total Duration
              </span>
              <span className="text-xs font-extrabold text-[#f59e0b] font-mono mt-1 block">
                {formatDurationEn(incident.duration)}
              </span>
            </div>
          </div>

          {/* 3. Pre-Incident Context & Trigger Condition */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70 space-y-3">
            <div className="flex items-center gap-2">
              <History className="size-4 text-blue-500 shrink-0" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Pre-Incident Context &amp; Trigger Condition
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {evidence.triggerContext}
            </p>

            {/* Last Recorded State at Incident Onset (Snapshot Parameter Penting) */}
            {evidence.metrics && evidence.metrics.length > 0 && (
              <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                  Device State at Incident
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {evidence.metrics.map((m: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-white dark:bg-[#070e1d] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs"
                    >
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate">
                        {m.label}
                      </span>
                      <span
                        className={`text-xs font-bold font-mono mt-0.5 block truncate ${
                          m.status === "danger"
                            ? "text-[#e2445c]"
                            : m.status === "warning"
                              ? "text-[#f59e0b]"
                              : m.status === "success"
                                ? "text-[#00c875]"
                                : "text-slate-800 dark:text-slate-200"
                        }`}
                        title={m.value}
                      >
                        {m.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Cause & Root Cause Analysis (At the bottom, simple & to the point) */}
          <div className="p-4 rounded-xl bg-rose-500/[0.06] dark:bg-rose-500/[0.1] border border-rose-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="size-4 text-rose-500 shrink-0" />
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                Root Cause &amp; System Analysis
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {evidence.rootCauseReason}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CellularReportDetailCardProps {
  gatewayId: string | null;
  dateRange?: string;
  onClose?: () => void;
}

export const CellularReportDetailCard: React.FC<
  CellularReportDetailCardProps
> = ({ gatewayId, dateRange, onClose }) => {
  const { data, isLoading } = useCellularReportGatewayDetail(
    gatewayId,
    dateRange,
  );
  const [selectedBarDay, setSelectedBarDay] = useState<number | null>(null);
  const [dailyViewMetric, setDailyViewMetric] = useState<
    "cpu_modem" | "cellular"
  >("cpu_modem");
  const [selectedEventDate, setSelectedEventDate] = useState<string>("ALL");
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [selectedIncidentIndex, setSelectedIncidentIndex] = useState<number>(1);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    if (!gatewayId) return;
    try {
      setIsExportingPdf(true);
      const url = exportCellularDetailPdfUrl(gatewayId, dateRange);
      const locName = (data?.location || gatewayId).replace(
        /[^a-zA-Z0-9_-]/g,
        "_",
      );
      await downloadReportFile(url, `Cellular_Detail_${locName}.pdf`);
    } catch (err) {
      console.error("Export cellular detail PDF error:", err);
    } finally {
      setIsExportingPdf(false);
    }
  };
  const [hoveredDay, setHoveredDay] = useState<{
    day: number;
    dayNumStr: string;
    dateKey: string;
    fullDate: string;
    status: "online" | "offline" | "warning" | "future";
    uptimePct: number;
    downtimePct: number;
    visualUpPct?: number;
    visualDownPct?: number;
    eventCount: number;
    totalDurationStr: string;
    isToday: boolean;
    isFuture?: boolean;
  } | null>(null);

  const periodInfo = useMemo(() => {
    return parseReportPeriod(data?.period || dateRange);
  }, [data?.period, dateRange]);

  // Actual first active day of this gateway (never calculate or show fake days before device existed)
  const minActiveDay = useMemo(() => {
    const rawBreakdown = data?.daily_breakdown || [];
    if (rawBreakdown.length > 0) {
      return Math.max(periodInfo.startDay, rawBreakdown[0].day);
    }
    return periodInfo.startDay;
  }, [data?.daily_breakdown, periodInfo.startDay]);

  // Synchronized date selection handler across Timeline, Rincian SLA, and Incident History
  const handleSelectDay = (day: number | null, dateKey?: string) => {
    if (
      day === null ||
      (selectedBarDay === day && (!dateKey || selectedEventDate === dateKey))
    ) {
      setSelectedBarDay(null);
      setSelectedEventDate("ALL");
    } else {
      setSelectedBarDay(day);
      if (dateKey) {
        setSelectedEventDate(dateKey);
      } else {
        const dayNumStr = day < 10 ? `0${day}` : `${day}`;
        setSelectedEventDate(`${dayNumStr} ${periodInfo.monthStr}`);
      }
    }
  };

  const handleDropdownDateChange = (val: string) => {
    setSelectedEventDate(val);
    if (val === "ALL") {
      setSelectedBarDay(null);
    } else {
      const parts = val.trim().split(" ");
      const dNum = parseInt(parts[0], 10);
      if (!isNaN(dNum)) {
        setSelectedBarDay(dNum);
      } else {
        setSelectedBarDay(null);
      }
    }
  };

  // Generate dynamic daily status bar chart items: full month timeline (1 s/d 30/31+), bars only appear for active filtered dates
  const dailyStatusList = useMemo(() => {
    const { daysInMonth, monthStr, yearStr, todayDay, isCurrentMonth } =
      periodInfo;
    const minDay = minActiveDay;
    const maxDay = periodInfo.endDay;
    const breakdown = data?.daily_breakdown || [];

    const totalDays = Math.max(daysInMonth, maxDay);
    const list = [];
    for (let day = 1; day <= totalDays; day++) {
      const dayNumStr = day < 10 ? `0${day}` : `${day}`;
      const dateKey = `${dayNumStr} ${monthStr}`;
      const fullDate = `${dayNumStr} ${monthStr} ${yearStr}`;

      // Bar is filled only if date is within selected filter range and not a future date
      const isInRange = day >= minDay && day <= maxDay;
      const isFutureDate = Boolean(
        isCurrentMonth && todayDay && day > todayDay,
      );
      const hasBar = isInRange && !isFutureDate;

      const daySla = breakdown.find((r) => r.day === day);

      let status: "online" | "offline" | "future" = !hasBar
        ? "future"
        : "online";
      let uptimePct = 100;
      let downtimePct = 0;
      let visualDownPct = 0;
      let visualUpPct = 100;
      let totalDurationStr = "0m";

      if (hasBar) {
        if (daySla) {
          const isCpu = dailyViewMetric === "cpu_modem";
          const downMin = isCpu
            ? daySla.cpu_modem_downtime_min
            : daySla.cellular_downtime_min;
          const upMin = isCpu
            ? daySla.cpu_modem_uptime_min
            : daySla.cellular_uptime_min;
          const sr = isCpu
            ? daySla.cpu_modem_success_rate
            : daySla.cellular_success_rate;

          const totalObs = upMin + downMin;
          if (totalObs > 0) {
            uptimePct = Number(((upMin / totalObs) * 100).toFixed(1));
            downtimePct = Number(((downMin / totalObs) * 100).toFixed(1));
          } else {
            uptimePct = Number(sr.toFixed(1));
            downtimePct = Number((100 - uptimePct).toFixed(1));
          }

          if (downMin > 0 || downtimePct > 0) {
            status = "offline";
            totalDurationStr = `${Math.round(downMin)}m`;
            if (downtimePct <= 0 && downMin > 0) {
              downtimePct = 0.1;
              uptimePct = 99.9;
            }
            if (uptimePct <= 0) {
              visualDownPct = 100;
              visualUpPct = 0;
            } else {
              // Ensure visible red height (minimum 6%, maximum 95%) so short downtime is clearly visible
              visualDownPct = Math.max(6, Math.min(95, downtimePct));
              visualUpPct = 100 - visualDownPct;
            }
          } else {
            status = "online";
            uptimePct = 100;
            downtimePct = 0;
            visualDownPct = 0;
            visualUpPct = 100;
            totalDurationStr = "0m";
          }
        } else {
          uptimePct = 100;
          downtimePct = 0;
          visualDownPct = 0;
          visualUpPct = 100;
          status = "online";
          totalDurationStr = "0m";
        }
      }

      list.push({
        day,
        dayNumStr,
        dateKey,
        fullDate,
        status,
        uptimePct,
        downtimePct,
        visualUpPct,
        visualDownPct,
        eventCount:
          downtimePct > 0 ||
          (daySla &&
            (dailyViewMetric === "cpu_modem"
              ? daySla.cpu_modem_downtime_min
              : daySla.cellular_downtime_min) > 0)
            ? 1
            : 0,
        totalDurationStr,
        isToday: day === todayDay,
        isFuture: !hasBar,
        isInRange,
      });
    }

    return list;
  }, [data?.daily_breakdown, periodInfo, minActiveDay, dailyViewMetric]);

  // 1. Filter trouble events strictly within the active date range
  const rangeFilteredEvents = useMemo(() => {
    const rawEvents = data?.trouble_events || [];
    const minDay = minActiveDay;
    const maxDay = periodInfo.endDay || periodInfo.effectiveDays;
    const month = periodInfo.monthStr.toLowerCase();
    const targetMonthNum =
      MONTH_NAMES.findIndex((m) => m.toLowerCase() === month) + 1;

    return rawEvents.filter((ev) => {
      const trimmed = (ev.start_time || "").trim();
      if (!trimmed) return true;

      // Handle ISO format: "YYYY-MM-DD ..."
      const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) {
        const dNum = parseInt(isoMatch[3], 10);
        const mNum = parseInt(isoMatch[2], 10);
        if (targetMonthNum > 0 && mNum !== targetMonthNum) {
          return false;
        }
        return dNum >= minDay && dNum <= maxDay;
      }

      // Handle legacy format: "DD MMM YYYY ..."
      const parts = trimmed.split(" ");
      if (parts.length >= 2) {
        const dNum = parseInt(parts[0], 10);
        const mStr = parts[1].toLowerCase().replace(".", "");
        const isSameMonth =
          mStr.startsWith(month.slice(0, 3)) ||
          month.startsWith(mStr.slice(0, 3));
        if (!isNaN(dNum) && isSameMonth) {
          return dNum >= minDay && dNum <= maxDay;
        }
        if (!isNaN(dNum) && !isSameMonth) {
          return false;
        }
      }
      return true;
    });
  }, [
    data?.trouble_events,
    minActiveDay,
    periodInfo.endDay,
    periodInfo.effectiveDays,
    periodInfo.monthStr,
  ]);

  // 2. Filter events matching the active metric card (cpu_modem vs cellular)
  // Gateway offline incidents affect both subsystems, so they appear in both views
  const metricMatchedEvents = useMemo(() => {
    return rangeFilteredEvents.filter((ev) => {
      const scope = getIncidentScope(ev);
      return scope === "both" || scope === dailyViewMetric;
    });
  }, [rangeFilteredEvents, dailyViewMetric]);

  // Extract distinct dates from metric-matched events for dropdown
  const uniqueDates = useMemo(() => {
    const set = new Set<string>();
    metricMatchedEvents.forEach((ev) => {
      const trimmed = (ev.start_time || "").trim();
      const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
      if (isoMatch) {
        set.add(isoMatch[1]);
        return;
      }
      const parts = trimmed.split(" ");
      if (parts.length >= 2) {
        set.add(`${parts[0]} ${parts[1]}`);
      }
    });
    return Array.from(set);
  }, [metricMatchedEvents]);

  // 3. Filter trouble events by active metric and selected date
  const filteredEvents = useMemo(() => {
    let list = metricMatchedEvents;

    if (selectedBarDay !== null) {
      const dayNumStr =
        selectedBarDay < 10 ? `0${selectedBarDay}` : `${selectedBarDay}`;
      const prefix = `${dayNumStr} ${periodInfo.monthStr}`;
      const mIdx = MONTH_NAMES.findIndex(
        (m) => m.toLowerCase() === periodInfo.monthStr.toLowerCase(),
      );
      const mNum = mIdx !== -1 ? String(mIdx + 1).padStart(2, "0") : "11";
      const isoPrefix = `${periodInfo.yearStr}-${mNum}-${dayNumStr}`;
      const year = Number(periodInfo.yearStr) || new Date().getFullYear();
      const dStart = new Date(year, mIdx, selectedBarDay, 0, 0, 0);
      const dEnd = new Date(year, mIdx, selectedBarDay, 23, 59, 59, 999);

      list = list.filter((ev) => {
        const trimmed = (ev.start_time || "").trim();
        const startMatches =
          trimmed.startsWith(isoPrefix) ||
          trimmed.startsWith(prefix) ||
          trimmed.startsWith(`${selectedBarDay} ${periodInfo.monthStr}`) ||
          (ev.date_str &&
            (ev.date_str === isoPrefix || ev.date_str.startsWith(prefix)));
        if (startMatches) return true;
        if (
          ev.end_time &&
          ev.end_time !== "-" &&
          !ev.end_time.toLowerCase().includes("present")
        ) {
          const st = new Date(trimmed.replace(" ", "T"));
          const et = new Date(ev.end_time.trim().replace(" ", "T"));
          if (!isNaN(st.getTime()) && !isNaN(et.getTime())) {
            return (
              st.getTime() < dEnd.getTime() && et.getTime() > dStart.getTime()
            );
          }
        }
        return false;
      });
    } else if (selectedEventDate !== "ALL") {
      list = list.filter((ev) => {
        const trimmed = (ev.start_time || "").trim();
        return (
          trimmed.startsWith(selectedEventDate) ||
          (ev.date_str && ev.date_str === selectedEventDate)
        );
      });
    }

    // Always sort descending: Active first, then latest start_time on top
    return [...list].sort((a, b) => {
      const aActive =
        a.status === "Active" ||
        a.end_time === "-" ||
        a.end_time?.toLowerCase().includes("now") ||
        a.end_time?.toLowerCase().includes("ongoing") ||
        a.end_time?.toLowerCase().includes("active") ||
        a.end_time?.toLowerCase().includes("present");
      const bActive =
        b.status === "Active" ||
        b.end_time === "-" ||
        b.end_time?.toLowerCase().includes("now") ||
        b.end_time?.toLowerCase().includes("ongoing") ||
        b.end_time?.toLowerCase().includes("active") ||
        b.end_time?.toLowerCase().includes("present");

      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;

      const parseDt = (item: any) => {
        if (typeof item.epoch === "number") return item.epoch * 1000;
        const s = (item.start_time || "").trim();
        const d = new Date(s.replace(" ", "T"));
        return isNaN(d.getTime()) ? 0 : d.getTime();
      };

      return parseDt(b) - parseDt(a);
    });
  }, [
    metricMatchedEvents,
    selectedEventDate,
    selectedBarDay,
    periodInfo.monthStr,
    periodInfo.yearStr,
  ]);

  // Filter Rincian SLA to only show active days between minActiveDay and effectiveDays
  const activeDailyBreakdown = useMemo(() => {
    const allRows = data?.daily_breakdown || [];
    const minDay = minActiveDay;
    const maxDay = periodInfo.effectiveDays;
    return allRows.filter((row) => row.day >= minDay && row.day <= maxDay);
  }, [data?.daily_breakdown, minActiveDay, periodInfo.effectiveDays]);

  // Dynamic top cards metrics responding to timeline selection / active observation period
  const cellularMetrics = useMemo(() => {
    if (selectedBarDay !== null) {
      const dayRow = activeDailyBreakdown.find((r) => r.day === selectedBarDay);
      const dayEvents = filteredEvents;
      if (dayRow) {
        const obsMin =
          dayRow.observation_min ??
          (dayRow.uptime_min ?? 0) + (dayRow.downtime_min ?? 0);
        const upMin =
          dayRow.cpu_modem_uptime_min ?? dayRow.uptime_min ?? obsMin;
        const downMin =
          dayRow.cpu_modem_downtime_min ?? dayRow.downtime_min ?? 0;
        const sr =
          dayRow.cpu_modem_success_rate ??
          dayRow.success_rate ??
          (obsMin > 0 ? (upMin / obsMin) * 100 : 100);

        const netUpMin = dayRow.cellular_uptime_min ?? upMin;
        const netDownMin = dayRow.cellular_downtime_min ?? downMin;
        const netSr = dayRow.cellular_success_rate ?? sr;

        const dayStr = dayRow.date;
        const obsHrs = (obsMin / 60.0).toFixed(1);

        return {
          periodStr: dayStr,
          periodHoursStr: `Total ${obsHrs} Hours`,
          cpuModemUptime: `${Math.floor(upMin / 60)}h ${Math.round(upMin % 60)}m`,
          cpuModemUptimePct: `${sr.toFixed(1)}%`,
          cpuModemOffline: `${Math.floor(downMin / 60)}h ${Math.round(downMin % 60)}m`,
          cpuModemOfflinePct: `${(100.0 - sr).toFixed(1)}%`,
          successRate: `${sr.toFixed(1)}%`,
          successRateChecks: `(1 / 1 day)`,
          networkUptime: `${Math.floor(netUpMin / 60)}h ${Math.round(netUpMin % 60)}m`,
          networkUptimePct: `${netSr.toFixed(1)}%`,
          networkOffline: `${Math.floor(netDownMin / 60)}h ${Math.round(netDownMin % 60)}m`,
          networkOfflinePct: `${(100.0 - netSr).toFixed(1)}%`,
          eventsCount: dayEvents.length,
        };
      }
    }

    const count = activeDailyBreakdown.length;
    let totalObsMin = 0;
    let totalUpMin = 0;
    let totalDownMin = 0;
    let totalNetUpMin = 0;
    let totalNetDownMin = 0;

    activeDailyBreakdown.forEach((r) => {
      const obs =
        r.observation_min ?? (r.uptime_min ?? 0) + (r.downtime_min ?? 0);
      totalObsMin += obs;
      totalUpMin += r.cpu_modem_uptime_min ?? r.uptime_min ?? obs;
      totalDownMin += r.cpu_modem_downtime_min ?? r.downtime_min ?? 0;
      totalNetUpMin += r.cellular_uptime_min ?? r.uptime_min ?? obs;
      totalNetDownMin += r.cellular_downtime_min ?? r.downtime_min ?? 0;
    });

    const avgSr =
      totalObsMin > 0
        ? (totalUpMin / totalObsMin) * 100
        : data?.cpu_modem_uptime_pct
          ? parseFloat(data.cpu_modem_uptime_pct)
          : 100;
    const avgNetSr =
      totalObsMin > 0
        ? (totalNetUpMin / totalObsMin) * 100
        : data?.network_uptime_pct
          ? parseFloat(data.network_uptime_pct)
          : 100;

    const firstDay = activeDailyBreakdown[0];
    const lastDay = activeDailyBreakdown[activeDailyBreakdown.length - 1];
    const activeRangeStr =
      firstDay && lastDay && firstDay.date !== lastDay.date
        ? `${firstDay.date} - ${lastDay.date}`
        : firstDay?.date || periodInfo.effectivePeriodStr;

    const totalObsHrs = (totalObsMin / 60.0).toFixed(1);

    return {
      periodStr: activeRangeStr,
      periodHoursStr: data?.period_hours || `Total ${totalObsHrs} Hours`,
      cpuModemUptime:
        data?.cpu_modem_uptime ||
        `${Math.floor(totalUpMin / 60)}h ${Math.round(totalUpMin % 60)}m`,
      cpuModemUptimePct: `${avgSr.toFixed(1)}%`,
      cpuModemOffline:
        data?.cpu_modem_offline ||
        `${Math.floor(totalDownMin / 60)}h ${Math.round(totalDownMin % 60)}m`,
      cpuModemOfflinePct: `${(100.0 - avgSr).toFixed(1)}%`,
      successRate: `${avgSr.toFixed(1)}%`,
      successRateChecks: `(${count} / ${count} days)`,
      networkUptime:
        data?.network_uptime ||
        `${Math.floor(totalNetUpMin / 60)}h ${Math.round(totalNetUpMin % 60)}m`,
      networkUptimePct: `${avgNetSr.toFixed(1)}%`,
      networkOffline:
        data?.network_offline ||
        `${Math.floor(totalNetDownMin / 60)}h ${Math.round(totalNetDownMin % 60)}m`,
      networkOfflinePct: `${(100.0 - avgNetSr).toFixed(1)}%`,
      eventsCount: rangeFilteredEvents.length,
    };
  }, [
    selectedBarDay,
    activeDailyBreakdown,
    filteredEvents,
    rangeFilteredEvents.length,
    data,
    periodInfo.effectivePeriodStr,
  ]);

  // When a day bar is clicked, filter Rincian SLA to only that day; otherwise show all active days up to today
  const displayedBreakdown = useMemo(() => {
    if (selectedBarDay !== null) {
      return activeDailyBreakdown.filter((r) => r.day === selectedBarDay);
    }
    return activeDailyBreakdown;
  }, [activeDailyBreakdown, selectedBarDay]);

  // Compute footer summary dynamically for displayed rows
  const displayedSummary = useMemo(() => {
    const isCpu = dailyViewMetric === "cpu_modem";
    const count = displayedBreakdown.length;
    if (count === 0) return null;

    let totalUptime = 0;
    let totalDowntime = 0;
    displayedBreakdown.forEach((r) => {
      totalUptime += isCpu ? r.cpu_modem_uptime_min : r.cellular_uptime_min;
      totalDowntime += isCpu
        ? r.cpu_modem_downtime_min
        : r.cellular_downtime_min;
    });

    const totalObs = totalUptime + totalDowntime;
    const avgSuccessRate = totalObs > 0 ? (totalUptime / totalObs) * 100 : 0;
    const isSuccess = avgSuccessRate >= 98.0;

    return {
      count,
      totalObs,
      totalUptime,
      totalDowntime,
      avgSuccessRate,
      isSuccess,
    };
  }, [displayedBreakdown, dailyViewMetric]);

  if (!gatewayId) return null;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <div className="size-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading gateway performance data...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-[#070e1d] rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
        Performance data for gateway {gatewayId} not found.
      </div>
    );
  }

  const d = data;
  const isWhite = (d.type || "").includes("Putih");
  const isOffline = (d.status || "").toLowerCase() === "offline";

  return (
    <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-4 sm:p-5 space-y-4 font-sans transition-all duration-300">
      {/* 1. Header with Gateway Location & Status */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <FileSpreadsheet className="size-4" />
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Detail Device &ndash; {d.location || d.id}
          </h2>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              isOffline
                ? "bg-rose-500/15 dark:bg-rose-500/20 text-[#e2445c] border-rose-500/30"
                : "bg-[#00c875]/15 dark:bg-[#00c875]/20 text-[#00c875] border-[#00c875]/30"
            }`}
          >
            {d.status}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-xs ${
              isExportingPdf
                ? "bg-blue-500/20 text-[#0073ea] dark:text-[#00d2ff] border-blue-500/40 cursor-wait"
                : "bg-blue-500/10 hover:bg-blue-500/20 text-[#0073ea] dark:text-[#00d2ff] border-blue-500/30 cursor-pointer active:scale-95"
            }`}
            title="Export Device Detail to PDF"
          >
            {isExportingPdf ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FileDown className="size-3.5" />
            )}
            <span>{isExportingPdf ? "Exporting..." : "Export"}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Close Details"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Section: Gateway Isometric Illustration & 10 KPI Metric Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 items-stretch">
        <div className="xl:col-span-4 bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row xl:flex-row gap-4 items-center sm:items-start xl:items-start justify-between shadow-xs">
          <div className="flex flex-col items-center justify-center shrink-0 pt-1">
            <SmartBoxIsometricIllustration isWhite={isWhite} />
          </div>

          <div className="flex-1 min-w-0 space-y-2 w-full">
            <div>
              <h3
                className="text-lg font-bold text-slate-900 dark:text-white tracking-wide leading-tight truncate"
                title={d.location}
              >
                {d.location}
              </h3>
              <p
                className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium truncate"
                title={d.id}
              >
                {d.id}
              </p>
            </div>

            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 font-normal pt-1">
              <div className="grid grid-cols-[80px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Type
                </span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium">
                  : {d.type}
                </span>
              </div>
              <div className="grid grid-cols-[80px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Modem
                </span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium">
                  : {d.modem}
                </span>
              </div>
              <div className="grid grid-cols-[80px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Provider
                </span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium">
                  : {d.provider}
                </span>
              </div>
              <div className="grid grid-cols-[80px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  No. SIM Card
                </span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-mono">
                  : {d.sim_number}
                </span>
              </div>
              <div className="grid grid-cols-[80px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  SIM Status
                </span>
                <span
                  className={`text-[11px] font-medium ${
                    isOffline || (d.sim_status || "").toLowerCase() !== "active"
                      ? "text-[#e2445c]"
                      : "text-[#00c875]"
                  }`}
                >
                  : {isOffline ? "Offline" : d.sim_status}
                </span>
              </div>
              <div className="grid grid-cols-[80px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Remaining Quota
                </span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium font-mono">
                  :{" "}
                  {d.quota_main_gb !== undefined && d.quota_main_gb !== null
                    ? `${d.quota_main_gb} GB`
                    : "-"}
                </span>
              </div>
              <div className="grid grid-cols-[80px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  IP Address
                </span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-mono">
                  : {d.ip_address}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (xl:col-span-8): 10 KPI Metric Cards */}
        <div className="xl:col-span-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {/* Card 1: Periode */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-slate-200/80 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <Calendar className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Period
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {cellularMetrics.periodStr}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                {cellularMetrics.periodHoursStr}
              </div>
            </div>
          </div>

          {/* Card 2: CPU – Modem Uptime */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-emerald-500/15 flex items-center justify-center text-[#00c875]">
                <Cpu className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                CPU – Modem Uptime
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#00c875] leading-tight">
                {cellularMetrics.cpuModemUptime}
              </div>
              <div className="text-[11px] font-semibold text-[#00c875] mt-0.5">
                {cellularMetrics.cpuModemUptimePct}
              </div>
            </div>
          </div>

          {/* Card 3: CPU – Modem Downtime */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-rose-500/15 flex items-center justify-center text-[#e2445c]">
                <XCircle className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                CPU – Modem Downtime
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#e2445c] leading-tight">
                {cellularMetrics.cpuModemOffline}
              </div>
              <div className="text-[11px] font-semibold text-[#e2445c] mt-0.5">
                {cellularMetrics.cpuModemOfflinePct}
              </div>
            </div>
          </div>

          {/* Card 4: CPU – Modem Success Rate */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-emerald-500/15 flex items-center justify-center text-[#00c875]">
                <CheckCircle2 className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                CPU Success Rate
              </span>
            </div>
            <div className="mt-2.5">
              <div
                className={`text-sm font-bold leading-tight ${
                  parseFloat(cellularMetrics.successRate || "0") >= 98.0
                    ? "text-[#00c875]"
                    : "text-[#e2445c]"
                }`}
              >
                {cellularMetrics.successRate}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {cellularMetrics.successRateChecks}
              </div>
            </div>
          </div>

          {/* Card 5: Avg Signal (RSRP) - Moved here from Card 8 */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-blue-500/15 flex items-center justify-center text-[#0073ea]">
                <Signal className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                Avg Signal (RSRP)
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {isOffline ? "-" : d.avg_rsrp || "-"}
              </div>
            </div>
          </div>

          {/* Card 6: Network Uptime */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-emerald-500/15 flex items-center justify-center text-[#00c875]">
                <Radio className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                Network Uptime
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#00c875] leading-tight">
                {cellularMetrics.networkUptime}
              </div>
              <div className="text-[11px] font-semibold text-[#00c875] mt-0.5">
                {cellularMetrics.networkUptimePct}
              </div>
            </div>
          </div>

          {/* Card 7: Network Downtime */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-rose-500/15 flex items-center justify-center text-[#e2445c]">
                <XCircle className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                Network Downtime
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#e2445c] leading-tight">
                {cellularMetrics.networkOffline}
              </div>
              <div className="text-[11px] font-semibold text-[#e2445c] mt-0.5">
                {cellularMetrics.networkOfflinePct}
              </div>
            </div>
          </div>

          {/* Card 8: Network Success Rate - Replaces Avg Response Time, placed where Avg Signal was */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-teal-500/15 flex items-center justify-center text-[#00c875]">
                <CheckCircle2 className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                Network Success Rate
              </span>
            </div>
            <div className="mt-2.5">
              <div
                className={`text-sm font-bold leading-tight ${
                  parseFloat(cellularMetrics.networkUptimePct || "0") >= 98.0
                    ? "text-[#00c875]"
                    : "text-[#e2445c]"
                }`}
              >
                {cellularMetrics.networkUptimePct}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {cellularMetrics.successRateChecks}
              </div>
            </div>
          </div>

          {/* Card 9: Avg Modem Temperature */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-rose-500/15 flex items-center justify-center text-[#e2445c]">
                <Thermometer className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                Avg Modem Temp
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {isOffline ? "-" : d.avg_modem_temp || "-"}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {isOffline ? "Gateway Offline" : d.temp_range}
              </div>
            </div>
          </div>

          {/* Card 10: Total Incidents */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-amber-500/15 flex items-center justify-center text-[#f59e0b]">
                <AlertCircle className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                Total Incidents
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#f59e0b] leading-tight">
                {cellularMetrics.eventsCount}{" "}
                {cellularMetrics.eventsCount === 1 ? "incident" : "incidents"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2.5 DUAL METRIC SELECTOR: CPU-MODEM vs CELLULAR / NETWORK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
        {/* Tab 1: CPU - Modem */}
        <button
          type="button"
          onClick={() => setDailyViewMetric("cpu_modem")}
          className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden ${
            dailyViewMetric === "cpu_modem"
              ? "bg-blue-600 dark:bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30 ring-2 ring-blue-300 dark:ring-blue-400"
              : "bg-slate-100/90 dark:bg-[#0d1829] border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400/70 opacity-80 hover:opacity-100 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${
                  dailyViewMetric === "cpu_modem"
                    ? "bg-white/20 text-white shadow-xs"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                <Cpu className="size-5" />
              </div>
              <div>
                <h4
                  className={`font-extrabold text-sm flex items-center gap-2 ${
                    dailyViewMetric === "cpu_modem"
                      ? "text-white"
                      : "text-slate-900 dark:text-white"
                  }`}
                >
                  <span>1. CPU – Modem Communication</span>
                  {dailyViewMetric === "cpu_modem" ? (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white text-blue-700 uppercase tracking-wide shadow-xs">
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      Click to View
                    </span>
                  )}
                </h4>
                <p
                  className={`text-[11px] mt-0.5 font-medium ${
                    dailyViewMetric === "cpu_modem"
                      ? "text-blue-100"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  Internal Hardware Bus & Serial Port Communication
                </p>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`font-mono text-xl font-black ${
                  dailyViewMetric === "cpu_modem"
                    ? "text-white drop-shadow-xs"
                    : "text-blue-600 dark:text-blue-400"
                }`}
              >
                {cellularMetrics.cpuModemUptimePct}
              </div>
              <div
                className={`text-[10px] font-semibold tracking-wider uppercase font-mono ${
                  dailyViewMetric === "cpu_modem"
                    ? "text-blue-100"
                    : "text-slate-500"
                }`}
              >
                Success Rate
              </div>
            </div>
          </div>
          <div
            className={`mt-3 pt-2.5 border-t flex items-center justify-between text-xs ${
              dailyViewMetric === "cpu_modem"
                ? "border-blue-400/40 text-blue-50"
                : "border-slate-200/80 dark:border-slate-800/80 text-slate-500 dark:text-slate-400"
            }`}
          >
            <span>
              Uptime:{" "}
              <strong
                className={`font-mono px-1.5 py-0.5 rounded ${
                  dailyViewMetric === "cpu_modem"
                    ? "bg-blue-700/80 text-white font-bold"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {cellularMetrics.cpuModemUptime}
              </strong>
            </span>
            <span>
              Downtime:{" "}
              <strong
                className={`font-mono px-1.5 py-0.5 rounded ${
                  dailyViewMetric === "cpu_modem"
                    ? "bg-rose-500 text-white font-bold"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {cellularMetrics.cpuModemOffline}
              </strong>
            </span>
          </div>
        </button>

        {/* Tab 2: Cellular / Network */}
        <button
          type="button"
          onClick={() => setDailyViewMetric("cellular")}
          className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden ${
            dailyViewMetric === "cellular"
              ? "bg-teal-600 dark:bg-teal-600 text-white border-teal-500 shadow-lg shadow-teal-600/30 ring-2 ring-teal-300 dark:ring-teal-400"
              : "bg-slate-100/90 dark:bg-[#0d1829] border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-teal-400/70 opacity-80 hover:opacity-100 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${
                  dailyViewMetric === "cellular"
                    ? "bg-white/20 text-white shadow-xs"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                <Wifi className="size-5" />
              </div>
              <div>
                <h4
                  className={`font-extrabold text-sm flex items-center gap-2 ${
                    dailyViewMetric === "cellular"
                      ? "text-white"
                      : "text-slate-900 dark:text-white"
                  }`}
                >
                  <span>2. Cellular / Carrier Network</span>
                  {dailyViewMetric === "cellular" ? (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white text-teal-700 uppercase tracking-wide shadow-xs">
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      Click to View
                    </span>
                  )}
                </h4>
                <p
                  className={`text-[11px] mt-0.5 font-medium ${
                    dailyViewMetric === "cellular"
                      ? "text-teal-100"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  Carrier BTS Signal, SIM Card & Cellular Data Service
                </p>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`font-mono text-xl font-black ${
                  dailyViewMetric === "cellular"
                    ? "text-white drop-shadow-xs"
                    : "text-teal-600 dark:text-teal-400"
                }`}
              >
                {cellularMetrics.networkUptimePct}
              </div>
              <div
                className={`text-[10px] font-semibold tracking-wider uppercase font-mono ${
                  dailyViewMetric === "cellular"
                    ? "text-teal-100"
                    : "text-slate-500"
                }`}
              >
                Success Rate
              </div>
            </div>
          </div>
          <div
            className={`mt-3 pt-2.5 border-t flex items-center justify-between text-xs ${
              dailyViewMetric === "cellular"
                ? "border-teal-400/40 text-teal-50"
                : "border-slate-200/80 dark:border-slate-800/80 text-slate-500 dark:text-slate-400"
            }`}
          >
            <span>
              Uptime:{" "}
              <strong
                className={`font-mono px-1.5 py-0.5 rounded ${
                  dailyViewMetric === "cellular"
                    ? "bg-teal-700/80 text-white font-bold"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {cellularMetrics.networkUptime}
              </strong>
            </span>
            <span>
              Downtime:{" "}
              <strong
                className={`font-mono px-1.5 py-0.5 rounded ${
                  dailyViewMetric === "cellular"
                    ? "bg-rose-500 text-white font-bold"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {cellularMetrics.networkOffline}
              </strong>
            </span>
          </div>
        </button>
      </div>

      {/* 3. Bottom Section: Left Column (Timeline + Daily SLA Breakdown) & Right Column (Incident History) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left Column (lg:col-span-6): Stack of Daily Status Timeline Card & Daily SLA Breakdown Table Card */}
        <div className="lg:col-span-6 space-y-3.5">
          {/* Top Card: Daily Status Timeline */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-xs">
            {/* Header with Title & Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Daily Status Timeline:{" "}
                  {dailyViewMetric === "cpu_modem"
                    ? "CPU – Modem"
                    : "Cellular / Network"}{" "}
                  ({periodInfo.effectivePeriodStr})
                </h4>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {periodInfo.endDay - periodInfo.startDay + 1} Days
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#00c875]" />
                  Online
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#e2445c]" />
                  Incident / Offline
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-blue-500" />
                  Today
                </span>
              </div>
            </div>

            {/* Daily Bar Chart Card with Date Labels on TOP and Bars on BOTTOM */}
            <div className="mt-3.5 p-3.5 rounded-xl bg-white dark:bg-[#070e1d] border border-slate-200/90 dark:border-slate-800/80 shadow-xs">
              {/* Dynamic Columns Grid */}
              <div
                className="grid gap-1 sm:gap-1.5 items-end pt-1"
                style={{
                  gridTemplateColumns: `repeat(${dailyStatusList.length}, minmax(0, 1fr))`,
                }}
              >
                {dailyStatusList.map((item) => {
                  const isSelected = selectedBarDay === item.day;
                  const barColor =
                    item.status === "offline"
                      ? "bg-[#e2445c] hover:bg-[#ff4d6d]"
                      : (item.status as string) === "warning"
                        ? "bg-[#f59e0b] hover:bg-[#fbbf24]"
                        : "bg-[#00c875] hover:bg-[#05e287]";

                  return (
                    <div
                      key={item.day}
                      onClick={() => {
                        if (item.isFuture) return;
                        handleSelectDay(item.day, item.dateKey);
                      }}
                      onMouseEnter={() => !item.isFuture && setHoveredDay(item)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`flex flex-col items-center gap-2 ${
                        item.isFuture
                          ? "cursor-default"
                          : "cursor-pointer group"
                      }`}
                      title={
                        item.isFuture
                          ? `${item.fullDate}`
                          : `${item.fullDate}: ${
                              item.status === "offline"
                                ? "Incident / Offline"
                                : "Online Normal"
                            }`
                      }
                    >
                      {/* 1. DATE LABELS ON TOP */}
                      <span
                        className={`text-[9px] sm:text-[10px] font-mono block leading-none transition-all select-none ${
                          item.isToday
                            ? "font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/20 px-1 py-0.5 rounded ring-1 ring-blue-500/50 scale-110 shadow-xs"
                            : isSelected
                              ? "font-bold text-amber-500 dark:text-amber-400 bg-amber-500/20 px-1 py-0.5 rounded ring-1 ring-amber-500/50 scale-110"
                              : item.isFuture
                                ? "text-slate-400 dark:text-slate-600 opacity-60"
                                : "text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200"
                        }`}
                      >
                        {item.dayNumStr}
                      </span>

                      {/* 2. BARS UNDERNEATH (FILLED ACCORDING TO DATE FILTER, REMAINING ARE EMPTY) */}
                      <div className="w-full h-20 sm:h-24 bg-slate-100 dark:bg-slate-900/60 rounded-md p-0.5 flex flex-col justify-end border border-slate-200/60 dark:border-slate-800/60">
                        {!item.isFuture && item.isInRange ? (
                          <div
                            className={`w-full h-full rounded-xs overflow-hidden flex flex-col justify-end transition-all duration-200 ${
                              item.isToday
                                ? "ring-2 ring-blue-500 shadow-md shadow-blue-500/35"
                                : ""
                            } ${
                              isSelected
                                ? "ring-2 ring-amber-400 shadow-md shadow-amber-400/35 scale-105"
                                : "group-hover:scale-105"
                            }`}
                          >
                            {/* Downtime (Red segment on top) */}
                            {item.visualDownPct > 0 && (
                              <div
                                style={{ height: `${item.visualDownPct}%` }}
                                className="w-full bg-[#e2445c] hover:bg-[#ff4d6d] transition-all duration-200 shrink-0 rounded-t-xs"
                                title={`Downtime: ${item.downtimePct}% (${item.totalDurationStr})`}
                              />
                            )}
                            {/* Uptime (Green segment at bottom) */}
                            {item.visualUpPct > 0 && (
                              <div
                                style={{ height: `${item.visualUpPct}%` }}
                                className="w-full flex-1 bg-[#00c875] hover:bg-[#05e287] transition-all duration-200 shrink-0"
                                title={`Uptime: ${item.uptimePct}%`}
                              />
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-1 bg-slate-200/40 dark:bg-slate-800/40 rounded-xs mb-0.5" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Hover / Selected Day Real-Time Info Bar */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between text-xs min-h-7.5">
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
                    {(hoveredDay.downtimePct ?? 0) > 0 ? (
                      <span className="font-medium inline-flex items-center gap-1.5">
                        <span className="text-[#00c875] font-semibold">
                          Uptime {hoveredDay.uptimePct}%
                        </span>
                        <span className="text-slate-400 dark:text-slate-600">
                          |
                        </span>
                        <span className="text-[#e2445c] font-semibold">
                          Downtime {hoveredDay.downtimePct}% (
                          {hoveredDay.totalDurationStr})
                        </span>
                      </span>
                    ) : (
                      <span className="text-[#00c875] font-semibold">
                        Normal Online (100% Uptime)
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between w-full">
                    <span>
                      {selectedBarDay !== null ? (
                        <span className="text-amber-500 dark:text-amber-400 font-semibold">
                          Active filter: Date{" "}
                          {selectedBarDay < 10
                            ? `0${selectedBarDay}`
                            : selectedBarDay}{" "}
                          {periodInfo.monthStr}
                        </span>
                      ) : (
                        `Hover or click a date (${dailyStatusList[0]?.dayNumStr || "01"} - ${dailyStatusList[dailyStatusList.length - 1]?.dayNumStr || periodInfo.effectiveDays}) to inspect details.`
                      )}
                    </span>

                    {selectedBarDay !== null && (
                      <button
                        onClick={() => handleSelectDay(null)}
                        className="text-blue-500 hover:underline text-[11px] font-semibold cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Card: Daily SLA Breakdown Table (Directly underneath the timeline card) */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-xs">
            {/* Header: Title, Active Selection Badge & Metric Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-md bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <FileSpreadsheet className="size-3.5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Daily SLA Breakdown:</span>
                  <span
                    className={
                      dailyViewMetric === "cpu_modem"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-teal-600 dark:text-teal-400"
                    }
                  >
                    {dailyViewMetric === "cpu_modem"
                      ? "CPU – Modem"
                      : "Cellular / Network"}
                  </span>
                </h4>
                {selectedBarDay !== null ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
                    <span>
                      Date{" "}
                      {selectedBarDay < 10
                        ? `0${selectedBarDay}`
                        : selectedBarDay}{" "}
                      {periodInfo.monthStr}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectDay(null);
                      }}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                      title="Show all days"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {activeDailyBreakdown.length} Days
                  </span>
                )}
              </div>

              {/* SLA Target Note */}
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Target SLA:{" "}
                <strong className="text-slate-700 dark:text-slate-300">
                  98.0%
                </strong>
              </div>
            </div>

            {/* Table (Columns: Date, Uptime (Mins), Downtime (Mins), Success Rate, SLA Status) */}
            <div className="overflow-x-auto mt-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-[#0a1224] shadow-xs">
                  <tr className="text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/60 font-semibold">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3 text-right">Uptime (Mins)</th>
                    <th className="py-2 px-3 text-right">Downtime (Mins)</th>
                    <th className="py-2 px-3 text-right">Success Rate</th>
                    <th className="py-2 px-3 text-center">SLA Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40 text-[11px]">
                  {displayedBreakdown.map((row) => {
                    const isCpu = dailyViewMetric === "cpu_modem";
                    const upMin = isCpu
                      ? row.cpu_modem_uptime_min
                      : row.cellular_uptime_min;
                    const downMin = isCpu
                      ? row.cpu_modem_downtime_min
                      : row.cellular_downtime_min;
                    const sr = isCpu
                      ? row.cpu_modem_success_rate
                      : row.cellular_success_rate;
                    const status = isCpu
                      ? row.cpu_modem_status_sla
                      : row.cellular_status_sla;
                    const isSuccess =
                      status === "Tercapai" ||
                      status === "Achieved" ||
                      sr >= 98.0;
                    const isSelected = selectedBarDay === row.day;

                    return (
                      <tr
                        key={row.day}
                        onClick={() =>
                          handleSelectDay(
                            row.day,
                            `${row.day < 10 ? `0${row.day}` : row.day} ${periodInfo.monthStr}`,
                          )
                        }
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-blue-500/10 dark:bg-blue-500/20 font-medium"
                            : "hover:bg-slate-100/80 dark:hover:bg-slate-800/30"
                        }`}
                        title="Click to select this date"
                      >
                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                          {row.date} ({row.day_name})
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          {upMin.toLocaleString("en-US")}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold">
                          {downMin > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400">
                              {downMin.toLocaleString("en-US")}
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
                  {displayedBreakdown.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-6 text-center text-slate-500 dark:text-slate-400 text-xs"
                      >
                        No daily SLA breakdown data available for the selected
                        date.
                      </td>
                    </tr>
                  )}
                </tbody>
                {displayedSummary && (
                  <tfoot className="sticky bottom-0 z-10 bg-slate-200/90 dark:bg-[#070e1d] font-bold text-[11px] border-t-2 border-slate-300 dark:border-slate-700 shadow-md">
                    <tr>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        <span className="text-blue-600 dark:text-blue-400 mr-1.5">
                          Total:
                        </span>
                        {displayedSummary.count} Days (
                        {displayedSummary.totalObs.toLocaleString("en-US")}m)
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                        {displayedSummary.totalUptime.toLocaleString("en-US")}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-rose-600 dark:text-rose-400">
                        {displayedSummary.totalDowntime.toLocaleString("en-US")}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-900 dark:text-white">
                        {displayedSummary.avgSuccessRate.toFixed(1)}%
                      </td>
                      <td className="py-2 px-3 text-center">
                        {displayedSummary.isSuccess ? (
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
                )}
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (lg:col-span-6): Restored Standalone Incident History */}
        <div className="lg:col-span-6 bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            {/* Header: Title matching active top card metric & Date Dropdown */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-md bg-amber-500/15 flex items-center justify-center text-[#f59e0b]">
                  <Clock className="size-3.5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Incident History:</span>
                  <span
                    className={
                      dailyViewMetric === "cpu_modem"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-teal-600 dark:text-teal-400"
                    }
                  >
                    {dailyViewMetric === "cpu_modem"
                      ? "CPU – Modem"
                      : "Cellular / Network"}
                  </span>
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  {filteredEvents.length}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Filter Date:
                </span>
                <select
                  value={selectedEventDate}
                  onChange={(e) => handleDropdownDateChange(e.target.value)}
                  className="text-xs font-medium bg-white dark:bg-[#070e1d] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs"
                >
                  <option value="ALL">
                    All Dates ({metricMatchedEvents.length})
                  </option>
                  {uniqueDates.map((dateStr) => {
                    const count = metricMatchedEvents.filter((e) =>
                      e.start_time.startsWith(dateStr),
                    ).length;
                    return (
                      <option key={dateStr} value={dateStr}>
                        {dateStr} ({count}{" "}
                        {count === 1 ? "incident" : "incidents"})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto mt-2 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-[#0a1224] shadow-xs">
                  <tr className="text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/60 font-semibold">
                    <th className="py-2.5 px-2 text-center w-8">No.</th>
                    <th className="py-2.5 px-3 min-w-[130px]">Incident Time</th>
                    <th className="py-2.5 px-3 min-w-[240px]">
                      Incident / Disturbance
                    </th>
                    <th className="py-2.5 px-3 text-center">Duration</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40 text-[11px]">
                  {filteredEvents.map((event, idx) => {
                    const isStillActive =
                      event.status === "Active" ||
                      event.end_time === "-" ||
                      event.end_time?.toLowerCase().includes("now") ||
                      event.end_time?.toLowerCase().includes("ongoing") ||
                      event.end_time?.toLowerCase().includes("active") ||
                      event.end_time?.toLowerCase().includes("sekarang") ||
                      event.end_time?.toLowerCase().includes("present");
                    const timeInfo = formatIncidentTime(
                      event.start_time,
                      event.end_time,
                    );
                    const isModemOutage =
                      (event.metric === "cpu_modem" ||
                        (event.description &&
                          event.description.toLowerCase().includes("modem")) ||
                        (event.title &&
                          event.title.toLowerCase().includes("modem"))) &&
                      !event.description
                        ?.toLowerCase()
                        .includes("gateway offline") &&
                      !event.title
                        ?.toLowerCase()
                        .includes("gateway offline");

                    let incidentText = cleanIncidentTitle(
                      event.title ||
                        event.description ||
                        event.cause ||
                        "Incident",
                    );

                    if (dailyViewMetric === "cellular" && isModemOutage) {
                      incidentText =
                        "Cellular Network Disconnected (Modem USB Communication Lost - [MODEM-CPU: TERPUTUS])";
                    }

                    return (
                      <tr
                        key={event.no || idx}
                        onClick={() => {
                          setSelectedIncident(event);
                          setSelectedIncidentIndex(idx + 1);
                        }}
                        className="hover:bg-slate-100/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                        title="Click row to view root cause & telemetry evidence"
                      >
                        <td className="py-3 px-2 text-center text-slate-500 dark:text-slate-400 font-mono align-middle">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap align-middle">
                          <div className="font-semibold text-slate-900 dark:text-white font-sans text-xs">
                            {timeInfo.dateStr}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            {timeInfo.timeStr}
                          </div>
                        </td>
                        <td className="py-3 px-3 align-middle font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {incidentText}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap align-middle">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-xs bg-amber-500/10 dark:bg-amber-500/20 text-[#f59e0b] border border-amber-500/30">
                            {formatDurationEn(event.duration)}
                          </span>
                          {selectedBarDay !== null &&
                            event.start_time &&
                            event.end_time &&
                            event.end_time !== "-" &&
                            (() => {
                              const mIdx = MONTH_NAMES.findIndex(
                                (m) =>
                                  m.toLowerCase() ===
                                  periodInfo.monthStr.toLowerCase(),
                              );
                              if (mIdx === -1) return null;
                              const year =
                                Number(periodInfo.yearStr) ||
                                new Date().getFullYear();
                              const dStart = new Date(
                                year,
                                mIdx,
                                selectedBarDay,
                                0,
                                0,
                                0,
                              );
                              const dEnd = new Date(
                                year,
                                mIdx,
                                selectedBarDay,
                                23,
                                59,
                                59,
                                999,
                              );
                              const st = new Date(
                                event.start_time.replace(" ", "T"),
                              );
                              const et = new Date(
                                event.end_time.replace(" ", "T"),
                              );
                              if (isNaN(st.getTime()) || isNaN(et.getTime()))
                                return null;
                              const oStart = Math.max(
                                st.getTime(),
                                dStart.getTime(),
                              );
                              const oEnd = Math.min(
                                et.getTime(),
                                dEnd.getTime(),
                              );
                              if (oEnd > oStart) {
                                const oMin = Math.round(
                                  (oEnd - oStart) / 60000,
                                );
                                const totMin = Math.round(
                                  (et.getTime() - st.getTime()) / 60000,
                                );
                                if (totMin > oMin) {
                                  const dayStr =
                                    selectedBarDay < 10
                                      ? `0${selectedBarDay}`
                                      : `${selectedBarDay}`;
                                  return (
                                    <div
                                      className="text-[9px] text-amber-500/90 dark:text-amber-400/90 font-medium mt-0.5"
                                      title={`Incident spans across midnight: ${oMin}m on Date ${dayStr}, ${totMin - oMin}m on adjacent day`}
                                    >
                                      ({oMin}m on Date {dayStr})
                                    </div>
                                  );
                                }
                              }
                              return null;
                            })()}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap align-middle">
                          {isStillActive ? (
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
                      <td
                        colSpan={5}
                        className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs"
                      >
                        No incident history available for the selected date.
                        {selectedEventDate !== "ALL" && (
                          <button
                            onClick={() => handleSelectDay(null)}
                            className="block mx-auto mt-2 text-blue-500 hover:underline font-semibold cursor-pointer"
                          >
                            Show All Incident History
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Incident Detail Modal Popup */}
      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      )}
    </div>
  );
};
