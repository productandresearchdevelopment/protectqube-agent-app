"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useDVRDashboard, IDVRGatewayItem } from "@/store/api/monitoring";
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
import { DVRDeviceDetailCard } from "@/components/dvr/DVRDeviceDetailCard";
import {
  Server,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Video,
  HardDrive,
  Cpu,
  Disc,
  MoreHorizontal,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
} from "recharts";

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

const CustomAreaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 dark:bg-slate-900/95 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-xl border border-slate-700/80 backdrop-blur-xs font-sans z-50">
        <div className="text-slate-400 font-mono text-[10px] mb-0.5">{label}</div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#c084fc]" />
          <span className="font-medium text-slate-200">Storage Usage:</span>
          <span className="font-bold text-[#c084fc]">{payload[0].value}%</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function DVRRecordingPage() {
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
  const { data: dashboard } = useDVRDashboard({
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

  const handleSelectGateway = (gateway: IDVRGatewayItem) => {
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
        { label: "Online", value: "Online" },
        { label: "Warning", value: "Warning" },
        { label: "Offline", value: "Offline" },
      ],
    },
  ];

  // Chart Data
  const cpuDvrData = charts?.cpu_dvr_comm.slices.map((s) => ({
    name: s.label,
    value: s.count,
    percent: s.percent,
    color: s.color,
  })) || [
    { name: "Connected", value: 1850, percent: 92.5, color: "#00c875" },
    { name: "No Response", value: 80, percent: 4.0, color: "#e2445c" },
    { name: "Not Detected", value: 40, percent: 2.0, color: "#fdab3d" },
    { name: "Driver Error", value: 30, percent: 1.5, color: "#579bfc" },
  ];

  const statusKameraData = charts?.status_kamera.slices.map((s) => ({
    name: s.label,
    value: s.count,
    percent: s.percent,
    color: s.color,
  })) || [
    { name: "Online", value: 7350, percent: 90.2, color: "#00c875" },
    { name: "No Video", value: 480, percent: 5.9, color: "#fdab3d" },
    { name: "Offline", value: 320, percent: 3.9, color: "#e2445c" },
  ];

  const recordingStatusData = charts?.recording_status.slices.map((s) => ({
    name: s.label,
    value: s.count,
    percent: s.percent,
    color: s.color,
  })) || [
    { name: "Recording", value: 7200, percent: 88.3, color: "#00c875" },
    { name: "Not Recording", value: 500, percent: 6.1, color: "#fdab3d" },
    { name: "Recording Error", value: 270, percent: 3.3, color: "#e2445c" },
    { name: "Storage Full", value: 180, percent: 2.2, color: "#a855f7" },
  ];

  const storageTimeline = charts?.storage_usage.timeline || [
    { time: "00:00", value: 68 },
    { time: "04:00", value: 69 },
    { time: "08:00", value: 71 },
    { time: "12:00", value: 72 },
    { time: "16:00", value: 72 },
    { time: "20:00", value: 73 },
  ];

  const kameraOnline = summary?.kamera_online ?? 8010;
  const kameraOffline = (summary?.kamera_no_video ?? 80) + (summary?.kamera_offline ?? 60);

  const storageUsed = summary?.storage_used_tb ?? 184.2;
  const storageTotal = summary?.total_storage_tb ?? 256.0;
  const storagePct = storageTotal > 0 ? Math.round((storageUsed / storageTotal) * 100) : 72;

  // Table Columns
  const columns: ColumnDef<IDVRGatewayItem>[] = [
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
              <Video className="size-3.5" />
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
      id: "dvr_model",
      header: "Model DVR",
      accessorKey: "dvr_model",
      cell: (item) => (
        <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">
          {item.dvr_model}
        </span>
      ),
    },
    {
      id: "cpu_dvr",
      header: "CPU – DVR",
      align: "center",
      cell: (item) => {
        const isConnected = item.cpu_dvr === "Connected";
        const isDegraded = item.cpu_dvr === "Degraded";
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
              isConnected
                ? "bg-emerald-50 dark:bg-emerald-500/15 text-[#00c875] border-emerald-200/60 dark:border-emerald-500/25"
                : isDegraded
                ? "bg-amber-50 dark:bg-amber-500/15 text-[#fdab3d] border-amber-200/60 dark:border-amber-500/25"
                : "bg-rose-50 dark:bg-rose-500/15 text-[#e2445c] border-rose-200/60 dark:border-rose-500/25"
            }`}
          >
            {isConnected ? (
              <CheckCircle2 className="size-3 text-[#00c875]" />
            ) : isDegraded ? (
              <AlertTriangle className="size-3 text-[#fdab3d]" />
            ) : (
              <AlertCircle className="size-3 text-[#e2445c]" />
            )}
            <span>{item.cpu_dvr}</span>
          </span>
        );
      },
    },
    {
      id: "camera_status",
      header: "Status Kamera",
      align: "center",
      cell: (item) => {
        const isAllUp = item.kamera_online === item.total_kamera;
        return (
          <span
            className={`font-mono font-bold text-[11px] ${
              isAllUp ? "text-[#00c875]" : "text-[#fdab3d]"
            }`}
          >
            {item.kamera_online} / {item.total_kamera} Online
          </span>
        );
      },
    },
    {
      id: "recording_status",
      header: "Recording Status",
      align: "center",
      cell: (item) => (
        <StatusBadge
          status={item.recording_status}
          variant={item.recording_status === "Normal" ? "online" : item.recording_status === "Warning" ? "warning" : "critical"}
        />
      ),
    },
    {
      id: "storage_percent",
      header: "Storage HDD/SD",
      align: "center",
      cell: (item) => <LoadProgressBar percent={item.storage_usage_percent} />,
    },
    {
      id: "dvr_health",
      header: "Kesehatan DVR",
      align: "center",
      cell: (item) => (
        <StatusBadge
          status={item.dvr_health}
          variant={item.dvr_health === "Good" ? "good" : item.dvr_health === "Caution" ? "caution" : "bad"}
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
          title="Lihat Detail Telemetry & Video Preview"
        >
          <MoreHorizontal className="size-4" />
        </button>
      ),
    },
  ];

  return (
    <AppLayout title="DVR & Recording">
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
            title="Recording Normal"
            value={summary ? summary.recording_normal : 1760}
            icon={Check}
            color="emerald"
            percentage={`${summary?.recording_normal_percent ?? 88.0}%`}
          />
          <SummaryCard
            title="Issue"
            value={summary ? summary.issue : 180}
            icon={AlertCircle}
            color="amber"
            percentage={`${summary?.issue_percent ?? 9.0}%`}
          />
          <SummaryCard
            title="Offline"
            value={summary ? summary.offline : 60}
            icon={AlertTriangle}
            color="rose"
            percentage={`${summary?.offline_percent ?? 3.0}%`}
          />
          <SummaryCard
            title="Total Kamera"
            value={summary ? summary.total_kamera : 8150}
            icon={Video}
            color="slate"
            footer={
              <div className="flex items-center gap-2.5 text-[10px] font-semibold mt-1">
                <span className="flex items-center gap-1 text-[#00c875]">
                  <span className="size-1.5 rounded-full bg-[#00c875]" />
                  {kameraOnline.toLocaleString()}
                </span>
                <span className="flex items-center gap-1 text-[#e2445c]">
                  <span className="size-1.5 rounded-full bg-[#e2445c]" />
                  {kameraOffline.toLocaleString()}
                </span>
              </div>
            }
          />
          <SummaryCard
            title="Total Storage"
            value={`${storageUsed} TB`}
            icon={HardDrive}
            color="purple"
            percentage={`${storagePct}%`}
            footer={
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden mt-1.5">
                <div
                  style={{ width: `${storagePct}%` }}
                  className="bg-purple-500 h-full"
                />
              </div>
            }
          />
        </div>

        {/* 3. Four Real-time Charts directly in page */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {/* Chart 1: CPU - DVR Comm Donut */}
          <ChartCard
            title="Komunikasi CPU – DVR"
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
                        data={cpuDvrData}
                        cx="50%"
                        cy="50%"
                        innerRadius={32}
                        outerRadius={50}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {cpuDvrData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-sm font-black text-slate-900 dark:text-white leading-none">
                    92.5%
                  </span>
                  <span className="text-[9px] text-slate-400">Connected</span>
                </div>
              </div>
              <div className="flex-1 space-y-1.5 text-xs">
                {cpuDvrData.map((d) => (
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

          {/* Chart 2: Status Kamera Donut */}
          <ChartCard
            title="Status Kamera"
            subtitle="Distribusi Channel CCTV"
            icon={Video}
          >
            <div className="flex items-center gap-2 h-40">
              <div className="w-32 h-32 relative shrink-0">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomDonutTooltip />} />
                      <Pie
                        data={statusKameraData}
                        cx="50%"
                        cy="50%"
                        innerRadius={32}
                        outerRadius={50}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusKameraData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-sm font-black text-slate-900 dark:text-white leading-none">
                    90.2%
                  </span>
                  <span className="text-[9px] text-slate-400">Online</span>
                </div>
              </div>
              <div className="flex-1 space-y-1.5 text-xs">
                {statusKameraData.map((d) => (
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

          {/* Chart 3: Recording Status Donut */}
          <ChartCard
            title="Status Recording"
            subtitle="Distribusi Status Stream"
            icon={Disc}
          >
            <div className="flex items-center gap-2 h-40">
              <div className="w-32 h-32 relative shrink-0">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomDonutTooltip />} />
                      <Pie
                        data={recordingStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={32}
                        outerRadius={50}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {recordingStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-sm font-black text-slate-900 dark:text-white leading-none">
                    88.3%
                  </span>
                  <span className="text-[9px] text-slate-400">Merekam</span>
                </div>
              </div>
              <div className="flex-1 space-y-1.5 text-xs">
                {recordingStatusData.map((d) => (
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

          {/* Chart 4: Storage Usage Trend AreaChart */}
          <ChartCard
            title="Tren Penggunaan Storage"
            subtitle="Kapasitas 24 Jam"
            icon={HardDrive}
          >
            <div className="flex items-stretch gap-1.5 h-40">
              <div className="flex-1 h-full relative">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={storageTimeline} margin={{ top: 8, right: 0, left: -4, bottom: 0 }}>
                      <defs>
                        <linearGradient id="storageGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#c084fc" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#c084fc" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={{ stroke: "#334155", strokeWidth: 0.5 }} tickLine={false} />
                      <YAxis width={28} domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomAreaTooltip />} />
                      <Area type="monotone" name="Storage" dataKey="value" stroke="#c084fc" strokeWidth={2} fillOpacity={1} fill="url(#storageGrad)" activeDot={{ r: 4, fill: "#c084fc" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="w-14 shrink-0 flex flex-col justify-between py-1 border-l border-slate-100 dark:border-slate-800/80 pl-1.5">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none">Avg</div>
                  <div className="text-xs font-bold text-purple-400 mt-0.5">{charts?.storage_usage.avg ?? "72.0"}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none">Max</div>
                  <div className="text-xs font-bold text-[#e2445c] mt-0.5">{charts?.storage_usage.max ?? "88.0"}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none">Min</div>
                  <div className="text-xs font-bold text-[#00c875] mt-0.5">{charts?.storage_usage.min ?? "65.0"}%</div>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* 4. Filterable & Paginated Daftar Gateway Table */}
        <DataTable
          title="Daftar Gateway DVR & Recording"
          titleIcon={Video}
          subtitle="Klik baris untuk membuka detail telemetry DVR & CCTV preview di bawah"
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

        {/* 5. DVR Device Detail Section - Appears below table upon row click with smooth auto-scroll */}
        {selectedGatewayId && (
          <div ref={detailRef} className="pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <DVRDeviceDetailCard
              gatewayId={selectedGatewayId}
              onClose={() => setSelectedGatewayId(null)}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
