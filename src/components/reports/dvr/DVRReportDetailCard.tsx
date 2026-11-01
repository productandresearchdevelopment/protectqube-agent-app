"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import {
  useDVRReportGatewayDetail,
  IDVRReportGatewayDetail,
} from "@/store/api/monitoring";
import { SmartBoxIsometricIllustration } from "@/components/ui/SmartBoxIllustration";

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
  const [hoveredDay, setHoveredDay] = useState<{
    day: number;
    dayNumStr: string;
    dateKey: string;
    fullDate: string;
    gwStatus: "online" | "offline" | "degraded";
    cellStatus: "online" | "offline" | "degraded";
    dvrStatus: "online" | "offline" | "degraded";
    eventsCount: number;
    isToday: boolean;
  } | null>(null);

  // Generate 31 daily status points for Gateway, Cellular, and DVR
  const dailyMultiTrack = useMemo(() => {
    const daysInMonth = 31;
    const monthStr = "Oct";
    const yearStr = "2026";
    const todayDay = 31;

    const events = data?.trouble_events || [];

    const list = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayNumStr = day < 10 ? `0${day}` : `${day}`;
      const dateKey = `${dayNumStr} ${monthStr}`;
      const fullDate = `${dayNumStr} ${monthStr} ${yearStr}`;

      const dayEvents = events.filter((ev) => {
        const trimmed = (ev.start_time || "").trim();
        return trimmed.startsWith(dateKey) || trimmed.startsWith(`${day} ${monthStr}`);
      });

      // Status per track
      let gwStatus: "online" | "offline" | "degraded" = "online";
      let cellStatus: "online" | "offline" | "degraded" = "online";
      let dvrStatus: "online" | "offline" | "degraded" = "online";

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

      // If gateway is down, all downstream are impacted
      if (gwStatus === "offline") {
        cellStatus = "offline";
        dvrStatus = "offline";
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
      });
    }

    return list;
  }, [data?.trouble_events]);

  // Unique dates for trouble event filter dropdown
  const uniqueDates = useMemo(() => {
    const set = new Set<string>();
    (data?.trouble_events || []).forEach((ev) => {
      const parts = ev.start_time.trim().split(" ");
      if (parts.length >= 2) {
        set.add(`${parts[0]} ${parts[1]}`);
      }
    });
    return Array.from(set);
  }, [data?.trouble_events]);

  // Filter trouble events by selected date
  const filteredEvents = useMemo(() => {
    if (!data?.trouble_events) return [];
    if (selectedEventDate === "ALL") {
      return data.trouble_events;
    }
    return data.trouble_events.filter((ev) => ev.start_time.startsWith(selectedEventDate));
  }, [data?.trouble_events, selectedEventDate]);

  if (!gatewayId) return null;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <div className="size-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Memuat data performa DVR/NVR...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-[#070e1d] rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
        Data performa DVR untuk gateway {gatewayId} tidak ditemukan.
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
            Detail Performa Gateway &ndash; {d.location || d.id}
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#00c875]/15 dark:bg-[#00c875]/20 text-[#00c875] border border-[#00c875]/30">
            {d.status}
          </span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Tutup Detail"
          >
            <X className="size-4" />
          </button>
        )}
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
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Tipe</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">: {d.type}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">DVR/NVR</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">: {d.dvr_model}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Jumlah Kamera</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium">: {d.kamera_channels}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Kapasitas HDD</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium">: {d.storage_capacity}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-start">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Lokasi</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">: {d.location}</span>
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
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Periode</span>
            </div>
            <div className="mt-2.5">
              <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {d.period}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                {d.period_hours}
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
                {d.cpu_dvr_uptime}
              </div>
              <div className="text-[11px] font-semibold text-[#00c875] mt-0.5">
                {d.cpu_dvr_uptime_pct}
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
                {d.cpu_dvr_offline}
              </div>
              <div className="text-[11px] font-semibold text-[#e2445c] mt-0.5">
                {d.cpu_dvr_offline_pct}
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
                {d.success_rate}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {d.success_rate_checks}
              </div>
            </div>
          </div>

          {/* Card 5: Total Gangguan */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-amber-500/15 flex items-center justify-center text-[#f59e0b]">
                <AlertCircle className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Total Gangguan</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#f59e0b] leading-tight">
                {d.trouble_events?.length || 0} event
              </div>
            </div>
          </div>

          {/* Card 6: Recording Uptime */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-rose-500/15 flex items-center justify-center text-[#e2445c]">
                <Disc className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Recording Uptime</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#e2445c] leading-tight">
                {d.rec_uptime}
              </div>
              <div className="text-[11px] font-semibold text-[#e2445c] mt-0.5">
                {d.rec_uptime_pct}
              </div>
            </div>
          </div>

          {/* Card 7: Tidak Merekam */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-amber-500/15 flex items-center justify-center text-[#f59e0b]">
                <Pause className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Tidak Merekam</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#f59e0b] leading-tight">
                {d.rec_tidak_merekam}
              </div>
              <div className="text-[11px] font-semibold text-[#f59e0b] mt-0.5">
                {d.rec_tidak_merekam_pct}
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
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Kamera</span>
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

      {/* 3. Bottom Section: Multi-Track Timeline Status & Riwayat Gangguan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left Column (lg:col-span-6): Multi-Track Timeline (Gateway, Cellular, DVR) with All 31 Days */}
        <div className="lg:col-span-6 bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            {/* Header with Title & Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Timeline Status ({d.period})
                </h4>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  31 Hari
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
                  Hari Ini
                </span>
              </div>
            </div>

            {/* 31-Day Multi-Track Timeline Matrix Card */}
            <div className="mt-3.5 p-3.5 rounded-xl bg-white dark:bg-[#070e1d] border border-slate-200/90 dark:border-slate-800/80 shadow-xs space-y-2">
              {/* RULER / HEADER TANGGAL DI ATAS */}
              <div className="flex items-center gap-2">
                <div className="w-16 shrink-0 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Track
                </div>
                <div className="flex-1 grid grid-cols-31 gap-0.5 sm:gap-1">
                  {dailyMultiTrack.map((item) => (
                    <div
                      key={item.day}
                      onClick={() => {
                        if (selectedEventDate === item.dateKey) {
                          setSelectedEventDate("ALL");
                        } else {
                          setSelectedEventDate(item.dateKey);
                        }
                      }}
                      onMouseEnter={() => setHoveredDay(item)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className="text-center cursor-pointer select-none"
                      title={item.fullDate}
                    >
                      <span
                        className={`text-[9px] font-mono block leading-none transition-all ${
                          item.isToday
                            ? "font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/20 px-0.5 py-0.5 rounded ring-1 ring-blue-500/50 scale-110 shadow-xs"
                            : selectedEventDate === item.dateKey
                            ? "font-bold text-amber-500 dark:text-amber-400"
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
                <div className="flex-1 grid grid-cols-31 gap-0.5 sm:gap-1">
                  {dailyMultiTrack.map((item) => (
                    <div
                      key={item.day}
                      onClick={() => {
                        if (selectedEventDate === item.dateKey) {
                          setSelectedEventDate("ALL");
                        } else {
                          setSelectedEventDate(item.dateKey);
                        }
                      }}
                      onMouseEnter={() => setHoveredDay(item)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`h-5.5 rounded-xs cursor-pointer transition-all ${
                        item.gwStatus === "offline"
                          ? "bg-[#e2445c] hover:bg-[#ff4d6d]"
                          : "bg-[#00c875] hover:bg-[#05e287]"
                      } ${
                        item.isToday
                          ? "ring-1.5 ring-blue-500 shadow-xs"
                          : ""
                      } ${
                        selectedEventDate === item.dateKey
                          ? "ring-2 ring-amber-400 scale-105"
                          : "hover:scale-105"
                      }`}
                      title={`Gateway ${item.dayNumStr} Oct: ${item.gwStatus === "offline" ? "Offline" : "Online"}`}
                    />
                  ))}
                </div>
              </div>

              {/* TRACK 2: CELLULAR */}
              <div className="flex items-center gap-2">
                <div className="w-16 shrink-0 text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                  Cellular
                </div>
                <div className="flex-1 grid grid-cols-31 gap-0.5 sm:gap-1">
                  {dailyMultiTrack.map((item) => (
                    <div
                      key={item.day}
                      onClick={() => {
                        if (selectedEventDate === item.dateKey) {
                          setSelectedEventDate("ALL");
                        } else {
                          setSelectedEventDate(item.dateKey);
                        }
                      }}
                      onMouseEnter={() => setHoveredDay(item)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`h-5.5 rounded-xs cursor-pointer transition-all ${
                        item.cellStatus === "offline"
                          ? "bg-[#e2445c] hover:bg-[#ff4d6d]"
                          : "bg-[#00c875] hover:bg-[#05e287]"
                      } ${
                        item.isToday
                          ? "ring-1.5 ring-blue-500 shadow-xs"
                          : ""
                      } ${
                        selectedEventDate === item.dateKey
                          ? "ring-2 ring-amber-400 scale-105"
                          : "hover:scale-105"
                      }`}
                      title={`Cellular ${item.dayNumStr} Oct: ${item.cellStatus === "offline" ? "Offline" : "Online"}`}
                    />
                  ))}
                </div>
              </div>

              {/* TRACK 3: DVR */}
              <div className="flex items-center gap-2">
                <div className="w-16 shrink-0 text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                  DVR
                </div>
                <div className="flex-1 grid grid-cols-31 gap-0.5 sm:gap-1">
                  {dailyMultiTrack.map((item) => (
                    <div
                      key={item.day}
                      onClick={() => {
                        if (selectedEventDate === item.dateKey) {
                          setSelectedEventDate("ALL");
                        } else {
                          setSelectedEventDate(item.dateKey);
                        }
                      }}
                      onMouseEnter={() => setHoveredDay(item)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`h-5.5 rounded-xs cursor-pointer transition-all ${
                        item.dvrStatus === "offline"
                          ? "bg-[#e2445c] hover:bg-[#ff4d6d]"
                          : "bg-[#00c875] hover:bg-[#05e287]"
                      } ${
                        item.isToday
                          ? "ring-1.5 ring-blue-500 shadow-xs"
                          : ""
                      } ${
                        selectedEventDate === item.dateKey
                          ? "ring-2 ring-amber-400 scale-105"
                          : "hover:scale-105"
                      }`}
                      title={`DVR ${item.dayNumStr} Oct: ${item.dvrStatus === "offline" ? "Offline" : "Online"}`}
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
                          Hari Ini
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
                      Cellular:{" "}
                      <strong className={hoveredDay.cellStatus === "offline" ? "text-[#e2445c]" : "text-[#00c875]"}>
                        {hoveredDay.cellStatus === "offline" ? "Offline" : "Online"}
                      </strong>
                      {" | "}
                      DVR:{" "}
                      <strong className={hoveredDay.dvrStatus === "offline" ? "text-[#e2445c]" : "text-[#00c875]"}>
                        {hoveredDay.dvrStatus === "offline" ? "Offline" : "Online"}
                      </strong>
                      {hoveredDay.eventsCount > 0 && ` (${hoveredDay.eventsCount} event gangguan)`}
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between w-full">
                    <span>Arahkan kursor atau klik tanggal (01 - 31) untuk memfilter detail gangguan.</span>
                    {selectedEventDate !== "ALL" && (
                      <button
                        onClick={() => setSelectedEventDate("ALL")}
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

        {/* Right Column (lg:col-span-6): Riwayat Gangguan Table with Date Selector & Scrollable 10 Rows */}
        <div className="lg:col-span-6 bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Riwayat Gangguan
                </h4>
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                  {filteredEvents.length} event
                </span>
              </div>

              {/* Date Selector Dropdown for Daily Filtering */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Filter Tanggal:</span>
                <select
                  value={selectedEventDate}
                  onChange={(e) => setSelectedEventDate(e.target.value)}
                  className="text-xs font-medium bg-white dark:bg-[#070e1d] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs"
                >
                  <option value="ALL">Semua Tanggal ({(d.trouble_events || []).length})</option>
                  {uniqueDates.map((dateStr) => {
                    const count = (d.trouble_events || []).filter((e) => e.start_time.startsWith(dateStr)).length;
                    return (
                      <option key={dateStr} value={dateStr}>
                        {dateStr} ({count} event)
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Scrollable Compact Table (max 10 rows visible) */}
            <div className="overflow-x-auto mt-2 max-h-87.5 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-[#0a1224] shadow-xs">
                  <tr className="text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/60 font-semibold">
                    <th className="py-2 px-2 text-center w-8">No.</th>
                    <th className="py-2 px-3">Mulai</th>
                    <th className="py-2 px-3">Selesai</th>
                    <th className="py-2 px-3 text-center">Durasi</th>
                    <th className="py-2 px-3">Kategori</th>
                    <th className="py-2 px-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40 text-[11px]">
                  {filteredEvents.map((event, idx) => (
                    <tr
                      key={event.no || idx}
                      className="hover:bg-slate-100/80 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-2 px-2 text-center text-slate-500 dark:text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                        {event.start_time}
                      </td>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                        {event.end_time}
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-[#f59e0b] whitespace-nowrap">
                        {event.duration}
                      </td>
                      <td className="py-2 px-3 text-slate-800 dark:text-slate-200 font-medium whitespace-nowrap">
                        {event.category}
                      </td>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300 truncate max-w-42.5" title={event.description}>
                        {event.description}
                      </td>
                    </tr>
                  ))}
                  {filteredEvents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500 dark:text-slate-400 text-xs">
                        Tidak ada riwayat gangguan pada tanggal yang dipilih.
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
  );
};
