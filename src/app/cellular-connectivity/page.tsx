"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCellularDashboard, ICellularGatewayItem } from "@/store/api/monitoring";
import { formatToWIB } from "@/utils/common";
import {
  DataTable,
  ColumnDef,
  FilterHeader,
  SummaryCard,
  ChartCard,
  StatusBadge,
  DeviceTypeBadge,
  IFilterConfig,
} from "@/components/ui";
import { CellularDeviceDetailCard } from "@/components/cellular/CellularDeviceDetailCard";
import {
  Server,
  Check,
  Radio,
  Wrench,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Box,
  Cpu,
  Globe,
  Signal,
  Thermometer,
  MoreHorizontal,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";

// Custom Tooltips for Charts
const CustomDonutTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-900/95 dark:bg-slate-900/95 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-xl border border-slate-700/80 backdrop-blur-xs font-sans z-50">
        <div className="flex items-center gap-1.5 font-bold">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: data.payload.color || data.payload.fill }}
          />
          <span>{data.name}</span>
        </div>
        <div className="mt-0.5 text-slate-300 flex justify-between gap-3">
          <span>Total:</span>
          <span className="font-semibold text-white">{data.value.toLocaleString()}</span>
        </div>
        <div className="text-slate-300 flex justify-between gap-3">
          <span>Persentase:</span>
          <span className="font-semibold text-[#00c875]">{data.payload.percent}%</span>
        </div>
      </div>
    );
  }
  return null;
};

