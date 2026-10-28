"use client";

import React, { useState, useRef, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useHealthReport,
  IHealthReportFilters,
  IHealthReportItem,
  exportHealthReportCsvUrl,
} from "@/store/api/monitoring";
import {
  DataTable,
  ColumnDef,
  FilterHeader,
  IFilterConfig,
} from "@/components/ui";
import { HealthReportDetailCard } from "@/components/reports/health/HealthReportDetailCard";
import { MoreHorizontal, Cpu } from "lucide-react";

export default function ReportHealthPage() {
  const [filters, setFilters] = useState<IHealthReportFilters>({
    search: "",
    type: "Semua Tipe",
    location: "Semua Lokasi",
    date_range: "01 Oct 2026 - 31 Oct 2026",
    page: 1,
    pageSize: 10,
  });

  const [selectedGateways, setSelectedGateways] = useState<string[]>([]);
  const [selectedGatewayId, setSelectedGatewayId] = useState<string | null>(null);

  const detailRef = useRef<HTMLDivElement>(null);

  // Fetch real-time telemetry from Python backend (FastAPI)
  const { data: reportData, isLoading } = useHealthReport(filters);

  const gateways = reportData?.gateways || [];
  const pagination = reportData?.pagination;

  const handleFilterChange = (key: keyof IHealthReportFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === "page" ? value : 1, // Reset to page 1 on filter changes
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setFilters((prev) => ({ ...prev, pageSize, page: 1 }));
  };

  const toggleSelectAll = () => {
    if (selectedGateways.length === gateways.length) {
      setSelectedGateways([]);
    } else {
      setSelectedGateways(gateways.map((g) => g.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedGateways((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectGateway = (gateway: IHealthReportItem) => {
    setSelectedGatewayId(gateway.id);
    setTimeout(() => {
      detailRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 120);
  };

  const handleExport = () => {
    const url = exportHealthReportCsvUrl(filters);
    window.open(url, "_blank");
  };

  const isAllSelected =
    gateways.length > 0 && gateways.every((g) => selectedGateways.includes(g.id));

  // Global FilterHeader configs
  const filterConfigs: IFilterConfig[] = [
    {
      id: "type",
      value: filters.type || "Semua Tipe",
      onChange: (val) => handleFilterChange("type", val),
      options: [
        { label: "Semua Tipe", value: "Semua Tipe" },
        { label: "SmartBox Hitam", value: "SmartBox Hitam" },
        { label: "SmartBox Putih", value: "SmartBox Putih" },
      ],
    },
    {
      id: "location",
      value: filters.location || "Semua Lokasi",
      onChange: (val) => handleFilterChange("location", val),
      options: [
        { label: "Semua Lokasi", value: "Semua Lokasi" },
        { label: "Alfa Mart", value: "Alfa" },
        { label: "Indomaret", value: "IDM" },
        { label: "SPBU", value: "SPBU" },
        { label: "Cileungsi", value: "Cileungsi" },
        { label: "Cinere", value: "Cinere" },
        { label: "Sawangan", value: "Sawangan" },
      ],
    },
  ];

  // Helper colors
  const getLoadBarColor = (pct: number) => {
    if (pct >= 80) return "bg-[#e2445c]";
    if (pct >= 60) return "bg-[#fdab3d]";
    return "bg-[#00c875]";
  };

  const getSdStatusBadge = (status: string) => {
    if (status === "Good") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-[#00c875] border border-emerald-500/25">
          Good
        </span>
      );
    }
    if (status === "Caution") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-[#fdab3d] border border-amber-500/25">
          Caution
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-[#e2445c] border border-rose-500/25">
        Poor
      </span>
    );
  };

  // Table Columns Definition matching report structure
  const columns = useMemo<ColumnDef<IHealthReportItem>[]>(
    () => [
      {
        id: "no",
        header: "No.",
        align: "center",
        cell: (gw) => <span className="text-slate-500 dark:text-slate-400">{gw.no}</span>,
      },
      {
        id: "id",
        header: "Gateway ID",
        cell: (gw) => (
          <span className="font-bold text-slate-900 dark:text-white whitespace-nowrap">
            {gw.id}
          </span>
        ),
      },
      {
        id: "location",
        header: "Lokasi",
        cell: (gw) => (
          <span className="text-slate-800 dark:text-slate-200 whitespace-nowrap">
            {gw.location}
          </span>
        ),
      },
      {
        id: "type",
        header: "Tipe",
        cell: (gw) => {
          const isBlack = gw.type.includes("Hitam");
          return (
            <div className="flex items-center gap-2">
              <div
                className={`size-5 rounded flex items-center justify-center shrink-0 border ${
                  isBlack
                    ? "bg-slate-900 border-slate-700 text-white"
                    : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700"
                }`}
              >
                <div
                  className={`w-3 h-1.5 rounded-xs ${
                    isBlack ? "bg-slate-700" : "bg-white"
                  }`}
                />
              </div>
              <span className="text-slate-700 dark:text-slate-300 text-[11px]">
                {isBlack ? "Hitam" : "Putih"}
              </span>
            </div>
          );
        },
      },
      {
        id: "cpu_avg",
        header: "Rata-rata",
        cell: (gw) => (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <div className="w-8 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0">
              <div
                className={`h-full ${getLoadBarColor(gw.cpu_avg)}`}
                style={{ width: `${Math.min(100, gw.cpu_avg)}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300">
              {gw.cpu_avg}%
            </span>
          </div>
        ),
      },
      {
        id: "cpu_peak",
        header: "Puncak",
        align: "center",
        cell: (gw) => (
          <span
            className={`font-bold whitespace-nowrap ${
              gw.cpu_max >= 85
                ? "text-[#e2445c]"
                : gw.cpu_max >= 65
                ? "text-[#fdab3d]"
                : "text-slate-800 dark:text-slate-200"
            }`}
          >
            {gw.cpu_max}%
          </span>
        ),
      },
      {
        id: "cpu_throttle_count",
        header: "Throttle",
        align: "center",
        cell: (gw) => (
          <span
            className={`font-semibold whitespace-nowrap ${
              gw.cpu_gt_80_duration !== "0m" && gw.cpu_gt_80_duration !== "0h"
                ? "text-[#e2445c]"
                : "text-slate-400"
            }`}
          >
            {gw.cpu_gt_80_duration}
          </span>
        ),
      },
      {
        id: "ram_avg",
        header: "Rata-rata",
        cell: (gw) => (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <div className="w-8 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0">
              <div
                className={`h-full ${getLoadBarColor(gw.ram_avg)}`}
                style={{ width: `${Math.min(100, gw.ram_avg)}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300">
              {gw.ram_avg}%
            </span>
          </div>
        ),
      },
      {
        id: "ram_peak",
        header: "Puncak",
        align: "center",
        cell: (gw) => (
          <span
            className={`font-bold whitespace-nowrap ${
              gw.ram_max >= 85
                ? "text-[#e2445c]"
                : gw.ram_max >= 70
                ? "text-[#fdab3d]"
                : "text-slate-800 dark:text-slate-200"
            }`}
          >
            {gw.ram_max}%
          </span>
        ),
      },
      {
        id: "ram_oom_count",
        header: "OOM",
        align: "center",
        cell: (gw) => (
          <span
            className={`font-semibold whitespace-nowrap ${
              gw.ram_gt_80_duration !== "0m" && gw.ram_gt_80_duration !== "0h"
                ? "text-[#e2445c]"
                : "text-slate-400"
            }`}
          >
            {gw.ram_gt_80_duration}
          </span>
        ),
      },
      {
        id: "sd_usage_avg",
        header: "Rata-rata",
        align: "center",
        cell: (gw) => (
          <span className="text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap text-[11px]">
            {gw.sd_avg}%
          </span>
        ),
      },
      {
        id: "sd_usage_peak",
        header: "Puncak",
        align: "center",
        cell: (gw) => (
          <span
            className={`font-bold whitespace-nowrap ${
              gw.sd_max >= 90
                ? "text-[#e2445c]"
                : gw.sd_max >= 75
                ? "text-[#fdab3d]"
                : "text-slate-800 dark:text-slate-200"
            }`}
          >
            {gw.sd_max}%
          </span>
        ),
      },
      {
        id: "sd_usage_free",
        header: "Free Space",
        align: "center",
        cell: (gw) => (
          <span className="text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap text-[11px]">
            {gw.sd_gt_90_duration}
          </span>
        ),
      },
      {
        id: "sd_wear_level",
        header: "Wear Level",
        align: "center",
        cell: (gw) => (
          <span
            className={`font-mono whitespace-nowrap font-medium ${
              gw.sd_life_pct <= 20
                ? "text-[#e2445c]"
                : gw.sd_life_pct <= 40
                ? "text-[#fdab3d]"
                : "text-[#00c875]"
            }`}
          >
            {gw.sd_life_pct}%
          </span>
        ),
      },
      {
        id: "sd_health_status",
        header: "Status",
        align: "center",
        cell: (gw) => getSdStatusBadge(gw.sd_health_status),
      },
      {
        id: "temp_avg",
        header: "Rata-rata",
        align: "center",
        cell: (gw) => (
          <span className="text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
            {gw.temp_avg}&deg;C
          </span>
        ),
      },
      {
        id: "temp_peak",
        header: "Puncak",
        align: "center",
        cell: (gw) => (
          <span
            className={`font-bold whitespace-nowrap ${
              gw.temp_max >= 70
                ? "text-[#e2445c]"
                : gw.temp_max >= 60
                ? "text-[#fdab3d]"
                : "text-[#00c875]"
            }`}
          >
            {gw.temp_max}&deg;C
          </span>
        ),
      },
      {
        id: "incident_count",
        header: "Jumlah Event",
        align: "center",
        cell: (gw) => (
          <span
            className={`font-bold whitespace-nowrap ${
              gw.jumlah_event > 0 ? "text-[#e2445c]" : "text-slate-400"
            }`}
          >
            {gw.jumlah_event} event
          </span>
        ),
      },
      {
        id: "incident_last_offline",
        header: "Uptime",
        cell: (gw) => (
          <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
            {gw.uptime_duration}
          </span>
        ),
      },
      {
        id: "action",
        header: "Action",
        align: "center",
        cell: () => (
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <MoreHorizontal className="size-4" />
          </button>
        ),
      },
    ],
    []
  );

  // Grouped Multi-level 2-Tier Header for DataTable
  const customHeaderRow = (
    <>
      <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#0e1628]/80 text-slate-500 dark:text-slate-400 font-semibold">
        <th rowSpan={2} className="py-2.5 px-3 w-10 text-center border-r border-slate-200/60 dark:border-slate-800/60">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={toggleSelectAll}
            className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0073ea] focus:ring-[#0073ea] size-3.5 cursor-pointer"
          />
        </th>
        <th rowSpan={2} className="py-2.5 px-2.5 w-10 text-center border-r border-slate-200/60 dark:border-slate-800/60">
          No.
        </th>
        <th rowSpan={2} className="py-2.5 px-3 whitespace-nowrap border-r border-slate-200/60 dark:border-slate-800/60">
          Gateway ID
        </th>
        <th rowSpan={2} className="py-2.5 px-4 whitespace-nowrap border-r border-slate-200/60 dark:border-slate-800/60">
          Lokasi
        </th>
        <th rowSpan={2} className="py-2.5 px-3 whitespace-nowrap border-r border-slate-200/60 dark:border-slate-800/60">
          Tipe
        </th>

        {/* Group 1: CPU */}
        <th
          colSpan={3}
          className="py-2 px-3 text-center border-r border-slate-200/60 dark:border-slate-800/60 font-bold text-slate-800 dark:text-slate-200 bg-slate-100/40 dark:bg-slate-800/30"
        >
          CPU
        </th>

        {/* Group 2: RAM */}
        <th
          colSpan={3}
          className="py-2 px-3 text-center border-r border-slate-200/60 dark:border-slate-800/60 font-bold text-slate-800 dark:text-slate-200 bg-slate-100/40 dark:bg-slate-800/30"
        >
          RAM
        </th>

        {/* Group 3: SD Card Usage */}
        <th
          colSpan={3}
          className="py-2 px-3 text-center border-r border-slate-200/60 dark:border-slate-800/60 font-bold text-slate-800 dark:text-slate-200 bg-slate-100/40 dark:bg-slate-800/30"
        >
          SD Card Usage
        </th>

        {/* Group 4: SD Card Health */}
        <th
          colSpan={2}
          className="py-2 px-3 text-center border-r border-slate-200/60 dark:border-slate-800/60 font-bold text-slate-800 dark:text-slate-200 bg-slate-100/40 dark:bg-slate-800/30"
        >
          SD Card Health
        </th>

        {/* Group 5: Suhu Sistem */}
        <th
          colSpan={2}
          className="py-2 px-3 text-center border-r border-slate-200/60 dark:border-slate-800/60 font-bold text-slate-800 dark:text-slate-200 bg-slate-100/40 dark:bg-slate-800/30"
        >
          Suhu Sistem
        </th>

        {/* Individual Trailing Columns */}
        <th rowSpan={2} className="py-2.5 px-3 text-center whitespace-nowrap border-r border-slate-200/60 dark:border-slate-800/60 font-bold">
          Jumlah Event
        </th>
        <th rowSpan={2} className="py-2.5 px-3.5 whitespace-nowrap border-r border-slate-200/60 dark:border-slate-800/60">
          Terakhir Spike
        </th>
        <th rowSpan={2} className="py-2.5 px-2 text-center whitespace-nowrap">
          Action
        </th>
      </tr>

      {/* Level 2 Sub-headers */}
      <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0e1628]/60 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
        {/* Under CPU */}
        <th className="py-2 px-2.5 text-center">Rata-rata</th>
        <th className="py-2 px-2.5 text-center">Puncak</th>
        <th className="py-2 px-2.5 text-center border-r border-slate-200/60 dark:border-slate-800/60">
          Throttle
        </th>

        {/* Under RAM */}
        <th className="py-2 px-2.5 text-center">Rata-rata</th>
        <th className="py-2 px-2.5 text-center">Puncak</th>
        <th className="py-2 px-2.5 text-center border-r border-slate-200/60 dark:border-slate-800/60">
          OOM
        </th>

        {/* Under SD Card Usage */}
        <th className="py-2 px-2.5 text-center">Rata-rata</th>
        <th className="py-2 px-2.5 text-center">Puncak</th>
        <th className="py-2 px-2.5 text-center border-r border-slate-200/60 dark:border-slate-800/60">
          Free Space
        </th>

        {/* Under SD Card Health */}
        <th className="py-2 px-2.5 text-center">Wear Level</th>
        <th className="py-2 px-2.5 text-center border-r border-slate-200/60 dark:border-slate-800/60">
          Status
        </th>

        {/* Under Suhu Sistem */}
        <th className="py-2 px-2.5 text-center">Rata-rata</th>
        <th className="py-2 px-2.5 text-center border-r border-slate-200/60 dark:border-slate-800/60">
          Puncak
        </th>
      </tr>
    </>
  );

  return (
    <AppLayout title="Report System Health">
      <div className="space-y-4 max-w-[1600px] mx-auto pb-12 font-sans transition-colors">
        {/* 1. Global Filter Header with Multi-Filters & CSV Export */}
        <FilterHeader
          title="Daftar Semua Gateway"
          titleIcon={Cpu}
          totalCount={pagination?.total_items ?? 2000}
          search={filters.search || ""}
          onSearchChange={(val) => handleFilterChange("search", val)}
          searchPlaceholder="Cari Gateway ID / Lokasi..."
          filters={filterConfigs}
          timeframe={filters.date_range || "01 Oct 2026 - 31 Oct 2026"}
          onTimeframeClick={() => {}}
          onExportClick={handleExport}
        />

        {/* 2. Global DataTable with Grouped Multi-Level Telemetry Header */}
        <DataTable
          data={gateways}
          columns={columns}
          keyField="id"
          enableSelection
          selectedIds={selectedGateways}
          onToggleSelectAll={toggleSelectAll}
          onToggleSelectOne={toggleSelectOne}
          selectedRowId={selectedGatewayId}
          onRowClick={handleSelectGateway}
          pagination={pagination}
          currentPage={filters.page || 1}
          pageSize={filters.pageSize || 10}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          customHeaderRow={customHeaderRow}
          isLoading={isLoading}
        />

        {/* 3. Detail Performa Gateway - Muncul di bawah saat baris diklik */}
        {selectedGatewayId && (
          <div ref={detailRef} className="pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <HealthReportDetailCard
              gatewayId={selectedGatewayId}
              dateRange={filters.date_range}
              onClose={() => setSelectedGatewayId(null)}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
