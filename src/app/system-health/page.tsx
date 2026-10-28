"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSystemHealthDashboard, IGatewayItem } from "@/store/api/monitoring";
import {
  DataTable,
  ColumnDef,
  FilterHeader,
  SummaryCard,
  ChartCard,
  StatusBadge,
  DeviceTypeBadge,
  LoadProgressBar,
  IFilterConfig,
} from "@/components/ui";
import { DeviceDetailCard } from "@/components/system-health/DeviceDetailCard";
import {
  Server,
  Check,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  Box,
  Cpu,
  HardDrive,
  Clock,
  MoreHorizontal,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const CustomMetricTooltip = ({ active, payload, label, unit, color }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 dark:bg-slate-900/95 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-xl border border-slate-700/80 backdrop-blur-xs font-sans z-50">
        <div className="text-slate-400 font-mono text-[10px] mb-0.5">{label}</div>
        <div className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: color || "#00c875" }}
          />
          <span className="font-medium text-slate-200">{payload[0].name}:</span>
          <span className="font-bold text-white">
            {payload[0].value}{unit}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function SystemHealthPage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Semua Tipe");
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedGateways, setSelectedGateways] = useState<string[]>([]);
  const [selectedGatewayId, setSelectedGatewayId] = useState<string | null>(null);

  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch real-time telemetry from Python backend (FastAPI)
  const { data: dashboard } = useSystemHealthDashboard({
    search,
    type: typeFilter,
    status: statusFilter,
    page: currentPage,
    pageSize,
  });

  const summary = dashboard?.summary;
  const charts = dashboard?.charts;
  const gateways = dashboard?.gateways || [];
  const pagination = dashboard?.pagination;

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

  const handleSelectGateway = (gateway: IGatewayItem) => {
    setSelectedGatewayId(gateway.id);
    setTimeout(() => {
      detailRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 120);
  };

  const filters: IFilterConfig[] = [
    {
      id: "type",
      value: typeFilter,
      onChange: (val) => {
        setTypeFilter(val);
        setCurrentPage(1);
      },
      options: [
        { label: "Semua Tipe", value: "Semua Tipe" },
        { label: "SmartBox Hitam", value: "SmartBox Hitam" },
        { label: "SmartBox Putih", value: "SmartBox Putih" },
      ],
    },
    {
      id: "status",
      value: statusFilter,
      onChange: (val) => {
        setStatusFilter(val);
        setCurrentPage(1);
      },
      options: [
        { label: "Semua Status", value: "Semua Status" },
        { label: "Healthy", value: "Healthy" },
        { label: "Warning", value: "Warning" },
        { label: "Critical", value: "Critical" },
      ],
    },
  ];

  // Chart Timelines
  const cpuTimeline = charts?.cpu.timeline || [
    { time: "00:00", value: 38 },
    { time: "04:00", value: 42 },
    { time: "08:00", value: 48 },
    { time: "12:00", value: 45 },
    { time: "16:00", value: 46 },
    { time: "20:00", value: 40 },
  ];

  const ramTimeline = charts?.ram.timeline || [
    { time: "00:00", value: 55 },
    { time: "04:00", value: 58 },
    { time: "08:00", value: 62 },
    { time: "12:00", value: 60 },
    { time: "16:00", value: 61 },
    { time: "20:00", value: 59 },
  ];

  const sdCardTimeline = charts?.sd_card.timeline || [
    { time: "00:00", value: 40 },
    { time: "04:00", value: 41 },
    { time: "08:00", value: 43 },
    { time: "12:00", value: 45 },
    { time: "16:00", value: 44 },
    { time: "20:00", value: 42 },
  ];

  const uptimeTimeline = charts?.uptime.timeline || [
    { time: "00:00", value: 42 },
    { time: "04:00", value: 44 },
    { time: "08:00", value: 48 },
    { time: "12:00", value: 50 },
    { time: "16:00", value: 49 },
    { time: "20:00", value: 46 },
  ];

  const hitamTotal = summary?.smartbox_hitam.total ?? 1050;
  const hitamHealthy = summary?.smartbox_hitam.healthy ?? 980;
  const hitamWarning = summary?.smartbox_hitam.warning ?? 55;
  const hitamCritical = summary?.smartbox_hitam.critical ?? 15;

  const putihTotal = summary?.smartbox_putih.total ?? 950;
  const putihHealthy = summary?.smartbox_putih.healthy ?? 870;
  const putihWarning = summary?.smartbox_putih.warning ?? 25;
  const putihCritical = summary?.smartbox_putih.critical ?? 55;

  // Table Columns
  const columns: ColumnDef<IGatewayItem>[] = [
    {
      id: "no",
      header: "No.",
      width: "48px",
      align: "center",
      cell: (_, idx) => (
        <span className="text-slate-400 font-mono text-[11px]">
          {(currentPage - 1) * pageSize + idx + 1}
        </span>
      ),
    },
    {
      id: "id",
      header: "Gateway ID",
      cell: (item) => {
        const isSelected = selectedGatewayId === item.id;
        return (
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-blue-500/10 dark:bg-blue-500/15 text-[#0073ea] flex items-center justify-center shrink-0">
              <Server className="size-3.5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 dark:text-white font-mono hover:text-[#0073ea] transition-colors">
                {item.id}
              </span>
              {isSelected && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0073ea] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0073ea]" />
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: "location",
      header: "Lokasi",
      accessorKey: "location",
      cell: (item) => (
        <span className="text-slate-700 dark:text-slate-300 font-medium">
          {item.location}
        </span>
      ),
    },
    {
      id: "type",
      header: "Tipe",
      cell: (item) => <DeviceTypeBadge type={item.type} />,
    },
    {
      id: "cpu",
      header: "CPU",
      align: "center",
      cell: (item) => <LoadProgressBar percent={item.cpu} />,
    },
    {
      id: "ram",
      header: "RAM",
      align: "center",
      cell: (item) => <LoadProgressBar percent={item.ram} />,
    },
    {
      id: "sd_card",
      header: "SD Card",
      align: "center",
      cell: (item) => <LoadProgressBar percent={item.sd_percent} />,
    },
    {
      id: "sd_health",
      header: "SD Health",
      align: "center",
      cell: (item) => (
        <StatusBadge
          status={item.sd_health}
          variant={item.sd_health === "Good" ? "good" : item.sd_health === "Wear" ? "wear" : "bad"}
        />
      ),
    },
    {
      id: "uptime",
      header: "Uptime",
      align: "center",
      accessorKey: "uptime",
      cell: (item) => (
        <span className="text-slate-700 dark:text-slate-300 font-medium font-sans">
          {item.uptime}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      align: "center",
      cell: (item) => (
        <StatusBadge
          status={item.status}
          variant={item.status === "Healthy" ? "healthy" : item.status === "Warning" ? "warning" : "critical"}
        />
      ),
    },
    {
      id: "last_update",
      header: "Last Update",
      align: "center",
      accessorKey: "last_update",
      cell: (item) => (
        <span className="text-slate-400 font-mono text-[11px]">
          {item.last_update}
        </span>
      ),
    },
    {
      id: "action",
      header: "Action",
      align: "center",
      width: "56px",
      cell: (item) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSelectGateway(item);
          }}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Lihat Detail Telemetry"
        >
          <MoreHorizontal className="size-4" />
        </button>
      ),
    },
  ];

  return (
    <AppLayout title="System Health">
      <div className="space-y-5 max-w-[1600px] mx-auto pb-16 font-sans transition-colors">
        {/* 1. Header with Filters */}
        <FilterHeader
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setCurrentPage(1);
          }}
          searchPlaceholder="Cari Gateway ID atau Lokasi..."
          filters={filters}
          timeframe="Last 24 Hours"
          onTimeframeClick={() => {}}
        />

        {/* 2. Top Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <SummaryCard
            title="Total Gateway"
            value={summary ? summary.total_gateways : 2000}
            icon={Server}
            color="blue"
          />
          <SummaryCard
            title="Healthy"
            value={summary ? summary.healthy : 1890}
            icon={Check}
            color="emerald"
            percentage={`${summary?.healthy_percent ?? 94.5}%`}
          />
          <SummaryCard
            title="Warning"
            value={summary ? summary.warning : 80}
            icon={AlertCircle}
            color="amber"
            percentage={`${summary?.warning_percent ?? 4.0}%`}
          />
          <SummaryCard
            title="Critical"
            value={summary ? summary.critical : 30}
            icon={AlertTriangle}
            color="rose"
            percentage={`${summary?.critical_percent ?? 1.5}%`}
          />
          <SummaryCard
            title="SmartBox Hitam"
            sublabel="(Raspberry Pi 3B+)"
            value={hitamTotal}
            deviceType="hitam"
            color="slate"
            breakdown={{
              healthy: hitamHealthy,
              warning: hitamWarning,
              critical: hitamCritical,
            }}
          />
          <SummaryCard
            title="SmartBox Putih"
            sublabel="(Rockchip RK3328)"
            value={putihTotal}
            deviceType="putih"
            color="slate"
            breakdown={{
              healthy: putihHealthy,
              warning: putihWarning,
              critical: putihCritical,
            }}
          />
        </div>

        {/* 3. Four Real-time Charts directly in page */}
        {/* 3. Four Real-time Charts directly in page */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {/* Chart 1: CPU Usage */}
          <ChartCard
            title="CPU Usage"
            subtitle="Rata-rata Semua Unit"
            icon={Cpu}
          >
            <div className="flex items-stretch gap-1.5 h-40">
              <div className="flex-1 h-full relative">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cpuTimeline} margin={{ top: 8, right: 0, left: -4, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00c875" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#00c875" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={{ stroke: "#334155", strokeWidth: 0.5 }} tickLine={false} />
                      <YAxis width={28} domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomMetricTooltip unit="%" color="#00c875" />} />
                      <Area type="monotone" name="CPU Usage" dataKey="value" stroke="#00c875" strokeWidth={2} fillOpacity={1} fill="url(#cpuGrad)" activeDot={{ r: 4, fill: "#00c875", stroke: "#fff", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="w-12 shrink-0 flex flex-col justify-between py-1 border-l border-slate-100 dark:border-slate-800/80 pl-1.5">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none">Avg</div>
                  <div className="text-xs font-bold text-[#00c875] mt-1">{charts?.cpu.avg ?? "43.2%"}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none">Max</div>
                  <div className="text-xs font-bold text-[#e2445c] mt-1">{charts?.cpu.max ?? "88.0%"}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none">Min</div>
                  <div className="text-xs font-bold text-[#0073ea] mt-1">{charts?.cpu.min ?? "12.4%"}</div>
                </div>
              </div>
            </div>
          </ChartCard>

          {/* Chart 2: RAM Usage */}
          <ChartCard
            title="RAM Usage"
            subtitle="Rata-rata Semua Unit"
            icon={Cpu}
          >
            <div className="flex items-stretch gap-1.5 h-40">
              <div className="flex-1 h-full relative">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ramTimeline} margin={{ top: 8, right: 0, left: -4, bottom: 0 }}>
                      <defs>
                        <linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0073ea" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#0073ea" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={{ stroke: "#334155", strokeWidth: 0.5 }} tickLine={false} />
                      <YAxis width={28} domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomMetricTooltip unit="%" color="#0073ea" />} />
                      <Area type="monotone" name="RAM Usage" dataKey="value" stroke="#0073ea" strokeWidth={2} fillOpacity={1} fill="url(#ramGrad)" activeDot={{ r: 4, fill: "#0073ea", stroke: "#fff", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="w-12 shrink-0 flex flex-col justify-between py-1 border-l border-slate-100 dark:border-slate-800/80 pl-1.5">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none">Avg</div>
                  <div className="text-xs font-bold text-[#0073ea] mt-1">{charts?.ram.avg ?? "61.5%"}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none">Max</div>
                  <div className="text-xs font-bold text-[#e2445c] mt-1">{charts?.ram.max ?? "91.2%"}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none">Min</div>
                  <div className="text-xs font-bold text-[#00c875] mt-1">{charts?.ram.min ?? "34.0%"}</div>
                </div>
              </div>
            </div>
          </ChartCard>

          {/* Chart 3: SD Card Storage */}
          <ChartCard
            title="SD Card Storage"
            subtitle="Rata-rata Kapasitas"
            icon={HardDrive}
          >
            <div className="flex items-stretch gap-1.5 h-40">
              <div className="flex-1 h-full relative">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sdCardTimeline} margin={{ top: 8, right: 0, left: -4, bottom: 0 }}>
                      <defs>
                        <linearGradient id="sdGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#fdab3d" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#fdab3d" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={{ stroke: "#334155", strokeWidth: 0.5 }} tickLine={false} />
                      <YAxis width={28} domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomMetricTooltip unit="%" color="#fdab3d" />} />
                      <Area type="monotone" name="SD Storage" dataKey="value" stroke="#fdab3d" strokeWidth={2} fillOpacity={1} fill="url(#sdGrad)" activeDot={{ r: 4, fill: "#fdab3d", stroke: "#fff", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="w-12 shrink-0 flex flex-col justify-between py-1 border-l border-slate-100 dark:border-slate-800/80 pl-1.5">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none">Avg</div>
                  <div className="text-xs font-bold text-[#fdab3d] mt-1">{charts?.sd_card.avg ?? "42.8%"}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none">Max</div>
                  <div className="text-xs font-bold text-[#e2445c] mt-1">{charts?.sd_card.max ?? "74.0%"}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none">Min</div>
                  <div className="text-xs font-bold text-[#00c875] mt-1">{charts?.sd_card.min ?? "20.1%"}</div>
                </div>
              </div>
            </div>
          </ChartCard>

          {/* Chart 4: Uptime Trend */}
          <ChartCard
            title="Uptime Trend"
            subtitle="Rata-rata Ketersediaan"
            icon={Clock}
          >
            <div className="flex items-stretch gap-1.5 h-40">
              <div className="flex-1 h-full relative">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={uptimeTimeline} margin={{ top: 8, right: 0, left: -4, bottom: 0 }}>
                      <defs>
                        <linearGradient id="upGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0073ea" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#0073ea" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={{ stroke: "#334155", strokeWidth: 0.5 }} tickLine={false} />
                      <YAxis width={28} domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomMetricTooltip unit="%" color="#0073ea" />} />
                      <Area type="monotone" name="Uptime" dataKey="value" stroke="#0073ea" strokeWidth={2} fillOpacity={1} fill="url(#upGrad)" activeDot={{ r: 4, fill: "#0073ea", stroke: "#fff", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="w-12 shrink-0 flex flex-col justify-between py-1 border-l border-slate-100 dark:border-slate-800/80 pl-1.5">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none">Avg</div>
                  <div className="text-xs font-bold text-[#0073ea] mt-1">{charts?.uptime.avg ?? "48.5%"}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none">Max</div>
                  <div className="text-xs font-bold text-[#00c875] mt-1">{charts?.uptime.max ?? "99.8%"}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none">Min</div>
                  <div className="text-xs font-bold text-[#e2445c] mt-1">{charts?.uptime.min ?? "18.2%"}</div>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* 4. Filterable & Paginated Daftar Gateway Table */}
        <DataTable
          title="Daftar Gateway"
          titleIcon={Server}
          subtitle="Klik baris untuk membuka detail telemetry di bawah"
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
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />

        {/* 5. Device Detail Section - Appears below table upon row click with smooth auto-scroll */}
        {selectedGatewayId && (
          <div ref={detailRef} className="pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <DeviceDetailCard
              gatewayId={selectedGatewayId}
              onClose={() => setSelectedGatewayId(null)}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
