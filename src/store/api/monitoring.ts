import { IGatewayHealthTelemetry } from "@/types/model";
import { getToken, handleFetchError } from "@/utils/common";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export const fetchGatewayHealth = async (): Promise<IGatewayHealthTelemetry> => {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/monitoring/health`, {
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    await handleFetchError(response);
  }

  const data = await response.json();
  return data.data;
};

export const triggerManualInspection = async (): Promise<IGatewayHealthTelemetry> => {
  const token = getToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/monitoring/trigger`, {
    method: "POST",
    headers,
  });

  if (!response.ok) {
    await handleFetchError(response);
  }

  const data = await response.json();
  return data.data;
};

export const useGatewayHealth = () => {
  return useQuery({
    queryKey: ["gatewayHealth"],
    queryFn: fetchGatewayHealth,
    refetchInterval: 5000, // Real-time poll every 5s from Python backend
  });
};

export const useTriggerInspection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: triggerManualInspection,
    onSuccess: (newData) => {
      queryClient.setQueryData(["gatewayHealth"], newData);
    },
  });
};

export interface ISystemHealthSummary {
  total_gateways: number;
  healthy: number;
  healthy_percent: number;
  warning: number;
  warning_percent: number;
  critical: number;
  critical_percent: number;
  smartbox_hitam: {
    name: string;
    model: string;
    total: number;
    healthy: number;
    warning: number;
    critical: number;
  };
  smartbox_putih: {
    name: string;
    model: string;
    total: number;
    healthy: number;
    warning: number;
    critical: number;
  };
}

export interface IChartData {
  avg: number;
  max?: number;
  min?: number;
  timeline: { time: string; value: number }[];
}

export interface IGatewayItem {
  no: number;
  id: string;
  location: string;
  type: string;
  model: string;
  cpu: number;
  ram: number;
  sd_used_gb: number;
  sd_total_gb: number;
  sd_percent: number;
  sd_health: "Good" | "Wear" | "Bad" | string;
  uptime: string;
  status: "Healthy" | "Warning" | "Critical" | string;
  last_update: string;
}

export interface ISystemHealthDashboardData {
  summary: ISystemHealthSummary;
  charts: {
    cpu: IChartData;
    ram: IChartData;
    sd_card: IChartData;
    uptime: IChartData;
  };
  gateways: IGatewayItem[];
  pagination: {
    total_items: number;
    total_pages: number;
    current_page: number;
    page_size: number;
    showing_start: number;
    showing_end: number;
  };
}

export interface ISystemHealthFilters {
  search?: string;
  type?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export const fetchSystemHealthDashboard = async (
  filters?: ISystemHealthFilters
): Promise<ISystemHealthDashboardData> => {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.type && filters.type !== "Semua Tipe") params.append("gateway_type", filters.type);
  if (filters?.status && filters.status !== "Semua Status") params.append("status", filters.status);
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.pageSize) params.append("page_size", String(filters.pageSize));

  const url = `${API_BASE_URL}/monitoring/system-health-dashboard?${params.toString()}`;
  const response = await fetch(url, { headers, cache: "no-store" });

  if (!response.ok) {
    await handleFetchError(response);
  }

  const json = await response.json();
  return json.data;
};

export const useSystemHealthDashboard = (filters?: ISystemHealthFilters) => {
  return useQuery({
    queryKey: ["systemHealthDashboard", filters],
    queryFn: () => fetchSystemHealthDashboard(filters),
    refetchInterval: 10000,
  });
};

export interface ICellularSummary {
  total_gateways: number;
  online: number;
  online_percent: number;
  offline: number;
  offline_percent: number;
  degraded: number;
  degraded_percent: number;
  smartbox_hitam: {
    name: string;
    model: string;
    total: number;
    online: number;
    offline: number;
    degraded: number;
  };
  smartbox_putih: {
    name: string;
    model: string;
    total: number;
    online: number;
    offline: number;
    degraded: number;
  };
}

export interface IDonutSlice {
  label: string;
  count: number;
  percent: number;
  color: string;
}

