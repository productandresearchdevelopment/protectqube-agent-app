"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  Calendar,
  Cpu,
  XCircle,
  CheckCircle2,
  Clock,
  Radio,
  Signal,
  Thermometer,
  AlertCircle,
  X,
} from "lucide-react";
import {
  useCellularReportGatewayDetail,
  ICellularReportGatewayDetail,
} from "@/store/api/monitoring";
import { SmartBoxIsometricIllustration } from "@/components/ui/SmartBoxIllustration";

interface CellularReportDetailCardProps {
  gatewayId: string | null;
  dateRange?: string;
  onClose?: () => void;
}

export const CellularReportDetailCard: React.FC<CellularReportDetailCardProps> = ({
  gatewayId,
  dateRange,
  onClose,
}) => {
  const { data, isLoading } = useCellularReportGatewayDetail(gatewayId, dateRange);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  if (!gatewayId) return null;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <div className="size-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Memuat data performa gateway...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-[#070e1d] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-6 text-center text-slate-500 text-sm">
        Data performa untuk gateway {gatewayId} tidak ditemukan.
      </div>
    );
  }

  const d = data;
  const isWhite = (d.type || "").includes("Putih");

  // Segment background color resolver
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
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide leading-tight truncate" title={d.location}>
                {d.location}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium truncate" title={d.id}>
                {d.id}
              </p>
            </div>

            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 font-normal pt-1">
              <div className="grid grid-cols-[80px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Tipe</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium">: {d.type}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Modem</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium">: {d.modem}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Provider</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium">: {d.provider}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">No. SIM Card</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-mono">: {d.sim_number}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">SIM Status</span>
                <span className="text-[#00c875] text-[11px] font-medium">: {d.sim_status}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] items-center">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">IP Address</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-mono">: {d.ip_address}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] items-start">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Lokasi</span>
                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium truncate">: {d.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (xl:col-span-8): 10 KPI Metric Cards (2 rows of 5 cards) */}
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

          {/* Card 2: CPU – Modem Uptime */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-emerald-500/15 flex items-center justify-center text-[#00c875]">
                <Cpu className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">CPU – Modem Uptime</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#00c875] leading-tight">
                {d.cpu_modem_uptime}
              </div>
              <div className="text-[11px] font-semibold text-[#00c875] mt-0.5">
                {d.cpu_modem_uptime_pct}
              </div>
            </div>
          </div>

          {/* Card 3: CPU – Modem Offline */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-rose-500/15 flex items-center justify-center text-[#e2445c]">
                <XCircle className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">CPU – Modem Offline</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#e2445c] leading-tight">
                {d.cpu_modem_offline}
              </div>
              <div className="text-[11px] font-semibold text-[#e2445c] mt-0.5">
                {d.cpu_modem_offline_pct}
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

          {/* Card 6: Network Uptime */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-emerald-500/15 flex items-center justify-center text-[#00c875]">
                <Radio className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Network Uptime</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#00c875] leading-tight">
                {d.network_uptime}
              </div>
              <div className="text-[11px] font-semibold text-[#00c875] mt-0.5">
                {d.network_uptime_pct}
              </div>
            </div>
          </div>

          {/* Card 7: Network Offline */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-rose-500/15 flex items-center justify-center text-[#e2445c]">
                <XCircle className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Network Offline</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#e2445c] leading-tight">
                {d.network_offline}
              </div>
              <div className="text-[11px] font-semibold text-[#e2445c] mt-0.5">
                {d.network_offline_pct}
              </div>
            </div>
          </div>

          {/* Card 8: Avg RSRP */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-blue-500/15 flex items-center justify-center text-[#0073ea]">
                <Signal className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Avg RSRP</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {d.avg_rsrp}
              </div>
            </div>
          </div>

          {/* Card 9: Avg Modem Temperature */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-rose-500/15 flex items-center justify-center text-[#e2445c]">
                <Thermometer className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Avg Modem Temp</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {d.avg_modem_temp}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {d.temp_range}
              </div>
            </div>
          </div>

          {/* Card 10: Total Gangguan */}
          <div className="bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-amber-500/15 flex items-center justify-center text-[#f59e0b]">
                <AlertCircle className="size-3.5" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Total Gangguan</span>
            </div>
            <div className="mt-2.5">
              <div className="text-sm font-bold text-[#f59e0b] leading-tight">
                {d.total_gangguan}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Section: Timeline Status & Riwayat Gangguan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left Column (lg:col-span-6): Timeline Status */}
        <div className="lg:col-span-6 bg-slate-50/70 dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            {/* Header with Title & Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/60">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Timeline Status ({d.period})
              </h4>
              <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#00c875]" />
                  Online
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#f59e0b]" />
                  Degraded
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#e2445c]" />
                  Offline
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#6366f1]" />
                  No Data
                </span>
              </div>
            </div>

            {/* Timeline Bar Row */}
            <div className="mt-4 flex items-center gap-3">
              <span className="text-xs font-bold text-slate-900 dark:text-white min-w-11">
                {d.id}
              </span>

              {/* Progress Bar with Segments */}
              <div className="flex-1 h-3.5 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800/80 relative">
                {d.timeline_segments.map((seg, idx) => (
                  <div
                    key={idx}
                    style={{ width: `${seg.width_pct}%` }}
                    className={`h-full ${getSegmentBg(seg.status)} transition-opacity hover:opacity-85 cursor-pointer relative group`}
                    onMouseEnter={() => setHoveredSegment(`${seg.period} | ${seg.label}`)}
                    onMouseLeave={() => setHoveredSegment(null)}
                  />
                ))}
              </div>
            </div>

            {/* Hover Tooltip display */}
            <div className="h-4 mt-1 pl-14 text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {hoveredSegment || "Arahkan kursor ke timeline untuk melihat detail"}
            </div>

            {/* Date Scale Ticks Beneath Timeline */}
            <div className="mt-1 pl-14 flex justify-between text-[9px] text-slate-500 dark:text-slate-400 font-mono select-none">
              {dateTicks.map((tick, idx) => (
                <span key={idx} className="hidden sm:inline-block">
                  {tick}
                </span>
              ))}
              {/* Fallback for smaller screens */}
              <span className="sm:hidden">01 Oct</span>
              <span className="sm:hidden">08 Oct</span>
              <span className="sm:hidden">16 Oct</span>
              <span className="sm:hidden">24 Oct</span>
              <span className="sm:hidden">31 Oct</span>
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

            {/* Compact Table */}
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/60 font-semibold bg-slate-100/60 dark:bg-slate-800/30">
                    <th className="py-2 px-2 text-center w-8">No.</th>
                    <th className="py-2 px-3">Mulai</th>
                    <th className="py-2 px-3">Selesai</th>
                    <th className="py-2 px-3 text-center">Durasi</th>
                    <th className="py-2 px-3">Penyebab / Keterangan</th>
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
                      <td className="py-2 px-3 text-slate-800 dark:text-slate-200 truncate max-w-50">
                        {event.cause}
                      </td>
                    </tr>
                  ))}
                  {d.trouble_events.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-500 dark:text-slate-400 text-xs">
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
