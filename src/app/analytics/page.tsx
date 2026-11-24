"use client";

import React, { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useIncidentAnalytics,
  IIncidentAnalyticsParams,
  IMonthlyTrendPoint,
  IRootCauseItem,
  IOfflineDeviceItem,
  IIncidentDetailItem,
} from "@/store/api/monitoring";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Radio,
  Video,
  Cpu,
  RefreshCw,
  Search,
  Calendar,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  ChevronRight,
  PieChart as PieIcon,
  HelpCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const CAUSE_COLORS: Record<string, string> = {
  cellular: "#f59e0b", // Amber
  cpu_dvr: "#ef4444",   // Red
  cpu_modem: "#8b5cf6", // Purple
  power: "#ec4899",     // Pink
  system: "#06b6d4",    // Cyan
  other: "#64748b",     // Slate
};

export default function AnalyticsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-11");
  const [selectedDate, setSelectedDate] = useState<string>("2026-11-20");
  const [clientFilter, setClientFilter] = useState<string>("All Clients");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"overview" | "offline" | "incidents">("overview");
  const [causeViewMode, setCauseViewMode] = useState<"day" | "month">("day");

  const queryParams: IIncidentAnalyticsParams = useMemo(() => ({
    month: selectedMonth,
    date: selectedDate,
    client: clientFilter,
    search: searchQuery.trim() || undefined,
    limit: 50,
  }), [selectedMonth, selectedDate, clientFilter, searchQuery]);

  const { data, isLoading, isFetching, refetch } = useIncidentAnalytics(queryParams);

  const summary = data?.summary;
  const monthlyTrend = data?.monthly_trend || [];
  const dailyCauses = data?.daily_causes || [];
  const monthlyCauses = data?.monthly_causes || [];
  const offlineDevices = data?.offline_devices || [];
  const incidentItems = data?.incidents?.items || [];
  const availableMonths = data?.available_months || ["2026-11"];

  // Filtered offline devices based on client & search
  const filteredOfflineDevices = useMemo(() => {
    return offlineDevices.filter((dev) => {
      const matchSearch =
        !searchQuery ||
        dev.gateway_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dev.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dev.primary_cause.toLowerCase().includes(searchQuery.toLowerCase());
      const matchClient =
        clientFilter === "All Clients" ||
        dev.client_name.toLowerCase() === clientFilter.toLowerCase();
      return matchSearch && matchClient;
    });
  }, [offlineDevices, searchQuery, clientFilter]);

  // Active causes to display (toggleable day vs month)
  const activeCauses = causeViewMode === "day" ? dailyCauses : monthlyCauses;

  // Custom Tooltip for Monthly Trend
  const TrendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((acc: number, curr: any) => acc + (curr.value || 0), 0);
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl border border-slate-700 shadow-xl text-xs space-y-1.5 z-50">
          <div className="font-bold border-b border-slate-700/80 pb-1 flex items-center justify-between gap-4">
            <span>Tanggal: {label}</span>
            <span className="text-amber-400 font-mono font-bold">{total.toLocaleString()} insiden</span>
          </div>
          {payload.map((entry: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-3 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-300 capitalize">{entry.name.replace("_", " ")}:</span>
              </span>
              <span className="font-mono font-semibold">{entry.value}</span>
            </div>
          ))}
          <div className="text-[10px] text-slate-400 pt-1 italic border-t border-slate-800">
            Klik batang untuk melihat detail tanggal ini
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-12 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0b1120] border border-slate-200/90 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <BarChart3 className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  Incident & Outage Analytics
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                    Insights
                  </span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Analisis tren insiden bulanan, penyebab downtime harian terbanyak, dan perangkat yang mengalami gangguan
                </p>
              </div>
            </div>
          </div>

          {/* Action Filters Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month Selector */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs">
              <Calendar className="size-3.5 text-slate-400" />
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setSelectedDate(`${e.target.value}-01`);
                }}
                className="bg-transparent border-none text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-hidden cursor-pointer"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m} className="dark:bg-slate-900 text-slate-900 dark:text-white">
                    Bulan: {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Client Filter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs">
              <Building2 className="size-3.5 text-slate-400" />
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="bg-transparent border-none text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-hidden cursor-pointer"
              >
                <option value="All Clients" className="dark:bg-slate-900">All Clients</option>
                <option value="DANAMON" className="dark:bg-slate-900">DANAMON</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0073ea] hover:bg-[#005bb5] text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              title="Perbarui data analytics"
            >
              <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Top Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Incidents Month */}
          <div className="bg-white dark:bg-[#0b1120] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Insiden (Bulan {selectedMonth})
              </p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {summary?.total_incidents_month?.toLocaleString() || 0}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <TrendingUp className="size-3 text-blue-500" />
                <span>Akumulasi sebulan penuh</span>
              </p>
            </div>
            <div className="size-11 rounded-2xl bg-blue-500/10 text-[#0073ea] flex items-center justify-center font-bold">
              <Layers className="size-5" />
            </div>
          </div>

          {/* Card 2: Total Incidents Selected Day */}
          <div className="bg-white dark:bg-[#0b1120] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Insiden Tanggal ({selectedDate})
              </p>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {summary?.total_incidents_today?.toLocaleString() || 0}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Clock className="size-3 text-amber-500" />
                <span>Frekuensi kejadian harian</span>
              </p>
            </div>
            <div className="size-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <AlertTriangle className="size-5" />
            </div>
          </div>

          {/* Card 3: Top Root Cause Today */}
          <div className="bg-white dark:bg-[#0b1120] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Penyebab Terbanyak Hari Ini
              </p>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate" title={summary?.top_cause_today}>
                {summary?.top_cause_today || "Tidak Ada"}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <span className="font-mono font-bold text-purple-500">{summary?.top_cause_today_count || 0}</span>
                <span>kali kejadian ({selectedDate})</span>
              </p>
            </div>
            <div className="size-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
              <PieIcon className="size-5" />
            </div>
          </div>

          {/* Card 4: Active Outages / Impacted Devices */}
          <div className="bg-white dark:bg-[#0b1120] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Perangkat Offline / Outage
              </p>
              <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {summary?.active_outages || 0}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <XCircle className="size-3 text-rose-500" />
                <span>Memerlukan perhatian teknis</span>
              </p>
            </div>
            <div className="size-11 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <Radio className="size-5" />
            </div>
          </div>
        </div>

        {/* Charts Section: Monthly Trend & Daily Cause Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Monthly Incident Trend Chart (2 columns) */}
          <div className="lg:col-span-2 bg-white dark:bg-[#0b1120] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/70 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="size-4 text-[#0073ea]" />
                    Grafik Tren Insiden Harian ({selectedMonth})
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Frekuensi insiden per hari berdasarkan kategori. Klik batang pada grafik untuk memilih tanggal.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#0073ea] font-medium border border-blue-200/60 dark:border-blue-800/60">
                    Aktif: <strong className="font-mono">{selectedDate}</strong>
                  </span>
                </div>
              </div>

              {/* Chart Canvas */}
              <div className="w-full h-72">
                {monthlyTrend.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                    Tidak ada data tren insiden untuk bulan {selectedMonth}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyTrend}
                      margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                      onClick={(e) => {
                        if (e && e.activeLabel) {
                          setSelectedDate(String(e.activeLabel));
                        }
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        fontSize={10}
                        tickLine={false}
                        tickFormatter={(val) => val.split("-").slice(1).join("/")}
                      />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip content={<TrendTooltip />} />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
                      />
                      <Bar dataKey="cellular" name="Cellular" stackId="a" fill={CAUSE_COLORS.cellular} radius={[0, 0, 0, 0]} cursor="pointer" />
                      <Bar dataKey="cpu_dvr" name="CPU - DVR" stackId="a" fill={CAUSE_COLORS.cpu_dvr} radius={[0, 0, 0, 0]} cursor="pointer" />
                      <Bar dataKey="cpu_modem" name="CPU - Modem" stackId="a" fill={CAUSE_COLORS.cpu_modem} radius={[4, 4, 0, 0]} cursor="pointer" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Quick date selector chips below chart */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/70 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mr-1">
                Pilih Tanggal:
              </span>
              {monthlyTrend.slice(-10).map((pt) => (
                <button
                  key={pt.date}
                  onClick={() => setSelectedDate(pt.date)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors cursor-pointer ${
                    selectedDate === pt.date
                      ? "bg-[#0073ea] text-white font-bold"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {pt.date.split("-")[2]} ({pt.total})
                </button>
              ))}
            </div>
          </div>

          {/* Breakdown of Causes (1 column) */}
          <div className="bg-white dark:bg-[#0b1120] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/70 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <PieIcon className="size-4 text-purple-500" />
                    Penyebab Gangguan
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {causeViewMode === "day" ? `Kategori insiden tanggal ${selectedDate}` : `Akumulasi bulan ${selectedMonth}`}
                  </p>
                </div>
                <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg text-[10px] font-semibold">
                  <button
                    onClick={() => setCauseViewMode("day")}
                    className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                      causeViewMode === "day"
                        ? "bg-white dark:bg-slate-700 text-[#0073ea] shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    Hari Ini
                  </button>
                  <button
                    onClick={() => setCauseViewMode("month")}
                    className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                      causeViewMode === "month"
                        ? "bg-white dark:bg-slate-700 text-[#0073ea] shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    Sebulan
                  </button>
                </div>
              </div>

              {/* Causes Progress Bar List */}
              <div className="space-y-4">
                {activeCauses.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">
                    Tidak ada insiden tercatat pada periode ini
                  </p>
                ) : (
                  activeCauses.map((cause) => {
                    const barColor = cause.color || CAUSE_COLORS[cause.metric] || "#64748b";
                    return (
                      <div key={cause.metric} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <span className="size-2 rounded-full" style={{ backgroundColor: barColor }} />
                            <span>{cause.title}</span>
                          </span>
                          <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-white">
                            {cause.count.toLocaleString()} <span className="text-slate-400 font-normal">({cause.percentage}%)</span>
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${cause.percentage}%`, backgroundColor: barColor }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">
                          {cause.description}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Most Impacted Gateway Card */}
            <div className="mt-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                <span className="font-semibold uppercase tracking-wider">Gateway Paling Banyak Gangguan</span>
                <span className="font-mono font-bold text-rose-500">
                  {summary?.most_affected_gateway?.incident_count || 0} Insiden
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {summary?.most_affected_gateway?.gateway_id} &bull; {summary?.most_affected_gateway?.location}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Client: {summary?.most_affected_gateway?.client_name}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs for Tables: Offline Devices vs All Incident Records */}
        <div className="bg-white dark:bg-[#0b1120] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl shadow-xs overflow-hidden">
          {/* Sub Header & Search Bar */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "overview"
                    ? "bg-[#0073ea] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Perangkat Offline & Outage ({filteredOfflineDevices.length})
              </button>
              <button
                onClick={() => setActiveTab("incidents")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "incidents"
                    ? "bg-[#0073ea] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Daftar Riwayat Insiden ({incidentItems.length})
              </button>
            </div>

            {/* Table Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Gateway ID, lokasi, atau penyebab..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-[#0073ea]"
              />
            </div>
          </div>

          {/* TAB 1: Offline Gateways Table */}
          {activeTab === "overview" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Gateway ID</th>
                    <th className="py-3 px-4">Lokasi & Klien</th>
                    <th className="py-3 px-4">Model Hardware</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Penyebab Gangguan (Root Cause)</th>
                    <th className="py-3 px-4">Komponen Bermasalah</th>
                    <th className="py-3 px-4">Durasi / Uptime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredOfflineDevices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                        Tidak ada perangkat offline yang terdeteksi pada kriteria pencarian ini
                      </td>
                    </tr>
                  ) : (
                    filteredOfflineDevices.map((dev) => (
                      <tr
                        key={dev.gateway_id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {dev.gateway_id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{dev.location}</div>
                          <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.2 rounded-sm bg-blue-50 dark:bg-blue-950/40 text-[#0073ea] font-medium border border-blue-200/50">
                            {dev.client_name}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px]">
                          {dev.hardware_type}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                            <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                            {dev.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-xs">
                          {dev.primary_cause}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                            style={{
                              backgroundColor: `${CAUSE_COLORS[dev.root_cause_metric] || "#64748b"}15`,
                              borderColor: `${CAUSE_COLORS[dev.root_cause_metric] || "#64748b"}40`,
                              color: CAUSE_COLORS[dev.root_cause_metric] || "#64748b",
                            }}
                          >
                            {dev.root_cause_metric.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {dev.uptime}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: Incidents List Table */}
          {activeTab === "incidents" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Waktu (WIB)</th>
                    <th className="py-3 px-4">Gateway ID</th>
                    <th className="py-3 px-4">Lokasi & Klien</th>
                    <th className="py-3 px-4">Komponen</th>
                    <th className="py-3 px-4">Judul & Keterangan Insiden</th>
                    <th className="py-3 px-4">Durasi</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {incidentItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                        Tidak ada riwayat insiden untuk tanggal {selectedDate}
                      </td>
                    </tr>
                  ) : (
                    incidentItems.map((inc) => (
                      <tr
                        key={inc.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap">
                          {inc.start_time_wib || "-"}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {inc.gateway_id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{inc.location}</div>
                          <span className="text-[10px] text-slate-400">{inc.client_name}</span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                            style={{
                              backgroundColor: `${CAUSE_COLORS[inc.metric] || "#64748b"}15`,
                              borderColor: `${CAUSE_COLORS[inc.metric] || "#64748b"}40`,
                              color: CAUSE_COLORS[inc.metric] || "#64748b",
                            }}
                          >
                            {inc.metric.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-sm">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{inc.title}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{inc.description}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {inc.duration}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              inc.status === "ACTIVE"
                                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60"
                                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60"
                            }`}
                          >
                            {inc.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
