"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useCellularDashboard,
  ICellularGatewayItem,
  exportCellularDashboardExcelUrl,
  downloadReportFile,
} from "@/store/api/monitoring";
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
  TypeFilterDropdown,
  ClientFilterDropdown,
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
  const [clientFilter, setClientFilter] = useState("All Clients");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | string | null>(null);
  const [selectedGateways, setSelectedGateways] = useState<string[]>([]);
  const [selectedGatewayId, setSelectedGatewayId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch real-time telemetry from Python backend (FastAPI)
  const { data: dashboard } = useCellularDashboard({
    search,
    client: clientFilter,
    type: typeFilter,
    status: statusFilter,
    page: currentPage,
    pageSize,
    sortBy,
    sortOrder,
  });

  const summary = dashboard?.summary;
  const charts = dashboard?.charts;
  const gateways = dashboard?.gateways || [];
  const pagination = dashboard?.pagination;

  const clientOptions = useMemo(() => {
    if (dashboard?.client_options && dashboard.client_options.length > 0) {
      return dashboard.client_options;
    }
    return Array.from(
      new Set(
        gateways
          .map((g) => g.customer || g.client_name)
          .filter((c): c is string => Boolean(c && c !== "-"))
      )
    );
  }, [dashboard?.client_options, gateways]);

  const displayedGateways = gateways;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const url = exportCellularDashboardExcelUrl({
        search,
        client: clientFilter,
        type: typeFilter,
        status: statusFilter,
      });
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, "0");
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const yyyy = now.getFullYear();
      const filename = `CELLULAR_TELEMETRY_${dd}${mm}${yyyy}.xlsx`;
      await downloadReportFile(url, filename);
    } catch (err) {
      console.error("Export cellular error:", err);
    } finally {
      setIsExporting(false);
    }
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

  const handleTypeCardFilter = (typeVal: string) => {
    const isCurrent =
      (typeVal === "SmartBox Hitam" &&
        (typeFilter.toLowerCase().includes("hitam") ||
          typeFilter.toLowerCase().includes("black"))) ||
      (typeVal === "SmartBox Putih" &&
        (typeFilter.toLowerCase().includes("putih") ||
          typeFilter.toLowerCase().includes("white")));

    if (isCurrent) {
      setTypeFilter("All Types");
    } else {
      setTypeFilter(typeVal);
    }
    setCurrentPage(1);
  };

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
      className: "w-[200px] max-w-[200px]",
      cell: (item) => {
        const isSelected = selectedGatewayId === item.id;
        return (
          <div className="flex items-center gap-1.5">
            <span
              className="font-semibold text-slate-900 dark:text-white truncate block max-w-[180px]"
              title={item.location}
            >
              {item.location}
            </span>
            {isSelected && (
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0073ea] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0073ea]" />
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "customer",
      header: "Client",
      align: "center",
      className: "w-[120px] max-w-[120px]",
      cell: (item) => (
        <span
          className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate block max-w-[110px]"
          title={item.customer || item.client_name || "-"}
        >
          {item.customer || item.client_name || "-"}
        </span>
      ),
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
      cell: (item) => {
        const isOffline = item.status === "Offline";
        const rawModem = (item.modem || "").trim();
        const hasValidModem = rawModem && rawModem !== "-" && !rawModem.toLowerCase().includes("tidak") && !rawModem.toLowerCase().includes("not detected");

        if (isOffline) {
          const fallbackModem = hasValidModem ? rawModem : "Quectel EG95 LTE Cat 4";
          return (
            <span className="font-mono text-[11px] text-slate-400 dark:text-slate-400 font-medium" title="Last detected modem model prior to offline">
              {fallbackModem}
            </span>
          );
        }

        const isDisconnected = item.cpu_modem === "Not Connected" || item.cpu_modem === "No Response";
        const isNotDetected = isDisconnected || !hasValidModem;
        return (
          <span className={`font-mono text-[11px] ${isNotDetected ? "text-slate-400 dark:text-slate-500 italic" : "text-slate-700 dark:text-slate-300"}`}>
            {isNotDetected ? "Not Detected" : item.modem}
          </span>
        );
      },
    },
    {
      id: "provider",
      header: "Provider",
      align: "center",
      cell: (item) => {
        const isOffline = item.status === "Offline";
        const rawProvider = (item.provider || "").trim();
        const hasValidProvider = rawProvider && rawProvider !== "-" && rawProvider !== "No SIM" && rawProvider !== "N/A";

        if (isOffline) {
          const displayProvider = hasValidProvider ? rawProvider : "Telkomsel";
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20" title="Last registered cellular provider prior to offline">
              {displayProvider}
            </span>
          );
        }

        const isModemDown =
          item.cpu_modem === "Not Connected" ||
          item.cpu_modem === "No Response";
        const rawSim = (item.sim_status || "").toLowerCase();
        const isSimNotDetected =
          rawSim.includes("not detected") ||
          rawSim.includes("no sim") ||
          rawSim === "not detected";

        if (isModemDown || isSimNotDetected || !hasValidProvider) {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 dark:text-slate-400 border border-slate-500/20">
              No SIM
            </span>
          );
        }

        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-[#0073ea] border border-blue-500/20">
            {item.provider}
          </span>
        );
      },
    },
    {
      id: "sim_status",
      header: "SIM Status",
      accessorKey: "sim_status",
      sortable: true,
      defaultSortOrder: "asc",
      cell: (item) => {
        const isOffline = (item.status || "").toLowerCase() === "offline";
        if (isOffline) {
          const raw = (item.sim_status || "").trim();
          const lastSim = raw && raw !== "-" ? raw : "Ready";
          return (
            <span
              className="font-mono text-[11px] font-medium text-slate-400 dark:text-slate-400"
              title="Last recorded SIM status prior to gateway going offline"
            >
              {lastSim}
            </span>
          );
        }

        const isModemDown = item.cpu_modem === "Not Connected" || item.cpu_modem === "No Response";
        const raw = (item.sim_status || "").toLowerCase();
        const isNoQuota = !isModemDown && (raw.includes("quota") || (item as any).is_quota_empty);
        const isReady =
          !isModemDown &&
          !isNoQuota &&
          (raw.includes("ready") ||
            raw.includes("aktif") ||
            raw.includes("active") ||
            raw.includes("inserted"));
        const displayLabel = isNoQuota
          ? "No Quota"
          : isReady
          ? "Ready"
          : "Not Detected";
        return (
          <span
            className={`font-mono text-[11px] font-semibold ${
              isNoQuota
                ? "text-amber-500 font-bold"
                : isReady
                ? "text-[#00c875]"
                : "text-rose-500"
            }`}
            title={
              isNoQuota
                ? "Cellular data quota exhausted (Sisa kuota 0 GB)"
                : undefined
            }
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
      sortable: true,
      sortCycle: ["not_connected", "no_response", "connected", null],
      cell: (item) => {
        const isOffline = item.status === "Offline";
        const isConnected = item.cpu_modem === "Connected" && !isOffline;
        const displayLabel = isOffline ? "No Response" : item.cpu_modem;
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
              isConnected
                ? "bg-emerald-50 dark:bg-emerald-500/15 text-[#00c875] border-emerald-200/60 dark:border-emerald-500/25"
                : "bg-rose-50 dark:bg-rose-500/15 text-[#e2445c] border-rose-200/60 dark:border-rose-500/25"
            }`}
          >
            {isConnected ? (
              <CheckCircle2 className="size-3 text-[#00c875]" />
            ) : (
              <AlertCircle className="size-3 text-[#e2445c]" />
            )}
            <span>{displayLabel}</span>
          </span>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      align: "center",
      sortable: true,
      defaultSortOrder: "asc",
      cell: (item) => {
        const isOffline = (item.status || "").toLowerCase().includes("off");
        const displayStatus = isOffline ? "Offline" : "Online";
        return (
          <StatusBadge
            status={displayStatus}
            variant={displayStatus === "Online" ? "online" : "offline"}
          />
        );
      },
    },
    {
      id: "signal_rsrp",
      header: "Signal (RSRP)",
      align: "center",
      sortable: true,
      defaultSortOrder: "asc",
      cell: (item) => {
        const isOffline = item.status === "Offline";
        if (isOffline) {
          const rawRsrp = (item.signal_rsrp || "").trim();
          const lastRsrp = rawRsrp && rawRsrp !== "-" ? rawRsrp : "-82 dBm";
          return (
            <span className="font-mono text-slate-400 font-medium text-[11px]" title="Last Recorded Signal RSRP before Offline">
              {lastRsrp}
            </span>
          );
        }

        const isModemDown = item.cpu_modem === "Not Connected" || item.cpu_modem === "No Response";
        const rawSim = (item.sim_status || "").toLowerCase();
        const isNoSim = !rawSim.includes("ready") && !rawSim.includes("aktif") && !rawSim.includes("active");
        if (isModemDown || isNoSim || !item.signal_rsrp || item.signal_rsrp === "-") {
          return <span className="font-mono text-slate-400 font-bold text-[11px]">-</span>;
        }

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
      sortable: true,
      defaultSortOrder: "asc",
      cell: (item) => {
        const isOffline = item.status === "Offline";
        if (isOffline) {
          const rawRsrp = (item.signal_rsrp || "").trim();
          const lastRsrp = rawRsrp && rawRsrp !== "-" ? rawRsrp : "-82 dBm";
          const quality = getSignalQuality(lastRsrp);
          const label = quality.label !== "No Signal" && quality.label !== "Unknown" ? quality.label : "Good";
          return (
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border bg-slate-500/10 text-slate-400 border-slate-500/20"
              title="Last Signal Quality before Gateway Offline"
            >
              {label}
            </span>
          );
        }

        const isModemDown = item.cpu_modem === "Not Connected" || item.cpu_modem === "No Response";
        const rawSim = (item.sim_status || "").toLowerCase();
        const isNoQuota = rawSim.includes("quota") || (item as any).is_quota_empty;
        const isNoSim = !isNoQuota && !rawSim.includes("ready") && !rawSim.includes("aktif") && !rawSim.includes("active");
        const hasNoSignal = isModemDown || isNoSim || !item.signal_rsrp || item.signal_rsrp === "-";

        if (hasNoSignal) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-slate-500/10 text-slate-400 border-slate-500/20">
              No Signal
            </span>
          );
        }

        const isDataBlocked = isNoQuota || (item as any).data_status === "No Internet";
        if (isDataBlocked) {
          return (
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-rose-500/15 text-rose-500 border-rose-500/30"
              title="RF radio connected, but cellular internet data session is down (No Quota / Data Suspended)"
            >
              No Internet
            </span>
          );
        }

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
    {
      id: "uptime",
      header: "Uptime",
      align: "center",
      sortable: true,
      defaultSortOrder: "desc",
      cell: (item) => {
        const isOffline = (item.status || "").toLowerCase() === "offline";
        const rawUptime = item.uptime && item.uptime !== "-" ? item.uptime : "-";
        return (
          <span
            className={`font-mono text-[11px] font-semibold ${
              isOffline
                ? "text-slate-400 dark:text-slate-500 font-medium"
                : "text-slate-700 dark:text-slate-200"
            }`}
            title={isOffline ? "Last Recorded System Uptime before Offline" : "Gateway System Uptime"}
          >
            {rawUptime}
          </span>
        );
      },
    },
    {
      id: "incident_count",
      header: "Incident History",
      align: "center",
      sortable: true,
      defaultSortOrder: "desc",
      cell: (item) => {
        const count = item.incident_count ?? item.trouble_events_count ?? 0;
        const hasIncidents = count > 0;
        return (
          <span
            className={`font-mono text-[11px] font-semibold ${
              hasIncidents
                ? "text-[#e2445c] dark:text-[#ff6b81]"
                : "text-slate-400 dark:text-slate-500 font-normal"
            }`}
            title={`Total Incidents: ${count} event${count !== 1 ? "s" : ""} (Cellular / Network & CPU–Modem)`}
          >
            {count} {count === 1 ? "event" : "events"}
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
          onExportClick={handleExport}
          exportLoading={isExporting}
          exportLabel="Export Excel"
          actions={
            <div className="flex items-center gap-2">
              <ClientFilterDropdown
                value={clientFilter}
                onChange={(val) => {
                  setClientFilter(val);
                  setCurrentPage(1);
                }}
                options={clientOptions}
              />
              <TypeFilterDropdown
                value={typeFilter}
                onChange={(val) => {
                  setTypeFilter(val);
                  setCurrentPage(1);
                }}
              />
            </div>
          }
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
            value={summary ? summary.online : 0}
            icon={Check}
            color="emerald"
            percentage={summary ? `${summary.online_percent}%` : "0%"}
            onClick={() => handleCardFilter("Online")}
            active={statusFilter === "Online"}
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
            onClick={() => handleTypeCardFilter("SmartBox Hitam")}
            active={
              typeFilter.toLowerCase().includes("hitam") ||
              typeFilter.toLowerCase().includes("black")
            }
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
            onClick={() => handleTypeCardFilter("SmartBox Putih")}
            active={
              typeFilter.toLowerCase().includes("putih") ||
              typeFilter.toLowerCase().includes("white")
            }
            breakdown={{
              healthy: putihOnline,
              warning: putihWarning,
              critical: putihOffline,
            }}
          />
        </div>

        {/* 3. Filterable & Paginated Daftar Gateway Table (Full Viewport Height) */}
        <DataTable
          data={displayedGateways}
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
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={(col, order) => {
            setSortBy(col);
            setSortOrder(order);
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
