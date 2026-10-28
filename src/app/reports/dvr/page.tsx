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

export default function ReportDVRPage() {
  const [filters, setFilters] = useState<IDVRReportFilters>({
    search: "",
    type: "Semua Tipe",
    dvr_brand: "Semua Merek DVR",
    location: "Semua Lokasi",
    date_range: "01 Oct 2026 - 31 Oct 2026",
    page: 1,
    pageSize: 10,
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
      value: filters.type || "Semua Tipe",
      onChange: (val) => handleFilterChange("type", val),
      options: [
        { label: "Semua Tipe", value: "Semua Tipe" },
        { label: "SmartBox Hitam", value: "SmartBox Hitam" },
        { label: "SmartBox Putih", value: "SmartBox Putih" },
      ],
    },
    {
      id: "dvr_brand",
      value: filters.dvr_brand || "Semua Merek DVR",
      onChange: (val) => handleFilterChange("dvr_brand", val),
      options: [
        { label: "Semua Merek DVR", value: "Semua Merek DVR" },
        { label: "Hikvision", value: "Hikvision" },
        { label: "Dahua", value: "Dahua" },
        { label: "Uniview", value: "Uniview" },
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
        id: "dvr_model",
        header: "DVR/NVR",
        cell: (gw) => (
          <span className="font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
            {gw.dvr_model}
          </span>
        ),
      },
      {
        id: "cpu_dvr_uptime",
        header: "Uptime",
        align: "center",
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
        cell: (gw) => (
          <span className="text-slate-800 dark:text-slate-200 whitespace-nowrap font-medium">
            {gw.cpu_dvr_success_rate}%
          </span>
        ),
      },
      {
        id: "cpu_dvr_avg_resp_ms",
        header: "Avg Resp (ms)",
        align: "center",
        cell: (gw) => (
          <span className="text-slate-700 dark:text-slate-300 whitespace-nowrap">
            {gw.cpu_dvr_avg_resp_ms}
          </span>
        ),
      },
      {
        id: "kamera_total",
        header: "Total",
        align: "center",
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
        cell: (gw) => (
          <span
            className={`font-bold whitespace-nowrap ${
              gw.kamera_offline > 0 ? "text-[#e2445c]" : "text-slate-400"
            }`}
          >
            {gw.kamera_offline}
          </span>
        ),
      },
      {
        id: "kamera_loss_pct",
        header: "Loss (%)",
        align: "center",
        cell: (gw) => {
          const lossCount = (gw.kamera_offline || 0) + (gw.kamera_no_video || 0);
          const lossPct = Math.round((lossCount / (gw.kamera_total || 1)) * 100);
          return (
            <span
              className={`whitespace-nowrap font-medium ${
                lossPct > 0 ? "text-[#e2445c]" : "text-slate-400"
              }`}
            >
              {lossPct}%
            </span>
          );
        },
      },
      {
        id: "rec_uptime",
        header: "Normal",
        align: "center",
        cell: (gw) => (
          <span className="font-bold text-[#00c875] whitespace-nowrap">
            {gw.rec_uptime}
          </span>
        ),
      },
      {
        id: "rec_tidak_merekam",
        header: "Corrupt",
        align: "center",
        cell: (gw) => (
          <span
            className={`font-bold whitespace-nowrap ${
              gw.rec_tidak_merekam !== "0m" && gw.rec_tidak_merekam !== "0h" ? "text-[#fdab3d]" : "text-slate-400"
            }`}
          >
            {gw.rec_tidak_merekam}
          </span>
        ),
      },
      {
        id: "rec_error",
        header: "Loss",
        align: "center",
        cell: (gw) => (
          <span
            className={`font-bold whitespace-nowrap ${
              gw.rec_error !== "0m" && gw.rec_error !== "0h" ? "text-[#e2445c]" : "text-slate-400"
            }`}
          >
            {gw.rec_error}
          </span>
        ),
      },
      {
        id: "storage_kapasitas",
        header: "Kapasitas",
        align: "center",
        cell: (gw) => (
          <span className="text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap text-[11px]">
            {gw.storage_kapasitas}
          </span>
        ),
      },
      {
        id: "storage_terpakai_pct",
        header: "Terpakai",
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
        header: "Retensi",
        align: "center",
        cell: (gw) => (
          <span className="font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
            {gw.storage_rata_rata}
          </span>
        ),
      },
      {
        id: "jumlah_event",
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
        id: "terakhir_offline",
        header: "Terakhir Offline",
        cell: (gw) => (
          <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
            {gw.terakhir_offline}
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
        <th rowSpan={2} className="py-2.5 px-3.5 whitespace-nowrap border-r border-slate-200/60 dark:border-slate-800/60">
          DVR/NVR
        </th>

        {/* Group 1: Komunikasi CPU – DVR */}
        <th
          colSpan={4}
          className="py-2 px-3 text-center border-r border-slate-200/60 dark:border-slate-800/60 font-bold text-slate-800 dark:text-slate-200 bg-slate-100/40 dark:bg-slate-800/30"
        >
          Komunikasi CPU &ndash; DVR
        </th>

        {/* Group 2: Status Kamera */}
        <th
          colSpan={4}
          className="py-2 px-3 text-center border-r border-slate-200/60 dark:border-slate-800/60 font-bold text-slate-800 dark:text-slate-200 bg-slate-100/40 dark:bg-slate-800/30"
        >
          Status Kamera
        </th>

        {/* Group 3: Status Recording */}
        <th
          colSpan={3}
          className="py-2 px-3 text-center border-r border-slate-200/60 dark:border-slate-800/60 font-bold text-slate-800 dark:text-slate-200 bg-slate-100/40 dark:bg-slate-800/30"
        >
          Status Recording
        </th>

        {/* Group 4: Storage DVR */}
        <th
          colSpan={3}
          className="py-2 px-3 text-center border-r border-slate-200/60 dark:border-slate-800/60 font-bold text-slate-800 dark:text-slate-200 bg-slate-100/40 dark:bg-slate-800/30"
        >
          Storage DVR
        </th>

        {/* Individual Trailing Columns */}
        <th rowSpan={2} className="py-2.5 px-3 text-center whitespace-nowrap border-r border-slate-200/60 dark:border-slate-800/60 font-bold">
          Jumlah Event
        </th>
        <th rowSpan={2} className="py-2.5 px-3.5 whitespace-nowrap border-r border-slate-200/60 dark:border-slate-800/60">
          Terakhir Offline
        </th>
        <th rowSpan={2} className="py-2.5 px-2 text-center whitespace-nowrap">
          Action
        </th>
      </tr>

      {/* Level 2 Sub-headers */}
      <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0e1628]/60 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
        {/* Under CPU - DVR */}
        <th className="py-2 px-2.5 text-center text-[#00c875]">Uptime</th>
        <th className="py-2 px-2.5 text-center text-[#e2445c]">Offline</th>
        <th className="py-2 px-2.5 text-center whitespace-nowrap">Success Rate</th>
        <th className="py-2 px-2.5 text-center whitespace-nowrap border-r border-slate-200/60 dark:border-slate-800/60">
          Avg Resp (ms)
        </th>

        {/* Under Status Kamera */}
        <th className="py-2 px-2 text-center text-[#00d2d3]">Total</th>
        <th className="py-2 px-2 text-center text-[#00c875]">Online</th>
        <th className="py-2 px-2 text-center text-[#e2445c]">Loss</th>
        <th className="py-2 px-2 text-center border-r border-slate-200/60 dark:border-slate-800/60">
          Loss Pct (%)
        </th>

        {/* Under Status Recording */}
        <th className="py-2 px-2.5 text-center text-[#00c875]">Normal</th>
        <th className="py-2 px-2.5 text-center text-[#fdab3d]">Corrupt</th>
        <th className="py-2 px-2.5 text-center text-[#e2445c] border-r border-slate-200/60 dark:border-slate-800/60">
          Loss
        </th>

        {/* Under Storage DVR */}
        <th className="py-2 px-2.5 text-center whitespace-nowrap">Kapasitas</th>
        <th className="py-2 px-2.5 text-center whitespace-nowrap">Terpakai</th>
        <th className="py-2 px-2.5 text-center whitespace-nowrap border-r border-slate-200/60 dark:border-slate-800/60">
          Retensi
        </th>
      </tr>
    </>
  );

  return (
    <AppLayout title="Report DVR & Recording">
      <div className="space-y-4 max-w-[1600px] mx-auto pb-12 font-sans transition-colors">
        {/* 1. Global Filter Header with Multi-Filters & CSV Export */}
        <FilterHeader
          title="Daftar Semua Gateway"
          titleIcon={Video}
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