export interface IDonutChart {
  total_label: string;
  total_count: number;
  total_percent: number;
  slices: IDonutSlice[];
}

export interface ICellularCharts {
  cpu_modem_comm: IDonutChart;
  modem_network_status: IDonutChart;
  signal_strength: IChartData;
  modem_temperature: IChartData;
}

export interface ICellularGatewayItem {
  no: number;
  id: string;
  location: string;
  type: string;
  model: string;
  modem: string;
  provider: string;
  sim_status: string;
  cpu_modem: string;
  network: string;
  signal_rsrp: string;
  signal_bars: number;
  modem_temp: string;
  status: string;
  last_update: string;
}

export interface ICellularDashboardData {
  summary: ICellularSummary;
  charts: ICellularCharts;
  gateways: ICellularGatewayItem[];
  pagination: {
    total_items: number;
    total_pages: number;
    current_page: number;
    page_size: number;
    showing_start: number;
    showing_end: number;
  };
}

export interface ICellularFilters {
  search?: string;
  type?: string;
  provider?: string;
  page?: number;
  pageSize?: number;
}

export const fetchCellularDashboard = async (
  filters?: ICellularFilters
): Promise<ICellularDashboardData> => {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.type && filters.type !== "Semua Tipe") params.append("gateway_type", filters.type);
  if (filters?.provider && filters.provider !== "Semua Provider") params.append("provider", filters.provider);
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.pageSize) params.append("page_size", String(filters.pageSize));

  const url = `${API_BASE_URL}/monitoring/cellular-dashboard?${params.toString()}`;
  const response = await fetch(url, { headers, cache: "no-store" });

  if (!response.ok) {
    await handleFetchError(response);
  }

  const json = await response.json();
  return json.data;
};

export const useCellularDashboard = (filters?: ICellularFilters) => {
  return useQuery({
    queryKey: ["cellularDashboard", filters],
    queryFn: () => fetchCellularDashboard(filters),
    refetchInterval: 10000,
  });
};

export interface IDVRSummary {
  total_gateways: number;
  recording_normal: number;
  recording_normal_percent: number;
  issue: number;
  issue_percent: number;
  offline: number;
  offline_percent: number;
  total_kamera: number;
  kamera_online: number;
  kamera_no_video: number;
  kamera_offline: number;
  total_storage_tb: number;
  storage_used_tb: number;
  storage_warning_tb: number;
  storage_critical_tb: number;
}

export interface IDVRCharts {
  cpu_dvr_comm: IDonutChart;
  status_kamera: IDonutChart;
  recording_status: IDonutChart;
  storage_usage: IChartData;
}

export interface IDVRGatewayItem {
  no: number;
  id: string;
  location: string;
  type: string;
  dvr_model: string;
  cpu_dvr: string;
  total_kamera: number;
  kamera_online: number;
  kamera_no_video: number;
  kamera_offline: number;
  recording_status: string;
  storage_usage_percent: number;
  dvr_health: string;
  last_update: string;
}

export interface IDVRDashboardData {
  summary: IDVRSummary;
  charts: IDVRCharts;
  gateways: IDVRGatewayItem[];
  pagination: {
    total_items: number;
    total_pages: number;
    current_page: number;
    page_size: number;
    showing_start: number;
    showing_end: number;
  };
}

export interface IDVRFilters {
  search?: string;
  type?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export const fetchDVRDashboard = async (
  filters?: IDVRFilters
): Promise<IDVRDashboardData> => {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.type && filters.type !== "Semua Tipe") params.append("gateway_type", filters.type);
  if (filters?.status && filters.status !== "Semua Status") params.append("status", filters.status);
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.pageSize) params.append("page_size", String(filters.pageSize));

  const url = `${API_BASE_URL}/monitoring/dvr-dashboard?${params.toString()}`;
  const response = await fetch(url, { headers, cache: "no-store" });

  if (!response.ok) {
    await handleFetchError(response);
  }

  const json = await response.json();
  return json.data;
};

export const useDVRDashboard = (filters?: IDVRFilters) => {
  return useQuery({
    queryKey: ["dvrDashboard", filters],
    queryFn: () => fetchDVRDashboard(filters),
    refetchInterval: 10000,
  });
};

