"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useOverviewSummary,
  IOverviewActiveIncident,
} from "@/store/api/monitoring";
import {
  Server,
  Radio,
  Video,
  Cpu,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowUpRight,
  Clock,
  ChevronRight,
  FileSpreadsheet,
  Search,
  RefreshCw,
  Flame,
  WifiOff,
  BarChart2,
  Bell,
  History,
  Disc,
  Building2,
  HardDrive,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const CustomDonutTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-slate-900/95 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-xl border border-slate-700 font-sans z-50">
        <div className="flex items-center gap-1.5 font-bold">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: item.payload?.color }}
          />
          <span>{item.name}</span>
        </div>
        <div className="text-slate-300 mt-0.5 font-mono">
          {Number(item.value).toLocaleString()} units
        </div>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const row = payload[0]?.payload;
    return (
      <div className="bg-slate-900/95 text-white text-[11px] px-3 py-2 rounded-xl shadow-xl border border-slate-700 font-sans z-50">
        <div className="font-bold text-slate-200 mb-1">{label}</div>
        <div className="flex items-center justify-between gap-4 text-emerald-400">
          <span>Healthy / Online:</span>
          <span className="font-mono font-bold">
            {row?.healthy?.toLocaleString()} ({row?.healthy_pct}%)
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-rose-400 mt-0.5">
          <span>Issue / Offline:</span>
          <span className="font-mono font-bold">
            {row?.issue?.toLocaleString()}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function OverviewPage() {
  const [mounted, setMounted] = useState(false);
  const [incidentPanelTab, setIncidentPanelTab] = useState<"active" | "history">(
    "active",
  );
  const [activeIncidentFilter, setActiveIncidentFilter] = useState<
    "all" | "offline" | "cellular" | "dvr" | "system"
  >("all");
  const [incidentSearch, setIncidentSearch] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(6);

  const incidentsSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: overview, isLoading, isFetching, refetch } = useOverviewSummary();

  const fleet = overview?.fleet;
  const sys = overview?.system_health;
  const cel = overview?.cellular;
  const dvr = overview?.dvr;
  const incSummary = overview?.incidents_summary;
  const activeIncidents = overview?.active_incidents || [];
  const historyAlerts = overview?.recent_history_alerts || [];
  const clientsSummary = overview?.clients_summary || [];
  const subsystemComparison = overview?.subsystem_comparison || [];

  const totalGateways = fleet?.total_gateways ?? 0;
  const totalLocations = fleet?.total_locations ?? 0;
  const onlineCount = fleet?.online ?? 0;
  const offlineCount = fleet?.offline ?? 0;
  const onlinePct = fleet?.online_percent ?? 0;

  // Donut datasets
  const systemDonutData = useMemo(() => {
    if (!fleet) return [];
    return [
      { name: "Online", value: onlineCount, color: "#00c875" },
      { name: "Offline", value: offlineCount, color: "#e2445c" },
    ].filter((d) => d.value > 0);
  }, [fleet, onlineCount, offlineCount]);

  const cellularDonutData = useMemo(() => {
    if (!cel) return [];
    const simMissingOnline = Math.max(0, cel.sim_not_detected - offlineCount);
    return [
      { name: "SIM Ready", value: cel.sim_ready, color: "#00d2ff" },
      { name: "SIM / Modem Down", value: simMissingOnline, color: "#fdab3d" },
      { name: "Offline", value: offlineCount, color: "#e2445c" },
    ].filter((d) => d.value > 0);
  }, [cel, offlineCount]);

  const dvrDonutData = useMemo(() => {
    const rd = dvr?.recording_distribution;
    if (!rd) return [];
    return [
      { name: "Recording", value: rd.recording, color: "#00c875" },
      { name: "Not Recording", value: rd.not_recording, color: "#fdab3d" },
      { name: "DVR Disconnected", value: rd.disconnected, color: "#e2445c" },
      { name: "Offline", value: rd.offline, color: "#64748b" },
    ].filter((d) => d.value > 0);
  }, [dvr?.recording_distribution]);

  // Filter active incidents
  const filteredIncidents = useMemo(() => {
    return activeIncidents.filter((item: IOverviewActiveIncident) => {
      if (activeIncidentFilter === "offline" && item.category !== "offline")
        return false;
      if (activeIncidentFilter === "cellular" && item.category !== "cellular")
        return false;
      if (activeIncidentFilter === "dvr" && item.category !== "dvr")
        return false;
      if (activeIncidentFilter === "system" && item.category !== "system")
        return false;

      if (incidentSearch.trim() !== "") {
        const q = incidentSearch.toLowerCase();
        return (
          item.device_id.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.client.toLowerCase().includes(q) ||
          item.alert_title.toLowerCase().includes(q) ||
          item.alert_detail.toLowerCase().includes(q) ||
          item.metric.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeIncidents, activeIncidentFilter, incidentSearch]);

  const displayedIncidents = useMemo(
    () => filteredIncidents.slice(0, visibleLimit),
    [filteredIncidents, visibleLimit],
  );

  const jumpToIncidentFilter = (
    filter: "all" | "offline" | "cellular" | "dvr" | "system",
  ) => {
    setIncidentPanelTab("active");
    setActiveIncidentFilter(filter);
    setVisibleLimit(6);
    incidentsSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const rsrpBadgeColor =
    cel?.signal_quality === "Poor" || cel?.signal_quality === "No Signal"
      ? "text-rose-500"
      : cel?.signal_quality === "Fair"
        ? "text-amber-500"
        : "text-[#00c875]";

  return (
    <AppLayout
      title="Overview"
      headerRight={
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
            <span className="size-2 rounded-full bg-[#00c875] animate-ping" />
            <span className="font-bold text-[#00c875]">{onlinePct}% Online</span>
            <span className="text-slate-400">
              ({onlineCount}/{totalGateways})
            </span>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Refresh overview"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </button>

          <Link
            href="/reports/sla"
            className="bg-[#0073ea] hover:bg-blue-600 active:scale-95 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
          >
            <FileSpreadsheet className="size-3.5" />
            <span>Report SLA</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-5 max-w-[1600px] mx-auto pb-12 font-sans transition-colors">
        {/* ========================================================= */}
        {/* 1. TOP EXECUTIVE KPI STRIP (5 SUMMARY TILES)              */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {/* Tile 1: Total Locations */}
          <div className="bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Total Locations
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 leading-none">
                {totalLocations.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1.5">
                {fleet?.total_clients ?? 0} Active Client
              </div>
            </div>
            <div className="size-10 rounded-xl bg-blue-500/10 text-[#0073ea] flex items-center justify-center shrink-0">
              <MapPin className="size-5" />
            </div>
          </div>

          {/* Tile 2: Total Devices & SmartBox Types */}
          <div className="bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Total Gateways
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 leading-none">
                {totalGateways.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1.5">
                Black: {fleet?.smartbox_hitam.total ?? 0} • White:{" "}
                {fleet?.smartbox_putih.total ?? 0}
              </div>
            </div>
            <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
              <Server className="size-5" />
            </div>
          </div>

          {/* Tile 3: Online vs Offline Right Now */}
          <button
            type="button"
            onClick={() => jumpToIncidentFilter("offline")}
            className="text-left bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/90 hover:border-rose-500/50 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3 transition-colors cursor-pointer"
          >
            <div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Gateway Status
              </div>
              <div className="flex items-baseline gap-2 mt-0.5 leading-none">
                <span className="text-2xl font-black text-[#00c875]">
                  {onlineCount}
                </span>
                <span className="text-xs font-bold text-slate-400">On</span>
                <span className="text-slate-300 dark:text-slate-700">/</span>
                <span className="text-xl font-black text-[#e2445c]">
                  {offlineCount}
                </span>
                <span className="text-xs font-bold text-rose-400">Off</span>
              </div>
              <div className="text-[11px] text-[#00c875] font-semibold mt-1.5">
                {onlinePct}% Fleet Online
              </div>
            </div>
            <div className="size-10 rounded-xl bg-emerald-500/10 text-[#00c875] flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-5" />
            </div>
          </button>

          {/* Tile 4: DVR Recording Status */}
          <button
            type="button"
            onClick={() => jumpToIncidentFilter("dvr")}
            className="text-left bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/90 hover:border-amber-500/50 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3 transition-colors cursor-pointer"
          >
            <div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                DVR Recording
              </div>
              <div className="flex items-baseline gap-2 mt-0.5 leading-none">
                <span className="text-2xl font-black text-[#00c875]">
                  {dvr?.recording_active ?? 0}
                </span>
                <span className="text-xs font-bold text-slate-400">Rec</span>
                <span className="text-slate-300 dark:text-slate-700">/</span>
                <span className="text-xl font-black text-[#fdab3d]">
                  {dvr?.recording_issue ?? 0}
                </span>
                <span className="text-xs font-bold text-amber-400">Off</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1.5">
                {dvr?.recording_active_pct ?? 0}% Active Recording
              </div>
            </div>
            <div className="size-10 rounded-xl bg-orange-500/10 text-[#fdab3d] flex items-center justify-center shrink-0">
              <Disc className="size-5" />
            </div>
          </button>

          {/* Tile 5: Active Outages & Offline */}
          <button
            type="button"
            onClick={() => jumpToIncidentFilter("all")}
            className="col-span-2 sm:col-span-1 text-left bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/90 hover:border-rose-500/50 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3 transition-colors cursor-pointer"
          >
            <div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Offline &amp; Down
              </div>
              <div className="text-2xl font-black text-rose-500 mt-0.5 leading-none">
                {incSummary?.total_active_alerts ?? 0}
              </div>
              <div className="text-[11px] text-slate-400 mt-1.5">
                {incSummary?.offline_count ?? 0} Gateway •{" "}
                {(incSummary?.cellular_count ?? 0) + (incSummary?.dvr_count ?? 0)} Modem/DVR
              </div>
            </div>
            <div className="size-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
              <WifiOff className="size-5" />
            </div>
          </button>
        </div>

        {/* ========================================================= */}
        {/* 2. OFFLINE GATEWAYS & SUBSYSTEM OUTAGES (TOP PRIORITY)    */}
        {/* ========================================================= */}
        <div
          ref={incidentsSectionRef}
          className="bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs space-y-4"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/70">
            <div>
              <div className="flex items-center gap-2">
                <WifiOff className="size-4 text-rose-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Offline Gateways &amp; Subsystem Outages
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Live list of offline gateways, disconnected modems/SIM, DVR &amp; camera downtime
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#060c18] p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setIncidentPanelTab("active")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  incidentPanelTab === "active"
                    ? "bg-[#0073ea] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                <Bell className="size-3.5" />
                <span>Active ({activeIncidents.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setIncidentPanelTab("history")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  incidentPanelTab === "history"
                    ? "bg-[#0073ea] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                <History className="size-3.5" />
                <span>History ({historyAlerts.length})</span>
              </button>
            </div>
          </div>

          {incidentPanelTab === "active" && (
            <div className="space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
                  {[
                    { id: "all", label: `All (${incSummary?.total_active_alerts ?? 0})` },
                    { id: "offline", label: `Gateway Offline (${incSummary?.offline_count ?? 0})` },
                    { id: "cellular", label: `Modem / SIM (${incSummary?.cellular_count ?? 0})` },
                    { id: "dvr", label: `DVR / Camera (${incSummary?.dvr_count ?? 0})` },
                    { id: "system", label: `Power (${incSummary?.system_count ?? 0})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveIncidentFilter(tab.id as any);
                        setVisibleLimit(6);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                        activeIncidentFilter === tab.id
                          ? "bg-[#0073ea] text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full lg:w-64 shrink-0">
                  <Search className="absolute left-3 top-2 size-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search location, ID, status..."
                    value={incidentSearch}
                    onChange={(e) => {
                      setIncidentSearch(e.target.value);
                      setVisibleLimit(6);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#060c18] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Loading fleet status...
                </div>
              ) : displayedIncidents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                        <th className="py-2 px-3">Location</th>
                        <th className="py-2 px-3">Client</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Issue</th>
                        <th className="py-2 px-3">Detail</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {displayedIncidents.map((inc) => {
                        const isGatewayOff = inc.category === "offline";
                        const statusLabel = isGatewayOff
                          ? "OFFLINE"
                          : inc.severity === "disconnected"
                            ? "DISCONNECTED"
                            : inc.alert_title.includes("SIM")
                              ? "NO SIM"
                              : inc.alert_title.includes("Recording")
                                ? "NOT RECORDING"
                                : inc.category === "dvr"
                                  ? "CAM OFFLINE"
                                  : "BATTERY";
                        return (
                          <tr
                            key={inc.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="py-2.5 px-3 max-w-[220px]">
                              <div
                                className="font-semibold text-slate-900 dark:text-white truncate"
                                title={inc.location}
                              >
                                {inc.location}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400">
                                {inc.device_id} • {inc.model}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                              {inc.client || "-"}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  isGatewayOff
                                    ? "bg-rose-500/15 text-rose-500 border border-rose-500/30"
                                    : "bg-orange-500/15 text-orange-500 border border-orange-500/30"
                                }`}
                              >
                                {isGatewayOff ? (
                                  <WifiOff className="size-3" />
                                ) : (
                                  <XCircle className="size-3" />
                                )}
                                {statusLabel}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <div
                                className={`font-semibold ${
                                  isGatewayOff ? "text-rose-500" : "text-slate-800 dark:text-slate-200"
                                }`}
                              >
                                {inc.alert_title}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                {inc.alert_detail}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                              <div className="font-bold text-slate-800 dark:text-slate-200">
                                {inc.metric}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock className="size-2.5" />
                                {inc.duration !== "Active"
                                  ? `Down ${inc.duration}`
                                  : inc.last_update}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <Link
                                href={inc.detail_href}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#0073ea] hover:text-white dark:bg-slate-800 dark:hover:bg-[#0073ea] text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors"
                              >
                                Inspect <ArrowUpRight className="size-3" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {filteredIncidents.length > visibleLimit && (
                    <div className="pt-3 text-center">
                      <button
                        type="button"
                        onClick={() => setVisibleLimit((prev) => prev + 10)}
                        className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        Show More ({filteredIncidents.length - visibleLimit} more)
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <CheckCircle2 className="size-8 text-[#00c875] mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    All gateways &amp; subsystems are online
                  </p>
                </div>
              )}
            </div>
          )}

          {incidentPanelTab === "history" && (
            <div className="overflow-x-auto">
              {historyAlerts.length > 0 ? (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                      <th className="py-2 px-3">Device</th>
                      <th className="py-2 px-3">Metric</th>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3">Start (WIB)</th>
                      <th className="py-2 px-3 text-center">Duration</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {historyAlerts.map((h) => (
                      <tr
                        key={h.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30"
                      >
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 dark:text-white">
                          {h.device_name}
                        </td>
                        <td className="py-2.5 px-3 uppercase text-[10px] font-bold text-slate-500">
                          {h.metric}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                          {h.description}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {h.start_time_wib || "-"}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-semibold text-amber-500">
                          {h.duration || "-"}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              h.status === "ACTIVE"
                                ? "bg-rose-500/15 text-rose-500"
                                : "bg-emerald-500/15 text-[#00c875]"
                            }`}
                          >
                            {h.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No historical outage alerts logged in database yet.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* 3. 3 MODULE SUMMARY CARDS WITH DONUT CHARTS               */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* MODULE 1: SYSTEM HEALTH SUMMARY */}
          <div className="bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-emerald-500/10 text-[#00c875] flex items-center justify-center">
                    <Cpu className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      System Health
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Gateway Status, CPU, RAM &amp; Storage
                    </p>
                  </div>
                </div>
                <Link
                  href="/system-health"
                  className="text-xs font-semibold text-[#0073ea] hover:underline flex items-center gap-0.5"
                >
                  Detail <ChevronRight className="size-3.5" />
                </Link>
              </div>

              {/* Donut + Legend */}
              <div className="flex items-center gap-4 py-4">
                <div className="w-28 h-28 relative shrink-0">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip content={<CustomDonutTooltip />} />
                        <Pie
                          data={systemDonutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={32}
                          outerRadius={48}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {systemDonutData.map((e, i) => (
                            <Cell key={`sh-d-${i}`} fill={e.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-sm font-black text-slate-900 dark:text-white leading-none">
                      {onlinePct}%
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5">Online</span>
                  </div>
                </div>

                <div className="flex-1 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <span className="size-2 rounded-full bg-[#00c875]" />
                      Online
                    </span>
                    <span className="font-bold font-mono text-[#00c875]">
                      {onlineCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <span className="size-2 rounded-full bg-[#e2445c]" />
                      Offline
                    </span>
                    <span className="font-bold font-mono text-rose-500">
                      {offlineCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/50 text-[11px]">
                    <span className="text-slate-400">SmartBox Black</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      <span className="text-[#00c875]">{fleet?.smartbox_hitam.online ?? 0}</span>
                      {" / "}
                      <span className="text-rose-500">{fleet?.smartbox_hitam.offline ?? 0} Off</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">SmartBox White</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      <span className="text-[#00c875]">{fleet?.smartbox_putih.online ?? 0}</span>
                      {" / "}
                      <span className="text-rose-500">{fleet?.smartbox_putih.offline ?? 0} Off</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Stats Grid */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs">
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-2.5">
                <div className="text-[10px] text-slate-400">Avg CPU / RAM</div>
                <div className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                  {sys?.cpu_avg ?? 0}% / {sys?.ram_avg ?? 0}%
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-2.5">
                <div className="text-[10px] text-slate-400">Avg Temp / Max</div>
                <div className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                  {sys?.temp_avg ?? 0}°C /{" "}
                  <span className="text-rose-500">{sys?.temp_max ?? 0}°C</span>
                </div>
              </div>
              <div className="col-span-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl px-2.5 py-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Root Disk Avg Usage
                </span>
                <span className="text-[11px] font-bold font-mono text-slate-800 dark:text-slate-200">
                  {sys?.sd_avg ?? 0}% • Flash Life {sys?.avg_sd_life ?? 100}%
                </span>
              </div>
            </div>
          </div>

          {/* MODULE 2: CELLULAR SUMMARY */}
          <div className="bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-cyan-500/10 text-[#00d2ff] flex items-center justify-center">
                    <Radio className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Cellular Connectivity
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Modem USB, SIM Card & 4G Signal
                    </p>
                  </div>
                </div>
                <Link
                  href="/cellular"
                  className="text-xs font-semibold text-[#0073ea] hover:underline flex items-center gap-0.5"
                >
                  Detail <ChevronRight className="size-3.5" />
                </Link>
              </div>

              {/* Donut + Legend */}
              <div className="flex items-center gap-4 py-4">
                <div className="w-28 h-28 relative shrink-0">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip content={<CustomDonutTooltip />} />
                        <Pie
                          data={cellularDonutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={32}
                          outerRadius={48}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {cellularDonutData.map((e, i) => (
                            <Cell key={`cel-d-${i}`} fill={e.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-sm font-black text-slate-900 dark:text-white leading-none">
                      {cel?.sla_pct ?? 0}%
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5">SIM OK</span>
                  </div>
                </div>

                <div className="flex-1 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <span className="size-2 rounded-full bg-[#00d2ff]" />
                      SIM Ready
                    </span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">
                      {cel?.sim_ready ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <span className="size-2 rounded-full bg-[#fdab3d]" />
                      Modem / SIM Issue
                    </span>
                    <span className="font-bold font-mono text-amber-500">
                      {Math.max(0, (cel?.sim_not_detected ?? 0) - offlineCount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <span className="size-2 rounded-full bg-[#e2445c]" />
                      Device Offline
                    </span>
                    <span className="font-bold font-mono text-rose-500">
                      {offlineCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/50">
                    <span className="text-slate-400">Avg Signal</span>
                    <span className={`font-bold font-mono ${rsrpBadgeColor}`}>
                      {cel?.avg_rsrp !== null && cel?.avg_rsrp !== undefined
                        ? `${cel.avg_rsrp} dBm (${cel.signal_quality})`
                        : "No Signal"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Stats Grid */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs">
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-2.5">
                <div className="text-[10px] text-slate-400">Modem USB</div>
                <div className="font-bold text-[#00c875] font-mono mt-0.5">
                  {cel?.modem_connected ?? 0} OK •{" "}
                  <span className="text-rose-500">
                    {cel?.modem_disconnected ?? 0} Down
                  </span>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-2.5">
                <div className="text-[10px] text-slate-400">Top Provider</div>
                <div className="font-bold text-slate-900 dark:text-white truncate mt-0.5">
                  {cel?.top_provider ?? "-"} ({cel?.top_provider_pct ?? 0}%)
                </div>
              </div>
              <div className="col-span-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl px-2.5 py-2 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">
                  Signal Quality:
                </span>
                <span className="font-semibold font-mono">
                  <span className="text-[#00c875]">
                    {(cel?.signal_distribution?.excellent ?? 0) +
                      (cel?.signal_distribution?.good ?? 0)}{" "}
                    Good
                  </span>
                  {" • "}
                  <span className="text-[#fdab3d]">
                    {cel?.signal_distribution?.fair ?? 0} Fair
                  </span>
                  {" • "}
                  <span className="text-[#e2445c]">
                    {cel?.signal_distribution?.poor ?? 0} Poor
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* MODULE 3: DVR & RECORDING SUMMARY */}
          <div className="bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-orange-500/10 text-[#fdab3d] flex items-center justify-center">
                    <Video className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      DVR & Recording
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      NVR Status, CCTV Cameras & HDD
                    </p>
                  </div>
                </div>
                <Link
                  href="/dvr-recording"
                  className="text-xs font-semibold text-[#0073ea] hover:underline flex items-center gap-0.5"
                >
                  Detail <ChevronRight className="size-3.5" />
                </Link>
              </div>

              {/* Donut + Legend */}
              <div className="flex items-center gap-4 py-4">
                <div className="w-28 h-28 relative shrink-0">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip content={<CustomDonutTooltip />} />
                        <Pie
                          data={dvrDonutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={32}
                          outerRadius={48}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {dvrDonutData.map((e, i) => (
                            <Cell key={`dvr-d-${i}`} fill={e.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-sm font-black text-slate-900 dark:text-white leading-none">
                      {dvr?.recording_active_pct ?? 0}%
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5">Rec</span>
                  </div>
                </div>

                <div className="flex-1 space-y-1.5 text-xs">
                  {[
                    {
                      label: "Recording Active",
                      val: dvr?.recording_distribution?.recording ?? 0,
                      dot: "bg-[#00c875]",
                    },
                    {
                      label: "Not Recording",
                      val: dvr?.recording_distribution?.not_recording ?? 0,
                      dot: "bg-[#fdab3d]",
                    },
                    {
                      label: "DVR Disconnected",
                      val: dvr?.recording_distribution?.disconnected ?? 0,
                      dot: "bg-[#e2445c]",
                    },
                    {
                      label: "Gateway Offline",
                      val: dvr?.recording_distribution?.offline ?? 0,
                      dot: "bg-slate-500",
                    },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <span className={`size-2 rounded-full ${r.dot}`} />
                        {r.label}
                      </span>
                      <span className="font-bold font-mono text-slate-900 dark:text-white">
                        {r.val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Stats Grid */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs">
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-2.5">
                <div className="text-[10px] text-slate-400">Cameras Live</div>
                <div className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                  {dvr?.cameras_online ?? 0}/{dvr?.total_cameras ?? 0}{" "}
                  <span className="text-[#00c875] text-[10px]">
                    ({dvr?.camera_online_pct ?? 0}%)
                  </span>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-2.5">
                <div className="text-[10px] text-slate-400">HDD Storage</div>
                <div className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                  {dvr?.used_storage_tb ?? 0}/{dvr?.total_storage_tb ?? 0} TB
                </div>
              </div>
              <div className="col-span-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl px-2.5 py-2 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">
                  DVR Connection ({dvr?.top_brand ?? "-"})
                </span>
                <span className="font-bold font-mono">
                  <span className="text-[#00c875]">
                    {dvr?.dvr_connected ?? 0} Connected
                  </span>
                  {" • "}
                  <span className="text-rose-500">
                    {dvr?.dvr_disconnected ?? 0} Down
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. SUBSYSTEM AVAILABILITY CHART + CLIENT FLEET SUMMARY    */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Left (7 cols): Subsystem Health Comparison Bar Chart */}
          <div className="lg:col-span-7 bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/70">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="size-4 text-[#0073ea]" />
                  Fleet Availability by Subsystem (%)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Real-time operational health percentage across all 6 core components
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Updated: {overview?.updated_at || "-"}
              </span>
            </div>

            <div className="h-56 w-full pt-4">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={subsystemComparison}
                    margin={{ top: 10, right: 16, left: -18, bottom: 0 }}
                    barSize={32}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#475569"
                      strokeOpacity={0.2}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={{ stroke: "#475569", strokeOpacity: 0.4 }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="healthy_pct" radius={[6, 6, 0, 0]}>
                      {subsystemComparison.map((entry, idx) => (
                        <Cell
                          key={`sub-${idx}`}
                          fill={
                            entry.healthy_pct >= 95
                              ? "#00c875"
                              : entry.healthy_pct >= 80
                                ? "#fdab3d"
                                : "#e2445c"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Right (5 cols): Client Summary & Hardware Split */}
          <div className="lg:col-span-5 bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/70">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-[#0073ea]" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Summary per Client & Hardware
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Device uptime, SIM & recording status grouped by client
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto mt-3">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800/60">
                      <th className="py-1.5 pr-2">Client</th>
                      <th className="py-1.5 px-2 text-center">Units</th>
                      <th className="py-1.5 px-2 text-center">Online</th>
                      <th className="py-1.5 px-2 text-center">Offline</th>
                      <th className="py-1.5 px-2 text-center">Rec</th>
                      <th className="py-1.5 pl-2 text-right">Uptime</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {clientsSummary.slice(0, 4).map((c) => (
                      <tr key={c.name} className="text-[11px]">
                        <td className="py-2 pr-2 font-bold text-slate-900 dark:text-white truncate max-w-[110px]">
                          {c.name}
                        </td>
                        <td className="py-2 px-2 text-center font-mono">
                          {c.total}
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-semibold text-[#00c875]">
                          {c.online}
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-semibold text-rose-500">
                          {c.offline}
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-slate-600 dark:text-slate-300">
                          {c.recording_active}
                        </td>
                        <td className="py-2 pl-2 text-right font-mono font-bold text-[#00c875]">
                          {c.uptime_pct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SmartBox Black vs White Breakdown */}
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/60 grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    SmartBox Black
                  </div>
                  <div className="text-[10px] text-slate-400">
                    <span className="text-[#00c875]">
                      {fleet?.smartbox_hitam.online ?? 0} On
                    </span>{" "}
                    •{" "}
                    <span className="text-rose-500">
                      {fleet?.smartbox_hitam.offline ?? 0} Off
                    </span>
                  </div>
                </div>
                <span className="text-base font-black text-[#0073ea]">
                  {fleet?.smartbox_hitam.total ?? 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    SmartBox White
                  </div>
                  <div className="text-[10px] text-slate-400">
                    <span className="text-[#00c875]">
                      {fleet?.smartbox_putih.online ?? 0} On
                    </span>{" "}
                    •{" "}
                    <span className="text-rose-500">
                      {fleet?.smartbox_putih.offline ?? 0} Off
                    </span>
                  </div>
                </div>
                <span className="text-base font-black text-slate-700 dark:text-slate-200">
                  {fleet?.smartbox_putih.total ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 5. REPORTS QUICK SUMMARY STRIP (4 REPORTS)                */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {[
            {
              title: "Report SLA",
              sub: "Fleet Compliance & Availability",
              badge: `${totalGateways} Devices`,
              href: "/reports/sla",
              icon: BarChart2,
              color: "text-[#0073ea] bg-blue-500/10",
            },
            {
              title: "Report Health",
              sub: "CPU, RAM, Storage & Temp",
              badge: `CPU Avg ${sys?.cpu_avg ?? 0}%`,
              href: "/reports/health",
              icon: Cpu,
              color: "text-[#00c875] bg-emerald-500/10",
            },
            {
              title: "Report Cellular",
              sub: "Modem, SIM & RSRP Signal",
              badge: `${cel?.sim_ready ?? 0} SIM Ready`,
              href: "/reports/cellular",
              icon: Radio,
              color: "text-[#00d2ff] bg-cyan-500/10",
            },
            {
              title: "Report DVR",
              sub: "NVR, Cameras & HDD Usage",
              badge: `${dvr?.cameras_online ?? 0}/${dvr?.total_cameras ?? 0} Cam`,
              href: "/reports/dvr",
              icon: HardDrive,
              color: "text-[#fdab3d] bg-orange-500/10",
            },
          ].map((rep) => {
            const Icon = rep.icon;
            return (
              <Link
                key={rep.href}
                href={rep.href}
                className="bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-slate-800/90 hover:border-[#0073ea]/60 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${rep.color}`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#0073ea] transition-colors">
                      {rep.title}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {rep.sub}
                    </div>
                    <div className="text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                      {rep.badge}
                    </div>
                  </div>
                </div>
                <ChevronRight className="size-4 text-slate-400 group-hover:text-[#0073ea] group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
