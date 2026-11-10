"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSystemHealthDashboard, IGatewayItem } from "@/store/api/monitoring";
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

  const hitamTotal = summary?.smartbox_hitam.total ?? 0;
  const hitamOnline = summary?.smartbox_hitam.online ?? 0;
  const hitamOffline = summary?.smartbox_hitam.offline ?? 0;

  const putihTotal = summary?.smartbox_putih.total ?? 0;
  const putihOnline = summary?.smartbox_putih.online ?? 0;
  const putihOffline = summary?.smartbox_putih.offline ?? 0;

  // Table Columns
  const columns: ColumnDef<IGatewayItem>[] = [
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
      id: "cpu",
      header: "CPU",
      align: "center",
      cell: (item) => {
        if (item.status === "Offline" || typeof item.cpu !== "number") {
          return <span className="font-mono text-slate-400 font-bold text-[11px]">-</span>;
        }
        return <LoadProgressBar percent={item.cpu} />;
      },
    },
    {
      id: "ram",
      header: "RAM",
      align: "center",
      cell: (item) => {
        if (item.status === "Offline" || typeof item.ram !== "number") {
          return <span className="font-mono text-slate-400 font-bold text-[11px]">-</span>;
        }
        return <LoadProgressBar percent={item.ram} />;
      },
    },
    {
      id: "sd_card",
      header: "Storage",
      align: "center",
      cell: (item) => {
        if (item.status === "Offline" || typeof item.sd_percent !== "number") {
          return <span className="font-mono text-slate-400 font-bold text-[11px]">-</span>;
        }
        return <LoadProgressBar percent={item.sd_percent} />;
      },
    },
    {
      id: "sd_health",
      header: "Storage Health",
      align: "center",
      cell: (item) => {
        if (item.status === "Offline" || !item.sd_health || item.sd_health === "-") {
          return <span className="font-mono text-slate-400 font-bold text-[11px]">-</span>;
        }
        const isGood = item.sd_health === "Good" || item.sd_health === "Normal";
        const isWarn = item.sd_health === "Wear" || item.sd_health === "Warning" || item.sd_health === "Caution";
        const statusLabel = isGood ? "Good" : isWarn ? "Warning" : "Critical";
        const variant = isGood ? "good" : isWarn ? "warning" : "critical";
        return (
          <StatusBadge
            status={statusLabel}
            variant={variant}
          />
        );
      },
    },
    {
      id: "battery",
      header: "Battery / Power",
      align: "center",
      cell: (item) => {
        if (item.status === "Offline") {
          return <span className="font-mono text-slate-400 font-bold text-[11px]">-</span>;
        }
        const isWhite = item.type.includes("Putih") || item.model.includes("210") || item.model.includes("RK3328");
        if (isWhite) {
          const isDischarging = item.is_power_drop || item.power_status === "Discharging" || item.power_source === "BATT";
          const pct = item.battery_percent ?? 100;
          const isFull = pct >= 100 || item.power_status === "Full" || item.power_text?.toLowerCase().includes("100% full");

          if (isDischarging) {
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-[#e2445c] border border-rose-500/30 whitespace-nowrap">
                <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                Discharging ({pct}%)
              </span>
            );
          }
          if (!isFull && pct < 100) {
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 whitespace-nowrap">
                <span className="size-1.5 rounded-full bg-blue-500" />
                Charging ({pct}%)
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-[#00c875] border border-emerald-500/30 whitespace-nowrap">
              <span className="size-1.5 rounded-full bg-[#00c875]" />
              Full ({pct}%)
            </span>
          );
        } else {
          // SmartBox Hitam
          const voltMatch = item.power_text?.match(/([0-9\.]+V)/i);
          let voltStr = voltMatch ? voltMatch[1] : (item.voltage || "5.10V");
          const numMatch = voltStr.match(/([0-9\.]+)/);
          if (numMatch) {
            const vFloat = parseFloat(numMatch[1]);
            if (!isNaN(vFloat)) {
              voltStr = `${vFloat.toFixed(2)}V`;
            }
          }
          const isDrop = item.is_power_drop || item.power_status === "Voltage Drop" || item.power_status === "Pernah Drop";
          if (isDrop) {
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 whitespace-nowrap">
                <span className="size-1.5 rounded-full bg-amber-500" />
                Charging ({voltStr})
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 whitespace-nowrap">
              <span className="size-1.5 rounded-full bg-blue-500" />
              Charging ({voltStr})
            </span>
          );
        }
      },
    },
    {
      id: "status",
      header: "Status",
      align: "center",
      cell: (item) => {
        const isOnline = item.status === "Online" || item.status === "Healthy";
        return (
          <StatusBadge
            status={isOnline ? "Online" : "Offline"}
            variant={isOnline ? "online" : "offline"}
          />
        );
      },
    },
  ];

  return (
    <AppLayout
      title="System Health"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 pt-1 pb-0.5">
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
            value={summary ? (summary.online ?? 0) : 0}
            icon={Check}
            color="emerald"
            percentage={summary ? `${summary.online_percent ?? 0}%` : "0%"}
            onClick={() => handleCardFilter("Online")}
            active={statusFilter === "Online"}
          />
          <SummaryCard
            title="Offline"
            value={summary ? (summary.offline ?? 0) : 0}
            icon={AlertTriangle}
            color="rose"
            percentage={summary ? `${summary.offline_percent ?? 0}%` : "0%"}
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
              warning: 0,
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
              warning: 0,
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