export interface ICellularReportItem {
  no: number;
  id: string;
  location: string;
  type: string;
  modem: string;
  provider: string;
  sim_number: string;
  cpu_modem_uptime: string;
  cpu_modem_offline: string;
  cpu_modem_success_rate: number;
  cpu_modem_avg_resp_ms: number;
  network_uptime: string;
  network_offline: string;
  network_success_rate?: number;
  network_avg_rsrp: number;
  network_avg_temp: number;
  trouble_events_count: number;
  trouble_last_offline: string;
}

export interface ICellularReportData {
  gateways: ICellularReportItem[];
  pagination: {
    total_items: number;
    total_pages: number;
    current_page: number;
    page_size: number;
    showing_start: number;
    showing_end: number;
  };
}

export interface ICellularReportFilters {
  search?: string;
  type?: string;
  provider?: string;
  location?: string;
  date_range?: string;
  page?: number;
  pageSize?: number;
}

export const fetchCellularReport = async (
  filters?: ICellularReportFilters
): Promise<ICellularReportData> => {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.type && filters.type !== "Semua Tipe") params.append("gateway_type", filters.type);
  if (filters?.provider && filters.provider !== "Semua Provider") params.append("provider", filters.provider);
  if (filters?.location && filters.location !== "Semua Lokasi") params.append("location", filters.location);
  if (filters?.date_range) params.append("date_range", filters.date_range);
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.pageSize) params.append("page_size", String(filters.pageSize));

  const url = `${API_BASE_URL}/monitoring/reports/cellular?${params.toString()}`;
  const response = await fetch(url, { headers, cache: "no-store" });

  if (!response.ok) {
    await handleFetchError(response);
  }

  const json = await response.json();
  return json.data;
};

export const useCellularReport = (filters?: ICellularReportFilters) => {
  return useQuery({
    queryKey: ["cellularReport", filters],
    queryFn: () => fetchCellularReport(filters),
    refetchInterval: 15000,
  });
};

export const exportCellularReportCsvUrl = (filters?: ICellularReportFilters) => {
  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.type && filters.type !== "Semua Tipe") params.append("gateway_type", filters.type);
  if (filters?.provider && filters.provider !== "Semua Provider") params.append("provider", filters.provider);
  if (filters?.location && filters.location !== "Semua Lokasi") params.append("location", filters.location);
  return `${API_BASE_URL}/monitoring/reports/cellular/export?${params.toString()}`;
};

export interface ITroubleEventItem {
  no: number;
  start_time: string;
  end_time: string;
  duration: string;
  cause: string;
}

export interface ITimelineSegment {
  status: "online" | "degraded" | "offline" | "no_data";
  start_pct: number;
  width_pct: number;
  label: string;
  period: string;
}

export interface ICellularReportGatewayDetail {
  id: string;
  status: string;
  location: string;
  type: string;
  modem: string;
  provider: string;
  sim_number: string;
  sim_status: string;
  ip_address: string;
  period: string;
  period_hours: string;
  cpu_modem_uptime: string;
  cpu_modem_uptime_pct: string;
  cpu_modem_offline: string;
  cpu_modem_offline_pct: string;
  success_rate: string;
  success_rate_checks: string;
  avg_response_time: string;
  network_uptime: string;
  network_uptime_pct: string;
  network_offline: string;
  network_offline_pct: string;
  avg_rsrp: string;
  avg_modem_temp: string;
  temp_range: string;
  total_gangguan: string;
  timeline_segments: ITimelineSegment[];
  trouble_events: ITroubleEventItem[];
}

export const fetchCellularReportGatewayDetail = async (
  gatewayId: string,
  dateRange?: string
): Promise<ICellularReportGatewayDetail> => {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const params = new URLSearchParams();
  if (dateRange) params.append("date_range", dateRange);

  const url = `${API_BASE_URL}/monitoring/reports/cellular/gateway/${encodeURIComponent(gatewayId)}/detail?${params.toString()}`;
  const response = await fetch(url, { headers, cache: "no-store" });

  if (!response.ok) {
    await handleFetchError(response);
  }

  const json = await response.json();
  return json.data;
};

