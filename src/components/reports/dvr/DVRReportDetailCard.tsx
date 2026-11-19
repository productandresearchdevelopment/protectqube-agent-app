"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  FileSpreadsheet,
  Calendar,
  Cpu,
  XCircle,
  CheckCircle2,
  Clock,
  Disc,
  Pause,
  AlertCircle,
  AlertTriangle,
  HardDrive,
  Video,
  X,
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
  Layers,
  FileDown,
  Loader2,
} from "lucide-react";
import {
  useDVRReportGatewayDetail,
  IDVRReportGatewayDetail,
  IDailySlaRecord,
  IDailySlaSummary,
  exportDVRDetailPdfUrl,
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
    .replace(/Komunikasi\s+Port\s+USB\s+Modem\s+dengan\s+CPU\s+Terputus/gi, "Modem USB Port Communication Lost")
    .replace(/Koneksi\s+Jaringan\s+Seluler\s+Terputus/gi, "Cellular Network Connection Disconnected")
    .replace(/Aliran\s+Data\s+Internet\s+Mati/gi, "No Internet Data")
    .replace(/Komunikasi\s+Gateway\s+CPU\s+ke\s+NVR\s+Surveillance\s+Terputus/gi, "Gateway CPU to NVR Communication Lost")
    .replace(/Kamera\s+Hilang\s+Sinyal\s*\/\s*No\s+Video/gi, "Camera Signal Loss / No Video")
    .replace(/Kamera\s+Terputus\s*\/\s*Offline/gi, "Camera Disconnected / Offline")
    .replace(/Kamera\s+Tidak\s+Merekam/gi, "Camera Not Recording")
    .replace(/Perekaman\s+CCTV\s+Terhenti/gi, "CCTV Video Recording Stopped")
    .replace(/Perekaman\s+kamera\s+terhenti/gi, "Camera Recording Stopped")
    .replace(/Perekaman\s+video\s+kamera\s+berhenti/gi, "Camera Video Recording Stopped")
    .replace(/tidak\s+merekam/gi, "Not Recording")
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
  }

  return {
    dateStr: `${startDateLabel} — ${endDateLabel}`,
    timeStr: `${sTime} — ${eTime}`,
  };
};

const formatMins = (val: number) => {
  if (!val || val === 0) return "0";
  return val % 1 === 0
    ? val.toLocaleString("id-ID")
    : val.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
};

const getIncidentScope = (event: any): "cpu_dvr" | "recording" | "both" => {
  const metric = (event.metric || "").toLowerCase().trim();
  if (metric === "cpu_dvr") return "cpu_dvr";
  if (metric === "recording") return "recording";

  const raw = (
    event.category ||
    event.cause ||
    event.description ||
    event.title ||
    ""
  ).toLowerCase();

  if (
    raw.includes("cpu - dvr") ||
    raw.includes("cpu–dvr") ||
    raw.includes("cpu-dvr") ||
    raw.includes("dvr communication") ||
    raw.includes("port dvr") ||
    raw.includes("isapi") ||
    raw.includes("nvr-cpu")
  ) {
    return "cpu_dvr";
  }

  if (
    raw.includes("kamera") ||
    raw.includes("camera") ||
    raw.includes("recording") ||
    raw.includes("rekaman") ||
    raw.includes("not recording") ||
    raw.includes("no video")
  ) {
    return "recording";
  }

  return "both";
};

interface DVRReportDetailCardProps {
  gatewayId: string | null;
  dateRange?: string;
  onClose?: () => void;
}

