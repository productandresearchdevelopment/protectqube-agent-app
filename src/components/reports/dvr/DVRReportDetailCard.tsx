"use client";

import React, { useState } from "react";
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
  Info,
  ChevronDown,
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
  const [timelineStatusFilter, setTimelineStatusFilter] = useState("Semua Status");
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  if (!gatewayId) return null;

  const isZH72 = gatewayId === "ZH72";
  const d: IDVRReportGatewayDetail = data || {
    id: gatewayId,
    status: "Online",
    location: isZH72 ? "Alfa H Sapri Pondok Aren" : "IDM Graha Morris Tambun",
    type: isZH72 ? "SmartBox Hitam" : "SmartBox Putih",
    dvr_model: isZH72 ? "Hikvision DS-7616NI" : "Dahua NVRS216",
    kamera_channels: "4 Channel",
    storage_capacity: "4 TB",
    period: dateRange || "01 Oct 2026 - 31 Oct 2026",
    period_hours: "(744 jam)",
    cpu_dvr_uptime: "720h 15m",
    cpu_dvr_uptime_pct: "96.8%",
    cpu_dvr_offline: "23h 45m",
    cpu_dvr_offline_pct: "3.2%",
    success_rate: "98.8%",
    success_rate_checks: "(5,421 / 5,486 check)",
    avg_response_time: "180 ms",
    rec_uptime: "708h 20m",
    rec_uptime_pct: "95.2%",
    rec_tidak_merekam: "12h 30m",
    rec_tidak_merekam_pct: "1.7%",
    rec_error: "3h 10m",
    rec_error_pct: "0.4%",
    storage_used_pct: 38,
    kamera_total: 4,
    kamera_online: 4,
    kamera_no_video: 0,
    kamera_offline: 0,
    timeline_tracks: [
      {
        track_name: "CPU – DVR",
        segments: [
          { status: "online", start_pct: 0, width_pct: 23.5, label: "Online", period: "01 Oct - 08 Oct" },
          { status: "offline", start_pct: 23.5, width_pct: 4.5, label: "DVR No Response", period: "08 Oct 02:14 - 06:32" },
          { status: "online", start_pct: 28.0, width_pct: 23.0, label: "Online", period: "08 Oct - 16 Oct" },
          { status: "no_data", start_pct: 51.0, width_pct: 3.0, label: "No Data", period: "16 Oct" },
          { status: "degraded", start_pct: 54.0, width_pct: 3.5, label: "Degraded Response", period: "17 Oct" },
          { status: "online", start_pct: 57.5, width_pct: 18.0, label: "Online", period: "18 Oct - 23 Oct" },
          { status: "offline", start_pct: 75.5, width_pct: 3.5, label: "DVR Timeout", period: "23 Oct" },
          { status: "online", start_pct: 79.0, width_pct: 8.0, label: "Online", period: "24 Oct - 26 Oct" },
          { status: "offline", start_pct: 87.0, width_pct: 3.5, label: "DVR Timeout", period: "26 Oct 14:32 - 17:05" },
          { status: "online", start_pct: 90.5, width_pct: 9.5, label: "Online", period: "26 Oct - 31 Oct" },
        ],
      },
      {
        track_name: "Recording",
        segments: [
          { status: "online", start_pct: 0, width_pct: 30.0, label: "Recording Normal", period: "01 Oct - 10 Oct" },
          { status: "offline", start_pct: 30.0, width_pct: 3.5, label: "Tidak ada rekaman", period: "10 Oct - 11 Oct" },
          { status: "online", start_pct: 33.5, width_pct: 2.5, label: "Recording Normal", period: "11 Oct - 12 Oct" },
          { status: "offline", start_pct: 36.0, width_pct: 3.0, label: "Tidak ada rekaman", period: "12 Oct 11:20 - 13:05" },
          { status: "online", start_pct: 39.0, width_pct: 18.0, label: "Recording Normal", period: "13 Oct - 18 Oct" },
          { status: "degraded", start_pct: 57.0, width_pct: 3.5, label: "Bitrate Drop", period: "18 Oct" },
          { status: "online", start_pct: 60.5, width_pct: 14.5, label: "Recording Normal", period: "19 Oct - 23 Oct" },
          { status: "offline", start_pct: 75.0, width_pct: 3.5, label: "Recording Error", period: "23 Oct 10:15 - 12:40" },
          { status: "online", start_pct: 78.5, width_pct: 8.5, label: "Recording Normal", period: "24 Oct - 26 Oct" },
          { status: "offline", start_pct: 87.0, width_pct: 3.5, label: "Storage Busy / Error", period: "26 Oct" },
          { status: "online", start_pct: 90.5, width_pct: 9.5, label: "Recording Normal", period: "27 Oct - 31 Oct" },
        ],
      },
      {
        track_name: "Kamera",
        segments: [
          { status: "online", start_pct: 0, width_pct: 55.0, label: "4/4 Channel Online", period: "01 Oct - 18 Oct" },
          { status: "offline", start_pct: 55.0, width_pct: 4.5, label: "Channel 3 No Video", period: "18 Oct 22:11 - 19 Oct 02:05" },
          { status: "online", start_pct: 59.5, width_pct: 17.5, label: "4/4 Channel Online", period: "19 Oct - 24 Oct" },
          { status: "degraded", start_pct: 77.0, width_pct: 3.5, label: "Camera 2 Degraded", period: "24 Oct" },
          { status: "online", start_pct: 80.5, width_pct: 6.5, label: "4/4 Channel Online", period: "25 Oct - 26 Oct" },
          { status: "offline", start_pct: 87.0, width_pct: 3.5, label: "Camera 1 Offline", period: "26 Oct" },
          { status: "online", start_pct: 90.5, width_pct: 9.5, label: "4/4 Channel Online", period: "27 Oct - 31 Oct" },
        ],
      },
    ],
    trouble_events: [
      {
        no: 1,
        start_time: "08 Oct 2026 02:14",
        end_time: "08 Oct 2026 06:32",
        duration: "4h 18m",
        category: "CPU – DVR",
        description: "DVR No Response",
      },
      {
        no: 2,
        start_time: "12 Oct 2026 11:20",
        end_time: "12 Oct 2026 13:05",
        duration: "1h 45m",
        category: "Recording",
        description: "Tidak ada rekaman",
      },
      {
        no: 3,
        start_time: "18 Oct 2026 22:11",
        end_time: "19 Oct 2026 02:05",
        duration: "3h 54m",
        category: "Kamera",
        description: "Channel 3 No Video",
      },
      {
        no: 4,
        start_time: "23 Oct 2026 10:15",
        end_time: "23 Oct 2026 12:40",
        duration: "2h 25m",
        category: "Recording",
        description: "Recording Error",
      },
      {
        no: 5,
        start_time: "26 Oct 2026 14:32",
        end_time: "26 Oct 2026 17:05",
        duration: "2h 33m",
        category: "CPU – DVR",
        description: "DVR Timeout",
      },
    ],
  };

  const isWhite = d.type.includes("Putih");

  const getSegmentBg = (status: string) => {
    switch (status) {
      case "online":
        return "bg-[#00c875]";
      case "degraded":
        return "bg-[#f59e0b]";
      case "offline":
        return "bg-[#e2445c]";
      case "no_data":
        return "bg-[#6366f1]";
      default:
        return "bg-[#00c875]";
    }
  };

  const dateTicks = [
    "01 Oct", "03 Oct", "05 Oct", "07 Oct", "09 Oct", "11 Oct", "13 Oct", "15 Oct",
    "17 Oct", "19 Oct", "21 Oct", "23 Oct", "25 Oct", "27 Oct", "29 Oct", "31 Oct",
  ];

  return (
    <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-4 sm:p-5 space-y-4 font-sans transition-all duration-300">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <FileSpreadsheet className="size-4" />
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Detail Performa Gateway &ndash; {d.id}
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
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide leading-tight">
                {d.id}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                {d.location}
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

          {/* Card 5: Avg Response Time */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-blue-500/15 flex items-center justify-center text-[#0073ea]">
                <Clock className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Avg Response Time</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {d.avg_response_time}
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
        {/* Left Column (lg:col-span-6): Timeline Status (Multi-Track) */}
        <div className="lg:col-span-6 bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            {/* Header with Title & Filter Dropdown */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Timeline Status Selama Periode
                </h4>
                <Info className="size-3 text-slate-400 cursor-pointer" />
              </div>

              {/* Status Dropdown */}
              <div className="relative">
                <select
                  value={timelineStatusFilter}
                  onChange={(e) => setTimelineStatusFilter(e.target.value)}
                  className="appearance-none bg-white dark:bg-[#070e1c] border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 pl-2.5 pr-6 py-0.5 rounded-md focus:outline-none focus:border-[#0073ea] cursor-pointer shadow-2xs"
                >
                  <option value="Semua Status">Semua Status</option>
                  <option value="Normal / Online">Normal / Online</option>
                  <option value="Degraded">Degraded</option>
                  <option value="Offline / Error">Offline / Error</option>
                  <option value="No Data">No Data</option>
                </select>
                <ChevronDown className="size-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 3 Tracks of Timeline */}
            <div className="mt-4 space-y-2.5">
              {d.timeline_tracks.map((track, tIdx) => (
                <div key={tIdx} className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 min-w-17.5 truncate">
                    {track.track_name}
                  </span>

                  {/* Multi-segment Progress Bar */}
                  <div className="flex-1 h-3 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800/80 relative">
                    {track.segments.map((seg, sIdx) => (
                      <div
                        key={sIdx}
                        style={{ width: `${seg.width_pct}%` }}
                        className={`h-full ${getSegmentBg(seg.status)} transition-opacity hover:opacity-85 cursor-pointer relative group`}
                        onMouseEnter={() =>
                          setHoveredSegment(`${track.track_name}: ${seg.period} | ${seg.label}`)
                        }
                        onMouseLeave={() => setHoveredSegment(null)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Hover Tooltip display */}
            <div className="h-4 mt-2 pl-20.5 text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {hoveredSegment || "Arahkan kursor ke timeline untuk melihat detail"}
            </div>

            {/* Date Scale Ticks Beneath Timeline */}
            <div className="mt-1 pl-20.5 flex justify-between text-[9px] text-slate-500 dark:text-slate-400 font-mono select-none">
              {dateTicks.map((tick, idx) => (
                <span key={idx} className="hidden sm:inline-block">
                  {tick}
                </span>
              ))}
              <span className="sm:hidden">01 Oct</span>
              <span className="sm:hidden">08 Oct</span>
              <span className="sm:hidden">16 Oct</span>
              <span className="sm:hidden">24 Oct</span>
              <span className="sm:hidden">31 Oct</span>
            </div>

            {/* Legend underneath date ticks */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/50 flex flex-wrap items-center gap-4 text-[11px] text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#00c875]" />
                Normal / Online
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#f59e0b]" />
                Degraded
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#e2445c]" />
                Offline / Error
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#6366f1]" />
                No Data
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (lg:col-span-6): Riwayat Gangguan Table */}
        <div className="lg:col-span-6 bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="pb-3 border-b border-slate-200 dark:border-slate-800/60">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Riwayat Gangguan ({d.trouble_events.length} event)
              </h4>
            </div>

            {/* Compact Table with Category column */}
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/60 font-semibold bg-slate-100/60 dark:bg-slate-800/30">
                    <th className="py-2 px-2 text-center w-8">No.</th>
                    <th className="py-2 px-3">Mulai</th>
                    <th className="py-2 px-3">Selesai</th>
                    <th className="py-2 px-3 text-center">Durasi</th>
                    <th className="py-2 px-3">Kategori</th>
                    <th className="py-2 px-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40 text-[11px]">
                  {d.trouble_events.map((event) => (
                    <tr
                      key={event.no}
                      className="hover:bg-slate-100/80 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-2 px-2 text-center text-slate-500 dark:text-slate-400 font-mono">
                        {event.no}
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
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300 truncate max-w-42.5">
                        {event.description}
                      </td>
                    </tr>
                  ))}
                  {d.trouble_events.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-500 dark:text-slate-400 text-xs">
                        Tidak ada riwayat gangguan pada periode ini.
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