export const useCellularReportGatewayDetail = (
  gatewayId: string | null,
  dateRange?: string
) => {
  return useQuery({
    queryKey: ["cellularReportGatewayDetail", gatewayId, dateRange],
    queryFn: () => (gatewayId ? fetchCellularReportGatewayDetail(gatewayId, dateRange) : null),
    enabled: !!gatewayId,
    refetchInterval: 15000,
  });
};


export interface IDVRReportItem {
  no: number;
  id: string;
  location: string;
  type: string;
  dvr_model: string;
  cpu_dvr_uptime: string;
  cpu_dvr_offline: string;
  cpu_dvr_success_rate: number;
  cpu_dvr_avg_resp_ms: number;
  kamera_total: number;
  kamera_online: number;
  kamera_no_video: number;
  kamera_offline: number;
  rec_uptime: string;
  rec_tidak_merekam: string;
  rec_error: string;
  storage_kapasitas: string;
  storage_terpakai_pct: number;
  storage_rata_rata: string;
  jumlah_event: number;
  terakhir_offline: string;
}

export interface IDVRReportData {
  gateways: IDVRReportItem[];
  pagination: {
    total_items: number;
    total_pages: number;
    current_page: number;
    page_size: number;
    showing_start: number;
    showing_end: number;
  };
}

export interface IDVRReportFilters {
  search?: string;
  type?: string;
  dvr_brand?: string;
  location?: string;
  date_range?: string;
  page?: number;
  pageSize?: number;
}

export const fetchDVRReport = async (
  filters?: IDVRReportFilters
): Promise<IDVRReportData> => {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.type && filters.type !== "Semua Tipe") params.append("gateway_type", filters.type);
  if (filters?.dvr_brand && filters.dvr_brand !== "Semua Merek DVR") params.append("dvr_brand", filters.dvr_brand);
  if (filters?.location && filters.location !== "Semua Lokasi") params.append("location", filters.location);
  if (filters?.date_range) params.append("date_range", filters.date_range);
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.pageSize) params.append("page_size", String(filters.pageSize));

  const url = `${API_BASE_URL}/monitoring/reports/dvr?${params.toString()}`;
  const response = await fetch(url, { headers, cache: "no-store" });

  if (!response.ok) {
    await handleFetchError(response);
  }

  const json = await response.json();
  return json.data;
};

export const useDVRReport = (filters?: IDVRReportFilters) => {
  return useQuery({
    queryKey: ["dvrReport", filters],
    queryFn: () => fetchDVRReport(filters),
    refetchInterval: 15000,
  });
};

export const exportDVRReportCsvUrl = (filters?: IDVRReportFilters) => {
  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.type && filters.type !== "Semua Tipe") params.append("gateway_type", filters.type);
  if (filters?.dvr_brand && filters.dvr_brand !== "Semua Merek DVR") params.append("dvr_brand", filters.dvr_brand);
  if (filters?.location && filters.location !== "Semua Lokasi") params.append("location", filters.location);
  return `${API_BASE_URL}/monitoring/reports/dvr/export?${params.toString()}`;
};

export interface IDVRTroubleEventItem {
  no: number;
  start_time: string;
  end_time: string;
  duration: string;
  category: string;
  description: string;
}

export interface IDVRTimelineSegment {
  status: "online" | "degraded" | "offline" | "no_data";
  start_pct: number;
  width_pct: number;
  label: string;
  period: string;
}

export interface IDVRTimelineTrack {
  track_name: string;
  segments: IDVRTimelineSegment[];
}

export interface IDVRReportGatewayDetail {
  id: string;
  status: string;
  location: string;
  type: string;
  dvr_model: string;
  kamera_channels: string;
  storage_capacity: string;
  period: string;
  period_hours: string;
  cpu_dvr_uptime: string;
  cpu_dvr_uptime_pct: string;
  cpu_dvr_offline: string;
  cpu_dvr_offline_pct: string;
  success_rate: string;
  success_rate_checks: string;
  avg_response_time: string;
  rec_uptime: string;
  rec_uptime_pct: string;
  rec_tidak_merekam: string;
  rec_tidak_merekam_pct: string;
  rec_error: string;
  rec_error_pct: string;
  storage_used_pct: number;
  kamera_total: number;
  kamera_online: number;
  kamera_no_video: number;
  kamera_offline: number;
  timeline_tracks: IDVRTimelineTrack[];
  trouble_events: IDVRTroubleEventItem[];
}