const CustomLineTooltip = ({ active, payload, label, unit }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 dark:bg-slate-900/95 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-xl border border-slate-700/80 backdrop-blur-xs font-sans z-50">
        <div className="text-slate-400 font-mono text-[10px] mb-0.5">{label}</div>
        <div className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: payload[0].color }}
          />
          <span className="font-medium text-slate-200">{payload[0].name}:</span>
          <span className="font-bold text-white">
            {payload[0].value} {unit}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function CellularConnectivityPage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Semua Tipe");
  const [providerFilter, setProviderFilter] = useState("Semua Provider");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedGateways, setSelectedGateways] = useState<string[]>([]);
  const [selectedGatewayId, setSelectedGatewayId] = useState<string | null>(null);

  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch real-time telemetry from Python backend (FastAPI)
  const { data: dashboard } = useCellularDashboard({
    search,
    type: typeFilter,
    provider: providerFilter,
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

  const handleSelectGateway = (gateway: ICellularGatewayItem) => {
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
      id: "provider",
      value: providerFilter,
      onChange: (val) => {
        setProviderFilter(val);
        setCurrentPage(1);
      },
      options: [
        { label: "Semua Provider", value: "Semua Provider" },
        { label: "Telkomsel", value: "Telkomsel" },
        { label: "Indosat Ooredoo", value: "Indosat Ooredoo" },
        { label: "XL Axiata", value: "XL Axiata" },
      ],
    },
  ];

  // Chart Data
  const cpuModemData = charts?.cpu_modem_comm.slices.map((s) => ({
    name: s.label,
    value: s.count,
    percent: s.percent,
    color: s.color,
  })) || [
    { name: "Connected", value: 1960, percent: 98.0, color: "#00c875" },
    { name: "Not Detected", value: 20, percent: 1.0, color: "#e2445c" },
    { name: "No Response", value: 12, percent: 0.6, color: "#fdab3d" },
    { name: "Driver Error", value: 8, percent: 0.4, color: "#579bfc" },
  ];

  const networkStatusData = charts?.modem_network_status.slices.map((s) => ({
    name: s.label,
    value: s.count,
    percent: s.percent,
    color: s.color,
  })) || [
    { name: "Online", value: 1720, percent: 86.0, color: "#00c875" },
    { name: "Searching", value: 50, percent: 2.5, color: "#fdab3d" },
    { name: "No Service", value: 120, percent: 6.0, color: "#e2445c" },
    { name: "SIM Error", value: 40, percent: 2.0, color: "#a855f7" },
    { name: "Roaming", value: 70, percent: 3.5, color: "#f59e0b" },
  ];

  const rsrpTimeline = charts?.signal_strength.timeline || [
    { time: "00:00", value: -88 },
    { time: "04:00", value: -85 },
    { time: "08:00", value: -82 },
    { time: "12:00", value: -84 },
    { time: "16:00", value: -86 },
    { time: "20:00", value: -85 },
  ];

  const tempTimeline = charts?.modem_temperature.timeline || [
    { time: "00:00", value: 38 },
    { time: "04:00", value: 42 },
    { time: "08:00", value: 46 },
    { time: "12:00", value: 48 },
    { time: "16:00", value: 47 },
    { time: "20:00", value: 41 },
  ];

  const hitamTotal = summary?.smartbox_hitam.total ?? 1050;
  const hitamOnline = summary?.smartbox_hitam.online ?? 900;
  const hitamOffline = summary?.smartbox_hitam.offline ?? 110;
  const hitamDegraded = summary?.smartbox_hitam.degraded ?? 40;

  const putihTotal = summary?.smartbox_putih.total ?? 950;
  const putihOnline = summary?.smartbox_putih.online ?? 820;
  const putihOffline = summary?.smartbox_putih.offline ?? 100;
  const putihDegraded = summary?.smartbox_putih.degraded ?? 30;

  // Table Columns
  const columns: ColumnDef<ICellularGatewayItem>[] = [
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
              <Signal className="size-3.5" />
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
      id: "modem",
      header: "Modem",
      accessorKey: "modem",
      cell: (item) => (
        <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">
          {item.modem}
        </span>
      ),
    },
    {
      id: "provider",
      header: "Provider",
      align: "center",
      cell: (item) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-[#0073ea] border border-blue-500/20">
          {item.provider}
        </span>
      ),
    },
    {
      id: "sim_status",
      header: "Status SIM",
      accessorKey: "sim_status",
      cell: (item) => (
        <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">
          {item.sim_status}
        </span>
      ),
    },
    {
      id: "cpu_modem",
      header: "CPU – Modem",
      align: "center",
      cell: (item) => {
        const isConnected = item.cpu_modem === "Connected";
        const isNoResp = item.cpu_modem === "No Response";
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
              isConnected
                ? "bg-emerald-50 dark:bg-emerald-500/15 text-[#00c875] border-emerald-200/60 dark:border-emerald-500/25"
                : isNoResp
                ? "bg-amber-50 dark:bg-amber-500/15 text-[#fdab3d] border-amber-200/60 dark:border-amber-500/25"
                : "bg-rose-50 dark:bg-rose-500/15 text-[#e2445c] border-rose-200/60 dark:border-rose-500/25"
            }`}
          >
            {isConnected ? (
              <CheckCircle2 className="size-3 text-[#00c875]" />
            ) : isNoResp ? (
              <AlertTriangle className="size-3 text-[#fdab3d]" />
            ) : (
              <AlertCircle className="size-3 text-[#e2445c]" />
            )}
            <span>{item.cpu_modem}</span>
          </span>
        );
      },
    },
    {
      id: "signal_rsrp",
      header: "Signal (RSRP)",
      align: "center",
      cell: (item) => {
        const rsrpVal = parseInt(item.signal_rsrp, 10) || -90;
        const color = rsrpVal >= -85 ? "text-[#00c875]" : rsrpVal >= -105 ? "text-[#fdab3d]" : "text-[#e2445c]";
        return (
          <span className={`font-mono font-bold text-[11px] ${color}`}>
            {item.signal_rsrp}
          </span>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      align: "center",
      cell: (item) => (
        <StatusBadge
          status={item.status}
          variant={item.status === "Online" ? "online" : item.status === "Degraded" ? "degraded" : "offline"}
        />
      ),
    },
    {
      id: "last_update",
      header: "Last Update",
      align: "center",
      accessorKey: "last_update",
      cell: (item) => (
        <span className="text-slate-400 font-mono text-[11px] whitespace-nowrap">
          {formatToWIB(item.last_update)}
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
    <AppLayout title="Cellular Connectivity">
      <div className="space-y-5 max-w-[1600px] mx-auto pb-16 font-sans transition-colors">
        {/* 1. Header with Filters */}
        <FilterHeader
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setCurrentPage(1);
          }}
          searchPlaceholder="Cari Gateway ID, Provider, Lokasi..."
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
            title="Online"
            value={summary ? summary.online : 1720}
            icon={Check}
            color="emerald"
            percentage={`${summary?.online_percent ?? 86.0}%`}
          />
          <SummaryCard
            title="Degraded"
            value={summary ? summary.degraded : 70}
            icon={AlertCircle}
            color="amber"
            percentage={`${summary?.degraded_percent ?? 3.5}%`}
          />
          <SummaryCard
            title="Offline"
            value={summary ? summary.offline : 210}
            icon={AlertTriangle}
            color="rose"
            percentage={`${summary?.offline_percent ?? 10.5}%`}
          />
          <SummaryCard
            title="SmartBox Hitam"
            sublabel="(Raspberry Pi 3B+)"
            value={hitamTotal}
            deviceType="hitam"
            color="slate"
            breakdown={{
              healthy: hitamOnline,
              warning: hitamDegraded,
              critical: hitamOffline,
            }}
          />
          <SummaryCard
            title="SmartBox Putih"
            sublabel="(Rockchip RK3328)"
            value={putihTotal}
            deviceType="putih"
            color="slate"
            breakdown={{
              healthy: putihOnline,
              warning: putihDegraded,
              critical: putihOffline,
            }}
          />
        </div>

        {/* 3. Four Real-time Charts directly in page */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {/* Chart 1: CPU - Modem Comm Donut */}
          <ChartCard
            title="Komunikasi CPU – Modem"
            subtitle="Status Handshake Hardware"
            icon={Cpu}
          >
            <div className="flex items-center gap-2 h-40">
              <div className="w-32 h-32 relative shrink-0">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomDonutTooltip />} />
                      <Pie
                        data={cpuModemData}
                        cx="50%"
                        cy="50%"
                        innerRadius={32}
                        outerRadius={50}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {cpuModemData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-sm font-black text-slate-900 dark:text-white leading-none">
                    98.0%
                  </span>
                  <span className="text-[9px] text-slate-400">Connected</span>
                </div>
              </div>
              <div className="flex-1 space-y-1.5 text-xs">
                {cpuModemData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate">
                      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{d.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

          {/* Chart 2: Modem Network Status Donut */}
          <ChartCard
            title="Koneksi Jaringan"
            subtitle="Distribusi Status Jaringan"
            icon={Globe}
          >
            <div className="flex items-center gap-2 h-40">
              <div className="w-32 h-32 relative shrink-0">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomDonutTooltip />} />
                      <Pie
                        data={networkStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={32}
                        outerRadius={50}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {networkStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-sm font-black text-slate-900 dark:text-white leading-none">
                    86.0%
                  </span>
                  <span className="text-[9px] text-slate-400">Online</span>
                </div>
              </div>
              <div className="flex-1 space-y-1.5 text-xs">
                {networkStatusData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate">
                      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{d.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

          {/* Chart 3: Signal RSRP Trend */}
          <ChartCard
            title="Kekuatan Sinyal (RSRP)"
            subtitle="Rata-rata 24 Jam"
            icon={Signal}
          >
            <div className="flex items-stretch gap-1.5 h-40">
              <div className="flex-1 h-full relative">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={rsrpTimeline} margin={{ top: 8, right: 0, left: -4, bottom: 0 }}>
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={{ stroke: "#334155", strokeWidth: 0.5 }} tickLine={false} />
                      <YAxis width={28} domain={[-120, -60]} ticks={[-120, -90, -60]} tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={(v) => `${v}`} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomLineTooltip unit="dBm" />} />
                      <Line type="monotone" name="RSRP" dataKey="value" stroke="#0073ea" strokeWidth={2} dot={{ r: 2, fill: "#0073ea" }} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="w-14 shrink-0 flex flex-col justify-between py-1 border-l border-slate-100 dark:border-slate-800/80 pl-1.5">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none">Avg</div>
                  <div className="text-xs font-bold text-[#0073ea] mt-0.5">{charts?.signal_strength.avg ?? "-85"} dBm</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none">Min</div>
                  <div className="text-xs font-bold text-[#e2445c] mt-0.5">{charts?.signal_strength.min ?? "-110"} dBm</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none">Max</div>
                  <div className="text-xs font-bold text-[#00c875] mt-0.5">{charts?.signal_strength.max ?? "-72"} dBm</div>
                </div>
              </div>
            </div>
          </ChartCard>

          {/* Chart 4: Modem Temperature Trend */}
          <ChartCard
            title="Temperatur Modem"
            subtitle="Rata-rata 24 Jam"
            icon={Thermometer}
          >
            <div className="flex items-stretch gap-1.5 h-40">
              <div className="flex-1 h-full relative">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tempTimeline} margin={{ top: 8, right: 0, left: -4, bottom: 0 }}>
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={{ stroke: "#334155", strokeWidth: 0.5 }} tickLine={false} />
                      <YAxis width={28} domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={(v) => `${v}°C`} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomLineTooltip unit="°C" />} />
                      <Line type="monotone" name="Suhu" dataKey="value" stroke="#e2445c" strokeWidth={2} dot={{ r: 2, fill: "#e2445c" }} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="w-14 shrink-0 flex flex-col justify-between py-1 border-l border-slate-100 dark:border-slate-800/80 pl-1.5">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none">Avg</div>
                  <div className="text-xs font-bold text-[#fdab3d] mt-0.5">{charts?.modem_temperature.avg ?? "43.5"}°C</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none">Max</div>
                  <div className="text-xs font-bold text-[#e2445c] mt-0.5">{charts?.modem_temperature.max ?? "62.0"}°C</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none">Min</div>
                  <div className="text-xs font-bold text-[#00c875] mt-0.5">{charts?.modem_temperature.min ?? "28.0"}°C</div>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* 4. Filterable & Paginated Daftar Gateway Table (Directly rendered with DataTable) */}
        <DataTable
          title="Daftar Gateway Cellular"
          titleIcon={Signal}
          subtitle="Klik baris untuk membuka detail telemetry cellular di bawah"
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

        {/* 5. Cellular Device Detail Section */}
        {selectedGatewayId && (
          <div ref={detailRef} className="pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <CellularDeviceDetailCard
              gatewayId={selectedGatewayId}
              onClose={() => setSelectedGatewayId(null)}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
