"use client";

import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  Clock,
  BarChart2,
  TrendingUp,
  Thermometer,
  Info,
  X,
  AlertCircle,
  AlertTriangle,
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
} from "@/store/api/monitoring";
import { SmartBoxIsometricIllustration } from "@/components/ui/SmartBoxIllustration";
import { parseReportPeriod } from "@/lib/reportPeriodUtils";


interface HealthReportDetailCardProps {
  gatewayId: string | null;
  dateRange?: string;
  onClose?: () => void;
}

const CustomChartTooltip = ({ active, payload, label, unit, color }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 text-white text-[10px] px-2 py-1 rounded shadow-lg border border-slate-700 font-sans z-50">
        <div className="text-slate-400 font-mono text-[9px] mb-0.5">{label}</div>
        <div className="flex items-center gap-1 font-bold">
          <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
          <span>{payload[0].value}{unit}</span>
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
  const { data, isLoading, isError, refetch } = useHealthReportGatewayDetail(gatewayId, dateRange);
  const [selectedEventDate, setSelectedEventDate] = useState<string>("ALL");

  const rawEvents = data?.events || [];

  const periodInfo = useMemo(() => {
    return parseReportPeriod(data?.period || dateRange);
  }, [data?.period, dateRange]);

  // List of active days for date filtering dropdown
  const availableDays = useMemo(() => {
    const list: { day: number; dateKey: string; label: string }[] = [];
    const minDay = periodInfo.startDay;
    const maxDay = periodInfo.effectiveDays;
    for (let day = minDay; day <= maxDay; day++) {
      const dayNumStr = day < 10 ? `0${day}` : `${day}`;
      const dateKey = `${dayNumStr} ${periodInfo.monthStr}`;
      const isToday = Boolean(periodInfo.isCurrentMonth && periodInfo.todayDay === day);
      list.push({
        day,
        dateKey,
        label: `${dateKey}${isToday ? " (Today)" : ""}`,
      });
    }
    return list;
  }, [periodInfo]);

  // Memoized dynamic trend data for CPU, RAM, and Storage Usage based on selected date (per jam / hourly when day is selected)
  const { filteredCpuTrend, filteredRamTrend, filteredStorageTrend, dayStats } = useMemo(() => {
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
        return arr.filter((_, idx) => idx % step === 0).map((p) => ({ ...p, displayDate: p.date_key || p.date }));
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
      if (p.date_key && p.date_key.trim().toLowerCase() === targetKey) return true;
      if (p.date && p.date.trim().toLowerCase().startsWith(targetKey)) return true;
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

    const baseCpu = dayCpu.length > 0 ? Math.round(dayCpu.reduce((a, b) => a + (b.value || 0), 0) / dayCpu.length) : (data?.cpu_avg || 0);
    const baseRam = dayRam.length > 0 ? Math.round(dayRam.reduce((a, b) => a + (b.value || 0), 0) / dayRam.length) : (data?.ram_avg || 0);
    const baseSd = daySd.length > 0 ? Math.round(daySd.reduce((a, b) => a + (b.value || 0), 0) / daySd.length) : (data?.sd_avg || 0);

    for (let h = 0; h <= maxHour; h++) {
      const hStr = h < 10 ? `0${h}` : `${h}`;
      const hourLabel = `${hStr}:00`;
      const hourPrefix = `${hStr}:`;

      const ptsC = dayCpu.filter((p) => p.time && p.time.startsWith(hourPrefix));
      const ptsR = dayRam.filter((p) => p.time && p.time.startsWith(hourPrefix));
      const ptsS = daySd.filter((p) => p.time && p.time.startsWith(hourPrefix));

      const vCpu = ptsC.length > 0 ? Math.round(ptsC.reduce((a, b) => a + (b.value || 0), 0) / ptsC.length) : baseCpu;
      const vRam = ptsR.length > 0 ? Math.round(ptsR.reduce((a, b) => a + (b.value || 0), 0) / ptsR.length) : baseRam;
      const vSd = ptsS.length > 0 ? Math.round(ptsS.reduce((a, b) => a + (b.value || 0), 0) / ptsS.length) : baseSd;

      hourlyCpu.push({ displayDate: hourLabel, time: hourLabel, value: vCpu });
      hourlyRam.push({ displayDate: hourLabel, time: hourLabel, value: vRam });
      hourlySd.push({ displayDate: hourLabel, time: hourLabel, value: vSd });
    }

    const calcAvg = (arr: any[]) => Math.round(arr.reduce((acc, x) => acc + (x.value || 0), 0) / arr.length);
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

  // Real SLA 99.5%, Uptime, and Downtime calculation (supports active period & daily filtering)
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
          `${r.day < 10 ? `0${r.day}` : r.day} ${periodInfo.monthStr}`.toLowerCase() === dayTargetStr
        );
      });

      const selDayNum = parseInt(selectedEventDate.split(" ")[0], 10);
      const isToday =
        periodInfo.isCurrentMonth &&
        periodInfo.todayDay !== null &&
        (selDayNum === periodInfo.todayDay || matchedRow?.day === periodInfo.todayDay);
      const currentHour = new Date().getHours();
      const totalObsMin = isToday ? Math.max(60, currentHour * 60) : 1440;
      const totalObsHours = totalObsMin / 60;

      let downMin = matchedRow?.cpu_modem_downtime_min ?? matchedRow?.downtime_min ?? 0;
      if (downMin === 0) {
        const dayEvs = rawEvents.filter((ev: any) =>
          (ev.start_time || "").startsWith(selectedEventDate)
        );
        downMin = dayEvs.reduce((acc: number, ev: any) => acc + (ev.duration_minutes || 0), 0);
      }

      const upMin = Math.max(0, totalObsMin - downMin);
      const uptimePct = Number(((upMin / totalObsMin) * 100).toFixed(1));
      const downtimePct = Number((100 - uptimePct).toFixed(1));

      const slaTargetPct = 99.5;
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
        ? breakdown.filter((r) => r.day >= periodInfo.startDay && r.day <= periodInfo.effectiveDays)
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
      const activeDaysCount = Math.max(1, periodInfo.effectiveDays - periodInfo.startDay + 1);
      totalObsMin = activeDaysCount * 1440;
      totalDownMin = rawEvents.reduce((acc: number, ev: any) => acc + (ev.duration_minutes || 0), 0);
      totalUpMin = Math.max(0, totalObsMin - totalDownMin);
    }

    const totalObsHours = totalObsMin / 60;
    const uptimePct = Number(((totalUpMin / totalObsMin) * 100).toFixed(1));
    const downtimePct = Number((100 - uptimePct).toFixed(1));

    const slaTargetPct = 99.5;
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
          <strong className="text-slate-700 dark:text-slate-200">{gatewayId}</strong> belum tersedia atau gagal dimuat.
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

  // Dynamic Real SLA Calculations (Active period or selected day)
  const isSLAMet = slaCalc.isSLAMet;
  const slaDiffPct = slaCalc.slaDiffPct;
  const periodHoursStr = slaCalc.periodHoursStr;
  const uptimeDurationText = slaCalc.uptimeText;
  const uptimePctNum = slaCalc.uptimePct;
  const downtimeDurationText = slaCalc.downtimeText;
  const downtimePctNum = slaCalc.downtimePct;
  const slaTargetHoursText = slaCalc.slaMinUptimeText;
  const slaDowntimeAllowedText = slaCalc.slaMaxDownText;
  const downtimeDiffText = slaCalc.toleranceText;

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
            Detail Performa Gateway &ndash; {d.location || d.id}
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#00c875]/20 text-[#00a862] dark:text-[#00c875] border border-[#00c875]/30">
            {d.status}
          </span>
        </div>

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

      {/* 2. Top Section: Device Profile & 7 Metric Cards + 3 Line Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 items-stretch">
        {/* Left Column (xl:col-span-3): Device Profile Card */}
        <div className="xl:col-span-3 bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row xl:flex-col gap-3.5 items-center sm:items-start justify-between shadow-xs">
          <div className="flex flex-col items-center justify-center shrink-0 w-full pt-1">
            <SmartBoxIsometricIllustration isWhite={isWhite} />
          </div>

          <div className="flex-1 min-w-0 space-y-1.5 w-full">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide leading-tight truncate" title={d.location}>
                {d.location}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium truncate" title={d.id}>
                {d.id}
              </p>
            </div>

            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 font-normal pt-1">
              <div className="grid grid-cols-[70px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Type</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">: {d.type}</span>
              </div>
              <div className="grid grid-cols-[70px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">CPU</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">: {d.cpu_spec}</span>
              </div>
              <div className="grid grid-cols-[70px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">RAM</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">: {d.ram_spec}</span>
              </div>
              <div className="grid grid-cols-[70px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">SD Card</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">: {d.sd_spec}</span>
              </div>
              <div className="grid grid-cols-[70px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Modem</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">: {d.modem_spec}</span>
              </div>
              <div className="grid grid-cols-[70px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Provider</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">: {d.provider_spec}</span>
              </div>
              <div className="grid grid-cols-[70px_1fr] items-start">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Location</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">: {d.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (xl:col-span-9): 7 KPI Cards & 3 Realtime Trend Charts */}
        <div className="xl:col-span-9 space-y-3 flex flex-col justify-between">
          {/* Top Sub-row: 8 KPI Cards with SLA Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {/* Card 1: Periode & Total Waktu */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                  <Calendar className="size-3" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">Period</span>
              </div>
              <div className="mt-2">
                <div className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight truncate">
                  {selectedEventDate !== "ALL" ? selectedEventDate : periodInfo.effectivePeriodStr}
                </div>
                <div className="text-[9px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                  Total {periodHoursStr}
                </div>
              </div>
            </div>

            {/* Card 2: Accumulated Uptime */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded bg-emerald-500/15 flex items-center justify-center text-[#00a862] dark:text-[#00c875]">
                  <CheckCircle2 className="size-3" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">Accumulated Uptime</span>
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-[#00a862] dark:text-[#00c875] leading-tight font-mono">
                  {uptimeDurationText}
                </div>
                <div className="text-[10px] font-semibold text-[#00a862] dark:text-[#00c875] mt-0.5">
                  {uptimePctNum}%
                </div>
              </div>
            </div>

            {/* Card 3: Accumulated Downtime */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded bg-rose-500/15 flex items-center justify-center text-[#e2445c]">
                  <Clock className="size-3" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">Accumulated Downtime</span>
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-[#e2445c] leading-tight font-mono">
                  {downtimeDurationText}
                </div>
                <div className="text-[10px] font-semibold text-[#e2445c] mt-0.5">
                  {downtimePctNum}%
                </div>
              </div>
            </div>

            {/* Card 4: Target SLA 99.5% */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className={`size-5 rounded flex items-center justify-center ${
                  isSLAMet ? "bg-emerald-500/15 text-[#00a862] dark:text-[#00c875]" : "bg-rose-500/15 text-[#e2445c]"
                }`}>
                  {isSLAMet ? <CheckCircle2 className="size-3" /> : <AlertTriangle className="size-3" />}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">SLA 99.5%</span>
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {uptimePctNum}% <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">/ 99.5%</span>
                </div>
                <div className={`text-[10px] font-bold mt-0.5 truncate ${
                  isSLAMet ? "text-[#00a862] dark:text-[#00c875]" : "text-[#e2445c]"
                }`}>
                  {isSLAMet ? "Achieved" : `Breach (${slaDiffPct}%)`}
                </div>
              </div>
            </div>

            {/* Card 5: Average CPU */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded bg-rose-500/15 flex items-center justify-center text-[#e2445c]">
                  <BarChart2 className="size-3" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">Average CPU</span>
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

            {/* Card 6: Average RAM */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded bg-emerald-500/15 flex items-center justify-center text-[#00a862] dark:text-[#00c875]">
                  <BarChart2 className="size-3" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">Average RAM</span>
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

            {/* Card 7: Storage Usage */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-[#f59e0b]">
                  <TrendingUp className="size-3" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">Storage Usage</span>
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

            {/* Card 8: Storage Health & Temp */}
            <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-[#00d2ff]">
                  <Thermometer className="size-3" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">Health & Temp</span>
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-[#00a862] dark:text-[#00c875] leading-tight">
                  {d.sd_health_status} ({d.sd_life_pct}%)
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {d.temp_avg}°C (Peak {d.temp_max}°C)
                </div>
              </div>
            </div>
          </div>

          {/* Dedicated Panel: Akumulasi Operasional & Pencapaian SLA 99.5% (1 Bulan) */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 space-y-3 shadow-xs">
            {/* Header: Title + SLA Status Badge */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className={`size-6 rounded-md flex items-center justify-center ${
                  isSLAMet ? "bg-emerald-500/15 text-[#00a862] dark:text-[#00c875]" : "bg-rose-500/15 text-[#e2445c]"
                }`}>
                  <Clock className="size-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    Accumulated Operational Uptime & 99.5% SLA Performance
                    <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 hidden sm:inline">
                      ({slaCalc.periodLabel})
                    </span>
                  </h4>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  isSLAMet 
                    ? "bg-[#00c875]/15 text-[#00a862] dark:text-[#00c875] border-[#00c875]/30" 
                    : "bg-[#e2445c]/15 text-rose-600 dark:text-[#e2445c] border-[#e2445c]/30"
                }`}>
                  <span className={`size-1.5 rounded-full ${isSLAMet ? "bg-[#00c875]" : "bg-[#e2445c] animate-pulse"}`} />
                  {isSLAMet ? `SLA 99.5% Achieved (+${slaDiffPct}%)` : `SLA 99.5% Breach (${slaDiffPct}%)`}
                </span>
              </div>
            </div>

            {/* Visual Accumulation Bar with SLA Target Line (99.5%) */}
            <div className="space-y-1.5">
              <div className="relative h-4 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden flex border border-slate-300 dark:border-slate-800">
                {/* Uptime Green Segment */}
                <div 
                  style={{ width: `${uptimePctNum}%` }} 
                  className="h-full bg-linear-to-r from-emerald-600 to-[#00c875] transition-all duration-500"
                  title={`Uptime: ${uptimeDurationText} (${uptimePctNum}%)`}
                />
                {/* Downtime Red Segment */}
                <div 
                  style={{ width: `${downtimePctNum}%` }} 
                  className="h-full bg-linear-to-r from-rose-500 to-[#e2445c] transition-all duration-500"
                  title={`Downtime: ${downtimeDurationText} (${downtimePctNum}%)`}
                />
                {/* SLA 99.5% Target Marker */}
                <div 
                  style={{ left: "99.5%" }} 
                  className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-10 shadow-[0_0_6px_rgba(250,204,21,0.9)]"
                  title="Target SLA 99.5% (Min. 740h 17m)"
                />
              </div>

              {/* Bar Subtitle / Legend */}
              <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-[#00c875]" />
                    Total Uptime: <strong className="text-slate-900 dark:text-emerald-400 font-mono">{uptimeDurationText}</strong> ({uptimePctNum}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-[#e2445c]" />
                    Total Downtime: <strong className="text-slate-900 dark:text-rose-400 font-mono">{downtimeDurationText}</strong> ({downtimePctNum}%)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-yellow-400 font-medium">
                  <span className="w-2.5 h-0.5 bg-yellow-400 inline-block" />
                  Target SLA: 99.5% (Min. {slaTargetHoursText} &bull; Max Downtime Tolerance {slaDowntimeAllowedText})
                </div>
              </div>
            </div>

            {/* 4 Detail Metric Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200 dark:border-slate-800/60">
              <div className="bg-white dark:bg-[#070e1c] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-2xs">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Observation Period</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">{periodHoursStr}</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400">
                  {selectedEventDate !== "ALL" ? "24 hours observation" : `${periodInfo.effectiveDays - periodInfo.startDay + 1} active days \u00d7 24h`}
                </span>
              </div>

              <div className="bg-white dark:bg-[#070e1c] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-2xs">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Accumulated Uptime</span>
                <span className="text-xs font-bold text-[#00a862] dark:text-[#00c875] font-mono mt-0.5 block">
                  {uptimeDurationText} ({uptimePctNum}%)
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400">Target Min: {slaTargetHoursText}</span>
              </div>

              <div className="bg-white dark:bg-[#070e1c] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-2xs">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Accumulated Downtime</span>
                <span className={`text-xs font-bold font-mono mt-0.5 block ${isSLAMet ? "text-slate-700 dark:text-slate-300" : "text-[#e2445c]"}`}>
                  {downtimeDurationText} ({downtimePctNum}%)
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400">Max Limit: {slaDowntimeAllowedText}</span>
              </div>

              <div className="bg-white dark:bg-[#070e1c] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-2xs">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">SLA Status & Tolerance</span>
                <span className={`text-xs font-bold font-mono mt-0.5 block ${isSLAMet ? "text-[#00a862] dark:text-[#00c875]" : "text-[#e2445c]"}`}>
                  {isSLAMet ? `Achieved (+${slaDiffPct}%)` : `Deficit ${slaDiffPct}%`}
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 truncate block" title={downtimeDiffText}>
                  {downtimeDiffText}
                </span>
              </div>
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
                  {dayStats.isDaySelected ? `(Hourly Trend • Range: 00:00 - ${dayStats.maxHourLabel || "23:00"})` : `(Daily Average Overview)`}
                </span>
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Filter Day:</span>
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
              <span className="font-bold text-slate-900 dark:text-white">CPU Usage (%)</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Avg: <strong className="text-slate-900 dark:text-white">{dayStats.cpuAvg}%</strong> | Peak: {dayStats.cpuMax}%
              </span>
            </div>
            <div className="h-36 w-full mt-1.5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredCpuTrend} margin={{ top: 5, right: 12, left: -22, bottom: 0 }}>
                  <XAxis dataKey="displayDate" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={{ stroke: "#94a3b8" }} tickLine={false} />
                  <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomChartTooltip unit="%" color="#00c875" />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#00c875"
                    strokeWidth={2}
                    dot={filteredCpuTrend.length <= 25 ? { r: 2.5, fill: "#00c875" } : false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: RAM Usage */}
          <div className="bg-white dark:bg-[#070e1d] border border-slate-200/90 dark:border-slate-800/80 rounded-xl p-3 shadow-2xs">
            <div className="flex items-center justify-between pb-1.5 text-xs">
              <span className="font-bold text-slate-900 dark:text-white">RAM Usage (%)</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Avg: <strong className="text-[#00a862] dark:text-[#00c875]">{dayStats.ramAvg}%</strong> | Peak: {dayStats.ramMax}%
              </span>
            </div>
            <div className="h-36 w-full mt-1.5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredRamTrend} margin={{ top: 5, right: 12, left: -22, bottom: 0 }}>
                  <XAxis dataKey="displayDate" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={{ stroke: "#94a3b8" }} tickLine={false} />
                  <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomChartTooltip unit="%" color="#f59e0b" />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={filteredRamTrend.length <= 25 ? { r: 2.5, fill: "#f59e0b" } : false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Storage Usage (Disk /) */}
          <div className="bg-white dark:bg-[#070e1d] border border-slate-200/90 dark:border-slate-800/80 rounded-xl p-3 shadow-2xs">
            <div className="flex items-center justify-between pb-1.5 text-xs">
              <span className="font-bold text-slate-900 dark:text-white">Storage Usage (Disk /) (%)</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Avg: <strong className="text-[#0073ea] dark:text-[#38bdf8]">{dayStats.sdAvg}%</strong> | Peak: {dayStats.sdMax}%
              </span>
            </div>
            <div className="h-36 w-full mt-1.5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredStorageTrend} margin={{ top: 5, right: 12, left: -22, bottom: 0 }}>
                  <XAxis dataKey="displayDate" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={{ stroke: "#94a3b8" }} tickLine={false} />
                  <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomChartTooltip unit="%" color="#0073ea" />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#0073ea"
                    strokeWidth={2}
                    dot={filteredStorageTrend.length <= 25 ? { r: 2.5, fill: "#0073ea" } : false}
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
