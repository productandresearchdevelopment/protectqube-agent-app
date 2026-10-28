"use client";

import React, { useState, useRef, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useCellularReport,
  ICellularReportFilters,
  ICellularReportItem,
  exportCellularReportCsvUrl,
} from "@/store/api/monitoring";
import {
  DataTable,
  ColumnDef,
  FilterHeader,
  IFilterConfig,
} from "@/components/ui";
import { CellularReportDetailCard } from "@/components/reports/cellular/CellularReportDetailCard";
import { MoreHorizontal, Radio } from "lucide-react";

export default function ReportCellularPage() {
  const [filters, setFilters] = useState<ICellularReportFilters>({
    search: "",
    type: "Semua Tipe",
    provider: "Semua Provider",
    location: "Semua Lokasi",
    date_range: "01 Oct 2026 - 31 Oct 2026",
    page: 1,
    pageSize: 10,
  });

  const [selectedGateways, setSelectedGateways] = useState<string[]>([]);
  const [selectedGatewayId, setSelectedGatewayId] = useState<string | null>(null);

  const detailRef = useRef<HTMLDivElement>(null);

  // Fetch real-time telemetry from Python backend (FastAPI)
  const { data: reportData, isLoading } = useCellularReport(filters);

  const gateways = reportData?.gateways || [];
  const pagination = reportData?.pagination;

  const handleFilterChange = (key: keyof ICellularReportFilters, value: any) => {
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

  const handleSelectGateway = (gateway: ICellularReportItem) => {
    setSelectedGatewayId(gateway.id);
    setTimeout(() => {
      detailRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 120);
  };

  const handleExport = () => {
    const url = exportCellularReportCsvUrl(filters);
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
      id: "provider",
      value: filters.provider || "Semua Provider",
      onChange: (val) => handleFilterChange("provider", val),
      options: [
        { label: "Semua Provider", value: "Semua Provider" },
        { label: "Telkomsel", value: "Telkomsel" },
        { label: "Indosat", value: "Indosat" },
        { label: "XL Axiata", value: "XL Axiata" },
        { label: "Smartfren", value: "Smartfren" },
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

  // Table Columns Definition matching report structure
  const columns = useMemo<ColumnDef<ICellularReportItem>[]>(
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
        id: "modem",
        header: "Modem",
        cell: (gw) => (
          <span className="text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">
            {gw.modem}
          </span>
        ),
      },
      {
        id: "provider",
        header: "Provider",
        cell: (gw) => (
          <span className="text-slate-700 dark:text-slate-300 whitespace-nowrap">
            {gw.provider}
          </span>
        ),
      },
      {
        id: "sim_number",
        header: "No. SIM Card",
        cell: (gw) => (
          <span className="font-mono text-slate-800 dark:text-slate-200 whitespace-nowrap">
            {gw.sim_number}
          </span>
        ),
      },
      {
        id: "cpu_modem_uptime",
        header: "Uptime",
        align: "center",
        cell: (gw) => (
          <span className="font-bold text-[#00c875] whitespace-nowrap">
            {gw.cpu_modem_uptime}
          </span>
        ),
      },
      {
        id: "cpu_modem_offline",
        header: "Offline",
        align: "center",
        cell: (gw) => (
          <span className="font-bold text-[#e2445c] whitespace-nowrap">
            {gw.cpu_modem_offline}
          </span>
        ),
      },
      {
        id: "cpu_modem_success_rate",
        header: "Success Rate",
        align: "center",
        cell: (gw) => (
          <span className="text-slate-800 dark:text-slate-200 whitespace-nowrap">
            {gw.cpu_modem_success_rate}%
          </span>
        ),
      },
      {
        id: "cpu_modem_avg_resp_ms",
        header: "Avg Resp (ms)",
        align: "center",
        cell: (gw) => (
          <span className="text-slate-700 dark:text-slate-300 whitespace-nowrap">
            {gw.cpu_modem_avg_resp_ms}
          </span>
        ),
      },
      {
        id: "network_uptime",
        header: "Uptime",
        align: "center",
        cell: (gw) => (
          <span className="font-bold text-[#00c875] whitespace-nowrap">
            {gw.network_uptime}
          </span>
        ),
      },
      {
        id: "network_offline",
        header: "Offline",
        align: "center",
        cell: (gw) => (
          <span className="font-bold text-[#e2445c] whitespace-nowrap">
            {gw.network_offline}
          </span>
        ),
      },
      {
        id: "network_success_rate",
        header: "Success Rate",
        align: "center",
        cell: (gw) => (
          <span className="font-semibold text-[#00c875] whitespace-nowrap">
            {gw.network_success_rate || "98.5"}%
          </span>
        ),
      },
      {
        id: "network_avg_rsrp",
        header: "Avg RSRP (dBm)",
        align: "center",
        cell: (gw) => (
          <span
            className={`whitespace-nowrap font-medium ${
              gw.network_avg_rsrp > -85
                ? "text-[#00c875]"
                : gw.network_avg_rsrp > -100
                ? "text-[#fdab3d]"
                : "text-[#e2445c]"
            }`}
          >
            {gw.network_avg_rsrp} dBm
          </span>
        ),
      },
      {
        id: "network_avg_temp",
        header: "Avg Suhu (°C)",
        align: "center",
        cell: (gw) => (
          <span
            className={`whitespace-nowrap font-medium ${
              gw.network_avg_temp >= 55
                ? "text-[#e2445c]"
                : gw.network_avg_temp >= 45
                ? "text-[#fdab3d]"
                : "text-slate-700 dark:text-slate-300"
            }`}
          >
            {gw.network_avg_temp}&deg;C
          </span>
        ),
      },
      {
        id: "trouble_events_count",
        header: "Jumlah Event",
        align: "center",
        cell: (gw) => (
          <span
            className={`font-bold whitespace-nowrap ${
              gw.trouble_events_count > 0 ? "text-[#e2445c]" : "text-slate-400"
            }`}
          >
            {gw.trouble_events_count} event
          </span>
        ),
      },
      {
        id: "trouble_last_offline",
        header: "Terakhir Offline",
        cell: (gw) => (
          <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
            {gw.trouble_last_offline}
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
        <th rowSpan={2} className="py-2.5 px-3 whitespace-nowrap border-r border-slate-200/60 dark:border-slate-800/60">
          Modem
        </th>
        <th rowSpan={2} className="py-2.5 px-3 whitespace-nowrap border-r border-slate-200/60 dark:border-slate-800/60">
          Provider
        </th>
        <th rowSpan={2} className="py-2.5 px-4 whitespace-nowrap border-r border-slate-200/60 dark:border-slate-800/60">
          No. SIM Card
        </th>

        {/* Group 1: Komunikasi CPU – Modem */}
        <th
          colSpan={4}
          className="py-2 px-3 text-center border-r border-slate-200/60 dark:border-slate-800/60 font-bold text-slate-800 dark:text-slate-200 bg-slate-100/40 dark:bg-slate-800/30"
        >
          Komunikasi CPU &ndash; Modem
        </th>

        {/* Group 2: Koneksi Jaringan */}
        <th
          colSpan={5}
          className="py-2 px-3 text-center border-r border-slate-200/60 dark:border-slate-800/60 font-bold text-slate-800 dark:text-slate-200 bg-slate-100/40 dark:bg-slate-800/30"
        >
          Koneksi Jaringan
        </th>

        {/* Group 3: Periode Gangguan */}
        <th
          colSpan={2}
          className="py-2 px-3 text-center border-r border-slate-200/60 dark:border-slate-800/60 font-bold text-slate-800 dark:text-slate-200 bg-slate-100/40 dark:bg-slate-800/30"
        >
          Periode Gangguan
        </th>

        <th rowSpan={2} className="py-2.5 px-2 text-center whitespace-nowrap">
          Action
        </th>
      </tr>

      {/* Level 2 Sub-headers */}
      <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0e1628]/60 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
        {/* Under CPU - Modem */}
        <th className="py-2 px-2.5 text-center text-[#00c875]">Uptime</th>
        <th className="py-2 px-2.5 text-center text-[#e2445c]">Offline</th>
        <th className="py-2 px-2.5 text-center whitespace-nowrap">Success Rate</th>
        <th className="py-2 px-2.5 text-center whitespace-nowrap border-r border-slate-200/60 dark:border-slate-800/60">
          Avg Resp (ms)
        </th>

        {/* Under Koneksi Jaringan */}
        <th className="py-2 px-2.5 text-center text-[#00c875]">Uptime</th>
        <th className="py-2 px-2.5 text-center text-[#e2445c]">Offline</th>
        <th className="py-2 px-2.5 text-center whitespace-nowrap text-[#00c875]">Success Rate</th>
        <th className="py-2 px-2.5 text-center whitespace-nowrap">Avg RSRP (dBm)</th>
        <th className="py-2 px-2.5 text-center whitespace-nowrap border-r border-slate-200/60 dark:border-slate-800/60">
          Avg Suhu (&deg;C)
        </th>

        {/* Under Periode Gangguan */}
        <th className="py-2 px-2.5 text-center whitespace-nowrap">Jumlah Event</th>
        <th className="py-2 px-3 whitespace-nowrap border-r border-slate-200/60 dark:border-slate-800/60">
          Terakhir Offline
        </th>
      </tr>
    </>
  );

  return (
    <AppLayout title="Report Cellular Connectivity">
      <div className="space-y-4 max-w-[1600px] mx-auto pb-12 font-sans transition-colors">
        {/* 1. Global Filter Header with Multi-Filters & CSV Export */}
        <FilterHeader
          title="Daftar Semua Gateway"
          titleIcon={Radio}
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
            <CellularReportDetailCard
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