export const fetchDVRReportGatewayDetail = async (
  gatewayId: string,
  dateRange?: string
): Promise<IDVRReportGatewayDetail> => {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const params = new URLSearchParams();
  if (dateRange) params.append("date_range", dateRange);

  const url = `${API_BASE_URL}/monitoring/reports/dvr/gateway/${encodeURIComponent(gatewayId)}/detail?${params.toString()}`;
  const response = await fetch(url, { headers, cache: "no-store" });

  if (!response.ok) {
    await handleFetchError(response);
  }

  const json = await response.json();
  return json.data;
};

export const useDVRReportGatewayDetail = (
  gatewayId: string | null,
  dateRange?: string
) => {
  return useQuery({
    queryKey: ["dvrReportGatewayDetail", gatewayId, dateRange],
    queryFn: () => (gatewayId ? fetchDVRReportGatewayDetail(gatewayId, dateRange) : null),
    enabled: !!gatewayId,
    refetchInterval: 15000,
  });
};


export interface IHealthReportItem {
  no: number;
  id: string;
  location: string;
  type: string;
  cpu_avg: number;
  cpu_max: number;
  cpu_gt_80_duration: string;
  ram_avg: number;
  ram_max: number;
  ram_gt_80_duration: string;
  sd_avg: number;
  sd_max: number;
  sd_gt_90_duration: string;
  sd_health_status: string;
  sd_life_pct: number;
  temp_avg: number;
  temp_max: number;
  uptime_duration: string;
  uptime_pct: number;
  jumlah_event: number;
}

export interface IHealthReportData {
  gateways: IHealthReportItem[];
  pagination: {
    total_items: number;
    total_pages: number;
    current_page: number;
    page_size: number;
    showing_start: number;
    showing_end: number;
  };
}

export interface IHealthReportFilters {
  search?: string;
  type?: string;
  location?: string;
  date_range?: string;
  page?: number;
  pageSize?: number;
}

export const fetchHealthReport = async (
  filters?: IHealthReportFilters
): Promise<IHealthReportData> => {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.type && filters.type !== "Semua Tipe") params.append("gateway_type", filters.type);
  if (filters?.location && filters.location !== "Semua Lokasi") params.append("location", filters.location);
  if (filters?.date_range) params.append("date_range", filters.date_range);
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.pageSize) params.append("page_size", String(filters.pageSize));

  const url = `${API_BASE_URL}/monitoring/reports/health?${params.toString()}`;
  const response = await fetch(url, { headers, cache: "no-store" });

  if (!response.ok) {
    await handleFetchError(response);
  }

  const json = await response.json();
  return json.data;
};

export const useHealthReport = (filters?: IHealthReportFilters) => {
  return useQuery({
    queryKey: ["healthReport", filters],
    queryFn: () => fetchHealthReport(filters),
    refetchInterval: 15000,
  });
};

export const exportHealthReportCsvUrl = (filters?: IHealthReportFilters) => {
  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.type && filters.type !== "Semua Tipe") params.append("gateway_type", filters.type);
  if (filters?.location && filters.location !== "Semua Lokasi") params.append("location", filters.location);
  return `${API_BASE_URL}/monitoring/reports/health/export?${params.toString()}`;
};

export interface IHealthTrendPoint {
  date: string;
  value: number;
}

export interface IHealthReportEvent {
  no: number;
  start_time: string;
  end_time: string;
  duration: string;
  category: string;
  value: string;
  description: string;
}

export interface IHealthTimelineSegment {
  status: "normal" | "cpu_high" | "ram_high" | "sd_high" | "suhu_high" | "no_data" | "offline";
  start_pct: number;
  width_pct: number;
  label: string;
  period: string;
}

