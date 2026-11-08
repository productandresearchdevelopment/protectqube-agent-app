"use client";

import React, { useState, useRef, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useHealthReport,
  IHealthReportFilters,
  IHealthReportItem,
  exportHealthReportExcelUrl,
  downloadReportFile,
} from "@/store/api/monitoring";
import {
  DataTable,
  ColumnDef,
  FilterHeader,
  IFilterConfig,
} from "@/components/ui";
import { HealthReportDetailCard } from "@/components/reports/health/HealthReportDetailCard";
import { Cpu } from "lucide-react";
import { getCurrentMonthPeriodStr } from "@/lib/reportPeriodUtils";

export default function ReportHealthPage() {
  const [filters, setFilters] = useState<IHealthReportFilters>({
    search: "",
    type: "All Types",
    date_range: getCurrentMonthPeriodStr(),

    page: 1,
    pageSize: 50,
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

  const [isExporting, setIsExporting] = useState(false);
  const handleExport = async () => {
    try {
      setIsExporting(true);
      const url = exportHealthReportExcelUrl(filters);
      await downloadReportFile(url, "health_report.xlsx");
    } catch (err) {
      console.error("Export health report error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const isAllSelected =
    gateways.length > 0 && gateways.every((g) => selectedGateways.includes(g.id));

  // Global FilterHeader configs
  const filterConfigs: IFilterConfig[] = [
    {
      id: "type",
      value: filters.type || "All Types",
      onChange: (val) => handleFilterChange("type", val),
      options: [
        { label: "All Types", value: "All Types" },
        { label: "SmartBox Black", value: "SmartBox Hitam" },
        { label: "SmartBox White", value: "SmartBox Putih" },
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
    if (status === "Warning" || status === "Caution") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-[#fdab3d] border border-amber-500/25">
          Warning
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-[#e2445c] border border-rose-500/25">
        Critical
      </span>
    );
  };

  // Table Columns Definition matching report structure
  const columns = useMemo<ColumnDef<IHealthReportItem>[]>(
    () => [
      {
        id: "location",
        header: "Location",
        cell: (gw) => (
          <span className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
            {gw.location}
          </span>
        ),
      },
      {
        id: "tipe",
        header: "Type",
        className: "border-r-2 border-slate-300 dark:border-slate-700/80",
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
                {isBlack ? "Black" : "White"}
              </span>
            </div>
          );
        },
      },
      // Group 1: CPU (Apple Blue Group)
      {
        id: "cpu_avg",
        header: "Average",
        className: "bg-blue-500/[0.025] dark:bg-blue-500/[0.04]",
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
        header: "Peak",
        align: "center",
        className: "bg-blue-500/[0.025] dark:bg-blue-500/[0.04]",
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
        className: "bg-blue-500/[0.025] dark:bg-blue-500/[0.04] border-r-2 border-r-blue-300 dark:border-r-blue-700/80",
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
      // Group 2: RAM (Apple Teal Group)
      {
        id: "ram_avg",
        header: "Average",
        className: "bg-teal-500/[0.025] dark:bg-teal-500/[0.04]",
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
        header: "Peak",
        align: "center",
        className: "bg-teal-500/[0.025] dark:bg-teal-500/[0.04] border-r-2 border-r-teal-300 dark:border-r-teal-700/80",
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
      // Group 3: Storage Usage (Apple Amber Group)
      {
        id: "sd_usage_avg",
        header: "Average",
        align: "center",
        className: "bg-amber-500/[0.025] dark:bg-amber-500/[0.04]",
        cell: (gw) => (
          <span className="text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap text-[11px]">
            {gw.sd_avg}%
          </span>
        ),
      },
      {
        id: "sd_usage_peak",
        header: "Peak",
        align: "center",
        className: "bg-amber-500/[0.025] dark:bg-amber-500/[0.04] border-r-2 border-r-amber-300 dark:border-r-amber-700/80",
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
      // Group 4: Storage Health (Apple Emerald Group)
      {
        id: "sd_wear_level",
        header: "Health",
        align: "center",
        className: "bg-emerald-500/[0.025] dark:bg-emerald-500/[0.04]",
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
        className: "bg-emerald-500/[0.025] dark:bg-emerald-500/[0.04] border-r-2 border-r-emerald-300 dark:border-r-emerald-700/80",
        cell: (gw) => getSdStatusBadge(gw.sd_health_status),
      },
      // Group 5: System Temperature (Apple Rose Group)
      {
        id: "temp_avg",
        header: "Average",
        align: "center",
        className: "bg-rose-500/[0.025] dark:bg-rose-500/[0.04]",
        cell: (gw) => (
          <span className="text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
            {gw.temp_avg}&deg;C
          </span>
        ),
      },
      {
        id: "temp_peak",
        header: "Peak",
        align: "center",
        className: "bg-rose-500/[0.025] dark:bg-rose-500/[0.04] border-r-2 border-r-rose-300 dark:border-r-rose-700/80",
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
      /* Sementara di-comment (Periode Gangguan / Total Events & Uptime):
      // Trailing Group: Periode Gangguan (Apple Purple Group)
      {
        id: "incident_count",
        header: "Total Events",
        align: "center",
        className: "bg-purple-500/[0.025] dark:bg-purple-500/[0.04]",
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
        className: "bg-purple-500/[0.025] dark:bg-purple-500/[0.04] border-r-2 border-r-purple-300 dark:border-r-purple-700/80",
        cell: (gw) => (
          <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
            {gw.uptime_duration}
          </span>
        ),
      },
      */
    ],
    []
  );

  // Grouped Multi-level 2-Tier Header for DataTable
  const customHeaderRow = (
    <>
      <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-100 dark:bg-[#0e1628] text-slate-700 dark:text-slate-200 font-semibold text-xs">
        <th rowSpan={2} className="py-2.5 px-3 w-10 text-center border-r border-slate-200/60 dark:border-slate-800/60">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={toggleSelectAll}
            className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0073ea] focus:ring-[#0073ea] size-3.5 cursor-pointer"
          />
        </th>
        <th rowSpan={2} className="py-2.5 px-4 whitespace-nowrap border-r border-slate-200/60 dark:border-slate-800/60">
          Location
        </th>
        <th rowSpan={2} className="py-2.5 px-3 whitespace-nowrap border-r-2 border-r-slate-300 dark:border-r-slate-700/80">
          Type
        </th>

        {/* Group 1: CPU (Apple Blue Group) */}
        <th
          colSpan={3}
          className="py-2 px-3 text-center border-r-2 border-r-blue-300 dark:border-r-blue-700 font-bold text-blue-900 dark:text-blue-200 bg-[#edf4ff] dark:bg-[#0c1e3d] border-b border-b-blue-200 dark:border-b-blue-800/60"
        >
          CPU
        </th>

        {/* Group 2: RAM (Apple Teal Group) */}
        <th
          colSpan={2}
          className="py-2 px-3 text-center border-r-2 border-r-teal-300 dark:border-r-teal-700 font-bold text-teal-900 dark:text-teal-200 bg-[#e6fbf5] dark:bg-[#062422] border-b border-b-teal-200 dark:border-b-teal-800/60"
        >
          RAM
        </th>

        {/* Group 3: Storage Usage (Apple Amber Group) */}
        <th
          colSpan={2}
          className="py-2 px-3 text-center border-r-2 border-r-amber-300 dark:border-r-amber-700 font-bold text-amber-900 dark:text-amber-200 bg-[#fffbeb] dark:bg-[#261705] border-b border-b-amber-200 dark:border-b-amber-800/60"
        >
          Storage Usage
        </th>

        {/* Group 4: Storage Health (Apple Emerald Group) */}
        <th
          colSpan={2}
          className="py-2 px-3 text-center border-r-2 border-r-emerald-300 dark:border-r-emerald-700 font-bold text-emerald-900 dark:text-emerald-200 bg-[#f0fdf4] dark:bg-[#05210f] border-b border-b-emerald-200 dark:border-b-emerald-800/60"
        >
          Storage Health
        </th>

        {/* Group 5: System Temperature (Apple Rose Group) */}
        <th
          colSpan={2}
          className="py-2 px-3 text-center border-r-2 border-r-rose-300 dark:border-r-rose-700 font-bold text-rose-900 dark:text-rose-200 bg-[#fff1f2] dark:bg-[#2d0f14] border-b border-b-rose-200 dark:border-b-rose-800/60"
        >
          System Temperature
        </th>

        {/* Sementara di-comment (Total Events & Uptime):
        <th rowSpan={2} className="py-2.5 px-3 text-center whitespace-nowrap border-r border-purple-200/60 dark:border-purple-900/50 font-bold bg-[#f5f0ff] dark:bg-[#1a0f30] text-purple-900 dark:text-purple-200">
          Total Events
        </th>
        <th rowSpan={2} className="py-2.5 px-3.5 whitespace-nowrap border-r-2 border-r-purple-300 dark:border-r-purple-700 bg-[#f5f0ff] dark:bg-[#1a0f30] text-purple-900 dark:text-purple-200">
          Uptime
        </th>
        */}
      </tr>

      {/* Level 2 Sub-headers */}
      <tr className="border-b border-slate-200/80 dark:border-slate-800/80 text-[11px] font-semibold">
        {/* Under CPU (Blue Sub-headers) */}
        <th className="py-2 px-2.5 text-center text-blue-900 dark:text-blue-200 bg-[#f4f8ff] dark:bg-[#08152b] border-r border-blue-200/60 dark:border-blue-900/50">Average</th>
        <th className="py-2 px-2.5 text-center text-blue-900 dark:text-blue-200 bg-[#f4f8ff] dark:bg-[#08152b] border-r border-blue-200/60 dark:border-blue-900/50">Peak</th>
        <th className="py-2 px-2.5 text-center text-blue-900 dark:text-blue-200 bg-[#f4f8ff] dark:bg-[#08152b] border-r-2 border-r-blue-300 dark:border-r-blue-700">
          Throttle
        </th>

        {/* Under RAM (Teal Sub-headers) */}
        <th className="py-2 px-2.5 text-center text-teal-900 dark:text-teal-200 bg-[#effcf8] dark:bg-[#041a18] border-r border-teal-200/60 dark:border-teal-900/50">Average</th>
        <th className="py-2 px-2.5 text-center text-teal-900 dark:text-teal-200 bg-[#effcf8] dark:bg-[#041a18] border-r-2 border-r-teal-300 dark:border-r-teal-700">
          Peak
        </th>

        {/* Under Storage Usage (Amber Sub-headers) */}
        <th className="py-2 px-2.5 text-center text-amber-900 dark:text-amber-200 bg-[#fffdf5] dark:bg-[#1a0f02] border-r border-amber-200/60 dark:border-amber-900/50">Average</th>
        <th className="py-2 px-2.5 text-center text-amber-900 dark:text-amber-200 bg-[#fffdf5] dark:bg-[#1a0f02] border-r-2 border-r-amber-300 dark:border-r-amber-700">
          Peak
        </th>

        {/* Under Storage Health (Emerald Sub-headers) */}
        <th className="py-2 px-2.5 text-center text-emerald-900 dark:text-emerald-200 bg-[#f7fef9] dark:bg-[#03170a] border-r border-emerald-200/60 dark:border-emerald-900/50">Health</th>
        <th className="py-2 px-2.5 text-center text-emerald-900 dark:text-emerald-200 bg-[#f7fef9] dark:bg-[#03170a] border-r-2 border-r-emerald-300 dark:border-r-emerald-700">
          Status
        </th>

        {/* Under System Temperature (Rose Sub-headers) */}
        <th className="py-2 px-2.5 text-center text-rose-900 dark:text-rose-200 bg-[#fff5f5] dark:bg-[#1f0a0d] border-r border-rose-200/60 dark:border-rose-900/50">Average</th>
        <th className="py-2 px-2.5 text-center text-rose-900 dark:text-rose-200 bg-[#fff5f5] dark:bg-[#1f0a0d] border-r-2 border-r-rose-300 dark:border-r-rose-700">
          Peak
        </th>
      </tr>
    </>
  );

  return (
    <AppLayout
      title="Report System Health"
      headerRight={
        <FilterHeader
          inline
          search={filters.search || ""}
          onSearchChange={(val) => handleFilterChange("search", val)}
          searchPlaceholder="Search Gateway ID / Location..."
          filters={filterConfigs}
          timeframe={filters.date_range || getCurrentMonthPeriodStr()}

          onDateRangeChange={(range) => handleFilterChange("date_range", range)}
          onExportClick={handleExport}
          exportLoading={isExporting}
        />
      }
    >
      <div className="w-full flex-1 flex flex-col min-h-0 font-sans transition-colors pb-2">
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
          pageSize={filters.pageSize || 50}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          customHeaderRow={customHeaderRow}
          isLoading={isLoading}
          className={selectedGatewayId ? "min-h-125" : "h-[calc(100vh-84px)] flex-1"}
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
