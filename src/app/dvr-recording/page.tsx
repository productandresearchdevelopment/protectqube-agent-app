"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useDVRDashboard, IDVRGatewayItem } from "@/store/api/monitoring";
import { formatToWIB } from "@/utils/common";
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
          <span>Percentage:</span>
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
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
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

  const handleCardFilter = (statusVal: string) => {
    if (statusFilter === statusVal) {
      setStatusFilter("All Statuses");
    } else {
      setStatusFilter(statusVal);
    }
    setCurrentPage(1);
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
        { label: "All Types", value: "All Types" },
        { label: "SmartBox Black", value: "SmartBox Hitam" },
        { label: "SmartBox White", value: "SmartBox Putih" },
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
      id: "id",
      header: "Gateway ID",
      cell: (item) => {
        const isSelected = selectedGatewayId === item.id;
        return (
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
        );
      },
    },
    {
      id: "location",
      header: "Location",
      accessorKey: "location",
      cell: (item) => (
        <span className="text-slate-700 dark:text-slate-300 font-medium">
          {item.location}
        </span>
      ),
    },
    {
      id: "type",
      header: "Type",
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
      header: "Camera Status",
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
      cell: (item) => {
        const isRec = item.recording_status === "Recording" || item.recording_status === "Normal";
        return (
          <StatusBadge
            status={isRec ? "Recording" : "Not Recording"}
            variant={isRec ? "online" : "critical"}
          />
        );
      },
    },
    {
      id: "storage_percent",
      header: "Storage",
      align: "center",
      cell: (item) => <LoadProgressBar percent={item.storage_usage_percent} />,
    },
    {
      id: "dvr_health",
      header: "DVR Health",
      align: "center",
      cell: (item) => (
        <StatusBadge
          status={item.dvr_health}
          variant={
            item.dvr_health === "Good"
              ? "good"
              : item.dvr_health === "Warning" || item.dvr_health === "Caution"
              ? "warning"
              : "critical"
          }
        />
      ),
    },
  ];

  return (
    <AppLayout
      title="DVR & Recording"
      headerRight={
        <FilterHeader
          inline
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setCurrentPage(1);
          }}
          searchPlaceholder="Search Gateway ID or Location..."
          filters={filters}
        />
      }
    >
      <div className="w-full flex-1 flex flex-col min-h-0 space-y-3.5 font-sans transition-colors pb-2">

        {/* 2. Top Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 pt-1 pb-0.5">
          <SummaryCard
            title="Total Gateway"
            value={summary ? summary.total_gateways : 2000}
            icon={Server}
            color="blue"
            onClick={() => handleCardFilter("All Statuses")}
            active={statusFilter === "All Statuses"}
          />
          <SummaryCard
            title="Recording"
            value={summary ? summary.recording_normal : 1760}
            icon={Check}
            color="emerald"
            percentage={`${summary?.recording_normal_percent ?? 88.0}%`}
            onClick={() => handleCardFilter("Recording")}
            active={statusFilter === "Recording"}
          />
          <SummaryCard
            title="Issue"
            value={summary ? summary.issue : 180}
            icon={AlertCircle}
            color="amber"
            percentage={`${summary?.issue_percent ?? 9.0}%`}
            onClick={() => handleCardFilter("Issue")}
            active={statusFilter === "Issue"}
          />
          <SummaryCard
            title="Offline"
            value={summary ? summary.offline : 60}
            icon={AlertTriangle}
            color="rose"
            percentage={`${summary?.offline_percent ?? 3.0}%`}
            onClick={() => handleCardFilter("Offline")}
            active={statusFilter === "Offline"}
          />
          <SummaryCard
            title="Total Cameras"
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

        {/* Status Filter Indicator */}
        {statusFilter !== "All Statuses" && (
          <div className="flex items-center justify-between bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 px-3.5 py-2 rounded-xl text-xs shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">Filtering table by status:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2.5 py-0.5 rounded-full">
                {statusFilter}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCardFilter("All Statuses")}
              className="text-blue-500 hover:underline font-semibold cursor-pointer"
            >
              Reset Filter (Show All)
            </button>
          </div>
        )}

        {/* 3. Filterable & Paginated Daftar Gateway Table (Full Viewport Height) */}
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
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          className={selectedGatewayId ? "min-h-100" : "h-[calc(100vh-215px)] flex-1"}
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
