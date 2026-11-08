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
          <span>Percentage:</span>
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

// Signal Quality helper based on standard dBm thresholds:
// • -50 dBm s/d -70 dBm : Excellent (Sangat Baik / Ideal)
// • -71 dBm s/d -85 dBm : Good (Bagus / Stabil)
// • -86 dBm s/d -100 dBm: Fair (Cukup / Lemah)
// • < -100 dBm          : Poor (Sangat Buruk / Terputus-putus)
function getSignalQuality(rsrpStr: string): {
  label: string;
  badgeClass: string;
} {
  if (!rsrpStr || rsrpStr === "-" || rsrpStr.toLowerCase().includes("n/a")) {
    return {
      label: "No Signal",
      badgeClass: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    };
  }
  const match = rsrpStr.match(/-?\d+/);
  if (!match) {
    return {
      label: "Unknown",
      badgeClass: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    };
  }
  const val = parseInt(match[0], 10);
  if (val >= -70) {
    return {
      label: "Excellent",
      badgeClass: "bg-emerald-50 dark:bg-emerald-500/15 text-[#00c875] border-emerald-200/60 dark:border-emerald-500/25",
    };
  }
  if (val >= -85) {
    return {
      label: "Good",
      badgeClass: "bg-teal-50 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-200/60 dark:border-teal-500/25",
    };
  }
  if (val >= -100) {
    return {
      label: "Fair",
      badgeClass: "bg-amber-50 dark:bg-amber-500/15 text-[#fdab3d] border-amber-200/60 dark:border-amber-500/25",
    };
  }
  return {
    label: "Poor",
    badgeClass: "bg-rose-50 dark:bg-rose-500/15 text-[#e2445c] border-rose-200/60 dark:border-rose-500/25",
  };
}

export default function CellularConnectivityPage() {
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
  const { data: dashboard } = useCellularDashboard({
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

  const handleSelectGateway = (gateway: ICellularGatewayItem) => {
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
  const cpuModemData =
    charts?.cpu_modem_comm.slices.map((s) => ({
      name: s.label,
      value: s.count,
      percent: s.percent,
      color: s.color,
    })) || [];

  const networkStatusData =
    charts?.modem_network_status.slices.map((s) => ({
      name: s.label,
      value: s.count,
      percent: s.percent,
      color: s.color,
    })) || [];

  const rsrpTimeline = charts?.signal_strength.timeline || [];

  const tempTimeline = charts?.modem_temperature.timeline || [];

  const hitamTotal = summary?.smartbox_hitam.total ?? 0;
  const hitamOnline = summary?.smartbox_hitam.online ?? 0;
  const hitamOffline = summary?.smartbox_hitam.offline ?? 0;
  const hitamWarning = (summary?.smartbox_hitam as any)?.warning ?? summary?.smartbox_hitam.degraded ?? 0;

  const putihTotal = summary?.smartbox_putih.total ?? 0;
  const putihOnline = summary?.smartbox_putih.online ?? 0;
  const putihOffline = summary?.smartbox_putih.offline ?? 0;
  const putihWarning = (summary?.smartbox_putih as any)?.warning ?? summary?.smartbox_putih.degraded ?? 0;

  // Table Columns
  const columns: ColumnDef<ICellularGatewayItem>[] = [
    {
      id: "location",
      header: "Location",
      accessorKey: "location",
      cell: (item) => {
        const isSelected = selectedGatewayId === item.id;
        return (
          <div className="flex items-center gap-2">
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              {item.location}
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
      id: "type",
      header: "Type",
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
      header: "SIM Status",
      accessorKey: "sim_status",
      cell: (item) => {
        const raw = (item.sim_status || "").toLowerCase();
        const isReady = raw.includes("ready") || raw.includes("aktif") || raw.includes("active") || raw.includes("inserted");
        const isNotDetected = raw.includes("tidak") || raw.includes("not detected") || raw.includes("no sim");
        const displayLabel = isReady ? "Ready" : isNotDetected ? "Not Detected" : item.sim_status || "Not Detected";
        return (
          <span
            className={`font-mono text-[11px] font-semibold ${
              isReady ? "text-[#00c875]" : "text-rose-500"
            }`}
          >
            {displayLabel}
          </span>
        );
      },
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
      id: "status",
      header: "Status",
      align: "center",
      cell: (item) => {
        const isWarn = item.status === "Warning" || item.status === "Degraded";
        const displayStatus = isWarn ? "Warning" : item.status;
        return (
          <StatusBadge
            status={displayStatus}
            variant={item.status === "Online" ? "online" : isWarn ? "degraded" : "offline"}
          />
        );
      },
    },
    {
      id: "signal_rsrp",
      header: "Signal (RSRP)",
      align: "center",
      cell: (item) => {
        const match = item.signal_rsrp.match(/-?\d+/);
        const rsrpVal = match ? parseInt(match[0], 10) : -90;
        const color =
          rsrpVal >= -70
            ? "text-[#00c875]"
            : rsrpVal >= -85
            ? "text-teal-400"
            : rsrpVal >= -100
            ? "text-[#fdab3d]"
            : "text-[#e2445c]";
        return (
          <span className={`font-mono font-bold text-[11px] ${color}`}>
            {item.signal_rsrp}
          </span>
        );
      },
    },
    {
      id: "signal_status",
      header: "Signal Status",
      align: "center",
      cell: (item) => {
        const quality = getSignalQuality(item.signal_rsrp);
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${quality.badgeClass}`}
          >
            {quality.label}
          </span>
        );
      },
    },
  ];

  return (
    <AppLayout
      title="Cellular"
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
            value={summary ? summary.total_gateways : 0}
            icon={Server}
            color="blue"
            onClick={() => handleCardFilter("All Statuses")}
            active={statusFilter === "All Statuses"}
          />
          <SummaryCard
            title="Online"
            value={summary ? summary.online : 0}
            icon={Check}
            color="emerald"
            percentage={summary ? `${summary.online_percent}%` : "0%"}
            onClick={() => handleCardFilter("Online")}
            active={statusFilter === "Online"}
          />
          <SummaryCard
            title="Warning"
            value={summary ? ((summary as any).warning ?? summary.degraded) : 0}
            icon={AlertCircle}
            color="amber"
            percentage={summary ? `${(summary as any)?.warning_percent ?? summary?.degraded_percent ?? 0}%` : "0%"}
            onClick={() => handleCardFilter("Warning")}
            active={statusFilter === "Warning" || statusFilter === "Degraded"}
          />
          <SummaryCard
            title="Offline"
            value={summary ? summary.offline : 0}
            icon={AlertTriangle}
            color="rose"
            percentage={summary ? `${summary.offline_percent}%` : "0%"}
            onClick={() => handleCardFilter("Offline")}
            active={statusFilter === "Offline"}
          />
          <SummaryCard
            title="SmartBox Black"
            sublabel="(Raspberry Pi 3B+)"
            value={hitamTotal}
            deviceType="hitam"
            color="slate"
            breakdown={{
              healthy: hitamOnline,
              warning: hitamWarning,
              critical: hitamOffline,
            }}
          />
          <SummaryCard
            title="SmartBox White"
            sublabel="(Rockchip RK3328)"
            value={putihTotal}
            deviceType="putih"
            color="slate"
            breakdown={{
              healthy: putihOnline,
              warning: putihWarning,
              critical: putihOffline,
            }}
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