export interface IHealthTimelineTrack {
  track_name: string;
  segments: IHealthTimelineSegment[];
}

export interface IHealthReportGatewayDetail {
  id: string;
  status: string;
  location: string;
  type: string;
  cpu_spec: string;
  ram_spec: string;
  sd_spec: string;
  modem_spec: string;
  provider_spec: string;
  period: string;
  period_hours: string;
  uptime_duration: string;
  uptime_pct: string;
  downtime_duration?: string;
  downtime_pct?: string;
  sla_target?: number;
  sla_target_hours?: string;
  sla_status?: string;
  sla_downtime_allowed?: string;
  cpu_avg: number;
  cpu_max: number;
  ram_avg: number;
  ram_max: number;
  sd_avg: number;
  sd_max: number;
  sd_health_status: string;
  sd_life_pct: number;
  temp_avg: number;
  temp_max: number;
  cpu_trend: IHealthTrendPoint[];
  ram_trend: IHealthTrendPoint[];
  sd_trend: IHealthTrendPoint[];
  timeline_tracks: IHealthTimelineTrack[];
  events: IHealthReportEvent[];
}

export const fetchHealthReportGatewayDetail = async (
  gatewayId: string,
  dateRange?: string
): Promise<IHealthReportGatewayDetail> => {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const params = new URLSearchParams();
  if (dateRange) params.append("date_range", dateRange);

  const url = `${API_BASE_URL}/monitoring/reports/health/gateway/${encodeURIComponent(gatewayId)}/detail?${params.toString()}`;
  const response = await fetch(url, { headers, cache: "no-store" });

  if (!response.ok) {
    await handleFetchError(response);
  }

  const json = await response.json();
  return json.data;
};

export const useHealthReportGatewayDetail = (
  gatewayId: string | null,
  dateRange?: string
) => {
  return useQuery({
    queryKey: ["healthReportGatewayDetail", gatewayId, dateRange],
    queryFn: () => (gatewayId ? fetchHealthReportGatewayDetail(gatewayId, dateRange) : null),
    enabled: !!gatewayId,
    refetchInterval: 15000,
  });
};


export interface ISDHealthDetails {
  status: string;
  bad_sector: number;
  wear_level: string;
  temperature: string;
  io_error: number;
}

export interface IDowntimeEvent {
  no: number;
  start_time: string;
  end_time: string;
  duration: string;
  accumulated_hours: string;
  category: string;
  reason: string;
  sla_impact_pct: number;
  status: string;
}

export interface IGatewayDetailData {
  id: string;
  location: string;
  type: string;
  model: string;
  ip_address: string;
  uptime: string;
  last_update: string;
  service_status: string;
  cpu_percent: number;
  cpu_min: string;
  cpu_max: string;
  cpu_sparkline: number[];
  ram_percent: number;
  ram_min: string;
  ram_max: string;
  ram_sparkline: number[];
  sd_percent: number;
  sd_used_gb: number;
  sd_total_gb: number;
  sd_sparkline: number[];
  sd_health: ISDHealthDetails;
  uptime_days: number;
  uptime_hours: number;
  uptime_status: string;
  uptime_subtext: string;
  month_period?: string;
  month_total_hours?: number;
  uptime_duration?: string;
  uptime_pct?: string;
  downtime_duration?: string;
  downtime_pct?: string;
  sla_target?: number;
  sla_target_hours?: string;
  sla_status?: string;
  sla_downtime_allowed?: string;
  downtime_events?: IDowntimeEvent[];
}

export const fetchGatewayDetail = async (
  gatewayId: string
): Promise<IGatewayDetailData> => {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const url = `${API_BASE_URL}/monitoring/gateway/${encodeURIComponent(gatewayId)}/detail`;
  const response = await fetch(url, { headers, cache: "no-store" });

  if (!response.ok) {
    await handleFetchError(response);
  }

  const json = await response.json();
  return json.data;
};

export const useGatewayDetail = (gatewayId: string | null) => {
  return useQuery({
    queryKey: ["gatewayDetail", gatewayId],
    queryFn: () => (gatewayId ? fetchGatewayDetail(gatewayId) : null),
    enabled: !!gatewayId,
    refetchInterval: 10000,
  });
};

