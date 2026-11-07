"use client";

import React, { useState, useRef, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useDVRReport,
  IDVRReportFilters,
  IDVRReportItem,
  exportDVRReportCsvUrl,
} from "@/store/api/monitoring";
import {
  DataTable,
  ColumnDef,
  FilterHeader,
  IFilterConfig,
} from "@/components/ui";
import { DVRReportDetailCard } from "@/components/reports/dvr/DVRReportDetailCard";
import { MoreHorizontal, Video } from "lucide-react";
import { getCurrentMonthPeriodStr } from "@/lib/reportPeriodUtils";

export default function ReportDVRPage() {
  const [filters, setFilters] = useState<IDVRReportFilters>({
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
  const { data: reportData, isLoading } = useDVRReport(filters);

  const gateways = reportData?.gateways || [];
  const pagination = reportData?.pagination;

  const handleFilterChange = (key: keyof IDVRReportFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === "page" ? value : 1, // Reset to page 1 on filter change
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

  const handleSelectGateway = (gateway: IDVRReportItem) => {
    setSelectedGatewayId(gateway.id);
    setTimeout(() => {
      detailRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 120);
  };

  const handleExport = () => {
    const url = exportDVRReportCsvUrl(filters);
    window.open(url, "_blank");
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

  // Mini progress bar color for storage
  const getStoragePillColor = (pct: number) => {
    if (pct >= 80) return "bg-[#e2445c]";
    if (pct >= 70) return "bg-[#fdab3d]";
    return "bg-[#00c875]";
  };

  // Table Columns Definition matching report structure
  const columns = useMemo<ColumnDef<IDVRReportItem>[]>(
    () => [
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
        header: "Location",
        cell: (gw) => (
          <span className="text-slate-800 dark:text-slate-200 whitespace-nowrap">
            {gw.location}
          </span>
        ),
      },
      {
        id: "type",
        header: "Type",
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
      {
        id: "dvr_model",
        header: "DVR/NVR",
        className: "border-r-2 border-slate-300 dark:border-slate-700/80",
        cell: (gw) => (
          <span className="font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
            {gw.dvr_model}
          </span>
        ),
      },
      // Group 1: Komunikasi CPU – DVR (Apple Blue Group)
      {
        id: "cpu_dvr_uptime",
        header: "Uptime",
        align: "center",
        className: "bg-blue-500/[0.025] dark:bg-blue-500/[0.04]",
        cell: (gw) => (
          <span className="font-bold text-[#00c875] whitespace-nowrap">
            {gw.cpu_dvr_uptime}
          </span>
        ),
      },
      {
        id: "cpu_dvr_offline",
        header: "Offline",
        align: "center",
        className: "bg-blue-500/[0.025] dark:bg-blue-500/[0.04]",
        cell: (gw) => (
          <span className="font-bold text-[#e2445c] whitespace-nowrap">
            {gw.cpu_dvr_offline}
          </span>
        ),
      },
      {
        id: "cpu_dvr_success_rate",
        header: "Success Rate",
        align: "center",
        className: "bg-blue-500/[0.025] dark:bg-blue-500/[0.04] border-r-2 border-r-blue-300 dark:border-r-blue-700/80",
        cell: (gw) => (
          <span className="text-slate-800 dark:text-slate-200 whitespace-nowrap font-medium">
            {gw.cpu_dvr_success_rate}%
          </span>
        ),
      },
      // Group 2: Camera Status (Apple Cyan Group)
      {
        id: "kamera_total",
        header: "Total",
        align: "center",
        className: "bg-cyan-500/[0.025] dark:bg-cyan-500/[0.04]",
        cell: (gw) => (
          <span className="font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
            {gw.kamera_total}
          </span>
        ),
      },
      {
        id: "kamera_online",
        header: "Online",
        align: "center",
        className: "bg-cyan-500/[0.025] dark:bg-cyan-500/[0.04]",
        cell: (gw) => (
          <span className="font-bold text-[#00c875] whitespace-nowrap">
            {gw.kamera_online}
          </span>
        ),
      },
      {
        id: "kamera_offline",
        header: "Loss",
        align: "center",
        className: "bg-cyan-500/[0.025] dark:bg-cyan-500/[0.04]",
        cell: (gw) => {
          const lossCount =
            gw.kamera_offline !== undefined && gw.kamera_offline !== null
              ? gw.kamera_offline
              : Math.max(0, (gw.kamera_total || 0) - (gw.kamera_online || 0));
          return (
            <span
              className={`font-bold whitespace-nowrap ${
                lossCount > 0 ? "text-[#e2445c]" : "text-slate-400"
              }`}
            >
              {lossCount}
            </span>
          );
        },
      },
      {
        id: "kamera_success_rate",
        header: "Success Rate",
        align: "center",
        className: "bg-cyan-500/[0.025] dark:bg-cyan-500/[0.04] border-r-2 border-r-cyan-300 dark:border-r-cyan-700/80",
        cell: (gw) => {
          const tot = gw.kamera_total || 0;
          const on = gw.kamera_online || 0;
          const sr = tot > 0 ? Number(((on / tot) * 100).toFixed(1)) : 100.0;
          return (
            <span className="text-slate-800 dark:text-slate-200 whitespace-nowrap font-medium">
              {sr}%
            </span>
          );
        },
      },
      // Group 3: Recording Status (Apple Amber Group)
      {
        id: "rec_uptime",
        header: "Record",
        align: "center",
        className: "bg-amber-500/[0.025] dark:bg-amber-500/[0.04]",
        cell: (gw) => (
          <span className="font-bold text-[#00c875] whitespace-nowrap">
            {gw.rec_uptime}
          </span>
        ),
      },
      {
        id: "rec_tidak_merekam",
        header: "Not Record",
        align: "center",
        className: "bg-amber-500/[0.025] dark:bg-amber-500/[0.04]",
        cell: (gw) => (
          <span
            className={`font-bold whitespace-nowrap ${
              gw.rec_tidak_merekam !== "0m" && gw.rec_tidak_merekam !== "0h" ? "text-[#e2445c]" : "text-slate-400"
            }`}
          >
            {gw.rec_tidak_merekam}
          </span>
        ),
      },
      {
        id: "rec_success_rate",
        header: "Success Rate",
        align: "center",
        className: "bg-amber-500/[0.025] dark:bg-amber-500/[0.04] border-r-2 border-r-amber-300 dark:border-r-amber-700/80",
        cell: (gw) => {
          const sr = gw.rec_success_rate ?? 100.0;
          return (
            <span className="text-slate-800 dark:text-slate-200 whitespace-nowrap font-medium">
              {sr}%
            </span>
          );
        },
      },
      // Group 4: DVR Storage (Apple Teal Group)
      {
        id: "storage_kapasitas",
        header: "Capacity",
        align: "center",
        className: "bg-teal-500/[0.025] dark:bg-teal-500/[0.04]",
        cell: (gw) => (
          <span className="text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap text-[11px]">
            {gw.storage_kapasitas}
          </span>
        ),
      },
      {
        id: "storage_terpakai_pct",
        header: "Used",
        className: "bg-teal-500/[0.025] dark:bg-teal-500/[0.04]",
        cell: (gw) => (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <div className="w-10 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0">
              <div
                className={`h-full ${getStoragePillColor(gw.storage_terpakai_pct)}`}
                style={{ width: `${Math.min(100, gw.storage_terpakai_pct)}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300">
              {gw.storage_terpakai_pct}%
            </span>
          </div>
        ),
      },
      {
        id: "storage_rata_rata",
        header: "Retention",
        align: "center",
        className: "bg-teal-500/[0.025] dark:bg-teal-500/[0.04] border-r-2 border-r-teal-300 dark:border-r-teal-700/80",
        cell: (gw) => (
          <span className="font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
            {gw.storage_rata_rata}
          </span>
        ),
      },
      // Trailing Group: SLA (Combined: CPU-DVR, Camera Status, Recording Status)
      {
        id: "sla",
        header: "SLA",
        align: "center",
        className: "bg-purple-500/[0.025] dark:bg-purple-500/[0.04] border-r-2 border-r-purple-300 dark:border-r-purple-700/80",
        cell: (gw) => {
          const cpuSr = Number(gw.cpu_dvr_success_rate ?? 100);
          const camTotal = gw.kamera_total ?? 0;
          const camOnline = gw.kamera_online ?? 0;
          const camSr = camTotal > 0 ? (camOnline / camTotal) * 100 : 100;
          const recSr = Number(gw.rec_success_rate ?? 100);
          const calculatedSla = Number(((cpuSr + camSr + recSr) / 3).toFixed(1));
          const finalSla = gw.sla !== undefined ? gw.sla : calculatedSla;

          const isAchieved = finalSla >= 98.0;
          const isWarning = finalSla >= 85.0 && finalSla < 98.0;

          return (
            <div className="flex items-center justify-center">
              <span
                className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full font-bold text-xs font-mono border whitespace-nowrap ${
                  isAchieved
                    ? "bg-[#00c875]/15 text-[#00c875] border-[#00c875]/30"
                    : isWarning
                    ? "bg-[#fdab3d]/15 text-[#fdab3d] border-[#fdab3d]/30"
                    : "bg-[#e2445c]/15 text-[#e2445c] border-[#e2445c]/30"
                }`}
              >
                {finalSla}%
              </span>
            </div>
          );
        },
      },
    ],
    []
  );

  // Grouped Multi-level 2-Tier Header for DataTable
  const customHeaderRow = (
    <>
      <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-100 dark:bg-[#0e1628] text-slate-700 dark:text-slate-200 font-semibold text-xs">
        <th rowSpan={2} className="py-2.5 px-3 w-10 text-center border-r border-slate-200/80 dark:border-slate-800/60 bg-slate-100 dark:bg-[#0e1628]">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={toggleSelectAll}
            className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0073ea] focus:ring-[#0073ea] size-3.5 cursor-pointer"
          />
        </th>
        <th rowSpan={2} className="py-2.5 px-3 whitespace-nowrap border-r border-slate-200/80 dark:border-slate-800/60 bg-slate-100 dark:bg-[#0e1628]">
          Gateway ID
        </th>
        <th rowSpan={2} className="py-2.5 px-4 whitespace-nowrap border-r border-slate-200/80 dark:border-slate-800/60 bg-slate-100 dark:bg-[#0e1628]">
          Location
        </th>
        <th rowSpan={2} className="py-2.5 px-3 whitespace-nowrap border-r border-slate-200/80 dark:border-slate-800/60 bg-slate-100 dark:bg-[#0e1628]">
          Type
        </th>
        <th rowSpan={2} className="py-2.5 px-3.5 whitespace-nowrap border-r-2 border-r-slate-300 dark:border-r-slate-700/80 bg-slate-100 dark:bg-[#0e1628]">
          DVR/NVR
        </th>

        {/* Group 1: Komunikasi CPU – DVR (Apple Blue) */}
        <th
          colSpan={3}
          className="py-2 px-3 text-center border-r-2 border-r-blue-300 dark:border-r-blue-700 font-bold text-blue-900 dark:text-blue-200 bg-[#edf4ff] dark:bg-[#0c1e3d] border-b border-b-blue-200 dark:border-b-blue-800/60"
        >
          CPU &ndash; DVR Communication
        </th>

        {/* Group 2: Camera Status (Apple Cyan) */}
        <th
          colSpan={4}
          className="py-2 px-3 text-center border-r-2 border-r-cyan-300 dark:border-r-cyan-700 font-bold text-cyan-900 dark:text-cyan-200 bg-[#e6fbf5] dark:bg-[#062422] border-b border-b-cyan-200 dark:border-b-cyan-800/60"
        >
          Camera Status
        </th>

        {/* Group 3: Recording Status (Apple Amber) */}
        <th
          colSpan={3}
          className="py-2 px-3 text-center border-r-2 border-r-amber-300 dark:border-r-amber-700 font-bold text-amber-900 dark:text-amber-200 bg-[#fffbeb] dark:bg-[#261705] border-b border-b-amber-200 dark:border-b-amber-800/60"
        >
          Recording Status
        </th>

        {/* Group 4: DVR Storage (Apple Teal) */}
        <th
          colSpan={3}
          className="py-2 px-3 text-center border-r-2 border-r-teal-300 dark:border-r-teal-700 font-bold text-teal-900 dark:text-teal-200 bg-[#f0fdf4] dark:bg-[#05210f] border-b border-b-teal-200 dark:border-b-teal-800/60"
        >
          DVR Storage
        </th>

        {/* Individual Trailing Column: SLA (Apple Purple) */}
        <th rowSpan={2} className="py-2.5 px-4 text-center whitespace-nowrap border-r-2 border-r-purple-300 dark:border-r-purple-700 font-bold bg-[#f5f0ff] dark:bg-[#1a0f30] text-purple-900 dark:text-purple-200">
          SLA
        </th>
      </tr>

      {/* Level 2 Sub-headers */}
      <tr className="border-b border-slate-200/80 dark:border-slate-800/80 text-[11px] font-semibold">
        {/* Under CPU - DVR (Blue Sub-headers) */}
        <th className="py-2 px-2.5 text-center text-[#00c875] bg-[#f4f8ff] dark:bg-[#08152b] border-r border-blue-200/60 dark:border-blue-900/50">Uptime</th>
        <th className="py-2 px-2.5 text-center text-[#e2445c] bg-[#f4f8ff] dark:bg-[#08152b] border-r border-blue-200/60 dark:border-blue-900/50">Offline</th>
        <th className="py-2 px-2.5 text-center whitespace-nowrap text-blue-900 dark:text-blue-200 bg-[#f4f8ff] dark:bg-[#08152b] border-r-2 border-r-blue-300 dark:border-r-blue-700">Success Rate</th>

        {/* Under Camera Status (Cyan Sub-headers) */}
        <th className="py-2 px-2 text-center text-[#00d2d3] bg-[#effcf8] dark:bg-[#041a18] border-r border-cyan-200/60 dark:border-cyan-900/50">Total</th>
        <th className="py-2 px-2 text-center text-[#00c875] bg-[#effcf8] dark:bg-[#041a18] border-r border-cyan-200/60 dark:border-cyan-900/50">Online</th>
        <th className="py-2 px-2 text-center text-[#e2445c] bg-[#effcf8] dark:bg-[#041a18] border-r border-cyan-200/60 dark:border-cyan-900/50">Loss</th>
        <th className="py-2 px-2 text-center whitespace-nowrap text-cyan-900 dark:text-cyan-200 bg-[#effcf8] dark:bg-[#041a18] border-r-2 border-r-cyan-300 dark:border-r-cyan-700">
          Success Rate
        </th>

        {/* Under Recording Status (Amber Sub-headers) */}
        <th className="py-2 px-2.5 text-center text-[#00c875] bg-[#fffdf5] dark:bg-[#1a0f02] border-r border-amber-200/60 dark:border-amber-900/50">Record</th>
        <th className="py-2 px-2.5 text-center text-[#e2445c] bg-[#fffdf5] dark:bg-[#1a0f02] border-r border-amber-200/60 dark:border-amber-900/50">Not Record</th>
        <th className="py-2 px-2.5 text-center whitespace-nowrap text-amber-900 dark:text-amber-200 bg-[#fffdf5] dark:bg-[#1a0f02] border-r-2 border-r-amber-300 dark:border-r-amber-700">
          Success Rate
        </th>

        {/* Under DVR Storage (Teal Sub-headers) */}
        <th className="py-2 px-2.5 text-center whitespace-nowrap text-teal-900 dark:text-teal-200 bg-[#f7fef9] dark:bg-[#03170a] border-r border-teal-200/60 dark:border-teal-900/50">Capacity</th>
        <th className="py-2 px-2.5 text-center whitespace-nowrap text-teal-900 dark:text-teal-200 bg-[#f7fef9] dark:bg-[#03170a] border-r border-teal-200/60 dark:border-teal-900/50">Used</th>
        <th className="py-2 px-2.5 text-center whitespace-nowrap text-teal-900 dark:text-teal-200 bg-[#f7fef9] dark:bg-[#03170a] border-r-2 border-r-teal-300 dark:border-r-teal-700">
          Retention
        </th>
      </tr>
    </>
  );

  return (
    <AppLayout
      title="Report DVR & Recording"
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
            <DVRReportDetailCard
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