export const DVRReportDetailCard: React.FC<DVRReportDetailCardProps> = ({
  gatewayId,
  dateRange,
  onClose,
}) => {
  const { data, isLoading } = useDVRReportGatewayDetail(gatewayId, dateRange);
  const [dailyViewMetric, setDailyViewMetric] = useState<"cpu_dvr" | "recording">("cpu_dvr");
  const [selectedEventDate, setSelectedEventDate] = useState<string>("ALL");
  const [selectedBarDay, setSelectedBarDay] = useState<number | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    if (!gatewayId) return;
    try {
      setIsExportingPdf(true);
      const url = exportDVRDetailPdfUrl(gatewayId, dateRange);
      const locName = (data?.location || gatewayId).replace(/[^a-zA-Z0-9_-]/g, "_");
      await downloadReportFile(url, `DVR_Detail_${locName}.pdf`);
    } catch (err) {
      console.error("Export dvr detail PDF error:", err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleSelectDay = (day: number | null) => {
    setSelectedBarDay((prev) => (prev === day ? null : day));
    if (day === null) {
      setSelectedEventDate("ALL");
    } else {
      setSelectedEventDate(String(day));
    }
  };

  const handleDropdownDateChange = (val: string) => {
    if (val === "ALL") {
      handleSelectDay(null);
    } else {
      const dNum = parseInt(val, 10);
      if (!isNaN(dNum)) {
        handleSelectDay(dNum);
      }
    }
  };
  const [hoveredDay, setHoveredDay] = useState<{
    day: number;
    dayNumStr: string;
    dateKey: string;
    fullDate: string;
    status: "online" | "offline" | "future";
    uptimePct: number;
    downtimePct: number;
    visualUpPct: number;
    visualDownPct: number;
    totalDurationStr: string;
    isToday: boolean;
    isFuture?: boolean;
    isInRange?: boolean;
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

  // Generate dynamic daily status bar chart items: full month timeline, percentage bars filled according to selected metric filter
  const dailyStatusList = useMemo(() => {
    const { daysInMonth, monthStr, yearStr, todayDay, isCurrentMonth } = periodInfo;
    const minDay = minActiveDay;
    const maxDay = periodInfo.endDay;
    const breakdown = data?.daily_breakdown || [];

    const totalDays = Math.max(daysInMonth, maxDay);
    const list = [];
    for (let day = 1; day <= totalDays; day++) {
      const dayNumStr = day < 10 ? `0${day}` : `${day}`;
      const dateKey = `${dayNumStr} ${monthStr}`;
      const fullDate = `${dayNumStr} ${monthStr} ${yearStr}`;

      const isInRange = day >= minDay && day <= maxDay;
      const isFutureDate = Boolean(isCurrentMonth && todayDay && day > todayDay);
      const hasBar = isInRange && !isFutureDate;

      const daySla = breakdown.find((r) => r.day === day);

      let status: "online" | "offline" | "future" = !hasBar ? "future" : "online";
      let uptimePct = 100;
      let downtimePct = 0;
      let visualUpPct = 100;
      let visualDownPct = 0;
      let totalDurationStr = "0m";

      if (hasBar && daySla) {
        const obs = daySla.observation_min ?? ((daySla.uptime_min ?? 0) + (daySla.downtime_min ?? 0));
        let up = 0;
        let down = 0;

        if (dailyViewMetric === "cpu_dvr") {
          up = daySla.cpu_dvr_uptime_min ?? daySla.uptime_min ?? obs;
          down = daySla.cpu_dvr_downtime_min ?? daySla.downtime_min ?? 0;
        } else {
          up = daySla.rec_uptime_min ?? (daySla as any).dvr_uptime_min ?? (daySla as any).recording_uptime_min ?? daySla.uptime_min ?? obs;
          down = daySla.rec_downtime_min ?? (daySla as any).dvr_downtime_min ?? (daySla as any).recording_downtime_min ?? daySla.downtime_min ?? 0;
        }

        if (obs > 0) {
          uptimePct = Math.min(100.0, Math.max(0.0, (up / obs) * 100.0));
          downtimePct = Math.min(100.0, Math.max(0.0, 100.0 - uptimePct));
        }

        if (downtimePct > 0) {
          status = "offline";
          visualDownPct = Math.max(8, Math.round(downtimePct));
          visualUpPct = 100 - visualDownPct;
          const downMin = Math.round(down);
          totalDurationStr = downMin >= 60 ? `${Math.floor(downMin / 60)}h ${downMin % 60}m` : `${downMin}m`;
        } else {
          status = "online";
          visualUpPct = 100;
          visualDownPct = 0;
        }
      }

      list.push({
        day,
        dayNumStr,
        dateKey,
        fullDate,
        status,
        uptimePct: Math.round(uptimePct),
        downtimePct: Math.round(downtimePct),
        visualUpPct,
        visualDownPct,
        totalDurationStr,
        isToday: Boolean(isCurrentMonth && todayDay && day === todayDay),
        isFuture: isFutureDate,
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
    const targetMonthNum = MONTH_NAMES.findIndex((m) => m.toLowerCase() === month) + 1;

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
        const isSameMonth = mStr.startsWith(month.slice(0, 3)) || month.startsWith(mStr.slice(0, 3));
        if (!isNaN(dNum) && isSameMonth) {
          return dNum >= minDay && dNum <= maxDay;
        }
        if (!isNaN(dNum) && !isSameMonth) {
          return false;
        }
      }
      return true;
    });
  }, [data?.trouble_events, minActiveDay, periodInfo.endDay, periodInfo.effectiveDays, periodInfo.monthStr]);

  // 2. Filter events matching the active subsystem (CPU-DVR vs Recording) & configured camera channels
  const metricMatchedEvents = useMemo(() => {
    const configuredCamIds = new Set(
      (data?.camera_list || []).map((c: any) => String(c.id || c.channel || "").replace(/\D/g, ""))
    );

    const list = rangeFilteredEvents.filter((ev) => {
      const metric = (ev.metric || "").toLowerCase().trim();
      if (dailyViewMetric === "recording") {
        if (metric === "cpu_dvr") return false;
        if (metric === "recording") return true;
      } else if (dailyViewMetric === "cpu_dvr") {
        if (metric === "recording") return false;
        if (metric === "cpu_dvr") return true;
      }
      const scope = getIncidentScope(ev);
      if (scope !== "both" && scope !== dailyViewMetric) return false;

      // Exclude HDD / Storage Full (normal 24/7 FIFO overwrite operation, does not generate recording downtime)
      const titleUpper = (ev.title || "").toUpperCase();
      const causeUpper = (ev.cause || "").toUpperCase();
      if (titleUpper.includes("STORAGE FULL") || causeUpper.includes("HDD_FULL")) {
        return false;
      }

      // Strictly filter out events referencing unconfigured camera channels
      if (configuredCamIds.size > 0) {
        const text = `${ev.title || ""} ${ev.description || ""} ${ev.cause || ""}`;
        const match = text.match(/\b(?:kamera|camera|ch|channel)\s*#?\s*0*(\d+)\b/i);
        if (match && !configuredCamIds.has(match[1])) {
          return false;
        }
      }
      return true;
    });

    // Deduplicate by (start_time, end_time) to guarantee no duplicated rows
    const seen = new Set<string>();
    return list.filter((ev) => {
      const timeKey = `${(ev.start_time || "").trim()}|${(ev.end_time || "").trim()}`;
      if (seen.has(timeKey)) return false;
      seen.add(timeKey);
      return true;
    });
  }, [rangeFilteredEvents, dailyViewMetric, data?.camera_list]);

  // Helper to test if an incident falls on or overlaps a given day number
  const isEventOnDay = useCallback(
    (ev: any, day: number): boolean => {
      const dayNumStr = day < 10 ? `0${day}` : `${day}`;
      const prefix = `${dayNumStr} ${periodInfo.monthStr}`;
      const mIdx = MONTH_NAMES.findIndex(
        (m) => m.toLowerCase() === periodInfo.monthStr.toLowerCase()
      );
      const mNum = mIdx !== -1 ? String(mIdx + 1).padStart(2, "0") : "11";
      const isoPrefix = `${periodInfo.yearStr}-${mNum}-${dayNumStr}`;
      const year = Number(periodInfo.yearStr) || new Date().getFullYear();
      const dStart = new Date(year, mIdx, day, 0, 0, 0);
      const dEnd = new Date(year, mIdx, day, 23, 59, 59, 999);

      const trimmed = (ev.start_time || "").trim();
      const startMatches =
        trimmed.startsWith(isoPrefix) ||
        trimmed.startsWith(prefix) ||
        trimmed.startsWith(`${day} ${periodInfo.monthStr}`) ||
        (ev.date_str && (ev.date_str === isoPrefix || ev.date_str.startsWith(prefix)));

      if (startMatches) return true;

      const isStillActive =
        ev.status === "Active" ||
        ev.status === "active" ||
        ev.end_time === "-" ||
        ev.end_time?.toLowerCase().includes("ongoing") ||
        ev.end_time?.toLowerCase().includes("present");

      if (isStillActive) {
        const st = new Date(trimmed.replace(" ", "T"));
        const now = new Date();
        if (!isNaN(st.getTime())) {
          return st.getTime() <= dEnd.getTime() && now.getTime() >= dStart.getTime();
        }
      } else if (ev.end_time && ev.end_time !== "-") {
        const st = new Date(trimmed.replace(" ", "T"));
        const et = new Date(ev.end_time.trim().replace(" ", "T"));
        if (!isNaN(st.getTime()) && !isNaN(et.getTime())) {
          return st.getTime() < dEnd.getTime() && et.getTime() > dStart.getTime();
        }
      }
      return false;
    },
    [periodInfo.monthStr, periodInfo.yearStr]
  );

  // 3. Extract distinct date options for trouble event filter dropdown
  const uniqueDateOptions = useMemo(() => {
    const list: { day: number; label: string; count: number }[] = [];
    for (let d = periodInfo.endDay; d >= periodInfo.startDay; d--) {
      const dayNumStr = d < 10 ? `0${d}` : `${d}`;
      const label = `${dayNumStr} ${periodInfo.monthStr} ${periodInfo.yearStr}`;
      const count = metricMatchedEvents.filter((ev) => isEventOnDay(ev, d)).length;
      if (count > 0 || d === selectedBarDay) {
        list.push({ day: d, label, count });
      }
    }
    return list;
  }, [metricMatchedEvents, isEventOnDay, periodInfo.startDay, periodInfo.endDay, periodInfo.monthStr, periodInfo.yearStr, selectedBarDay]);

  // 4. Filter trouble events by selected date (timeline bar click or dropdown selection)
  const filteredEvents = useMemo(() => {
    if (selectedBarDay !== null) {
      return metricMatchedEvents.filter((ev) => isEventOnDay(ev, selectedBarDay));
    }
    return metricMatchedEvents;
  }, [metricMatchedEvents, selectedBarDay, isEventOnDay]);

  // 5. Strictly sort descending: Active first on top, followed by newest resolved events
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      const aIsActive =
        a.status === "Active" ||
        a.status === "active" ||
        a.end_time?.toLowerCase().includes("ongoing") ||
        a.end_time?.toLowerCase().includes("present");
      const bIsActive =
        b.status === "Active" ||
        b.status === "active" ||
        b.end_time?.toLowerCase().includes("ongoing") ||
        b.end_time?.toLowerCase().includes("present");
      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;

      const aTime = a.epoch || (a.start_time ? new Date(a.start_time.replace(" ", "T")).getTime() : 0);
      const bTime = b.epoch || (b.start_time ? new Date(b.start_time.replace(" ", "T")).getTime() : 0);
      return bTime - aTime;
    });
  }, [filteredEvents]);

  // Filter Rincian SLA to only show active days between minActiveDay and effectiveDays
  const isNoDvr = (data as any)?.has_dvr === false || data?.dvr_model === "Not Installed" || (data as any)?.kamera_channels === 0;

  const activeDailyBreakdown = useMemo(() => {
    if (isNoDvr) return [];
    const allRows = data?.daily_breakdown || [];
    const minDay = minActiveDay;
    const maxDay = periodInfo.effectiveDays;
    return allRows.filter((row) => row.day >= minDay && row.day <= maxDay);
  }, [data?.daily_breakdown, minActiveDay, periodInfo.effectiveDays, isNoDvr]);

  // Dynamic top cards metrics responding to timeline selection / active observation period
  const dvrMetrics = useMemo(() => {
    if (isNoDvr) {
      return {
        periodStr: periodInfo.periodLabel || "Period",
        periodHoursStr: "Standalone Device",
        cpuDvrUptime: "N/A",
        cpuDvrUptimePct: "N/A",
        cpuDvrOffline: "N/A",
        cpuDvrOfflinePct: "N/A",
        successRate: "N/A",
        successRateChecks: "-",
        recUptime: "N/A",
        recUptimePct: "N/A",
        recOffline: "N/A",
        recOfflinePct: "N/A",
        eventsCount: 0,
      };
    }
    if (selectedBarDay !== null) {
      const dayRow = activeDailyBreakdown.find((r) => r.day === selectedBarDay);
      const dayEvents = filteredEvents;
      if (dayRow) {
        const obsMin = dayRow.observation_min ?? ((dayRow.uptime_min ?? 0) + (dayRow.downtime_min ?? 0));
        const upMin = dayRow.cpu_dvr_uptime_min ?? dayRow.uptime_min ?? obsMin;
        const downMin = dayRow.cpu_dvr_downtime_min ?? dayRow.downtime_min ?? 0;
        const sr = dayRow.cpu_dvr_success_rate ?? dayRow.success_rate ?? (obsMin > 0 ? (upMin / obsMin) * 100 : 100);
        const dayStr = dayRow.date;
        const obsHrs = (obsMin / 60.0).toFixed(1);

        const recUpMin = dayRow.rec_uptime_min ?? upMin;
        const recDownMin = dayRow.rec_downtime_min ?? downMin;
        const recSr = dayRow.rec_success_rate ?? sr;

        return {
          periodStr: dayStr,
          periodHoursStr: `Total ${obsHrs} Hours`,
          cpuDvrUptime: `${Math.floor(upMin / 60)}h ${Math.round(upMin % 60)}m`,
          cpuDvrUptimePct: `${sr.toFixed(1)}%`,
          cpuDvrOffline: `${Math.floor(downMin / 60)}h ${Math.round(downMin % 60)}m`,
          cpuDvrOfflinePct: `${(100.0 - sr).toFixed(1)}%`,
          successRate: `${sr.toFixed(1)}%`,
          successRateChecks: `(1 / 1 day)`,
          recUptime: `${Math.floor(recUpMin / 60)}h ${Math.round(recUpMin % 60)}m`,
          recUptimePct: `${recSr.toFixed(1)}%`,
          recOffline: `${Math.floor(recDownMin / 60)}h ${Math.round(recDownMin % 60)}m`,
          recOfflinePct: `${(100.0 - recSr).toFixed(1)}%`,
          eventsCount: dayEvents.length,
        };
      }
    }

    const count = activeDailyBreakdown.length;
    let totalObsMin = 0;
    let totalUpMin = 0;
    let totalDownMin = 0;
    let totalRecUpMin = 0;
    let totalRecDownMin = 0;

    activeDailyBreakdown.forEach((r) => {
      const obs = r.observation_min ?? ((r.uptime_min ?? 0) + (r.downtime_min ?? 0));
      totalObsMin += obs;
      totalUpMin += (r.cpu_dvr_uptime_min ?? r.uptime_min ?? obs);
      totalDownMin += (r.cpu_dvr_downtime_min ?? r.downtime_min ?? 0);
      totalRecUpMin += (r.rec_uptime_min ?? r.uptime_min ?? obs);
      totalRecDownMin += (r.rec_downtime_min ?? r.downtime_min ?? 0);
    });

    const avgSr = totalObsMin > 0 ? (totalUpMin / totalObsMin) * 100 : (data?.cpu_dvr_uptime_pct ? parseFloat(data.cpu_dvr_uptime_pct) : 100);
    const avgRecSr = totalObsMin > 0 ? (totalRecUpMin / totalObsMin) * 100 : (data?.rec_uptime_pct ? parseFloat(data.rec_uptime_pct) : 100);

    const firstDay = activeDailyBreakdown[0];
    const lastDay = activeDailyBreakdown[activeDailyBreakdown.length - 1];
    const activeRangeStr = firstDay && lastDay && firstDay.date !== lastDay.date
      ? `${firstDay.date} - ${lastDay.date}`
      : (firstDay?.date || periodInfo.effectivePeriodStr);

    const totalObsHrs = (totalObsMin / 60.0).toFixed(1);

    return {
      periodStr: activeRangeStr,
      periodHoursStr: data?.period_hours || `Total ${totalObsHrs} Hours`,
      cpuDvrUptime: data?.cpu_dvr_uptime || `${Math.floor(totalUpMin / 60)}h ${Math.round(totalUpMin % 60)}m`,
      cpuDvrUptimePct: `${avgSr.toFixed(1)}%`,
      cpuDvrOffline: data?.cpu_dvr_offline || `${Math.floor(totalDownMin / 60)}h ${Math.round(totalDownMin % 60)}m`,
      cpuDvrOfflinePct: `${(100.0 - avgSr).toFixed(1)}%`,
      successRate: `${avgSr.toFixed(1)}%`,
      successRateChecks: `(${count} / ${count} days)`,
      recUptime: data?.rec_uptime || `${Math.floor(totalRecUpMin / 60)}h ${Math.round(totalRecUpMin % 60)}m`,
      recUptimePct: `${avgRecSr.toFixed(1)}%`,
      recOffline: data?.rec_tidak_merekam || `${Math.floor(totalRecDownMin / 60)}h ${Math.round(totalRecDownMin % 60)}m`,
      recOfflinePct: `${(100.0 - avgRecSr).toFixed(1)}%`,
      eventsCount: metricMatchedEvents.length,
    };
  }, [selectedBarDay, activeDailyBreakdown, filteredEvents, metricMatchedEvents.length, data, periodInfo.effectivePeriodStr]);

  // When a day bar is clicked, filter Rincian SLA to only that day; otherwise show all active days up to today
  const displayedBreakdown = useMemo(() => {
    if (selectedBarDay !== null) {
      return activeDailyBreakdown.filter((r) => r.day === selectedBarDay);
    }
    return activeDailyBreakdown;
  }, [activeDailyBreakdown, selectedBarDay]);

  // Compute footer summary dynamically for displayed SLA rows (CPU - DVR vs Recording)
  const displayedSummary = useMemo(() => {
    const isCpu = dailyViewMetric === "cpu_dvr";
    const count = displayedBreakdown.length;
    if (count === 0) return null;

    let totalUptime = 0;
    let totalDowntime = 0;
    displayedBreakdown.forEach((r) => {
      if (isCpu) {
        totalUptime += (r.cpu_dvr_uptime_min ?? r.uptime_min ?? 0);
        totalDowntime += (r.cpu_dvr_downtime_min ?? r.downtime_min ?? 0);
      } else {
        totalUptime += ((r as any).dvr_uptime_min ?? (r as any).recording_uptime_min ?? r.uptime_min ?? 0);
        totalDowntime += ((r as any).dvr_downtime_min ?? (r as any).recording_downtime_min ?? r.downtime_min ?? 0);
      }
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

  // Grouped daily recording data for all active days in the period
  const dailyRecordingGroups = useMemo(() => {
    const rawList = data?.camera_list || [];
    const totalCam = data?.kamera_total || (rawList.length > 0 ? rawList.length : 4);

    const baseCams =
      rawList.length > 0
        ? rawList
        : Array.from({ length: totalCam }, (_, i) => ({
            id: String(i + 1),
            name: `Camera 0${i + 1}`,
            resolution: "1080P",
            is_online: i < (data?.kamera_online ?? 2),
            recording_status: i < (data?.kamera_online ?? 2) ? "RECORD" : "NOT_RECORD",
          }));

    return activeDailyBreakdown.map((row) => {
      // Real observation duration from actual telemetry (never hardcoded 1440m)
      const dayObsMin = row.observation_min ?? ((row.uptime_min ?? 0) + (row.downtime_min ?? 0));
      // Durasi online komunikasi DVR pada hari tersebut (durasi DVR aktif dapat merekam)
      const dvrDownMin = Math.min(
        dayObsMin,
        Math.max(
          0,
          row.rec_downtime_min ??
            row.cpu_dvr_downtime_min ??
            row.downtime_min ??
            0
        )
      );
      const dvrUpMin = Math.max(0, dayObsMin - dvrDownMin);
      const dvrRate = dayObsMin > 0 ? (dvrUpMin / dayObsMin) * 100.0 : 0.0;

      // Status historis hari tersebut: jika downtime 0, maka seluruh kamera online merekam (RECORD)
      const isDayHealthy = dvrDownMin === 0 && dvrRate >= 98.0;
      const isDayFullyDown = dvrUpMin === 0 || dvrRate === 0.0;

      const cams = baseCams.map((c: any, idx: number) => {
        const camId = c.id || String(idx + 1);
        const camName = c.name || `Camera 0${camId}`;
        const resolution = c.resolution || c.resolution_raw || "1080P";
        const isCamOnline = c.is_online !== false;

        let isRecording = false;
        let uptimeMin = 0;
        let downtimeMin = 0;
        let successRate = 0.0;

        if (isDayHealthy) {
          if (isCamOnline) {
            isRecording = true;
            uptimeMin = dayObsMin;
            downtimeMin = 0;
            successRate = 100.0;
          } else {
            isRecording = false;
            uptimeMin = 0;
            downtimeMin = dayObsMin;
            successRate = 0.0;
          }
        } else if (isDayFullyDown) {
          isRecording = false;
          uptimeMin = 0;
          downtimeMin = dayObsMin;
          successRate = 0.0;
        } else {
          // Hari dengan gangguan parsial
          if (isCamOnline) {
            uptimeMin = dvrUpMin;
            downtimeMin = dvrDownMin;
            successRate = dvrRate;
            isRecording = dvrRate >= 98.0;
          } else {
            uptimeMin = 0;
            downtimeMin = dayObsMin;
            successRate = 0.0;
            isRecording = false;
          }
        }

        const isSuccess = successRate >= 98.0;

        return {
          no: idx + 1,
          id: camId,
          channel: `Ch ${camId}`,
          name: camName,
          resolution,
          isOnline: isCamOnline,
          recordingStatus: isRecording
            ? "RECORD"
            : !isCamOnline
            ? "NO VIDEO"
            : "NOT RECORD",
          observationMin: dayObsMin,
          uptimeMin,
          downtimeMin,
          successRate,
          isSuccess,
        };
      });

      const recordingCount = cams.filter((c) => c.recordingStatus === "RECORD").length;
      const totalCams = cams.length;
      const totalObsMin = cams.reduce((acc, c) => acc + c.observationMin, 0);
      const totalUpMin = cams.reduce((acc, c) => acc + c.uptimeMin, 0);
      const totalDownMin = cams.reduce((acc, c) => acc + c.downtimeMin, 0);
      const avgRate = totalObsMin > 0 ? (totalUpMin / totalObsMin) * 100.0 : 0.0;
      const isDaySuccess = avgRate >= 98.0;

      const avgUpMin = totalCams > 0 ? totalUpMin / totalCams : 0;
      const avgDownMin = totalCams > 0 ? totalDownMin / totalCams : 0;

      return {
        day: row.day,
        date: row.date,
        day_name: row.day_name,
        isToday: row.day === periodInfo.effectiveDays,
        dayObsMin,
        totalCams,
        recordingCount,
        avgUpMin,
        avgDownMin,
        totalObsMin,
        totalUpMin,
        totalDownMin,
        avgRate,
        isDaySuccess,
        cams,
      };
    });
  }, [activeDailyBreakdown, data?.camera_list, data?.kamera_total, data?.kamera_online, periodInfo.effectiveDays]);

  // When selectedBarDay is set (clicked from timeline or SLA breakdown table), filter to that day; otherwise show all active days
  const displayedRecordingGroups = useMemo(() => {
    if (selectedBarDay !== null) {
      return dailyRecordingGroups.filter((g) => g.day === selectedBarDay);
    }
    return dailyRecordingGroups;
  }, [dailyRecordingGroups, selectedBarDay]);

  // Expand / collapse state for tree list (per-day toggle)
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({});

  // When dailyRecordingGroups loads or selectedBarDay changes, auto-expand target day
  useEffect(() => {
    if (selectedBarDay !== null) {
      setExpandedDays((prev) => ({ ...prev, [selectedBarDay]: true }));
    } else if (dailyRecordingGroups.length > 0) {
      // Default: expand the latest date
      const latestDay = dailyRecordingGroups[dailyRecordingGroups.length - 1].day;
      setExpandedDays((prev) => ({ ...prev, [latestDay]: true }));
    }
  }, [selectedBarDay, dailyRecordingGroups]);

  const toggleExpandDay = (day: number) => {
    setExpandedDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };

  // Overall footer summary for displayed recording groups
  const overallRecordingSummary = useMemo(() => {
    if (displayedRecordingGroups.length === 0) return null;
    const daysCount = displayedRecordingGroups.length;
    const totalDayObs = displayedRecordingGroups.reduce((acc, g) => acc + g.dayObsMin, 0);
    const totalAvgUptime = displayedRecordingGroups.reduce((acc, g) => acc + g.avgUpMin, 0);
    const totalAvgDowntime = displayedRecordingGroups.reduce((acc, g) => acc + g.avgDownMin, 0);

    const totalObs = displayedRecordingGroups.reduce((acc, g) => acc + g.totalObsMin, 0);
    const totalUptime = displayedRecordingGroups.reduce((acc, g) => acc + g.totalUpMin, 0);
    const totalDowntime = displayedRecordingGroups.reduce((acc, g) => acc + g.totalDownMin, 0);
    const avgRate = totalObs > 0 ? (totalUptime / totalObs) * 100.0 : 0.0;
    const isSuccess = avgRate >= 98.0;
    const totalCamsSum = displayedRecordingGroups.reduce((acc, g) => acc + g.totalCams, 0);
    const totalActiveCamsSum = displayedRecordingGroups.reduce((acc, g) => acc + g.recordingCount, 0);

    return {
      daysCount,
      totalDayObs,
      totalAvgUptime,
      totalAvgDowntime,
      totalObs,
      totalUptime,
      totalDowntime,
      avgRate,
      isSuccess,
      totalCamsSum,
      totalActiveCamsSum,
    };
  }, [displayedRecordingGroups]);

  if (!gatewayId) return null;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <div className="size-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading DVR/NVR performance data...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-[#070e1d] rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
        DVR performance data for gateway {gatewayId} not found.
      </div>
    );
  }

  const d = data;

  const isWhite = (d.type || "").includes("Putih");
  const isOffline =
    (d.status || "").toLowerCase() === "offline" ||
    Boolean((d as any).is_offline) ||
    Boolean((d as any).is_last_known);

  return (
    <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-4 sm:p-5 space-y-4 font-sans transition-all duration-300">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <FileSpreadsheet className="size-4" />
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Detail Device &ndash; {d.location || d.id}
          </h2>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isOffline
                ? "bg-rose-500/15 text-[#e2445c] border border-rose-500/30"
                : "bg-[#00c875]/20 text-[#00a862] dark:text-[#00c875] border border-[#00c875]/30"
            }`}
          >
            {isOffline ? "Offline" : d.status || "Online"}
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

      {/* CPU - NVR Disconnected Notice Banner */}
      {((d as any).cpu_dvr_status === "Not Connected" || (d as any).is_last_known) && (
        <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-800 dark:text-amber-200 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>CPU to NVR Disconnected</strong> (Port 80 ISAPI timeout / unreachable). Storage, HDD capacity, and camera channels represent the <strong>last known recorded state</strong> prior to disconnection.
            </span>
          </div>
          {(d as any).last_connected_at && (
            <span className="font-mono text-[11px] text-amber-700 dark:text-amber-300 shrink-0">
              Last connected: {(d as any).last_connected_at}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 items-stretch">
        <div className="xl:col-span-4 bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row xl:flex-row gap-4 items-center sm:items-start xl:items-start justify-between shadow-xs">
          <div className="flex flex-col items-center justify-center shrink-0 pt-1">
            <SmartBoxIsometricIllustration isWhite={isWhite} />
          </div>

          <div className="flex-1 min-w-0 space-y-2 w-full">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide leading-tight truncate" title={d.location}>
                {d.location}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium truncate" title={d.id}>
                {d.id}
              </p>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 font-normal pt-1">
              <div className="grid grid-cols-[100px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Type</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">: {d.type}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">DVR/NVR</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">: {d.dvr_model}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Camera Count</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium">: {d.kamera_channels}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">HDD Capacity</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium">
                  : {d.storage_capacity}
                  {(d as any).is_last_known && (
                    <span className="ml-1 text-[10px] font-normal text-slate-400 font-sans">
                      (Last)
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {/* Card 1: Periode */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-slate-200/80 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <Calendar className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Period</span>
            </div>
            <div className="mt-2.5">
              <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {dvrMetrics.periodStr}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                {dvrMetrics.periodHoursStr}
              </div>
            </div>
          </div>

          {/* Card 2: CPU – DVR Uptime */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-emerald-500/15 flex items-center justify-center text-[#00c875]">
                <Cpu className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">CPU – DVR Uptime</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#00c875] leading-tight">
                {dvrMetrics.cpuDvrUptime}
              </div>
              <div className="text-[11px] font-semibold text-[#00c875] mt-0.5">
                {dvrMetrics.cpuDvrUptimePct}
              </div>
            </div>
          </div>

          {/* Card 3: CPU – DVR Offline */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-rose-500/15 flex items-center justify-center text-[#e2445c]">
                <XCircle className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">CPU – DVR Offline</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#e2445c] leading-tight">
                {dvrMetrics.cpuDvrOffline}
              </div>
              <div className="text-[11px] font-semibold text-[#e2445c] mt-0.5">
                {dvrMetrics.cpuDvrOfflinePct}
              </div>
            </div>
          </div>

          {/* Card 4: Success Rate */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-emerald-500/15 flex items-center justify-center text-[#00c875]">
                <CheckCircle2 className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Success Rate</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#00c875] leading-tight">
                {dvrMetrics.successRate}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {dvrMetrics.successRateChecks}
              </div>
            </div>
          </div>

          {/* Card 5: Total Incidents */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-amber-500/15 flex items-center justify-center text-[#f59e0b]">
                <AlertCircle className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Total Incidents</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#f59e0b] leading-tight">
                {dvrMetrics.eventsCount} events
              </div>
            </div>
          </div>

          {/* Card 6: Recording Uptime */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-emerald-500/15 flex items-center justify-center text-[#00c875]">
                <Disc className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Recording Uptime</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#00c875] leading-tight">
                {dvrMetrics.recUptime}
              </div>
              <div className="text-[11px] font-semibold text-[#00c875] mt-0.5">
                {dvrMetrics.recUptimePct}
              </div>
            </div>
          </div>

          {/* Card 7: Not Recording */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-amber-500/15 flex items-center justify-center text-[#f59e0b]">
                <Pause className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Not Recording</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#f59e0b] leading-tight">
                {dvrMetrics.recOffline}
              </div>
              <div className="text-[11px] font-semibold text-[#f59e0b] mt-0.5">
                {dvrMetrics.recOfflinePct}
              </div>
            </div>
          </div>

          {/* Card 8: Recording Success Rate */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-emerald-500/15 flex items-center justify-center text-[#00c875]">
                <Disc className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Recording Success Rate</span>
            </div>
            <div className="mt-2.5">
              <div
                className={`text-sm font-bold leading-tight ${
                  isNoDvr
                    ? "text-slate-400 dark:text-slate-500"
                    : parseFloat(dvrMetrics.recUptimePct || "0") >= 98.0
                    ? "text-[#00c875]"
                    : "text-[#e2445c]"
                }`}
              >
                {dvrMetrics.recUptimePct}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {isNoDvr ? "Target SLA: N/A" : "Target SLA: 98.0%"}
              </div>
            </div>
          </div>

          {/* Card 9: Storage HDD */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-slate-200/80 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <HardDrive className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Storage HDD</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {isNoDvr ? "N/A" : d.storage_capacity}
                {!isNoDvr && (d as any).is_last_known && (
                  <span className="ml-1 text-[10px] font-normal text-slate-400 font-sans">
                    (Last)
                  </span>
                )}
              </div>
              {!isNoDvr && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${d.storage_used_pct}%` }}
                      className="h-full bg-[#00c875] rounded-full"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-700 dark:text-slate-300 font-bold shrink-0">
                    {d.storage_used_pct}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Card 10: Camera */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-cyan-500/15 flex items-center justify-center text-[#00d2ff]">
                <Video className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Camera</span>
            </div>
            <div className="mt-2">
              <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {isNoDvr ? "No Camera" : `${d.kamera_total} Channels`}
              </div>
              {isNoDvr ? (
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Not Installed
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 font-medium">
                    <span className="size-1.5 rounded-full bg-[#00c875]" />
                    {d.kamera_online} Online
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium">
                    <span className="size-1.5 rounded-full bg-[#f59e0b]" />
                    {d.kamera_no_video} No Video
                  </span>
                  {d.kamera_offline > 0 && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium">
                        <span className="size-1.5 rounded-full bg-[#e2445c]" />
                        {d.kamera_offline} Offline
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2.5 DUAL METRIC SELECTOR: CPU-DVR vs CCTV / RECORDING */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
        {/* Tab 1: CPU - DVR */}
        <button
          type="button"
          onClick={() => setDailyViewMetric("cpu_dvr")}
          className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden ${
            dailyViewMetric === "cpu_dvr"
              ? "bg-blue-600 dark:bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30 ring-2 ring-blue-300 dark:ring-blue-400"
              : "bg-slate-100/90 dark:bg-[#0d1829] border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400/70 opacity-80 hover:opacity-100 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${
                  dailyViewMetric === "cpu_dvr"
                    ? "bg-white/20 text-white shadow-xs"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                <Cpu className="size-5" />
              </div>
              <div>
                <h4
                  className={`font-extrabold text-sm flex items-center gap-2 ${
                    dailyViewMetric === "cpu_dvr"
                      ? "text-white"
                      : "text-slate-900 dark:text-white"
                  }`}
                >
                  <span>1. CPU – DVR Communication</span>
                  {dailyViewMetric === "cpu_dvr" ? (
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
                    dailyViewMetric === "cpu_dvr"
                      ? "text-blue-100"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  Internal Hardware Bus & IP Protocol Communication
                </p>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-base font-black font-mono leading-none ${
                  dailyViewMetric === "cpu_dvr"
                    ? "text-white"
                    : "text-emerald-600 dark:text-[#00c875]"
                }`}
              >
                {dvrMetrics.cpuDvrUptimePct}
              </div>
              <span
                className={`text-[9px] uppercase tracking-wider font-bold block mt-1 ${
                  dailyViewMetric === "cpu_dvr"
                    ? "text-blue-100"
                    : "text-slate-400"
                }`}
              >
                Success Rate
              </span>
            </div>
          </div>
          <div
            className={`flex items-center justify-between text-[11px] pt-3 mt-3 border-t font-mono ${
              dailyViewMetric === "cpu_dvr"
                ? "border-blue-400/40 text-blue-50"
                : "border-slate-200 dark:border-slate-800 text-slate-500"
            }`}
          >
            <span>Uptime: <strong className="font-bold">{dvrMetrics.cpuDvrUptime}</strong></span>
            <span>Downtime: <strong className="font-bold">{dvrMetrics.cpuDvrOffline}</strong></span>
          </div>
        </button>

        {/* Tab 2: CCTV / Recording Status */}
        <button
          type="button"
          onClick={() => setDailyViewMetric("recording")}
          className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden ${
            dailyViewMetric === "recording"
              ? "bg-teal-600 dark:bg-teal-600 text-white border-teal-500 shadow-lg shadow-teal-600/30 ring-2 ring-teal-300 dark:ring-teal-400"
              : "bg-slate-100/90 dark:bg-[#0d1829] border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-teal-400/70 opacity-80 hover:opacity-100 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${
                  dailyViewMetric === "recording"
                    ? "bg-white/20 text-white shadow-xs"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                <Disc className="size-5" />
              </div>
              <div>
                <h4
                  className={`font-extrabold text-sm flex items-center gap-2 ${
                    dailyViewMetric === "recording"
                      ? "text-white"
                      : "text-slate-900 dark:text-white"
                  }`}
                >
                  <span>2. CCTV / NVR Recording Status</span>
                  {dailyViewMetric === "recording" ? (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white text-teal-800 uppercase tracking-wide shadow-xs">
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
                    dailyViewMetric === "recording"
                      ? "text-teal-100"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  Video Stream, Camera Channels & Storage Recording
                </p>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-base font-black font-mono leading-none ${
                  dailyViewMetric === "recording"
                    ? "text-white"
                    : "text-teal-600 dark:text-[#00d2ff]"
                }`}
              >
                {dvrMetrics.recUptimePct}
              </div>
              <span
                className={`text-[9px] uppercase tracking-wider font-bold block mt-1 ${
                  dailyViewMetric === "recording"
                    ? "text-teal-100"
                    : "text-slate-400"
                }`}
              >
                Success Rate
              </span>
            </div>
          </div>
          <div
            className={`flex items-center justify-between text-[11px] pt-3 mt-3 border-t font-mono ${
              dailyViewMetric === "recording"
                ? "border-teal-400/40 text-teal-50"
                : "border-slate-200 dark:border-slate-800 text-slate-500"
            }`}
          >
            <span>Uptime: <strong className="font-bold">{dvrMetrics.recUptime}</strong></span>
            <span>Downtime: <strong className="font-bold">{dvrMetrics.recOffline}</strong></span>
          </div>
        </button>
      </div>

      {/* 3. Bottom Section: Left Column (Timeline + Daily Table) & Right Column (Incident History) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left Column (lg:col-span-6): Daily Status Timeline + Daily Breakdown Table */}
        <div className="lg:col-span-6 flex flex-col gap-3.5">
          {/* Top Card: Daily Status Timeline with Vertical Percentage Bars */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-xs">
            {/* Header with Title & Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Daily Status Timeline: {dailyViewMetric === "cpu_dvr" ? "CPU – DVR" : "CCTV / Recording"} ({periodInfo.effectivePeriodStr})
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
              <div
                className="grid gap-1 sm:gap-1.5 items-end pt-1"
                style={{
                  gridTemplateColumns: `repeat(${dailyStatusList.length}, minmax(0, 1fr))`,
                }}
              >
                {dailyStatusList.map((item) => {
                  const isSelected = selectedBarDay === item.day;
                  return (
                    <div
                      key={item.day}
                      onClick={() => {
                        if (item.isFuture) return;
                        handleSelectDay(item.day);
                      }}
                      onMouseEnter={() => !item.isFuture && setHoveredDay(item)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`flex flex-col items-center gap-2 ${
                        item.isFuture ? "cursor-default" : "cursor-pointer group"
                      }`}
                      title={
                        item.isFuture
                          ? `${item.fullDate}`
                          : `${item.fullDate}: ${
                              item.status === "offline" ? "Incident / Offline" : "Online Normal"
                            }`
                      }
                    >
                      {/* Date Labels on Top */}
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

                      {/* Bars Underneath */}
                      <div className="w-full h-20 sm:h-24 bg-slate-100 dark:bg-slate-900/60 rounded-md p-0.5 flex flex-col justify-end border border-slate-200/60 dark:border-slate-800/60">
                        {!item.isFuture && item.isInRange ? (
                          <div
                            className={`w-full h-full rounded-xs overflow-hidden flex flex-col justify-end transition-all duration-200 ${
                              item.isToday ? "ring-2 ring-blue-500 shadow-md shadow-blue-500/35" : ""
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
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Hover / Selected Date Info Banner */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between text-xs min-h-7">
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
                    <span className="text-[11px] text-slate-600 dark:text-slate-300">
                      Status:{" "}
                      <strong className={hoveredDay.status === "offline" ? "text-[#e2445c]" : "text-[#00c875]"}>
                        {hoveredDay.status === "offline" ? "Incident / Offline" : "Online Normal"}
                      </strong>
                      {" | "}Uptime: <strong className="text-[#00c875]">{hoveredDay.uptimePct}%</strong>
                      {hoveredDay.downtimePct > 0 && (
                        <>
                          {" | "}Downtime: <strong className="text-[#e2445c]">{hoveredDay.downtimePct}% ({hoveredDay.totalDurationStr})</strong>
                        </>
                      )}
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between w-full">
                    <span>Hover or click a date to inspect and filter incident history.</span>
                    {(selectedBarDay !== null || selectedEventDate !== "ALL") && (
                      <button
                        onClick={() => handleSelectDay(null)}
                        className="text-blue-500 hover:underline text-[11px] font-medium cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Card: Table based on active subsystem filter - Only for CPU - DVR */}
          {dailyViewMetric === "cpu_dvr" && (
            /* Table 1: Daily SLA Breakdown (CPU – DVR) */
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-md bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <FileSpreadsheet className="size-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Daily SLA Breakdown (CPU – DVR)
                  </h4>
                  {selectedBarDay !== null ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
                      <span>Date {selectedBarDay < 10 ? `0${selectedBarDay}` : selectedBarDay} {periodInfo.monthStr}</span>
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
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Target SLA: 98.0%
                </div>
              </div>

              <div className="overflow-x-auto mt-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
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
                      const upMin = row.cpu_dvr_uptime_min ?? row.uptime_min;
                      const downMin = row.cpu_dvr_downtime_min ?? row.downtime_min;
                      const sr = row.cpu_dvr_success_rate ?? row.success_rate;
                      const status = row.cpu_dvr_status_sla ?? row.sla_status;
                      const isSuccess = status === "Tercapai" || status === "Achieved";
                      const isSelected = selectedBarDay === row.day;

                      return (
                        <tr
                          key={row.day}
                          onClick={() => handleSelectDay(row.day)}
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
                            {upMin.toLocaleString("id-ID")}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold">
                            {downMin > 0 ? (
                              <span className="text-rose-600 dark:text-rose-400">{downMin.toLocaleString("id-ID")}</span>
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
                  {displayedSummary && (
                    <tfoot className="sticky bottom-0 z-10 bg-slate-200/90 dark:bg-[#070e1d] font-bold text-[11px] border-t-2 border-slate-300 dark:border-slate-700 shadow-md">
                      <tr>
                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          <span className="text-blue-600 dark:text-blue-400 mr-1.5">Total:</span>
                          {displayedSummary.count} Days ({displayedSummary.totalObs.toLocaleString("en-US")}m)
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                          {displayedSummary.totalUptime.toLocaleString("id-ID")}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-rose-600 dark:text-rose-400">
                          {displayedSummary.totalDowntime.toLocaleString("id-ID")}
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
          )}
        </div>

        {/* Right Column (lg:col-span-6): Incident History Table with Date Selector */}
        <div className="lg:col-span-6 bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs h-full">
          <div className="flex flex-col h-full">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60 shrink-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Incident History: {dailyViewMetric === "cpu_dvr" ? "CPU – DVR" : "CCTV / Recording"}
                </h4>
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                  {sortedEvents.length} {sortedEvents.length === 1 ? "incident" : "incidents"}
                </span>
              </div>

              {/* Date Selector Dropdown for Daily Filtering */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Filter Date:</span>
                <select
                  value={selectedBarDay !== null ? String(selectedBarDay) : "ALL"}
                  onChange={(e) => handleDropdownDateChange(e.target.value)}
                  className="text-xs font-medium bg-white dark:bg-[#070e1d] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs"
                >
                  <option value="ALL">All Dates</option>
                  {uniqueDateOptions.map((opt) => (
                    <option key={opt.day} value={String(opt.day)}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {selectedBarDay !== null && (
                  <button
                    type="button"
                    onClick={() => handleSelectDay(null)}
                    className="text-xs text-blue-500 hover:underline font-medium cursor-pointer ml-1"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable / Full-Stretched Table */}
            <div className={`overflow-x-auto mt-2 pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 flex-1 min-h-[360px] flex flex-col justify-start ${sortedEvents.length > 5 ? "max-h-[520px] overflow-y-auto" : "h-full"}`}>
              <table className="w-full text-left text-xs border-collapse h-full flex-1" style={{ height: "100%" }}>
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-[#0a1224] shadow-xs shrink-0">
                  <tr className="text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/60 font-semibold h-8">
                    <th className="py-2.5 px-2 text-center w-8">No.</th>
                    <th className="py-2.5 px-3">Incident Time</th>
                    <th className="py-2.5 px-3">Incident / Issue</th>
                    <th className="py-2.5 px-3 text-center">Duration</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-slate-200 dark:divide-slate-800/40 text-[11px] ${sortedEvents.length <= 1 ? "h-full" : ""}`} style={{ height: "100%" }}>
                  {sortedEvents.map((event, idx) => {
                    const isStillActive =
                      event.status === "Active" ||
                      event.status === "active" ||
                      event.end_time === "-" ||
                      event.end_time?.toLowerCase().includes("ongoing") ||
                      event.end_time?.toLowerCase().includes("present");

                    const timeInfo = formatIncidentTime(event.start_time, event.end_time);

                    const isCpuDvrOutage =
                      (event.metric === "cpu_dvr" ||
                        (event.description &&
                          event.description.toLowerCase().includes("cpu to nvr")) ||
                        (event.title &&
                          event.title.toLowerCase().includes("cpu to nvr")) ||
                        (event.description &&
                          event.description.toLowerCase().includes("nvr-cpu"))) &&
                      !event.description?.toLowerCase().includes("gateway offline") &&
                      !event.title?.toLowerCase().includes("gateway offline");

                    let incidentText = cleanIncidentTitle(
                      event.title || event.description || event.cause || "Incident"
                    );

                    if (dailyViewMetric === "recording" && isCpuDvrOutage) {
                      incidentText =
                        "CCTV Video Recording Halted (Gateway CPU to NVR Communication Lost - [NVR-CPU: TERPUTUS])";
                    }

                    return (
                      <tr
                        key={event.no || idx}
                        style={sortedEvents.length === 1 ? { height: "100%" } : undefined}
                        className={`hover:bg-slate-100/80 dark:hover:bg-slate-800/30 transition-colors ${sortedEvents.length === 1 ? "h-full" : ""}`}
                      >
                        <td className={`py-2.5 px-2 text-center text-slate-500 dark:text-slate-400 font-mono align-middle ${sortedEvents.length === 1 ? "py-4" : ""}`}>
                          {idx + 1}
                        </td>
                        <td className={`py-2.5 px-3 text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap align-middle ${sortedEvents.length === 1 ? "py-4" : ""}`}>
                          <div className="font-semibold text-slate-900 dark:text-white font-sans text-xs">
                            {timeInfo.dateStr}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            {timeInfo.timeStr}
                          </div>
                        </td>
                        <td className={`py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100 align-middle ${sortedEvents.length === 1 ? "py-4" : ""}`}>
                          {incidentText}
                        </td>
                        <td className={`py-2.5 px-3 text-center whitespace-nowrap align-middle ${sortedEvents.length === 1 ? "py-4" : ""}`}>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-xs bg-amber-500/10 dark:bg-amber-500/20 text-[#f59e0b] border border-amber-500/30">
                            {formatDurationEn(event.duration)}
                          </span>
                        </td>
                        <td className={`py-2.5 px-3 text-center whitespace-nowrap align-middle ${sortedEvents.length === 1 ? "py-4" : ""}`}>
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
                  {sortedEvents.length === 0 && (
                    <tr className="h-full" style={{ height: "100%" }}>
                      <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs align-middle h-full">
                        No incident history found for {dailyViewMetric === "cpu_dvr" ? "CPU – DVR" : "CCTV / Recording"} on the selected date.
                        {selectedBarDay !== null && (
                          <button
                            type="button"
                            onClick={() => handleSelectDay(null)}
                            className="block mx-auto mt-1.5 text-blue-500 hover:underline font-semibold cursor-pointer"
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

      {/* 5. Full Width Section: Daily Recording Status Record (Expandable Date Tree Table) - Only in Recording View */}
      {dailyViewMetric === "recording" && (
      <div className="w-full bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-xs mt-3.5 space-y-3">
        {/* Header: Title, Timeline Selection Indicator, Expand/Collapse All Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="size-6 rounded-md bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Video className="size-3.5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Daily Recording Status Record
            </h4>
            {selectedBarDay !== null ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <span>Filtered Date: {selectedBarDay < 10 ? `0${selectedBarDay}` : selectedBarDay} {periodInfo.monthStr}</span>
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
                {displayedRecordingGroups.length} Days ({activeDailyBreakdown[0] ? (activeDailyBreakdown[0].day < 10 ? `0${activeDailyBreakdown[0].day}` : activeDailyBreakdown[0].day) : "01"} &ndash; {activeDailyBreakdown[activeDailyBreakdown.length - 1] ? (activeDailyBreakdown[activeDailyBreakdown.length - 1].day < 10 ? `0${activeDailyBreakdown[activeDailyBreakdown.length - 1].day}` : activeDailyBreakdown[activeDailyBreakdown.length - 1].day) : "08"} {periodInfo.monthStr})
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            {selectedBarDay !== null && (
              <button
                type="button"
                onClick={() => handleSelectDay(null)}
                className="text-blue-500 hover:underline text-[11px] font-medium cursor-pointer"
              >
                Show All {dailyRecordingGroups.length} Days
              </button>
            )}

            {/* Overall Camera Status Badge */}
            {dailyRecordingGroups.length > 0 && (() => {
              const latestGrp = dailyRecordingGroups[dailyRecordingGroups.length - 1];
              const isAll = latestGrp.recordingCount === latestGrp.totalCams && latestGrp.totalCams > 0;
              const isSome = latestGrp.recordingCount > 0;
              return (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isAll
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-[#00c875] border-emerald-500/30"
                    : isSome
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : "bg-rose-500/15 text-rose-600 dark:text-[#e2445c] border-rose-500/30"
                }`}>
                  <span className={`size-1.5 rounded-full ${isAll ? "bg-[#00c875] animate-pulse" : isSome ? "bg-amber-500" : "bg-[#e2445c]"}`} />
                  {latestGrp.recordingCount} / {latestGrp.totalCams} Cams Active (Latest)
                </span>
              );
            })()}
          </div>
        </div>

        {/* Tree Table: Date Rows with Expandable Camera Channel Sub-tables */}
        <div className="overflow-x-auto max-h-[580px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-[#0a1224] shadow-xs">
              <tr className="text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/60 font-semibold">
                <th className="py-2.5 px-3">Date / Camera Channel</th>
                <th className="py-2.5 px-3 text-center">Recording Status</th>
                <th className="py-2.5 px-3 text-right">Observation (Mins)</th>
                <th className="py-2.5 px-3 text-right">Uptime (Mins)</th>
                <th className="py-2.5 px-3 text-right">Downtime (Mins)</th>
                <th className="py-2.5 px-3 text-right">Success Rate</th>
                <th className="py-2.5 px-3 text-center">SLA Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40 text-[11px]">
              {displayedRecordingGroups.map((group) => {
                const isExpanded = !!expandedDays[group.day];
                const isSelected = selectedBarDay === group.day;

                return (
                  <React.Fragment key={group.day}>
                    {/* Master Date Row (Summary for the Day) */}
                    <tr
                      onClick={() => toggleExpandDay(group.day)}
                      className={`cursor-pointer transition-colors border-b border-slate-200/80 dark:border-slate-800/60 ${
                        isExpanded
                          ? "bg-emerald-500/10 dark:bg-emerald-500/15 font-semibold"
                          : isSelected
                          ? "bg-blue-500/10 dark:bg-blue-500/20"
                          : "hover:bg-slate-100/80 dark:hover:bg-slate-800/40"
                      }`}
                      title="Click to toggle camera channel details"
                    >
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="p-0.5 rounded text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">
                            <ChevronRight className={`size-3.5 transition-transform duration-200 ${isExpanded ? "rotate-90 text-emerald-600 dark:text-emerald-400" : ""}`} />
                          </span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                            {group.date}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                            ({group.day_name})
                          </span>
                          {group.isToday && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-500">
                              Today
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            group.isToday
                              ? group.recordingCount === group.totalCams && group.totalCams > 0
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-[#00c875] border-emerald-500/30"
                                : group.recordingCount > 0
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                : "bg-rose-500/15 text-rose-600 dark:text-[#e2445c] border-rose-500/30"
                              : group.avgDownMin === 0 || group.avgRate >= 98.0
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-[#00c875] border-emerald-500/30"
                              : group.avgUpMin > 0
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                              : "bg-rose-500/15 text-rose-600 dark:text-[#e2445c] border-rose-500/30"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              group.isToday
                                ? group.recordingCount === group.totalCams && group.totalCams > 0
                                  ? "bg-[#00c875] animate-pulse"
                                  : group.recordingCount > 0
                                  ? "bg-amber-500"
                                  : "bg-[#e2445c]"
                                : group.avgDownMin === 0 || group.avgRate >= 98.0
                                ? "bg-[#00c875]"
                                : group.avgUpMin > 0
                                ? "bg-amber-500"
                                : "bg-[#e2445c]"
                            }`}
                          />
                          {group.isToday
                            ? group.recordingCount === 0
                              ? `0 / ${group.totalCams} Cams Active (Recording Stopped)`
                              : `${group.recordingCount} / ${group.totalCams} Cams Active Recording`
                            : group.avgDownMin === 0 || group.avgRate >= 98.0
                            ? `All ${group.totalCams} Cams Normal Recording`
                            : group.avgUpMin > 0
                            ? `Recording Interrupted (${formatMins(group.avgDownMin)} Downtime)`
                            : `All ${group.totalCams} Cams Not Recorded`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                        {formatMins(group.dayObsMin)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                        {formatMins(group.avgUpMin)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold">
                        {group.avgDownMin > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">
                            {formatMins(group.avgDownMin)}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {group.avgRate.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {group.isDaySuccess ? (
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

                    {/* Direct Camera Rows: Aligned Straight with the Exact Same Table Columns */}
                    {isExpanded &&
                      group.cams.map((cam) => {
                        const isRec = cam.recordingStatus === "RECORD";
                        const isOffline =
                          cam.recordingStatus === "OFFLINE" ||
                          cam.recordingStatus === "NO VIDEO" ||
                          !cam.isOnline;

                        return (
                          <tr
                            key={`${group.day}-cam-${cam.id}`}
                            className="bg-slate-100/50 dark:bg-[#070e1d]/50 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-2 px-3 pl-8 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400 dark:text-slate-600 font-mono text-xs">└</span>
                                <span className="font-bold text-slate-900 dark:text-white font-mono bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                                  {cam.channel}
                                </span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[240px]" title={cam.name}>
                                  {cam.name}
                                </span>
                                <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 bg-slate-200/40 dark:bg-slate-800/50 px-1 rounded">
                                  {cam.resolution}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-center whitespace-nowrap">
                              {cam.downtimeMin === 0 || cam.successRate >= 98.0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-[#00c875] border border-emerald-500/30">
                                  <span className="size-1.5 rounded-full bg-[#00c875] animate-pulse" />
                                  <span>RECORD (NORMAL)</span>
                                </span>
                              ) : cam.uptimeMin > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-[#fdab3d] border border-amber-500/30">
                                  <span className="size-1.5 rounded-full bg-[#fdab3d]" />
                                  <span>PARTIAL ({cam.successRate.toFixed(1)}%{group.isToday && !isRec ? " • Inactive Now" : ""})</span>
                                </span>
                              ) : !cam.isOnline ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-600 dark:text-[#e2445c] border border-rose-500/30">
                                  <span className="size-1.5 rounded-full bg-[#e2445c]" />
                                  <span>NO VIDEO</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-600 dark:text-[#e2445c] border border-rose-500/30">
                                  <span className="size-1.5 rounded-full bg-[#e2445c]" />
                                  <span>NOT RECORD (OUTAGE)</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-500 dark:text-slate-400">
                              {formatMins(cam.observationMin)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                              {formatMins(cam.uptimeMin)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold">
                              {cam.downtimeMin > 0 ? (
                                <span className="text-rose-600 dark:text-rose-400">{formatMins(cam.downtimeMin)}</span>
                              ) : (
                                <span className="text-slate-400">0</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                              {cam.successRate.toFixed(1)}%
                            </td>
                            <td className="py-2 px-3 text-center whitespace-nowrap">
                              {cam.isSuccess ? (
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
                  </React.Fragment>
                );
              })}
              {displayedRecordingGroups.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                    No recording status records found for the selected period.
                  </td>
                </tr>
              )}
            </tbody>
            {overallRecordingSummary && (
              <tfoot className="sticky bottom-0 z-10 bg-slate-200/90 dark:bg-[#070e1d] font-bold text-[11px] border-t-2 border-slate-300 dark:border-slate-700 shadow-md">
                <tr>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    <span className="text-emerald-600 dark:text-emerald-400 mr-1.5">Total:</span>
                    {overallRecordingSummary.daysCount} Days ({overallRecordingSummary.totalActiveCamsSum}/{overallRecordingSummary.totalCamsSum} Camera Checks)
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-slate-500 dark:text-slate-400 font-normal">
                      Channel-Aggregated Total
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                    {formatMins(overallRecordingSummary.totalObs)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    {formatMins(overallRecordingSummary.totalUptime)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-600 dark:text-rose-400">
                    {overallRecordingSummary.totalDowntime > 0 ? (
                      formatMins(overallRecordingSummary.totalDowntime)
                    ) : (
                      "0"
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-900 dark:text-white">
                    {overallRecordingSummary.avgRate.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    {overallRecordingSummary.isSuccess ? (
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
      )}
    </div>
  );
};
