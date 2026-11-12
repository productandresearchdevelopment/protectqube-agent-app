"use client";

import React, { useState, useMemo, useEffect } from "react";
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

const formatMins = (val: number) => {
  if (!val || val === 0) return "0";
  return val % 1 === 0
    ? val.toLocaleString("id-ID")
    : val.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
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

  const handleSelectDay = (day: number | null, dateKey?: string) => {
    setSelectedBarDay((prev) => (prev === day ? null : day));
    if (day === null) {
      setSelectedEventDate("ALL");
    } else if (dateKey) {
      setSelectedEventDate(dateKey);
    }
  };
  const [hoveredDay, setHoveredDay] = useState<{
    day: number;
    dayNumStr: string;
    dateKey: string;
    fullDate: string;
    gwStatus: "online" | "offline" | "degraded" | "future";
    cellStatus: "online" | "offline" | "degraded" | "future";
    dvrStatus: "online" | "offline" | "degraded" | "future";
    eventsCount: number;
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

  // Generate dynamic daily status points: full 30-day month timeline, indicators only appear for active filtered dates
  const dailyMultiTrack = useMemo(() => {
    const { daysInMonth, monthStr, yearStr, todayDay, isCurrentMonth } = periodInfo;
    const minDay = minActiveDay;
    const maxDay = periodInfo.endDay;
    const events = data?.trouble_events || [];
    const breakdown = data?.daily_breakdown || [];

    const totalDays = Math.max(daysInMonth, maxDay);
    const list = [];
    for (let day = 1; day <= totalDays; day++) {
      const dayNumStr = day < 10 ? `0${day}` : `${day}`;
      const dateKey = `${dayNumStr} ${monthStr}`;
      const fullDate = `${dayNumStr} ${monthStr} ${yearStr}`;
      const mIdx = MONTH_NAMES.findIndex((m) => m.toLowerCase() === monthStr.toLowerCase());
      const mNum = mIdx !== -1 ? String(mIdx + 1).padStart(2, "0") : "11";
      const isoDateKey = `${yearStr}-${mNum}-${dayNumStr}`;

      const isInRange = day >= minDay && day <= maxDay;
      const isFutureDate = Boolean(isCurrentMonth && todayDay && day > todayDay);
      const hasBar = isInRange && !isFutureDate;

      const dayEvents = hasBar
        ? events.filter((ev) => {
            const trimmed = (ev.start_time || "").trim();
            return (
              trimmed.startsWith(isoDateKey) ||
              trimmed.startsWith(dateKey) ||
              trimmed.startsWith(`${day} ${monthStr}`) ||
              (ev.date_str && (ev.date_str === isoDateKey || ev.date_str.startsWith(dateKey)))
            );
          })
        : [];

      const daySla = breakdown.find((r) => r.day === day);

      // Status per track
      let gwStatus: "online" | "offline" | "future" = !hasBar ? "future" : "online";
      let cellStatus: "online" | "offline" | "future" = !hasBar ? "future" : "online";
      let dvrStatus: "online" | "offline" | "future" = !hasBar ? "future" : "online";

      if (hasBar) {
        if (daySla) {
          if ((daySla.cpu_modem_downtime_min ?? 0) > 0) gwStatus = "offline";
          if ((daySla.cellular_downtime_min ?? 0) > 0) cellStatus = "offline";
          if ((daySla.cpu_dvr_downtime_min ?? daySla.downtime_min ?? 0) > 0 || (daySla.rec_downtime_min ?? 0) > 0) dvrStatus = "offline";
        }

        for (const ev of dayEvents) {
          const cat = (ev.category || "").toLowerCase();
          const desc = (ev.description || "").toLowerCase();
          if (cat.includes("gateway") || desc.includes("gateway") || desc.includes("power")) {
            gwStatus = "offline";
          }
          if (cat.includes("cellular") || desc.includes("sim") || desc.includes("modem")) {
            cellStatus = "offline";
          }
          if (cat.includes("dvr") || cat.includes("camera") || desc.includes("recording") || desc.includes("nvr")) {
            dvrStatus = "offline";
          }
        }

        if (gwStatus === "offline") {
          cellStatus = "offline";
          dvrStatus = "offline";
        }
      }

      list.push({
        day,
        dayNumStr,
        dateKey,
        fullDate,
        gwStatus,
        cellStatus,
        dvrStatus,
        eventsCount: dayEvents.length,
        isToday: day === todayDay,
        isFuture: !hasBar,
        isInRange,
      });
    }

    return list;
  }, [data?.trouble_events, data?.daily_breakdown, periodInfo, minActiveDay]);

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

  // 2. Extract distinct dates for trouble event filter dropdown
  const uniqueDates = useMemo(() => {
    const set = new Set<string>();
    rangeFilteredEvents.forEach((ev) => {
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
  }, [rangeFilteredEvents]);

  // 3. Filter trouble events by selected date (timeline bar click or dropdown selection)
  const filteredEvents = useMemo(() => {
    if (selectedBarDay !== null) {
      const dayNumStr = selectedBarDay < 10 ? `0${selectedBarDay}` : `${selectedBarDay}`;
      const prefix = `${dayNumStr} ${periodInfo.monthStr}`;
      const mIdx = MONTH_NAMES.findIndex((m) => m.toLowerCase() === periodInfo.monthStr.toLowerCase());
      const mNum = mIdx !== -1 ? String(mIdx + 1).padStart(2, "0") : "11";
      const isoPrefix = `${periodInfo.yearStr}-${mNum}-${dayNumStr}`;
      const year = Number(periodInfo.yearStr) || new Date().getFullYear();
      const dStart = new Date(year, mIdx, selectedBarDay, 0, 0, 0);
      const dEnd = new Date(year, mIdx, selectedBarDay, 23, 59, 59, 999);

      return rangeFilteredEvents.filter((ev) => {
        const trimmed = (ev.start_time || "").trim();
        const startMatches = (
          trimmed.startsWith(isoPrefix) ||
          trimmed.startsWith(prefix) ||
          trimmed.startsWith(`${selectedBarDay} ${periodInfo.monthStr}`) ||
          (ev.date_str && (ev.date_str === isoPrefix || ev.date_str.startsWith(prefix)))
        );
        if (startMatches) return true;
        if (ev.end_time && ev.end_time !== "-" && !ev.end_time.toLowerCase().includes("present")) {
          const st = new Date(trimmed.replace(" ", "T"));
          const et = new Date(ev.end_time.trim().replace(" ", "T"));
          if (!isNaN(st.getTime()) && !isNaN(et.getTime())) {
            return st.getTime() < dEnd.getTime() && et.getTime() > dStart.getTime();
          }
        }
        return false;
      });
    }
    if (selectedEventDate === "ALL") {
      return rangeFilteredEvents;
    }
    return rangeFilteredEvents.filter((ev) => {
      const trimmed = (ev.start_time || "").trim();
      return (
        trimmed.startsWith(selectedEventDate) ||
        (ev.date_str && ev.date_str === selectedEventDate)
      );
    });
  }, [rangeFilteredEvents, selectedEventDate, selectedBarDay, periodInfo.monthStr, periodInfo.yearStr]);

  // Filter Rincian SLA to only show active days between minActiveDay and effectiveDays
  const activeDailyBreakdown = useMemo(() => {
    const allRows = data?.daily_breakdown || [];
    const minDay = minActiveDay;
    const maxDay = periodInfo.effectiveDays;
    return allRows.filter((row) => row.day >= minDay && row.day <= maxDay);
  }, [data?.daily_breakdown, minActiveDay, periodInfo.effectiveDays]);

  // Dynamic top cards metrics responding to timeline selection / active observation period
  const dvrMetrics = useMemo(() => {
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
      eventsCount: rangeFilteredEvents.length,
    };
  }, [selectedBarDay, activeDailyBreakdown, filteredEvents, rangeFilteredEvents.length, data, periodInfo.effectivePeriodStr]);

  // When a day bar is clicked, filter Rincian SLA to only that day; otherwise show all active days up to today
  const displayedBreakdown = useMemo(() => {
    if (selectedBarDay !== null) {
      return activeDailyBreakdown.filter((r) => r.day === selectedBarDay);
    }
    return activeDailyBreakdown;
  }, [activeDailyBreakdown, selectedBarDay]);

  // Compute footer summary dynamically for displayed CPU - DVR SLA rows
  const displayedSummary = useMemo(() => {
    const count = displayedBreakdown.length;
    if (count === 0) return null;

    let totalUptime = 0;
    let totalDowntime = 0;
    displayedBreakdown.forEach((r) => {
      totalUptime += (r.cpu_dvr_uptime_min ?? r.uptime_min);
      totalDowntime += (r.cpu_dvr_downtime_min ?? r.downtime_min);
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
  }, [displayedBreakdown]);

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
      const dvrUpMin = Math.min(dayObsMin, Math.max(0, row.cpu_dvr_uptime_min ?? row.uptime_min ?? dayObsMin));
      const dvrDownMin = Math.max(0, dayObsMin - dvrUpMin);
      const dvrRate = dayObsMin > 0 ? (dvrUpMin / dayObsMin) * 100.0 : 0.0;

      const cams = baseCams.map((c: any, idx: number) => {
        const camId = c.id || String(idx + 1);
        const camName = c.name || `Camera 0${camId}`;
        const resolution = c.resolution || c.resolution_raw || "1080P";
        const isOnline = c.is_online !== false;
        const rawStatus = String(c.recording_status || (isOnline ? "RECORD" : "NOT_RECORD")).toUpperCase();

        const isRecording = (rawStatus === "RECORD" || rawStatus.includes("REC")) && isOnline;

        let uptimeMin = 0;
        let downtimeMin = dayObsMin;
        let successRate = 0.0;

        if (isRecording) {
          uptimeMin = dvrUpMin;
          downtimeMin = dvrDownMin;
          successRate = dvrRate;
        } else {
          uptimeMin = 0;
          downtimeMin = dayObsMin;
          successRate = 0.0;
        }

        const isSuccess = successRate >= 98.0;

        return {
          no: idx + 1,
          id: camId,
          channel: `Ch ${camId}`,
          name: camName,
          resolution,
          isOnline,
          recordingStatus: isRecording ? "RECORD" : (!isOnline ? "OFFLINE" : "NOT_RECORD"),
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#00c875]/15 dark:bg-[#00c875]/20 text-[#00c875] border border-[#00c875]/30">
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
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium">: {d.storage_capacity}</span>
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

          {/* Card 8: Recording Error */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-rose-500/15 flex items-center justify-center text-[#e2445c]">
                <AlertCircle className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Recording Error</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#e2445c] leading-tight">
                {d.rec_error}
              </div>
              <div className="text-[11px] font-semibold text-[#e2445c] mt-0.5">
                {d.rec_error_pct}
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
                {d.storage_capacity}
              </div>
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
            </div>
          </div>

          {/* Card 10: Kamera */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-cyan-500/15 flex items-center justify-center text-[#00d2ff]">
                <Video className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Camera</span>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">
                  {d.kamera_total} Total
                </span>
                <div className="w-16 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    style={{
                      width: `${(d.kamera_online / d.kamera_total) * 100}%`,
                    }}
                    className="h-full bg-[#00c875]"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-1 text-[9px] text-slate-500 dark:text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-[#00c875]" />
                  Online {d.kamera_online}
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-[#f59e0b]" />
                  No Video {d.kamera_no_video}
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-[#e2445c]" />
                  Offline {d.kamera_offline}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Section: Multi-Track Timeline Status, SLA Summary & Riwayat Gangguan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left Column (lg:col-span-6): Multi-Track Timeline + Daily SLA Breakdown Table */}
        <div className="lg:col-span-6 flex flex-col gap-3.5">
          {/* Top Card: Multi-Track Timeline (Gateway, Cellular, DVR) with All 31 Days */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div>
              {/* Header with Title & Legend */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Daily Status Timeline ({periodInfo.effectivePeriodStr})
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
                    Offline
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-blue-500" />
                    Today
                  </span>
                </div>
              </div>

              {/* Dynamic Multi-Track Timeline Matrix Card */}
              <div className="mt-3.5 p-3.5 rounded-xl bg-white dark:bg-[#070e1d] border border-slate-200/90 dark:border-slate-800/80 shadow-xs space-y-2">
                {/* RULER / HEADER TANGGAL DI ATAS */}
                <div className="flex items-center gap-2">
                  <div className="w-16 shrink-0 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Track
                  </div>
                  <div
                    className="flex-1 grid gap-0.5 sm:gap-1"
                    style={{ gridTemplateColumns: `repeat(${dailyMultiTrack.length}, minmax(0, 1fr))` }}
                  >
                    {dailyMultiTrack.map((item) => (
                      <div
                        key={item.day}
                        onClick={() => {
                          if (item.isFuture) return;
                          const nextDay = selectedBarDay === item.day ? null : item.day;
                          handleSelectDay(nextDay, `${item.dayNumStr} ${periodInfo.monthStr}`);
                        }}
                        onMouseEnter={() => !item.isFuture && setHoveredDay(item)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`text-center select-none ${item.isFuture ? "cursor-default" : "cursor-pointer"}`}
                        title={item.isFuture ? `${item.fullDate}` : item.fullDate}
                      >
                        <span
                          className={`text-[9px] font-mono block leading-none transition-all ${
                            item.isToday
                              ? "font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/20 px-0.5 py-0.5 rounded ring-1 ring-blue-500/50 scale-110 shadow-xs"
                              : (selectedBarDay === item.day || selectedEventDate === item.dateKey)
                              ? "font-bold text-amber-500 dark:text-amber-400"
                              : item.isFuture
                              ? "text-slate-400 dark:text-slate-600 opacity-60"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                          }`}
                        >
                          {item.dayNumStr}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TRACK 1: GATEWAY */}
                <div className="flex items-center gap-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60">
                  <div className="w-16 shrink-0 text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                    Gateway
                  </div>
                  <div
                    className="flex-1 grid gap-0.5 sm:gap-1"
                    style={{ gridTemplateColumns: `repeat(${dailyMultiTrack.length}, minmax(0, 1fr))` }}
                  >
                    {dailyMultiTrack.map((item) => (
                      <div
                        key={item.day}
                        onClick={() => {
                          if (item.isFuture) return;
                          const nextDay = selectedBarDay === item.day ? null : item.day;
                          handleSelectDay(nextDay, `${item.dayNumStr} ${periodInfo.monthStr}`);
                        }}
                        onMouseEnter={() => !item.isFuture && setHoveredDay(item)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`h-5.5 rounded-xs transition-all ${
                          item.isFuture
                            ? "bg-slate-200/30 dark:bg-slate-800/30 cursor-default"
                            : item.gwStatus === "offline"
                            ? "bg-[#e2445c] hover:bg-[#ff4d6d] cursor-pointer"
                            : "bg-[#00c875] hover:bg-[#05e287] cursor-pointer"
                        } ${
                          item.isToday && !item.isFuture
                            ? "ring-1.5 ring-blue-500 shadow-xs"
                            : ""
                        } ${
                          (selectedBarDay === item.day || selectedEventDate === item.dateKey)
                            ? "ring-2 ring-amber-400 scale-105"
                            : !item.isFuture ? "hover:scale-105" : ""
                        }`}
                        title={item.isFuture ? `${item.fullDate}` : `Gateway ${item.dayNumStr} ${periodInfo.monthStr}: ${item.gwStatus === "offline" ? "Offline" : "Online"}`}
                      />
                    ))}
                  </div>
                </div>



                {/* TRACK 3: DVR */}
                <div className="flex items-center gap-2">
                  <div className="w-16 shrink-0 text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                    DVR
                  </div>
                  <div
                    className="flex-1 grid gap-0.5 sm:gap-1"
                    style={{ gridTemplateColumns: `repeat(${dailyMultiTrack.length}, minmax(0, 1fr))` }}
                  >
                    {dailyMultiTrack.map((item) => (
                      <div
                        key={item.day}
                        onClick={() => {
                          if (item.isFuture) return;
                          const nextDay = selectedBarDay === item.day ? null : item.day;
                          handleSelectDay(nextDay, `${item.dayNumStr} ${periodInfo.monthStr}`);
                        }}
                        onMouseEnter={() => !item.isFuture && setHoveredDay(item)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`h-5.5 rounded-xs transition-all ${
                          item.isFuture
                            ? "bg-slate-200/30 dark:bg-slate-800/30 cursor-default"
                            : item.dvrStatus === "offline"
                            ? "bg-[#e2445c] hover:bg-[#ff4d6d] cursor-pointer"
                            : "bg-[#00c875] hover:bg-[#05e287] cursor-pointer"
                        } ${
                          item.isToday && !item.isFuture
                            ? "ring-1.5 ring-blue-500 shadow-xs"
                            : ""
                        } ${
                          (selectedBarDay === item.day || selectedEventDate === item.dateKey)
                            ? "ring-2 ring-amber-400 scale-105"
                            : !item.isFuture ? "hover:scale-105" : ""
                        }`}
                        title={item.isFuture ? `${item.fullDate}` : `DVR ${item.dayNumStr} ${periodInfo.monthStr}: ${item.dvrStatus === "offline" ? "Offline" : "Online"}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Hover / Selected Day Real-Time Info Bar */}
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
                        Gateway:{" "}
                        <strong className={hoveredDay.gwStatus === "offline" ? "text-[#e2445c]" : "text-[#00c875]"}>
                          {hoveredDay.gwStatus === "offline" ? "Offline" : "Online"}
                        </strong>
                        {" | "}
                        DVR:{" "}
                        <strong className={hoveredDay.dvrStatus === "offline" ? "text-[#e2445c]" : "text-[#00c875]"}>
                          {hoveredDay.dvrStatus === "offline" ? "Offline" : "Online"}
                        </strong>
                        {hoveredDay.eventsCount > 0 && ` (${hoveredDay.eventsCount} incident events)`}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between w-full">
                      <span>Hover or click a date ({dailyMultiTrack[0]?.dayNumStr || "01"} - {dailyMultiTrack[dailyMultiTrack.length - 1]?.dayNumStr || "30"}) to filter incident details.</span>

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
          </div>

          {/* Bottom Card 1: Daily SLA Breakdown Table (CPU – DVR) */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-xs">
            {/* Header: Title & Active Selection Badge */}
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
            </div>

            {/* Table (Columns: Date, Uptime (Mins), Downtime (Mins), Success Rate, SLA Status) */}
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
                        onClick={() => handleSelectDay(row.day, `${row.day < 10 ? `0${row.day}` : row.day} ${periodInfo.monthStr}`)}
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
                  {displayedBreakdown.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500 dark:text-slate-400 text-xs">
                        No daily SLA breakdown data for the selected date.
                      </td>
                    </tr>
                  )}
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
        </div>

        {/* Right Column (lg:col-span-6): Incident History Table with Date Selector */}
        <div className="lg:col-span-6 bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs h-full">
          <div className="flex flex-col h-full">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60 shrink-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Incident History
                </h4>
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                  {filteredEvents.length} event
                </span>
              </div>

              {/* Date Selector Dropdown for Daily Filtering */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Filter Date:</span>
                <select
                  value={selectedEventDate}
                  onChange={(e) => setSelectedEventDate(e.target.value)}
                  className="text-xs font-medium bg-white dark:bg-[#070e1d] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs"
                >
                  <option value="ALL">All Dates ({rangeFilteredEvents.length})</option>
                  {uniqueDates.map((dateStr) => {
                    const count = rangeFilteredEvents.filter((e) => e.start_time.startsWith(dateStr)).length;
                    return (
                      <option key={dateStr} value={dateStr}>
                        {dateStr} ({count} events)
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

            {/* Scrollable / Full-Stretched Table */}
            <div className={`overflow-x-auto mt-2 pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 flex-1 min-h-[360px] flex flex-col justify-start ${filteredEvents.length > 5 ? "max-h-[520px] overflow-y-auto" : "h-full"}`}>
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
                <tbody className={`divide-y divide-slate-200 dark:divide-slate-800/40 text-[11px] ${filteredEvents.length <= 1 ? "h-full" : ""}`} style={{ height: "100%" }}>
                  {filteredEvents.map((event, idx) => {
                    const isStillActive = event.end_time === "-" || event.end_time?.toLowerCase().includes("sekarang");
                    return (
                      <tr
                        key={event.no || idx}
                        style={filteredEvents.length === 1 ? { height: "100%" } : undefined}
                        className={`hover:bg-slate-100/80 dark:hover:bg-slate-800/30 transition-colors ${filteredEvents.length === 1 ? "h-full" : ""}`}
                      >
                        <td className={`py-2.5 px-2 text-center text-slate-500 dark:text-slate-400 font-mono align-middle ${filteredEvents.length === 1 ? "py-4" : ""}`}>
                          {idx + 1}
                        </td>
                        <td className={`py-2.5 px-3 text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap align-middle ${filteredEvents.length === 1 ? "py-4" : ""}`}>
                          <div>{event.start_time}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">to {event.end_time}</div>
                        </td>
                        <td className={`py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100 align-middle ${filteredEvents.length === 1 ? "py-4" : ""}`}>
                          {formatIncidentEn(event.title || event.description || event.cause)}
                        </td>
                        <td className={`py-2.5 px-3 text-center whitespace-nowrap align-middle ${filteredEvents.length === 1 ? "py-4" : ""}`}>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-xs bg-amber-500/10 dark:bg-amber-500/20 text-[#f59e0b] border border-amber-500/30">
                            {formatDurationEn(event.duration)}
                          </span>
                          {selectedBarDay !== null && event.start_time && event.end_time && event.end_time !== "-" && (
                            (() => {
                              const mIdx = MONTH_NAMES.findIndex((m) => m.toLowerCase() === periodInfo.monthStr.toLowerCase());
                              if (mIdx === -1) return null;
                              const year = Number(periodInfo.yearStr) || new Date().getFullYear();
                              const dStart = new Date(year, mIdx, selectedBarDay, 0, 0, 0);
                              const dEnd = new Date(year, mIdx, selectedBarDay, 23, 59, 59, 999);
                              const st = new Date(event.start_time.replace(" ", "T"));
                              const et = new Date(event.end_time.replace(" ", "T"));
                              if (isNaN(st.getTime()) || isNaN(et.getTime())) return null;
                              const oStart = Math.max(st.getTime(), dStart.getTime());
                              const oEnd = Math.min(et.getTime(), dEnd.getTime());
                              if (oEnd > oStart) {
                                const oMin = Math.round((oEnd - oStart) / 60000);
                                const totMin = Math.round((et.getTime() - st.getTime()) / 60000);
                                if (totMin > oMin) {
                                  const dayStr = selectedBarDay < 10 ? `0${selectedBarDay}` : `${selectedBarDay}`;
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
                            })()
                          )}
                        </td>
                        <td className={`py-2.5 px-3 text-center whitespace-nowrap align-middle ${filteredEvents.length === 1 ? "py-4" : ""}`}>
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
                    <tr className="h-full" style={{ height: "100%" }}>
                      <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs align-middle h-full">
                        No incident history found for the selected date.
                        {selectedEventDate !== "ALL" && (
                          <button
                            type="button"
                            onClick={() => setSelectedEventDate("ALL")}
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

      {/* 5. Full Width Section: Daily Recording Status Record (Expandable Date Tree Table) */}
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
            {dailyRecordingGroups.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-[#00c875] border border-emerald-500/30">
                <span className="size-1.5 rounded-full bg-[#00c875] animate-pulse" />
                {dailyRecordingGroups[dailyRecordingGroups.length - 1].recordingCount} / {dailyRecordingGroups[dailyRecordingGroups.length - 1].totalCams} Cams Active (Latest)
              </span>
            )}
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
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-[#00c875] border border-emerald-500/30">
                          <span className="size-1.5 rounded-full bg-[#00c875] animate-pulse" />
                          {group.recordingCount} / {group.totalCams} Cams Active Recording
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                        {formatMins(group.totalObsMin)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                        {formatMins(group.totalUpMin)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold">
                        {group.totalDownMin > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">
                            {formatMins(group.totalDownMin)}
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
                        const isOffline = cam.recordingStatus === "OFFLINE";

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
                              {isRec ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-[#00c875] border border-emerald-500/30">
                                  <span className="size-1.5 rounded-full bg-[#00c875] animate-pulse" />
                                  <span>RECORD</span>
                                </span>
                              ) : isOffline ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-600 dark:text-[#e2445c] border border-rose-500/30">
                                  <span className="size-1.5 rounded-full bg-[#e2445c]" />
                                  <span>NO VIDEO</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-[#fdab3d] border border-amber-500/30">
                                  <span className="size-1.5 rounded-full bg-[#fdab3d]" />
                                  <span>NOT RECORD</span>
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
                      Akumulasi Semua Channel
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
    </div>
  );
};
