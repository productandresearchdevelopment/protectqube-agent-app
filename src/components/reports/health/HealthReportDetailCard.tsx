"use client";

import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  Clock,
  Activity,
  BarChart2,
  TrendingUp,
  Thermometer,
  Info,
  X,
  AlertCircle,
  AlertTriangle,
  FileDown,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  useHealthReportGatewayDetail,
  IHealthReportGatewayDetail,
  exportHealthDetailPdfUrl,
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

interface HealthReportDetailCardProps {
  gatewayId: string | null;
  dateRange?: string;
  onClose?: () => void;
}

const CustomChartTooltip = ({ active, payload, label, unit, color }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 text-white text-[10px] px-2 py-1 rounded shadow-lg border border-slate-700 font-sans z-50">
        <div className="text-slate-400 font-mono text-[9px] mb-0.5">
          {label}
        </div>
        <div className="flex items-center gap-1 font-bold">
          <span
            className="size-1.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span>
            {payload[0].value}
            {unit}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const HealthReportDetailCard: React.FC<HealthReportDetailCardProps> = ({
  gatewayId,
  dateRange,
  onClose,
}) => {
  const { data, isLoading, isError, refetch } = useHealthReportGatewayDetail(
    gatewayId,
    dateRange,
  );
  const [selectedEventDate, setSelectedEventDate] = useState<string>("ALL");
  const [selectedBarDay, setSelectedBarDay] = useState<number | null>(null);
  const [hoveredDay, setHoveredDay] = useState<any | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    if (!gatewayId) return;
    try {
      setIsExportingPdf(true);
      const url = exportHealthDetailPdfUrl(gatewayId, dateRange);
      const locName = (data?.location || gatewayId).replace(
        /[^a-zA-Z0-9_-]/g,
        "_",
      );
      await downloadReportFile(url, `Health_Detail_${locName}.pdf`);
    } catch (err) {
      console.error("Export health detail PDF error:", err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const rawEvents = data?.events || [];

  const periodInfo = useMemo(() => {
    return parseReportPeriod(data?.period || dateRange);
  }, [data?.period, dateRange]);

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

  const minActiveDay = useMemo(() => {
    const rawBreakdown = (data?.daily_breakdown as any[]) || [];
    if (rawBreakdown.length > 0 && typeof rawBreakdown[0].day === "number") {
      return Math.max(periodInfo.startDay, rawBreakdown[0].day);
    }
    return periodInfo.startDay;
  }, [data?.daily_breakdown, periodInfo.startDay]);

  const dailyStatusList = useMemo(() => {
    const { daysInMonth, monthStr, yearStr, todayDay, isCurrentMonth } =
      periodInfo;
    const minDay = minActiveDay;
    const maxDay = periodInfo.endDay;
    const breakdown = (data?.daily_breakdown as any[]) || [];

    const totalDays = Math.max(daysInMonth, maxDay);
    const list = [];
    for (let day = 1; day <= totalDays; day++) {
      const dayNumStr = day < 10 ? `0${day}` : `${day}`;
      const dateKey = `${dayNumStr} ${monthStr}`;
      const fullDate = `${dayNumStr} ${monthStr} ${yearStr}`;

      const isInRange = day >= minDay && day <= maxDay;
      const isFutureDate = Boolean(
        isCurrentMonth && todayDay && day > todayDay,
      );
      const hasBar = isInRange && !isFutureDate;

      const daySla = breakdown.find(
        (r) => r.day === day || r.date?.startsWith(dayNumStr),
      );

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
          const downMin =
            daySla.downtime_min ?? daySla.cpu_modem_downtime_min ?? 0;
          const upMin =
            daySla.uptime_min ?? daySla.cpu_modem_uptime_min ?? 1440;
          const sr =
            daySla.success_rate ?? daySla.cpu_modem_success_rate ?? 100;

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
        totalDurationStr,
        isToday: Boolean(isCurrentMonth && todayDay === day),
        isFuture: !hasBar,
        isInRange,
      });
    }

    return list;
  }, [data?.daily_breakdown, periodInfo, minActiveDay]);

  const activeDailyBreakdown = useMemo(() => {
    const breakdown = (data?.daily_breakdown as any[]) || [];
    return breakdown.filter((r) => {
      const d = r.day ?? parseInt(r.date?.split(" ")[0] || "0", 10);
      return d >= minActiveDay && d <= periodInfo.effectiveDays;
    });
  }, [data?.daily_breakdown, minActiveDay, periodInfo.effectiveDays]);

  const displayedBreakdown = useMemo(() => {
    if (selectedBarDay !== null) {
      return activeDailyBreakdown.filter((r) => {
        const d = r.day ?? parseInt(r.date?.split(" ")[0] || "0", 10);
        return d === selectedBarDay;
      });
    }
    return activeDailyBreakdown;
  }, [activeDailyBreakdown, selectedBarDay]);

  const displayedSummary = useMemo(() => {
    if (displayedBreakdown.length === 0) return null;
    let totalUp = 0;
    let totalDown = 0;
    let totalObs = 0;
    displayedBreakdown.forEach((r) => {
      const up = r.uptime_min ?? r.cpu_modem_uptime_min ?? 0;
      const down = r.downtime_min ?? r.cpu_modem_downtime_min ?? 0;
      const obs = r.observation_min ?? r.total_observed_min ?? up + down;
      totalUp += up;
      totalDown += down;
      totalObs += obs;
    });
    const avgSr = totalObs > 0 ? (totalUp / totalObs) * 100 : 100;
    return {
      count: displayedBreakdown.length,
      totalObs: Math.round(totalObs),
      totalUptime: Math.round(totalUp),
      totalDowntime: Math.round(totalDown),
      avgSuccessRate: Number(avgSr.toFixed(1)),
      isSuccess: avgSr >= 98.0,
    };
  }, [displayedBreakdown]);

  // List of active days for date filtering dropdown
  const availableDays = useMemo(() => {
    const list: { day: number; dateKey: string; label: string }[] = [];
    const minDay = periodInfo.startDay;
    const maxDay = periodInfo.effectiveDays;
    for (let day = minDay; day <= maxDay; day++) {
      const dayNumStr = day < 10 ? `0${day}` : `${day}`;
      const dateKey = `${dayNumStr} ${periodInfo.monthStr}`;
      const isToday = Boolean(
        periodInfo.isCurrentMonth && periodInfo.todayDay === day,
      );
      list.push({
        day,
        dateKey,
        label: `${dateKey}${isToday ? " (Today)" : ""}`,
      });
    }
    return list;
  }, [periodInfo]);

  // Filter events by period / selected date for Incident History table
  const rangeFilteredEvents = useMemo(() => {
    const minDay = periodInfo.startDay;
    const maxDay = periodInfo.effectiveDays;
    const month = periodInfo.monthStr.toLowerCase();
    const targetMonthNum =
      MONTH_NAMES.findIndex((m) => m.toLowerCase() === month) + 1;

    return rawEvents.filter((ev: any) => {
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
      const dayNum = parseInt(parts[0], 10);
      if (isNaN(dayNum)) return true;
      return dayNum >= minDay && dayNum <= maxDay;
    });
  }, [rawEvents, periodInfo]);

  const uniqueDates = useMemo(() => {
    const dates = new Set<string>();
    rangeFilteredEvents.forEach((e: any) => {
      const trimmed = (e.start_time || "").trim();
      const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
      if (isoMatch) {
        dates.add(isoMatch[1]);
        return;
      }
      const match = trimmed.match(/^(\d{1,2}\s+[A-Za-z]{3})/);
      if (match) dates.add(match[1]);
    });
    return Array.from(dates);
  }, [rangeFilteredEvents]);

  const filteredEvents = useMemo(() => {
    if (selectedBarDay !== null) {
      const dayStr =
        selectedBarDay < 10 ? `0${selectedBarDay}` : `${selectedBarDay}`;
      return rangeFilteredEvents.filter((e: any) => {
        const trimmed = (e.start_time || "").trim();
        const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) {
          return parseInt(isoMatch[3], 10) === selectedBarDay;
        }
        const parts = trimmed.split(" ");
        return parseInt(parts[0], 10) === selectedBarDay;
      });
    }
    if (selectedEventDate !== "ALL") {
      const target = selectedEventDate.trim().toLowerCase();
      return rangeFilteredEvents.filter((e: any) => {
        const trimmed = (e.start_time || "").trim().toLowerCase();
        return (
          trimmed.startsWith(target) ||
          (e.date_str && e.date_str.toLowerCase() === target)
        );
      });
    }
    return rangeFilteredEvents;
  }, [rangeFilteredEvents, selectedEventDate, selectedBarDay]);

  // Memoized dynamic trend data for CPU, RAM, and Storage Usage based on selected date (per jam / hourly when day is selected)
  const { filteredCpuTrend, filteredRamTrend, filteredStorageTrend, dayStats } =
    useMemo(() => {
      const rawCpu = (data?.cpu_trend as any[]) || [];
      const rawRam = (data?.ram_trend as any[]) || [];
      const rawSd = (data?.sd_trend as any[]) || [];

      const defaultStats = {
        isDaySelected: false,
        label: "All Month",
        hasData: rawCpu.length > 0,
        maxHourLabel: "23:00",
        isDayToday: false,
        cpuAvg: data?.cpu_avg || 0,
        cpuMax: data?.cpu_max || 0,
        ramAvg: data?.ram_avg || 0,
        ramMax: data?.ram_max || 0,
        sdAvg: data?.sd_avg || 0,
        sdMax: data?.sd_max || 0,
      };

      if (selectedEventDate === "ALL") {
        const sample = (arr: any[]) => {
          if (arr.length <= 31) {
            return arr.map((p) => ({
              ...p,
              displayDate: p.date_key || p.date,
            }));
          }
          // Deduplicate by date_key if present
          const seen = new Set<string>();
          const deduped: any[] = [];
          for (const item of arr) {
            const k = item.date_key || item.date?.split(" ")[0];
            if (k && !seen.has(k)) {
              seen.add(k);
              deduped.push({ ...item, displayDate: k });
            }
          }
          if (deduped.length > 0) return deduped;
          const step = Math.ceil(arr.length / 30);
          return arr
            .filter((_, idx) => idx % step === 0)
            .map((p) => ({ ...p, displayDate: p.date_key || p.date }));
        };

        return {
          filteredCpuTrend: sample(rawCpu),
          filteredRamTrend: sample(rawRam),
          filteredStorageTrend: sample(rawSd),
          dayStats: defaultStats,
        };
      }

      // A specific day is selected, e.g. "06 Nov" or "04 Nov"
      // Aggregated per jam (hourly range: 00:00 - current hour for today, or 00:00 - 23:00 for past days)
      const selDayNum = parseInt(selectedEventDate.split(" ")[0], 10);
      const targetKey = selectedEventDate.trim().toLowerCase();

      const matchDay = (p: any) => {
        if (p.day && p.day === selDayNum) return true;
        if (p.date_key && p.date_key.trim().toLowerCase() === targetKey)
          return true;
        if (p.date && p.date.trim().toLowerCase().startsWith(targetKey))
          return true;
        return false;
      };

      const dayCpu = rawCpu.filter(matchDay);
      const dayRam = rawRam.filter(matchDay);
      const daySd = rawSd.filter(matchDay);

      const isDayToday =
        periodInfo.isCurrentMonth &&
        periodInfo.todayDay !== null &&
        selDayNum === periodInfo.todayDay;

      const currentHour = new Date().getHours();
      const maxHour = isDayToday ? currentHour : 23;
      const maxHourLabel = `${maxHour < 10 ? `0${maxHour}` : maxHour}:00`;

      const hourlyCpu: any[] = [];
      const hourlyRam: any[] = [];
      const hourlySd: any[] = [];

      const baseCpu =
        dayCpu.length > 0
          ? Math.round(
              dayCpu.reduce((a, b) => a + (b.value || 0), 0) / dayCpu.length,
            )
          : data?.cpu_avg || 0;
      const baseRam =
        dayRam.length > 0
          ? Math.round(
              dayRam.reduce((a, b) => a + (b.value || 0), 0) / dayRam.length,
            )
          : data?.ram_avg || 0;
      const baseSd =
        daySd.length > 0
          ? Math.round(
              daySd.reduce((a, b) => a + (b.value || 0), 0) / daySd.length,
            )
          : data?.sd_avg || 0;

      for (let h = 0; h <= maxHour; h++) {
        const hStr = h < 10 ? `0${h}` : `${h}`;
        const hourLabel = `${hStr}:00`;
        const hourPrefix = `${hStr}:`;

        const ptsC = dayCpu.filter(
          (p) => p.time && p.time.startsWith(hourPrefix),
        );
        const ptsR = dayRam.filter(
          (p) => p.time && p.time.startsWith(hourPrefix),
        );
        const ptsS = daySd.filter(
          (p) => p.time && p.time.startsWith(hourPrefix),
        );

        const vCpu =
          ptsC.length > 0
            ? Math.round(
                ptsC.reduce((a, b) => a + (b.value || 0), 0) / ptsC.length,
              )
            : baseCpu;
        const vRam =
          ptsR.length > 0
            ? Math.round(
                ptsR.reduce((a, b) => a + (b.value || 0), 0) / ptsR.length,
              )
            : baseRam;
        const vSd =
          ptsS.length > 0
            ? Math.round(
                ptsS.reduce((a, b) => a + (b.value || 0), 0) / ptsS.length,
              )
            : baseSd;

        hourlyCpu.push({
          displayDate: hourLabel,
          time: hourLabel,
          value: vCpu,
        });
        hourlyRam.push({
          displayDate: hourLabel,
          time: hourLabel,
          value: vRam,
        });
        hourlySd.push({ displayDate: hourLabel, time: hourLabel, value: vSd });
      }

      const calcAvg = (arr: any[]) =>
        Math.round(
          arr.reduce((acc, x) => acc + (x.value || 0), 0) / arr.length,
        );
      const calcMax = (arr: any[]) => Math.max(...arr.map((x) => x.value || 0));

      return {
        filteredCpuTrend: hourlyCpu,
        filteredRamTrend: hourlyRam,
        filteredStorageTrend: hourlySd,
        dayStats: {
          isDaySelected: true,
          label: selectedEventDate,
          hasData: dayCpu.length > 0,
          maxHourLabel,
          isDayToday,
          cpuAvg: calcAvg(hourlyCpu),
          cpuMax: calcMax(hourlyCpu),
          ramAvg: calcAvg(hourlyRam),
          ramMax: calcMax(hourlyRam),
          sdAvg: calcAvg(hourlySd),
          sdMax: calcMax(hourlySd),
        },
      };
    }, [
      data?.cpu_trend,
      data?.ram_trend,
      data?.sd_trend,
      data?.cpu_avg,
      data?.cpu_max,
      data?.ram_avg,
      data?.ram_max,
      data?.sd_avg,
      data?.sd_max,
      selectedEventDate,
      periodInfo,
    ]);

  // Real SLA 98.0%, Uptime, and Downtime calculation (supports active period & daily filtering)
  const slaCalc = useMemo(() => {
    const isDayFiltered = selectedEventDate !== "ALL";
    const breakdown = (data?.daily_breakdown as any[]) || [];

    const fmtHM = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = Math.round(mins % 60);
      return `${h}h ${m.toString().padStart(2, "0")}m`;
    };

    if (isDayFiltered) {
      // 1 Specific Day is selected (e.g. "06 Nov")
      const dayTargetStr = selectedEventDate.trim().toLowerCase();
      const matchedRow = breakdown.find((r) => {
        const dStr = (r.date || "").trim().toLowerCase();
        return (
          dStr === dayTargetStr ||
          `${r.day < 10 ? `0${r.day}` : r.day} ${periodInfo.monthStr}`.toLowerCase() ===
            dayTargetStr
        );
      });

      const selDayNum = parseInt(selectedEventDate.split(" ")[0], 10);
      const isToday =
        periodInfo.isCurrentMonth &&
        periodInfo.todayDay !== null &&
        (selDayNum === periodInfo.todayDay ||
          matchedRow?.day === periodInfo.todayDay);
      const currentHour = new Date().getHours();
      const totalObsMin = isToday ? Math.max(60, currentHour * 60) : 1440;
      const totalObsHours = totalObsMin / 60;

      let downMin =
        matchedRow?.cpu_modem_downtime_min ?? matchedRow?.downtime_min ?? 0;
      if (downMin === 0) {
        const dayEvs = rawEvents.filter((ev: any) =>
          (ev.start_time || "").startsWith(selectedEventDate),
        );
        downMin = dayEvs.reduce(
          (acc: number, ev: any) => acc + (ev.duration_minutes || 0),
          0,
        );
      }

      const upMin = Math.max(0, totalObsMin - downMin);
      const uptimePct = Number(((upMin / totalObsMin) * 100).toFixed(1));
      const downtimePct = Number((100 - uptimePct).toFixed(1));

      const slaTargetPct = 98.0;
      const minUptimeMin = totalObsMin * (slaTargetPct / 100);
      const maxDownMin = totalObsMin * ((100 - slaTargetPct) / 100);

      const isMet = uptimePct >= slaTargetPct;
      const diffPct = Number((uptimePct - slaTargetPct).toFixed(1));

      const downDiffMin = downMin - maxDownMin;
      const toleranceText =
        downDiffMin > 0
          ? `Downtime exceeded daily tolerance limit by ${fmtHM(downDiffMin)}`
          : `Downtime within daily tolerance limit (${fmtHM(Math.abs(downDiffMin))} remaining)`;

      return {
        isDayFiltered: true,
        periodLabel: `Date: ${selectedEventDate} (${totalObsHours.toFixed(1)} Hours Observation)`,
        periodHours: Math.round(totalObsHours),
        periodHoursStr: `${totalObsHours.toFixed(1)} Hours`,
        uptimeText: fmtHM(upMin),
        uptimePct,
        downtimeText: fmtHM(downMin),
        downtimePct,
        slaTargetPct,
        slaMinUptimeText: fmtHM(minUptimeMin),
        slaMaxDownText: fmtHM(maxDownMin),
        isSLAMet: isMet,
        slaDiffPct: diffPct >= 0 ? `+${diffPct}` : `${diffPct}`,
        toleranceText,
      };
    }

    // ALL (Active Period or Full Month)
    const activeRows =
      breakdown.length > 0
        ? breakdown.filter(
            (r) =>
              r.day >= periodInfo.startDay && r.day <= periodInfo.effectiveDays,
          )
        : [];

    let totalObsMin = 0;
    let totalUpMin = 0;
    let totalDownMin = 0;

    if (activeRows.length > 0) {
      activeRows.forEach((r) => {
        const up = r.cpu_modem_uptime_min ?? r.uptime_min ?? 1440;
        const down = r.cpu_modem_downtime_min ?? r.downtime_min ?? 0;
        totalUpMin += up;
        totalDownMin += down;
        totalObsMin += up + down;
      });
    }

    if (totalObsMin === 0) {
      const activeDaysCount = Math.max(
        1,
        periodInfo.effectiveDays - periodInfo.startDay + 1,
      );
      totalObsMin = activeDaysCount * 1440;
      totalDownMin = rawEvents.reduce(
        (acc: number, ev: any) => acc + (ev.duration_minutes || 0),
        0,
      );
      totalUpMin = Math.max(0, totalObsMin - totalDownMin);
    }

    const totalObsHours = totalObsMin / 60;
    const uptimePct = Number(((totalUpMin / totalObsMin) * 100).toFixed(1));
    const downtimePct = Number((100 - uptimePct).toFixed(1));

    const slaTargetPct = 98.0;
    const minUptimeMin = totalObsMin * (slaTargetPct / 100);
    const maxDownMin = totalObsMin * ((100 - slaTargetPct) / 100);

    const isMet = uptimePct >= slaTargetPct;
    const diffPct = Number((uptimePct - slaTargetPct).toFixed(1));

    const downDiffMin = totalDownMin - maxDownMin;
    const toleranceText =
      downDiffMin > 0
        ? `Downtime exceeded tolerance limit by ${fmtHM(downDiffMin)}`
        : `Downtime within tolerance limit (${fmtHM(Math.abs(downDiffMin))} remaining)`;

    return {
      isDayFiltered: false,
      periodLabel: `${periodInfo.effectivePeriodStr} (${totalObsHours.toFixed(1)} Hours Active)`,
      periodHours: Math.round(totalObsHours),
      periodHoursStr: `${totalObsHours.toFixed(1)} Hours`,
      uptimeText: fmtHM(totalUpMin),
      uptimePct,
      downtimeText: fmtHM(totalDownMin),
      downtimePct,
      slaTargetPct,
      slaMinUptimeText: fmtHM(minUptimeMin),
      slaMaxDownText: fmtHM(maxDownMin),
      isSLAMet: isMet,
      slaDiffPct: diffPct >= 0 ? `+${diffPct}` : `${diffPct}`,
      toleranceText,
    };
  }, [selectedEventDate, data?.daily_breakdown, periodInfo, rawEvents]);

  if (!gatewayId) return null;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <div className="size-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Memuat data performa kesehatan sistem...</span>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-white dark:bg-[#070e1d] rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-6 text-center text-slate-500 dark:text-slate-400 text-sm space-y-3">
        <p>
          Data performa kesehatan untuk gateway{" "}
          <strong className="text-slate-700 dark:text-slate-200">
            {gatewayId}
          </strong>{" "}
          belum tersedia atau gagal dimuat.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors cursor-pointer"
        >
          Muat Ulang (Retry)
        </button>
      </div>
    );
  }

  const d = data;
  const isWhite = (d.type || "").includes("Putih");

  // Dynamic Period Calculation
  const periodHoursStr = slaCalc.periodHoursStr;

  const getCategoryColor = (cat: string) => {
    if (cat.includes("CPU")) return "text-[#f59e0b]";
    if (cat.includes("SD")) return "text-[#e2445c]";
    if (cat.includes("RAM")) return "text-[#f97316]";
    if (cat.includes("Suhu")) return "text-[#eab308]";
    return "text-slate-300";
  };

  return (
    <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-5 space-y-4 font-sans transition-all duration-300">
      {/* 1. Header Bar: Title, Status Badge, Close Button */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <FileSpreadsheet className="size-4" />
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Detail Device &ndash; {d.location || d.id}
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#00c875]/20 text-[#00a862] dark:text-[#00c875] border border-[#00c875]/30">
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
              className="text-slate-400 hover:text-slate-800 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Close Details"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Section: Device Profile & 7 Metric Cards + 3 Line Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 items-stretch">
        {/* Left Column (xl:col-span-3): Device Profile Card */}
        <div className="xl:col-span-3 bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row xl:flex-col gap-3.5 items-center sm:items-start justify-between shadow-xs">
          <div className="flex flex-col items-center justify-center shrink-0 w-full pt-1">
            <SmartBoxIsometricIllustration isWhite={isWhite} />
          </div>

          <div className="flex-1 min-w-0 space-y-1.5 w-full">
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
              <div className="grid grid-cols-[70px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Type
                </span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">
                  : {d.type}
                </span>
              </div>
              <div className="grid grid-cols-[70px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  CPU
                </span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">
                  : {d.cpu_spec}
                </span>
              </div>
              <div className="grid grid-cols-[70px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  RAM
                </span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">
                  : {d.ram_spec}
                </span>
              </div>
              <div className="grid grid-cols-[70px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  SD Card
                </span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">
                  : {d.sd_spec}
                </span>
              </div>
              <div className="grid grid-cols-[70px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Modem
                </span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">
                  : {d.modem_spec}
                </span>
              </div>
              <div className="grid grid-cols-[70px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Provider
                </span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">
                  : {d.provider_spec}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (xl:col-span-9): 7 KPI Cards & 3 Realtime Trend Charts */}
        <div className="xl:col-span-9 space-y-3 flex flex-col justify-between">
          {/* Top Sub-row: 5 Hardware Health KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {/* Card 1: Periode & Total Waktu */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                  <Calendar className="size-3" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  Period
                </span>
              </div>
              <div className="mt-2">
                <div className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight truncate">
                  {selectedEventDate !== "ALL"
                    ? selectedEventDate
                    : periodInfo.effectivePeriodStr}
                </div>
                <div className="text-[9px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                  Total {periodHoursStr}
                </div>
              </div>
            </div>

            {/* Card 2: Average CPU */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded bg-rose-500/15 flex items-center justify-center text-[#e2445c]">
                  <BarChart2 className="size-3" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  Average CPU
                </span>
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-[#e2445c] leading-tight">
                  {d.cpu_avg}%
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Max {d.cpu_max}%
                </div>
              </div>
            </div>

            {/* Card 3: Average RAM */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded bg-emerald-500/15 flex items-center justify-center text-[#00a862] dark:text-[#00c875]">
                  <BarChart2 className="size-3" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  Average RAM
                </span>
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-[#00a862] dark:text-[#00c875] leading-tight">
                  {d.ram_avg}%
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Max {d.ram_max}%
                </div>
              </div>
            </div>

            {/* Card 4: Storage Usage */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-[#f59e0b]">
                  <TrendingUp className="size-3" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  Storage Usage
                </span>
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-amber-600 dark:text-[#f59e0b] leading-tight">
                  {d.sd_avg}%
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Peak {d.sd_max}%
                </div>
              </div>
            </div>

            {/* Card 5: Storage Health & Temp */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-[#00d2ff]">
                  <Thermometer className="size-3" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  Health & Temp
                </span>
              </div>
              <div className="mt-2">
                <div
                  className={`text-xs font-bold leading-tight ${
                    d.sd_health_status === "Warning" ||
                    d.sd_health_status === "Caution"
                      ? "text-[#fdab3d]"
                      : d.sd_health_status === "Critical"
                        ? "text-[#e2445c]"
                        : "text-[#00a862] dark:text-[#00c875]"
                  }`}
                >
                  {d.sd_health_status === "Caution"
                    ? "Warning"
                    : d.sd_health_status}{" "}
                  ({d.sd_life_pct}%)
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {d.temp_avg}°C (Peak {d.temp_max}°C)
                </div>
              </div>
            </div>
          </div>

          {/* Daily Status Timeline Card (Replaces Incident History in top right section) */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
            {/* Header with Title & Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-md bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Activity className="size-3.5" />
                </div>
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
                  Incident / Offline
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-blue-500" />
                  Today
                </span>
              </div>
            </div>

            {/* Daily Bar Chart Card with Date Labels on TOP and Bars on BOTTOM */}
            <div className="mt-2.5 p-3 rounded-xl bg-white dark:bg-[#070e1d] border border-slate-200/90 dark:border-slate-800/80 shadow-xs">
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
                        handleSelectDay(item.day, item.dateKey);
                      }}
                      onMouseEnter={() => !item.isFuture && setHoveredDay(item)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`flex flex-col items-center gap-1.5 ${
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
                      {/* Date label on top */}
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

                      {/* Bar underneath */}
                      <div className="w-full h-16 sm:h-20 bg-slate-100 dark:bg-slate-900/60 rounded-md p-0.5 flex flex-col justify-end border border-slate-200/60 dark:border-slate-800/60">
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
              <div className="mt-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between text-xs min-h-6">
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
                    <span
                      className={`font-medium ${
                        (hoveredDay.downtimePct ?? 0) > 0
                          ? "text-[#e2445c]"
                          : "text-[#00c875]"
                      }`}
                    >
                      {(hoveredDay.downtimePct ?? 0) > 0
                        ? `Uptime ${hoveredDay.uptimePct}% | Downtime ${hoveredDay.downtimePct}% (${hoveredDay.totalDurationStr})`
                        : `Normal Online (100% Uptime)`}
                    </span>
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
        </div>
      </div>

      {/* 3. Section: Left Column (Daily SLA Breakdown Table) & Right Column (Incident History Table) - Above Telemetry Usage Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left Column (lg:col-span-6): Daily SLA Breakdown Table (Gateway System) */}
        <div className="lg:col-span-6 bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-xs">
          {/* Header: Title, Active Selection Badge & Days Count */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <FileSpreadsheet className="size-3.5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Daily SLA Breakdown (Gateway System)
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
                {displayedBreakdown.map((row: any) => {
                  const upMin = row.uptime_min ?? row.cpu_modem_uptime_min ?? 0;
                  const downMin =
                    row.downtime_min ?? row.cpu_modem_downtime_min ?? 0;
                  const sr =
                    row.success_rate ?? row.cpu_modem_success_rate ?? 100;
                  const isSuccess =
                    sr >= 98.0 ||
                    row.sla_status === "Achieved" ||
                    row.is_sla_met;
                  const isSelected = selectedBarDay === row.day;

                  return (
                    <tr
                      key={row.day || row.date}
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
                        {row.date} {row.day_name ? `(${row.day_name})` : ""}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                        {Math.round(upMin).toLocaleString("en-US")}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold">
                        {downMin > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">
                            {Math.round(downMin).toLocaleString("en-US")}
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

        {/* Right Column (lg:col-span-6): Incident History Table */}
        <div className="lg:col-span-6 bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs h-full">
          <div className="flex flex-col h-full">
            {/* Header: Title, Event Count Badge & Filter Dropdown */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60 shrink-0">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-md bg-amber-500/15 flex items-center justify-center text-[#f59e0b]">
                  <Clock className="size-3.5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Incident History
                </h4>
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                  {filteredEvents.length} event
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Filter Date:
                </span>
                <select
                  value={selectedEventDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "ALL") {
                      handleSelectDay(null);
                    } else {
                      const d = parseInt(val.split(" ")[0], 10);
                      handleSelectDay(isNaN(d) ? null : d, val);
                    }
                  }}
                  className="text-xs font-medium bg-white dark:bg-[#070e1d] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs"
                >
                  <option value="ALL">
                    All Dates ({rangeFilteredEvents.length})
                  </option>
                  {uniqueDates.map((dateStr) => {
                    const count = rangeFilteredEvents.filter((ev: any) =>
                      (ev.start_time || "").startsWith(dateStr),
                    ).length;
                    return (
                      <option key={dateStr} value={dateStr}>
                        {dateStr} ({count}{" "}
                        {count === 1 ? "incident" : "incidents"})
                      </option>
                    );
                  })}
                </select>
                {selectedEventDate !== "ALL" && (
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

            {/* Table */}
            <div
              className={`overflow-x-auto mt-2 flex-1 min-h-0 flex flex-col justify-start pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 ${filteredEvents.length > 4 ? "max-h-72 overflow-y-auto" : "h-full min-h-[140px]"}`}
            >
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-[#0a1224] shadow-xs shrink-0">
                  <tr className="text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/60 font-semibold h-8">
                    <th className="py-2 px-2 text-center w-8">No.</th>
                    <th className="py-2 px-3">Incident Time</th>
                    <th className="py-2 px-3">Incident / Disturbance</th>
                    <th className="py-2 px-3 text-center">Duration</th>
                    <th className="py-2 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40 text-[11px]">
                  {filteredEvents.map((event: any, idx: number) => {
                    const isStillActive =
                      event.end_time === "-" ||
                      event.end_time?.toLowerCase().includes("sekarang") ||
                      event.end_time?.toLowerCase().includes("now");
                    return (
                      <tr
                        key={event.no || idx}
                        className="hover:bg-slate-100/80 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-2 px-2 text-center text-slate-500 dark:text-slate-400 font-mono align-middle">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap align-middle">
                          <div>{event.start_time}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            to {event.end_time}
                          </div>
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100 align-middle">
                          {formatIncidentEn(
                            event.title || event.description || event.cause,
                          )}
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap align-middle">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-xs bg-amber-500/10 dark:bg-amber-500/20 text-[#f59e0b] border border-amber-500/30">
                            {formatDurationEn(event.duration)}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap align-middle">
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
                        className="py-10 text-center text-slate-500 dark:text-slate-400 text-xs"
                      >
                        No incident history available for the selected date.
                        {selectedEventDate !== "ALL" && (
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

      {/* 2. Telemetry Usage Trend Charts (Full Width) */}
      <div className="w-full bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-xs space-y-3.5">
        {/* Header: Title + Day Filter Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <TrendingUp className="size-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Telemetry Usage Trend
                <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                  {dayStats.isDaySelected
                    ? `(Hourly Trend • Range: 00:00 - ${dayStats.maxHourLabel || "23:00"})`
                    : `(Daily Average Overview)`}
                </span>
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Filter Day:
            </span>
            <select
              value={selectedEventDate}
              onChange={(e) => setSelectedEventDate(e.target.value)}
              className="text-xs font-medium bg-white dark:bg-[#070e1d] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs"
            >
              <option value="ALL">All Days (Full Month)</option>
              {availableDays.map((d) => (
                <option key={d.dateKey} value={d.dateKey}>
                  {d.label}
                </option>
              ))}
            </select>
            {dayStats.isDaySelected && (
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

        {/* 3 Line Trend Charts - Spanning Full Width (grid-cols-1 md:grid-cols-3) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Chart 1: CPU Usage */}
          <div className="bg-white dark:bg-[#070e1d] border border-slate-200/90 dark:border-slate-800/80 rounded-xl p-3 shadow-2xs">
            <div className="flex items-center justify-between pb-1.5 text-xs">
              <span className="font-bold text-slate-900 dark:text-white">
                CPU Usage (%)
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Avg:{" "}
                <strong className="text-slate-900 dark:text-white">
                  {dayStats.cpuAvg}%
                </strong>{" "}
                | Peak: {dayStats.cpuMax}%
              </span>
            </div>
            <div className="h-36 w-full mt-1.5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={filteredCpuTrend}
                  margin={{ top: 5, right: 12, left: -22, bottom: 0 }}
                >
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 9, fill: "#94a3b8" }}
                    axisLine={{ stroke: "#94a3b8" }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tick={{ fontSize: 9, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<CustomChartTooltip unit="%" color="#00c875" />}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#00c875"
                    strokeWidth={2}
                    dot={
                      filteredCpuTrend.length <= 25
                        ? { r: 2.5, fill: "#00c875" }
                        : false
                    }
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: RAM Usage */}
          <div className="bg-white dark:bg-[#070e1d] border border-slate-200/90 dark:border-slate-800/80 rounded-xl p-3 shadow-2xs">
            <div className="flex items-center justify-between pb-1.5 text-xs">
              <span className="font-bold text-slate-900 dark:text-white">
                RAM Usage (%)
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Avg:{" "}
                <strong className="text-[#00a862] dark:text-[#00c875]">
                  {dayStats.ramAvg}%
                </strong>{" "}
                | Peak: {dayStats.ramMax}%
              </span>
            </div>
            <div className="h-36 w-full mt-1.5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={filteredRamTrend}
                  margin={{ top: 5, right: 12, left: -22, bottom: 0 }}
                >
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 9, fill: "#94a3b8" }}
                    axisLine={{ stroke: "#94a3b8" }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tick={{ fontSize: 9, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<CustomChartTooltip unit="%" color="#f59e0b" />}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={
                      filteredRamTrend.length <= 25
                        ? { r: 2.5, fill: "#f59e0b" }
                        : false
                    }
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Storage Usage (Disk /) */}
          <div className="bg-white dark:bg-[#070e1d] border border-slate-200/90 dark:border-slate-800/80 rounded-xl p-3 shadow-2xs">
            <div className="flex items-center justify-between pb-1.5 text-xs">
              <span className="font-bold text-slate-900 dark:text-white">
                Storage Usage (Disk /) (%)
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Avg:{" "}
                <strong className="text-[#0073ea] dark:text-[#38bdf8]">
                  {dayStats.sdAvg}%
                </strong>{" "}
                | Peak: {dayStats.sdMax}%
              </span>
            </div>
            <div className="h-36 w-full mt-1.5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={filteredStorageTrend}
                  margin={{ top: 5, right: 12, left: -22, bottom: 0 }}
                >
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 9, fill: "#94a3b8" }}
                    axisLine={{ stroke: "#94a3b8" }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tick={{ fontSize: 9, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<CustomChartTooltip unit="%" color="#0073ea" />}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#0073ea"
                    strokeWidth={2}
                    dot={
                      filteredStorageTrend.length <= 25
                        ? { r: 2.5, fill: "#0073ea" }
                        : false
                    }
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
