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
    pageSize: 50,
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
                {isBlack ? "Hitam" : "Putih"}
              </span>
            </div>
          );
        },
      },
      // Group: Perangkat Modem (Apple Indigo / Slate Group)
      {
        id: "modem_name",
        header: "Nama",
        className: "bg-indigo-500/[0.025] dark:bg-indigo-500/[0.04]",
        cell: (gw) => (
          <span className="text-slate-800 dark:text-slate-200 font-semibold whitespace-nowrap">
            {gw.modem_name || gw.modem || "Quectel EG95 LTE Cat 4"}
          </span>
        ),
      },
      {
        id: "modem_temp",
        header: "Avg Suhu",
        align: "center",
        className: "bg-indigo-500/[0.025] dark:bg-indigo-500/[0.04] border-r-2 border-r-indigo-300 dark:border-r-indigo-700/80",
        cell: (gw) => {
          const temp = gw.modem_temp ?? gw.network_avg_temp ?? 42;
          return (
            <span
              className={`font-semibold whitespace-nowrap ${
                temp >= 65
                  ? "text-[#e2445c]"
                  : temp >= 50
                  ? "text-[#fdab3d]"
                  : "text-slate-800 dark:text-slate-200"
              }`}
            >
              {temp}&deg;C
            </span>
          );
        },
      },
      // Group: Kartu SIM & Kuota (Apple Warm Amber Group)
      {
        id: "provider",
        header: "Provider",
        className: "bg-amber-500/[0.025] dark:bg-amber-500/[0.04]",
        cell: (gw) => (
          <span className="text-slate-800 dark:text-slate-200 whitespace-nowrap font-medium">
            {gw.provider}
          </span>
        ),
      },
      {
        id: "sim_number",
        header: "No. SIM Card",
        className: "bg-amber-500/[0.025] dark:bg-amber-500/[0.04]",
        cell: (gw) => (
          <span className="font-mono text-slate-800 dark:text-slate-200 whitespace-nowrap">
            {gw.sim_number}
          </span>
        ),
      },
      {
        id: "quota_remaining_gb",
        header: "Sisa Kuota",
        align: "center",
        className: "bg-amber-500/[0.025] dark:bg-amber-500/[0.04] border-r-2 border-r-amber-300 dark:border-r-amber-700/80",
        cell: (gw) => {
          if (gw.quota_remaining_gb === undefined || gw.quota_remaining_gb === null) {
            return <span className="text-slate-400 font-mono text-[11px]">-</span>;
          }
          const quota = gw.quota_remaining_gb;
          return (
            <span
              className={`font-mono font-semibold whitespace-nowrap ${
                quota <= 3 ? "text-[#e2445c]" : quota <= 8 ? "text-[#fdab3d]" : "text-[#00c875]"
              }`}
            >
              {quota} GB
            </span>
          );
        },
      },
      // Group 1: Komunikasi CPU – Modem (Apple Blue Tint)
      {
        id: "cpu_modem_uptime",
        header: "Uptime",
        align: "center",
        className: "bg-blue-500/[0.025] dark:bg-blue-500/[0.04]",
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
        className: "bg-blue-500/[0.025] dark:bg-blue-500/[0.04]",
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
        className: "bg-blue-500/[0.025] dark:bg-blue-500/[0.04] border-r-2 border-r-blue-300 dark:border-r-blue-700/80",
        cell: (gw) => (
          <span className="text-slate-800 dark:text-slate-200 whitespace-nowrap">
            {gw.cpu_modem_success_rate}%
          </span>
        ),
      },
      // Group 2: Koneksi Jaringan (Apple Teal Tint)
      {
        id: "network_uptime",
        header: "Uptime",
        align: "center",
        className: "bg-teal-500/[0.025] dark:bg-teal-500/[0.04]",
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
        className: "bg-teal-500/[0.025] dark:bg-teal-500/[0.04]",
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
        className: "bg-teal-500/[0.025] dark:bg-teal-500/[0.04]",
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
        className: "bg-teal-500/[0.025] dark:bg-teal-500/[0.04] border-r-2 border-r-teal-300 dark:border-r-teal-700/80",
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
      // Group 3: Periode Gangguan (Apple Purple Tint)
      {
        id: "trouble_events_count",
        header: "Jumlah Event",
        align: "center",
        className: "bg-purple-500/[0.025] dark:bg-purple-500/[0.04]",
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
        className: "bg-purple-500/[0.025] dark:bg-purple-500/[0.04] border-r-2 border-r-purple-300 dark:border-r-purple-700/80",
        cell: (gw) => (
          <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
            {gw.trouble_last_offline}
          </span>
        ),
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
          Lokasi
        </th>
        <th rowSpan={2} className="py-2.5 px-3 whitespace-nowrap border-r-2 border-r-slate-300 dark:border-r-slate-700/80 bg-slate-100 dark:bg-[#0e1628]">
          Tipe
        </th>

        {/* Group: Perangkat Modem (Apple Indigo / Slate) */}
        <th
          colSpan={2}
          className="py-2 px-3 text-center border-r-2 border-r-indigo-300 dark:border-r-indigo-700/80 font-bold text-indigo-950 dark:text-indigo-200 bg-[#edf0ff] dark:bg-[#12132e] border-b border-b-indigo-200 dark:border-b-indigo-800/60"
        >
          Perangkat Modem
        </th>

        {/* Group: Kartu SIM & Kuota (Apple Warm Amber) */}
        <th
          colSpan={3}
          className="py-2 px-3 text-center border-r-2 border-r-amber-300 dark:border-r-amber-700/80 font-bold text-amber-950 dark:text-amber-200 bg-[#fff8eb] dark:bg-[#261a08] border-b border-b-amber-200 dark:border-b-amber-800/60"
        >
          Kartu SIM & Kuota
        </th>

        {/* Group 1: Komunikasi CPU – Modem (Apple Blue) */}
        <th
          colSpan={3}
          className="py-2 px-3 text-center border-r-2 border-r-blue-300 dark:border-r-blue-700 font-bold text-blue-900 dark:text-blue-200 bg-[#edf4ff] dark:bg-[#0c1e3d] border-b border-b-blue-200 dark:border-b-blue-800/60"
        >
          Komunikasi CPU &ndash; Modem
        </th>

        {/* Group 2: Koneksi Jaringan (Apple Teal) */}
        <th
          colSpan={4}
          className="py-2 px-3 text-center border-r-2 border-r-teal-300 dark:border-r-teal-700 font-bold text-teal-900 dark:text-teal-200 bg-[#e6fbf5] dark:bg-[#062422] border-b border-b-teal-200 dark:border-b-teal-800/60"
        >
          Koneksi Jaringan
        </th>

        {/* Group 3: Periode Gangguan (Apple Purple) */}
        <th
          colSpan={2}
          className="py-2 px-3 text-center border-r-2 border-r-purple-300 dark:border-r-purple-700 font-bold text-purple-900 dark:text-purple-200 bg-[#f5f0ff] dark:bg-[#1a0f30] border-b border-b-purple-200 dark:border-b-purple-800/60"
        >
          Periode Gangguan
        </th>
      </tr>

      {/* Level 2 Sub-headers */}
      <tr className="border-b border-slate-200/80 dark:border-slate-800/80 text-[11px] font-semibold">
        {/* Under Perangkat Modem */}
        <th className="py-2 px-3 text-center whitespace-nowrap text-indigo-900/90 dark:text-indigo-200 bg-[#f5f6ff] dark:bg-[#181a3a] border-r border-indigo-200/60 dark:border-indigo-900/50">
          Nama
        </th>
        <th className="py-2 px-3 text-center whitespace-nowrap text-indigo-900/90 dark:text-indigo-200 bg-[#f5f6ff] dark:bg-[#181a3a] border-r-2 border-r-indigo-300 dark:border-r-indigo-700/80">
          Avg Suhu
        </th>

        {/* Under Kartu SIM & Kuota */}
        <th className="py-2 px-3 text-center whitespace-nowrap text-amber-900/90 dark:text-amber-200 bg-[#fffcf4] dark:bg-[#30220c] border-r border-amber-200/60 dark:border-amber-900/50">
          Provider
        </th>
        <th className="py-2 px-3.5 text-center whitespace-nowrap text-amber-900/90 dark:text-amber-200 bg-[#fffcf4] dark:bg-[#30220c] border-r border-amber-200/60 dark:border-amber-900/50">
          No. SIM Card
        </th>
        <th className="py-2 px-3 text-center whitespace-nowrap text-amber-900/90 dark:text-amber-200 bg-[#fffcf4] dark:bg-[#30220c] border-r-2 border-r-amber-300 dark:border-r-amber-700/80">
          Sisa Kuota
        </th>

        {/* Under CPU - Modem (Blue Sub-headers) */}
        <th className="py-2 px-2.5 text-center text-[#00c875] bg-[#f4f8ff] dark:bg-[#08152b] border-r border-blue-200/60 dark:border-blue-900/50">Uptime</th>
        <th className="py-2 px-2.5 text-center text-[#e2445c] bg-[#f4f8ff] dark:bg-[#08152b] border-r border-blue-200/60 dark:border-blue-900/50">Offline</th>
        <th className="py-2 px-2.5 text-center whitespace-nowrap text-blue-900 dark:text-blue-200 bg-[#f4f8ff] dark:bg-[#08152b] border-r-2 border-r-blue-300 dark:border-r-blue-700">
          Success Rate
        </th>

        {/* Under Koneksi Jaringan (Teal Sub-headers) */}
        <th className="py-2 px-2.5 text-center text-[#00c875] bg-[#effcf8] dark:bg-[#041a18] border-r border-teal-200/60 dark:border-teal-900/50">Uptime</th>
        <th className="py-2 px-2.5 text-center text-[#e2445c] bg-[#effcf8] dark:bg-[#041a18] border-r border-teal-200/60 dark:border-teal-900/50">Offline</th>
        <th className="py-2 px-2.5 text-center whitespace-nowrap text-[#00c875] bg-[#effcf8] dark:bg-[#041a18] border-r border-teal-200/60 dark:border-teal-900/50">Success Rate</th>
        <th className="py-2 px-2.5 text-center whitespace-nowrap text-teal-900 dark:text-teal-200 bg-[#effcf8] dark:bg-[#041a18] border-r-2 border-r-teal-300 dark:border-r-teal-700">
          Avg RSRP (dBm)
        </th>

        {/* Under Periode Gangguan (Purple Sub-headers) */}
        <th className="py-2 px-2.5 text-center whitespace-nowrap text-purple-900 dark:text-purple-200 bg-[#f8f4ff] dark:bg-[#120a22] border-r border-purple-200/60 dark:border-purple-900/50">Jumlah Event</th>
        <th className="py-2 px-3 whitespace-nowrap text-purple-900 dark:text-purple-200 bg-[#f8f4ff] dark:bg-[#120a22] border-r-2 border-r-purple-300 dark:border-r-purple-700">
          Terakhir Offline
        </th>
      </tr>
    </>
  );

  return (
    <AppLayout
      title="Report Cellular Connectivity"
      headerRight={
        <FilterHeader
          inline
          search={filters.search || ""}
          onSearchChange={(val) => handleFilterChange("search", val)}
          searchPlaceholder="Cari Gateway ID / Lokasi..."
          filters={filterConfigs}
          timeframe={filters.date_range || "01 Oct 2026 - 31 Oct 2026"}
          onTimeframeClick={() => {}}
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