export interface ICPUModemDetail {
  status: string;
  message: string;
  port: string;
  baudrate: number;
  driver: string;
  last_check: string;
}

export interface ISignalStrengthDetail {
  rsrp: number;
  unit: string;
  max_rsrp: string;
  min_rsrp: string;
  avg_rsrp: string;
  sparkline: number[];
}

export interface INetworkSIMDetail {
  network_type: string;
  network_sub: string;
  operator: string;
  sim_status: string;
  imsi: string;
  iccid: string;
  data_upload: string;
  data_download: string;
  roaming: string;
}

export interface IModemTempDetail {
  temperature: number;
  unit: string;
  max_temp: string;
  min_temp: string;
  avg_temp: string;
  sparkline: number[];
}

export interface ICellularGatewayDetailData {
  id: string;
  location: string;
  type: string;
  model: string;
  modem: string;
  provider: string;
  sim_card: string;
  ip_address: string;
  last_update: string;
  service_status: string;
  cpu_modem: ICPUModemDetail;
  signal_strength: ISignalStrengthDetail;
  network_sim: INetworkSIMDetail;
  modem_temperature: IModemTempDetail;
}

export const fetchCellularGatewayDetail = async (
  gatewayId: string
): Promise<ICellularGatewayDetailData> => {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const url = `${API_BASE_URL}/monitoring/cellular/gateway/${encodeURIComponent(gatewayId)}/detail`;
  const response = await fetch(url, { headers, cache: "no-store" });

  if (!response.ok) {
    await handleFetchError(response);
  }

  const json = await response.json();
  return json.data;
};

export const useCellularGatewayDetail = (gatewayId: string | null) => {
  return useQuery({
    queryKey: ["cellularGatewayDetail", gatewayId],
    queryFn: () => (gatewayId ? fetchCellularGatewayDetail(gatewayId) : null),
    enabled: !!gatewayId,
    refetchInterval: 10000,
  });
};

export interface ICPUDVRDetail {
  status: string;
  message: string;
  port: string;
  response_time: string;
  packet_loss: string;
  last_check: string;
}

export interface ICameraStatusDetail {
  total: number;
  online: number;
  no_video: number;
  offline: number;
  percent: number;
  sparkline: number[];
}

export interface IRecordingStorageDetail {
  status: string;
  used_tb: number;
  total_tb: number;
  percent: number;
  retention_days: number;
  sparkline: number[];
}

export interface IDVRHealthDetail {
  status: string;
  hdd_status: string;
  temperature: string;
  fan_status: string;
  bad_sector: number;
}

export interface ICameraChannelPreview {
  channel: number;
  name: string;
  status: string;
  is_recording: boolean;
  fps: number;
  resolution: string;
  bitrate: string;
  timestamp: string;
}

export interface IDVRGatewayDetailData {
  id: string;
  location: string;
  type: string;
  model: string;
  dvr_model: string;
  ip_address: string;
  last_update: string;
  service_status: string;
  cpu_dvr: ICPUDVRDetail;
  camera_status: ICameraStatusDetail;
  recording_storage: IRecordingStorageDetail;
  dvr_health: IDVRHealthDetail;
  cameras: ICameraChannelPreview[];
}

export const fetchDVRGatewayDetail = async (
  gatewayId: string
): Promise<IDVRGatewayDetailData> => {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const url = `${API_BASE_URL}/monitoring/dvr/gateway/${encodeURIComponent(gatewayId)}/detail`;
  const response = await fetch(url, { headers, cache: "no-store" });

  if (!response.ok) {
    await handleFetchError(response);
  }

  const json = await response.json();
  return json.data;
};

export const useDVRGatewayDetail = (gatewayId: string | null) => {
  return useQuery({
    queryKey: ["dvrGatewayDetail", gatewayId],
    queryFn: () => (gatewayId ? fetchDVRGatewayDetail(gatewayId) : null),
    enabled: !!gatewayId,
    refetchInterval: 10000,
  });
};







