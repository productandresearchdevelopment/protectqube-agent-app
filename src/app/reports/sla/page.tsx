"use client";

import React, { useState, useRef, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useSLAReport,
  ISLAReportFilters,
  ISLAReportItem,
  exportSLAReportExcelUrl,
  downloadReportFile,
} from "@/store/api/monitoring";
import {
  DataTable,
  ColumnDef,
  FilterHeader,
  IFilterConfig,
  SummaryCard,
} from "@/components/ui";
import {
  BarChart2,
  Package,
  Video,
  Wifi,
  Award,
  X,
  ShieldCheck,
  MapPin,
  Server,
  Database,
  AlertTriangle,
  Bell,
  Clock,
  Activity,
} from "lucide-react";
import { getCurrentMonthPeriodStr } from "@/lib/reportPeriodUtils";
import { SLAReportDetailCard } from "@/components/reports/sla/SLAReportDetailCard";

export default function ReportSLAPage() {
  const [filters, setFilters] = useState<ISLAReportFilters>({
    search: "",
    type: "All Types",
    sla_status: "All SLA",
    date_range: getCurrentMonthPeriodStr(),
    page: 1,
    pageSize: 50,
  });

  const [selectedGateways, setSelectedGateways] = useState<string[]>([]);
  const [selectedGatewayId, setSelectedGatewayId] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  // Fetch real SLA report data from FastAPI backend
  const { data: reportData, isLoading } = useSLAReport(filters);

  const gateways = reportData?.gateways || [];
  const summary = reportData?.summary;
  const pagination = reportData?.pagination;

  const handleFilterChange = (key: keyof ISLAReportFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === "page" ? value : 1,
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

  const handleSelectGateway = (gateway: ISLAReportItem) => {
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
      const url = exportSLAReportExcelUrl(filters);
      await downloadReportFile(url, "report_sla_compliance.xlsx");
    } catch (err) {
      console.error("Export SLA report error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const isAllSelected =
    gateways.length > 0 &&
    gateways.every((g) => selectedGateways.includes(g.id));

  const filterConfigs: IFilterConfig[] = [
    {
      id: "type",
      value: filters.type || "All Types",
      onChange: (val) => handleFilterChange("type", val),
      options: [
        { label: "All Types", value: "All Types" },
        { label: "SmartBox Hitam", value: "Hitam" },
        { label: "SmartBox Putih", value: "Putih" },
      ],
    },
    {
      id: "sla_status",
      value: filters.sla_status || "All SLA",
      onChange: (val) => handleFilterChange("sla_status", val),
      options: [
        { label: "All SLA", value: "All SLA" },
        { label: "Meet SLA (≥ 99%)", value: "meet" },
        { label: "SLA Breach (< 99%)", value: "breach" },
      ],
    },
  ];

  const activeGateway = useMemo(
    () => gateways.find((g) => g.id === selectedGatewayId) || null,
    [gateways, selectedGatewayId]
  );

  const storageUsedPct = useMemo(() => {
    if (!summary || !summary.total_storage_tb || summary.total_storage_tb <= 0) return 0;
    return Math.round((summary.storage_used_tb / summary.total_storage_tb) * 100);
  }, [summary]);

  // Status Badge Helper matching the client visual spec
  const renderStatusBadge = (status: string) => {
    const isOk = status === "Online" || status === "Working";
    if (isOk) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
        <span className="size-1.5 rounded-full bg-rose-500" />
        {status}
      </span>
    );
  };

  // SLA Uptime Pill Badge Helper matching the client visual spec
  const renderSlaBadge = (pct: number) => {
    if (pct >= 99.0) {
      return (
        <span className="inline-block px-3 py-1 rounded-md text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono tracking-tight">
          {pct.toFixed(2)}%
        </span>
      );
    }
    if (pct >= 95.0) {
      return (
        <span className="inline-block px-3 py-1 rounded-md text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono tracking-tight">
          {pct.toFixed(2)}%
        </span>
      );
    }
    return (
      <span className="inline-block px-3 py-1 rounded-md text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-mono tracking-tight">
        {pct.toFixed(2)}%
      </span>
    );
  };

  const columns = useMemo<ColumnDef<ISLAReportItem>[]>(
    () => [
      {
        id: "location",
        header: "Location",
        cell: (gw) => (
          <span className="font-semibold text-slate-900 dark:text-white text-xs whitespace-nowrap">
            {gw.location}
          </span>
        ),
      },
      {
        id: "type",
        header: "Type",
        align: "center",
        cell: (gw) => {
          const isBlack = gw.type.includes("Hitam");
          return (
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
              <span className={`size-2.5 rounded-xs ${isBlack ? "bg-slate-900 dark:bg-slate-300" : "bg-slate-300 dark:bg-white"}`} />
              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                {gw.type}
              </span>
            </div>
          );
        },
      },
      {
        id: "customer",
        header: "Customer",
        align: "center",
        cell: (gw) => (
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            {gw.customer || "-"}
          </span>
        ),
      },

      // --- SMARTBOX COLUMNS ---
      {
        id: "sb_status",
        header: "Status",
        align: "center",
        className: "bg-blue-500/[0.02] dark:bg-blue-500/[0.03]",
        cell: (gw) => renderStatusBadge(gw.smartbox_status),
      },
      {
        id: "sb_uptime",
        header: "Uptime",
        align: "center",
        className: "bg-blue-500/[0.02] dark:bg-blue-500/[0.03] border-r border-slate-200/80 dark:border-slate-800",
        cell: (gw) => (
          <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
            {gw.smartbox_uptime_pct.toFixed(1)}%
          </span>
        ),
      },

      // --- DVR COLUMNS ---
      {
        id: "dvr_status",
        header: "Status",
        align: "center",
        className: "bg-emerald-500/[0.02] dark:bg-emerald-500/[0.03]",
        cell: (gw) => renderStatusBadge(gw.dvr_status),
      },
      {
        id: "dvr_uptime",
        header: "Uptime",
        align: "center",
        className: "bg-emerald-500/[0.02] dark:bg-emerald-500/[0.03] border-r border-slate-200/80 dark:border-slate-800",
        cell: (gw) => (
          <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
            {gw.dvr_uptime_pct.toFixed(1)}%
          </span>
        ),
      },

      // --- NETWORK COLUMNS ---
      {
        id: "net_status",
        header: "Status",
        align: "center",
        className: "bg-purple-500/[0.02] dark:bg-purple-500/[0.03]",
        cell: (gw) => renderStatusBadge(gw.network_status),
      },
      {
        id: "net_uptime",
        header: "Uptime",
        align: "center",
        className: "bg-purple-500/[0.02] dark:bg-purple-500/[0.03] border-r border-slate-200/80 dark:border-slate-800",
        cell: (gw) => (
          <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
            {gw.network_uptime_pct.toFixed(1)}%
          </span>
        ),
      },

      // --- SLA COLUMNS ---
      {
        id: "sla_uptime",
        header: "Uptime",
        align: "center",
        className: "bg-amber-500/[0.02] dark:bg-amber-500/[0.03]",
        cell: (gw) => renderSlaBadge(gw.sla_uptime_pct),
      },
      {
        id: "sla_fail",
        header: "Failure Rate",
        align: "center",
        className: "bg-amber-500/[0.02] dark:bg-amber-500/[0.03]",
        cell: (gw) => (
          <span className="font-mono text-xs font-semibold text-rose-500 dark:text-rose-400">
            {gw.sla_failure_rate_pct.toFixed(2)}%
          </span>
        ),
      },
    ],
    []
  );

  // Multi-Level Grouped Header Row matching the exact mockup
  const customHeaderRow = (
    <>
      <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold select-none">
        <th
          rowSpan={2}
          className="w-10 px-3 text-center border-r border-slate-200/80 dark:border-slate-800"
        >
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={toggleSelectAll}
            className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0073ea] focus:ring-[#0073ea] size-3.5 cursor-pointer"
          />
        </th>
        <th
          rowSpan={2}
          className="py-3 px-4 text-left border-r border-slate-200/80 dark:border-slate-800 whitespace-nowrap text-slate-900 dark:text-white"
        >
          Location
        </th>
        <th
          rowSpan={2}
          className="py-3 px-3 text-center border-r border-slate-200/80 dark:border-slate-800 whitespace-nowrap text-slate-900 dark:text-white"
        >
          Type
        </th>
        <th
          rowSpan={2}
          className="py-3 px-3 text-center border-r border-slate-200/80 dark:border-slate-800 whitespace-nowrap text-slate-900 dark:text-white"
        >
          Customer
        </th>

        {/* Group: Smartbox (Blue Theme) */}
        <th
          colSpan={2}
          className="py-2.5 px-3 text-center border-r border-blue-200 dark:border-blue-900 bg-[#edf5ff] dark:bg-[#0c1e3d] text-blue-700 dark:text-blue-300 font-bold border-b border-b-blue-200 dark:border-b-blue-800/60"
        >
          <div className="flex items-center justify-center gap-1.5">
            <Package className="size-4" />
            <span>Smartbox</span>
          </div>
        </th>

        {/* Group: DVR (Green Theme) */}
        <th
          colSpan={2}
          className="py-2.5 px-3 text-center border-r border-emerald-200 dark:border-emerald-900 bg-[#eefbf3] dark:bg-[#072414] text-emerald-700 dark:text-emerald-300 font-bold border-b border-b-emerald-200 dark:border-b-emerald-800/60"
        >
          <div className="flex items-center justify-center gap-1.5">
            <Video className="size-4" />
            <span>DVR</span>
          </div>
        </th>

        {/* Group: Network (Purple Theme) */}
        <th
          colSpan={2}
          className="py-2.5 px-3 text-center border-r border-purple-200 dark:border-purple-900 bg-[#f7f0ff] dark:bg-[#1a0f30] text-purple-700 dark:text-purple-300 font-bold border-b border-b-purple-200 dark:border-b-purple-800/60"
        >
          <div className="flex items-center justify-center gap-1.5">
            <Wifi className="size-4" />
            <span>Network</span>
          </div>
        </th>

        {/* Group: SLA (Gold/Slate Theme) */}
        <th
          colSpan={2}
          className="py-2.5 px-3 text-center bg-[#fffbeb] dark:bg-[#261d07] text-amber-800 dark:text-amber-300 font-bold border-b border-b-amber-200 dark:border-b-amber-800/60"
        >
          <div className="flex items-center justify-center gap-1.5">
            <Award className="size-4" />
            <span>SLA</span>
          </div>
        </th>
      </tr>

      {/* Level 2 Sub-Headers */}
      <tr className="border-b border-slate-200/80 dark:border-slate-800/80 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
        {/* Smartbox */}
        <th className="py-2 px-2.5 text-center bg-[#f4f8ff] dark:bg-[#08152b] border-r border-blue-100 dark:border-blue-950">
          Status
        </th>
        <th className="py-2 px-2.5 text-center bg-[#f4f8ff] dark:bg-[#08152b] border-r border-slate-200/80 dark:border-slate-800">
          Uptime
        </th>

        {/* DVR */}
        <th className="py-2 px-2.5 text-center bg-[#f4fdf7] dark:bg-[#041a0d] border-r border-emerald-100 dark:border-emerald-950">
          Status
        </th>
        <th className="py-2 px-2.5 text-center bg-[#f4fdf7] dark:bg-[#041a0d] border-r border-slate-200/80 dark:border-slate-800">
          Uptime
        </th>

        {/* Network */}
        <th className="py-2 px-2.5 text-center bg-[#faf5ff] dark:bg-[#140b24] border-r border-purple-100 dark:border-purple-950">
          Status
        </th>
        <th className="py-2 px-2.5 text-center bg-[#faf5ff] dark:bg-[#140b24] border-r border-slate-200/80 dark:border-slate-800">
          Uptime
        </th>

        {/* SLA */}
        <th className="py-2 px-2.5 text-center bg-[#fffdf5] dark:bg-[#1c1503] border-r border-amber-100 dark:border-amber-950">
          Uptime
        </th>
        <th className="py-2 px-2.5 text-center bg-[#fffdf5] dark:bg-[#1c1503]">
          Failure Rate
        </th>
      </tr>
    </>
  );

  return (
    <AppLayout
      title="Report SLA"
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
        {/* Executive Period Summary Cards (2 Baris x 4 Kolom) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
          {/* Row 1 / Card 1: Location */}
          <SummaryCard
            title="Location"
            value={summary?.total_locations ?? 0}
            icon={MapPin}
            color="blue"
            subtext="Total Unique Sites"
          />

          {/* Row 1 / Card 2: Device Status (Gambar 1: Split 2 Kolom dengan |) */}
          <SummaryCard
            icon={Server}
            color="emerald"
          >
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                Device Status
              </span>
              <div className="flex items-center gap-2.5">
                {/* Online Column */}
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl sm:text-2xl font-black text-[#00c875] tracking-tight leading-none">
                      {summary?.device_online_count ?? 0}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Online</span>
                  </div>
                  <div className="text-[11px] font-semibold text-[#00c875] mt-0.5">
                    ({summary && summary.total_gateways > 0 ? ((summary.device_online_count / summary.total_gateways) * 100).toFixed(1) : "0.0"}%)
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="w-[1.5px] h-8 bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />

                {/* Offline Column */}
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl sm:text-2xl font-black text-[#e2445c] tracking-tight leading-none">
                      {summary?.device_offline_count ?? 0}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Offline</span>
                  </div>
                  <div className="text-[11px] font-semibold text-[#e2445c] mt-0.5">
                    ({summary && summary.total_gateways > 0 ? ((summary.device_offline_count / summary.total_gateways) * 100).toFixed(1) : "0.0"}%)
                  </div>
                </div>
              </div>
            </div>
          </SummaryCard>

          {/* Row 1 / Card 3: Total Camera (Gambar 2: Count Online & Offline Dot) */}
          <SummaryCard
            icon={Video}
            color="cyan"
          >
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-[#0073ea] dark:text-[#0091ff] leading-none">
                  {summary?.total_cameras?.toLocaleString() ?? 0}
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Total Cameras</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold mt-1.5">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <span className="size-2 rounded-full bg-[#00c875]" />
                  <span>{summary?.cameras_online?.toLocaleString() ?? 0} Online</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <span className="size-2 rounded-full bg-[#e2445c]" />
                  <span>{summary?.cameras_offline?.toLocaleString() ?? 0} Offline</span>
                </div>
              </div>
            </div>
          </SummaryCard>

          {/* Row 1 / Card 4: Total Storage (Gambar 3: PB/TB, Used % & Progress Bar) */}
          <SummaryCard
            icon={Database}
            color="purple"
          >
            <div className="w-full">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-purple-600 dark:text-purple-400 leading-none">
                  {summary?.total_storage_tb ? (summary.total_storage_tb >= 1000 ? `${(summary.total_storage_tb / 1000).toFixed(1)} PB` : `${summary.total_storage_tb} TB`) : "0 TB"}
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Total Storage</span>
              </div>
              <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400 mt-1">
                {storageUsedPct}% Used
              </div>
              <div className="mt-1 w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple-600 dark:bg-purple-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, storageUsedPct))}%` }}
                />
              </div>
            </div>
          </SummaryCard>

          {/* Row 2 / Card 5: Average SLA */}
          <SummaryCard
            title="Average SLA"
            value={`${summary ? summary.avg_sla_uptime.toFixed(2) : "100.00"}%`}
            icon={Award}
            color="purple"
            subtext="Fleet Target: ≥ 99.50%"
          />

          {/* Row 2 / Card 6: Failure Rate */}
          <SummaryCard
            title="Failure Rate"
            value={`${summary ? summary.avg_sla_failure_rate.toFixed(2) : "0.00"}%`}
            icon={AlertTriangle}
            color="rose"
            subtext="Fleet Downtime Ratio"
          />

          {/* Row 2 / Card 7: Incident Count */}
          <SummaryCard
            title="Incident Count"
            value={summary?.total_incidents ? summary.total_incidents.toLocaleString() : 0}
            icon={Bell}
            color="amber"
            subtext="Recorded Trouble Events"
          />

          {/* Row 2 / Card 8: MTTR & MTBF (Gambar 1: Split 2 Kolom dengan |) */}
          <SummaryCard
            icon={Clock}
            color="indigo"
          >
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                MTTR &amp; MTBF
              </span>
              <div className="flex items-center gap-2.5">
                {/* MTTR Column */}
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight leading-none">
                      {summary?.mttr_minutes ? Math.round(summary.mttr_minutes) : 0}m
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">MTTR</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate">
                    Mean Repair
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="w-[1.5px] h-8 bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />

                {/* MTBF Column */}
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight leading-none">
                      {summary?.mtbf_hours ? Math.round(summary.mtbf_hours) : 0}h
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">MTBF</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate">
                    Between Failure
                  </div>
                </div>
              </div>
            </div>
          </SummaryCard>
        </div>

        {/* Global DataTable */}
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
          className={
            selectedGatewayId ? "min-h-125" : "h-[calc(100vh-140px)] flex-1"
          }
        />

        {/* Detail Performa Gateway SLA (Muncul saat baris diklik) */}
        {selectedGatewayId && (
          <div
            ref={detailRef}
            className="pt-2 animate-in fade-in slide-in-from-top-4 duration-300 mx-3 pb-4"
          >
            <SLAReportDetailCard
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
