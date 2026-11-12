"use client";

import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  Clock,
  Activity,
  Award,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Server,
  Video,
  Wifi,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  useSLAReportGatewayDetail,
  ISLAReportGatewayDetail,
} from "@/store/api/monitoring";
import { SmartBoxIsometricIllustration } from "@/components/ui/SmartBoxIllustration";
import { parseReportPeriod, MONTH_NAMES } from "@/lib/reportPeriodUtils";

interface SLAReportDetailCardProps {
  gatewayId: string | null;
  dateRange?: string;
  onClose?: () => void;
}

const formatDurationEn = (dur?: string) => {
  if (!dur) return "-";
  return dur
    .replace(/menit/gi, "m")
    .replace(/jam/gi, "h")
    .replace(/detik/gi, "s")
    .trim();
};

export const SLAReportDetailCard: React.FC<SLAReportDetailCardProps> = ({
  gatewayId,
  dateRange,
  onClose,
}) => {
  const { data: detailData, isLoading } = useSLAReportGatewayDetail(
    gatewayId,
    dateRange,
  );

  const [selectedEventDate, setSelectedEventDate] = useState<string>("ALL");
  const [selectedBarDay, setSelectedBarDay] = useState<number | null>(null);
  const [hoveredDay, setHoveredDay] = useState<any | null>(null);

  // Parse active date range / period
  const periodInfo = useMemo(() => {
    return parseReportPeriod(dateRange);
  }, [dateRange]);

  const d = detailData;

  const isWhite = useMemo(() => {
    const t = (d?.type || "").toLowerCase();
    return t.includes("white") || t.includes("putih");
  }, [d?.type]);

  const rawEvents = useMemo(() => {
    return (d?.trouble_events as any[]) || [];
  }, [d?.trouble_events]);

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

  const dailyStatusList = useMemo(() => {
    const { daysInMonth, monthStr, yearStr, todayDay, isCurrentMonth } =
      periodInfo;
    const breakdown = (d?.daily_breakdown as any[]) || [];
    const minActiveDay =
      breakdown.length > 0
        ? Math.max(periodInfo.startDay, breakdown[0].day)
        : periodInfo.startDay;
    const minDay = minActiveDay;
    const maxDay = periodInfo.endDay;

    const totalDays = Math.max(daysInMonth, maxDay);
    const list = [];
    for (let day = 1; day <= totalDays; day++) {
      const dayNumStr = day < 10 ? `0${day}` : `${day}`;
      const dateKey = `${dayNumStr} ${monthStr}`;
      const fullDate = `${dayNumStr} ${monthStr} ${yearStr}`;

      const daySla = breakdown.find(
        (r) => r.day === day || r.date?.startsWith(dayNumStr),
      );
      const isInRange = day >= minDay && day <= maxDay;
      const isFutureDate = Boolean(
        isCurrentMonth && todayDay && day > todayDay,
      );
      const hasBar = isInRange && !isFutureDate && (breakdown.length === 0 || Boolean(daySla));
      const isToday = Boolean(isCurrentMonth && todayDay && day === todayDay);
      const isYesterday = Boolean(
        isCurrentMonth && todayDay && day === todayDay - 1,
      );

      let status: "online" | "offline" | "future" = !hasBar
        ? "future"
        : "online";
      let uptimePct = 100;
      let downtimePct = 0;
      let totalDurationStr = "0m";
      let uptimeDurationStr = "24h 00m";

      if (hasBar) {
        if (daySla) {
          const downMin = daySla.downtime_min ?? 0;
          const upMin = daySla.uptime_min ?? 1440;
          const sr = daySla.success_rate ?? 100;

          const totalObs = upMin + downMin;
          if (totalObs > 0) {
            uptimePct = Number(((upMin / totalObs) * 100).toFixed(2));
            downtimePct = Number(((downMin / totalObs) * 100).toFixed(2));
          } else {
            uptimePct = Number(sr.toFixed(2));
            downtimePct = Number((100 - uptimePct).toFixed(2));
          }

          uptimeDurationStr = `${Math.floor(upMin / 60)}h ${Math.round(upMin % 60).toString().padStart(2, "0")}m`;
          totalDurationStr = downMin > 0 ? `${Math.floor(downMin / 60)}h ${Math.round(downMin % 60).toString().padStart(2, "0")}m` : "0m";

          if (uptimePct < 98.0) {
            status = "offline";
          } else {
            status = "online";
          }
        } else {
          status = "online";
          uptimePct = 100;
          downtimePct = 0;
          totalDurationStr = "0m";
          uptimeDurationStr = "24h 00m";
        }
      }

      list.push({
        day,
        dateKey,
        fullDate,
        hasBar,
        status,
        uptimePct,
        downtimePct,
        totalDurationStr,
        uptimeDurationStr,
        isToday,
        isYesterday,
      });
    }

    return list;
  }, [d?.daily_breakdown, periodInfo]);

  const displayedDailyRecords = useMemo(() => {
    const valid = dailyStatusList.filter((item) => item.hasBar);
    if (selectedBarDay) {
      return valid.filter((item) => item.day === selectedBarDay);
    }
    return [...valid].reverse();
  }, [dailyStatusList, selectedBarDay]);

  // SLA 99.5% calculation
  const slaCalc = useMemo(() => {
    const isDayFiltered = selectedEventDate !== "ALL";
    const breakdown = (d?.daily_breakdown as any[]) || [];

    const fmtHM = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = Math.round(mins % 60);
      return `${h}h ${m.toString().padStart(2, "0")}m`;
    };

    if (isDayFiltered) {
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

      let downMin = matchedRow?.downtime_min ?? 0;
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

    // ALL (Active Period)
    const activeDaysCount = Math.max(
      1,
      periodInfo.effectiveDays - periodInfo.startDay + 1,
    );
    const totalObsMin = activeDaysCount * 1440;
    const totalObsHours = totalObsMin / 60;

    const actualSlaUptime = d?.sla_uptime_pct ?? 100.0;
    const actualFailPct = d?.sla_failure_rate_pct ?? (100.0 - actualSlaUptime);

    const totalDownMin = totalObsMin * (actualFailPct / 100);
    const totalUpMin = Math.max(0, totalObsMin - totalDownMin);

    const slaTargetPct = 99.5;
    const minUptimeMin = totalObsMin * (slaTargetPct / 100);
    const maxDownMin = totalObsMin * ((100 - slaTargetPct) / 100);

    const isMet = actualSlaUptime >= slaTargetPct;
    const diffPct = Number((actualSlaUptime - slaTargetPct).toFixed(2));

    const downDiffMin = totalDownMin - maxDownMin;
    const toleranceText =
      downDiffMin > 0
        ? `Downtime exceeded tolerance limit by ${fmtHM(downDiffMin)}`
        : `Downtime within tolerance limit (${fmtHM(Math.abs(downDiffMin))} remaining)`;

    return {
      isDayFiltered: false,
      periodLabel: `${periodInfo.effectivePeriodStr} (${totalObsHours.toFixed(0)} Hours Active)`,
      periodHoursStr: `${totalObsHours.toFixed(0)} Hours`,
      uptimeText: fmtHM(totalUpMin),
      uptimePct: actualSlaUptime,
      downtimeText: fmtHM(totalDownMin),
      downtimePct: actualFailPct,
      slaTargetPct,
      slaMinUptimeText: fmtHM(minUptimeMin),
      slaMaxDownText: fmtHM(maxDownMin),
      isSLAMet: isMet,
      slaDiffPct: diffPct >= 0 ? `+${diffPct}` : `${diffPct}`,
      toleranceText,
    };
  }, [d?.sla_uptime_pct, d?.sla_failure_rate_pct, d?.daily_breakdown, rawEvents, selectedEventDate, periodInfo]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (selectedEventDate === "ALL") return rawEvents;
    const target = selectedEventDate.trim().toLowerCase();
    return rawEvents.filter((ev: any) => {
      const st = (ev.start_time || "").trim().toLowerCase();
      const dt = (ev.date_str || "").trim().toLowerCase();
      return st.startsWith(target) || dt.startsWith(target);
    });
  }, [rawEvents, selectedEventDate]);

  if (isLoading || !d) {
    return (
      <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="size-8 text-[#0073ea] animate-spin" />
        <span className="text-xs font-semibold text-slate-500">
          Loading SLA Gateway Telemetry...
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 space-y-3.5 font-sans transition-all duration-300">
      {/* 1. Header Bar: Title, Close Button */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Award className="size-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Detail Device &ndash; {d.location || d.id}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

      {/* 2. Top Section: Device Profile & 4 KPI Cards */}
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
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium truncate">
                {d.id}
              </p>
            </div>

            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 font-normal pt-1">
              <div className="grid grid-cols-[75px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Type</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">
                  : {d.type}
                </span>
              </div>
              <div className="grid grid-cols-[75px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Hardware</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">
                  : {d.hardware_model || "Dusun DSGW-10"}
                </span>
              </div>
              <div className="grid grid-cols-[75px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Customer</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate" title={d.customer || "-"}>
                  : {d.customer || "-"}
                </span>
              </div>
              <div className="grid grid-cols-[75px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Period</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">
                  : {periodInfo.effectivePeriodStr}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (xl:col-span-9): 4 Comprehensive KPI Scorecards */}
        <div className="xl:col-span-9 space-y-3 flex flex-col justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Card 1: Total SLA Uptime */}
            <div className="bg-purple-500/[0.04] dark:bg-purple-950/20 border border-purple-300 dark:border-purple-800/60 rounded-xl p-3 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                  Overall SLA Uptime
                </span>
                <Award className="size-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
                  {d.sla_uptime_pct.toFixed(2)}%
                </div>
                <div className="flex items-center justify-between text-[10px] font-semibold mt-1">
                  <span className="text-rose-500">
                    Fail: {d.sla_failure_rate_pct.toFixed(2)}%
                  </span>
                  <span className={d.meets_sla ? "text-emerald-500" : "text-rose-500"}>
                    {d.meets_sla ? "Achieved (≥98%)" : "Not Achieved (<98%)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Smartbox Uptime */}
            <div className="bg-blue-500/[0.04] dark:bg-blue-950/20 border border-blue-300 dark:border-blue-800/60 rounded-xl p-3 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                  Smartbox System
                </span>
                <Server className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                  {d.smartbox_uptime_pct.toFixed(1)}%
                </div>
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  <span>Status: <strong className={d.smartbox_status === "Online" ? "text-emerald-500" : "text-rose-500"}>{d.smartbox_status}</strong></span>
                  <span className="font-mono">{formatDurationEn(d.smartbox_uptime_duration)}</span>
                </div>
              </div>
            </div>

            {/* Card 3: DVR Uptime */}
            <div className="bg-emerald-500/[0.04] dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800/60 rounded-xl p-3 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                  DVR / Surveillance
                </span>
                <Video className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {d.dvr_uptime_pct.toFixed(1)}%
                </div>
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  <span>Status: <strong className={d.dvr_status === "Online" || d.dvr_status === "Working" ? "text-emerald-500" : "text-rose-500"}>{d.dvr_status}</strong></span>
                  <span className="font-mono">{formatDurationEn(d.dvr_uptime_duration)}</span>
                </div>
              </div>
            </div>

            {/* Card 4: Network / Cellular Uptime */}
            <div className="bg-cyan-500/[0.04] dark:bg-cyan-950/20 border border-cyan-300 dark:border-cyan-800/60 rounded-xl p-3 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-cyan-700 dark:text-cyan-300 uppercase tracking-wide">
                  Network Connection
                </span>
                <Wifi className="size-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
                  {d.network_uptime_pct.toFixed(1)}%
                </div>
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  <span>Status: <strong className={d.network_status === "Online" || d.network_status === "Working" ? "text-emerald-500" : "text-rose-500"}>{d.network_status}</strong></span>
                  <span className="font-mono">{formatDurationEn(d.network_uptime_duration)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Daily SLA Breakdown / 31-Day Timeline Bar */}
      <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-purple-500" />
            <span className="font-bold text-slate-900 dark:text-white">
              Daily SLA Timeline ({periodInfo.monthStr} {periodInfo.yearStr})
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-semibold">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="size-2 rounded-full bg-[#00c875]" />
              <span>Achieved (≥98%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="size-2 rounded-full bg-[#e2445c]" />
              <span>Not Achieved (&lt;98%)</span>
            </div>
          </div>
        </div>

        {/* 31-day Interactive Bar */}
        <div
          className="grid gap-1 pt-1 pb-1"
          style={{
            gridTemplateColumns: `repeat(${dailyStatusList.length}, minmax(0, 1fr))`,
          }}
        >
          {dailyStatusList.map((item) => {
            const isSelected = selectedBarDay === item.day;
            let barColor =
              "bg-slate-200 dark:bg-slate-800 cursor-not-allowed opacity-40";
            if (item.hasBar) {
              if (item.uptimePct >= 98.0)
                barColor = "bg-[#00c875] hover:brightness-110";
              else barColor = "bg-[#e2445c] hover:brightness-110";
            }

            return (
              <div
                key={item.day}
                onClick={() =>
                  item.hasBar && handleSelectDay(item.day, item.dateKey)
                }
                onMouseEnter={() => item.hasBar && setHoveredDay(item)}
                onMouseLeave={() => setHoveredDay(null)}
                className={`group relative flex flex-col items-center justify-end h-10 rounded transition-all cursor-pointer ${
                  isSelected ? "ring-2 ring-purple-500 ring-offset-1" : ""
                }`}
              >
                <div className={`w-full rounded h-7 ${barColor}`} />
                <span className="text-[9px] font-mono text-slate-400 mt-1">
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>

        {/* Tooltip info under hover or selected day */}
        {(hoveredDay || selectedBarDay) && (
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg flex items-center justify-between">
            <span>
              Date:{" "}
              <strong>
                {(
                  hoveredDay ||
                  dailyStatusList.find((x) => x.day === selectedBarDay)
                )?.fullDate}
              </strong>
            </span>
            <span>
              Uptime:{" "}
              <strong>
                {(
                  hoveredDay ||
                  dailyStatusList.find((x) => x.day === selectedBarDay)
                )?.uptimePct}
                %
              </strong>
            </span>
            <span>
              Downtime:{" "}
              <strong>
                {(
                  hoveredDay ||
                  dailyStatusList.find((x) => x.day === selectedBarDay)
                )?.totalDurationStr}
              </strong>
            </span>
          </div>
        )}

        {/* Daily SLA Table List directly underneath timeline */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Daily SLA Records{" "}
              {selectedEventDate !== "ALL"
                ? `(Filtered: ${selectedEventDate})`
                : `(${periodInfo.monthStr} ${periodInfo.yearStr})`}
            </span>
            {selectedEventDate !== "ALL" && (
              <button
                type="button"
                onClick={() => handleSelectDay(null)}
                className="text-[11px] font-semibold text-[#0073ea] hover:underline cursor-pointer"
              >
                Reset to All Days
              </button>
            )}
          </div>

          <div className="overflow-x-auto max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-500 font-semibold sticky top-0 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3 text-center">SLA Uptime %</th>
                  <th className="py-2 px-3 text-right">Uptime Duration</th>
                  <th className="py-2 px-3 text-right">Downtime</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {displayedDailyRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400">
                      No records available for this period.
                    </td>
                  </tr>
                ) : (
                  displayedDailyRecords.map((r) => {
                    const isMet = r.uptimePct >= 98.0;
                    return (
                      <tr
                        key={r.day}
                        className={`hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
                          selectedBarDay === r.day
                            ? "bg-blue-50/70 dark:bg-blue-950/30"
                            : ""
                        }`}
                        onClick={() => handleSelectDay(r.day, r.dateKey)}
                      >
                        <td className="py-1.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                          {r.fullDate}{" "}
                          {r.isYesterday ? (
                            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold ml-1.5 px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60">
                              Yesterday
                            </span>
                          ) : r.isToday ? (
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold ml-1.5 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60">
                              Today
                            </span>
                          ) : null}
                        </td>
                        <td className="py-1.5 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded font-mono text-[11px] font-bold ${
                              isMet
                                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                                : "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300"
                            }`}
                          >
                            {r.uptimePct.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                          {r.uptimeDurationStr}
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-rose-500 font-semibold">
                          {r.totalDurationStr}
                        </td>
                        <td className="py-1.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              isMet
                                ? "bg-[#00c875]/15 text-[#00a862] dark:text-[#00c875] border-[#00c875]/25"
                                : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25"
                            }`}
                          >
                            {isMet ? "Achieved" : "Not Achieved"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Trouble Incident Log Table */}
      <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-amber-500" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
              Incident & Trouble History ({filteredEvents.length} Events)
            </h4>
          </div>

          <div className="flex items-center gap-2">
            {selectedEventDate !== "ALL" && (
              <button
                onClick={() => handleSelectDay(null)}
                className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
              >
                Show All Days
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-500 font-semibold sticky top-0 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2 px-3 w-12 text-center">No</th>
                <th className="py-2 px-3">Timestamp / Date</th>
                <th className="py-2 px-3">Component / Metric</th>
                <th className="py-2 px-3">Event Description</th>
                <th className="py-2 px-3 text-right">Duration</th>
                <th className="py-2 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    Normal Operation &ndash; No incidents recorded for this period.
                  </td>
                </tr>
              ) : (
                filteredEvents.slice(0, 50).map((ev: any, idx: number) => {
                  const metricStr = (ev.metric || ev.category || "Gateway").toLowerCase();
                  let metricBadge = "bg-blue-500/10 text-blue-600 border-blue-500/20";
                  if (metricStr.includes("dvr") || metricStr.includes("camera") || metricStr.includes("rec")) {
                    metricBadge = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
                  } else if (metricStr.includes("cell") || metricStr.includes("net") || metricStr.includes("modem")) {
                    metricBadge = "bg-cyan-500/10 text-cyan-600 border-cyan-500/20";
                  }

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="py-2 px-3 text-center text-slate-400 font-mono">
                        {ev.no || idx + 1}
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        {ev.start_time || ev.date_str || "-"}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${metricBadge}`}>
                          {ev.category || ev.metric || "Gateway"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-800 dark:text-slate-200 font-medium">
                        {ev.description || ev.reason || "Incident detected"}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-rose-500">
                        {formatDurationEn(ev.duration || ev.value || "0m")}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 border border-emerald-500/25">
                          {ev.status || "Resolved"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
