export interface IUser {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  avatarId?: string | null;
  roleId: string;
  roleName?: string | null;
  roleAlias?: string | null;
  role_name?: string | null;
  role_alias?: string | null;
  permissions?: string[];
  lastLogin?: string | null;
}

export interface IRole {
  id: string;
  name: string;
  alias: string;
  color: string;
  description?: string | null;
}

export interface IModule {
  id: number;
  moduleTypeId: string;
  parentId?: number | null;
  path?: string | null;
  name: string;
  icon?: string | null;
  route?: string | null;
  description?: string | null;
}

export interface IConnectivityData {
  status: string;
  modem_connected: boolean;
  port: string;
  operator: string | null;
  iccid: string | null;
  phone_number: string | null;
  signal_csq: number;
  signal_percent: number;
  signal_quality: string;
  temperature_celsius: number | null;
  network_tech: string;
  registration_status: string;
  error?: string | null;
}

export interface IDVRChannel {
  channel: number;
  name: string;
  recording: boolean;
  online: boolean;
}

export interface IDVRData {
  status: string;
  host: string;
  ping_ok: boolean;
  http_port_open: boolean;
  rtsp_port_open: boolean;
  hdd_status: string;
  hdd_total_gb: number;
  hdd_used_gb: number;
  hdd_free_gb: number;
  hdd_usage_percent: number;
  recording_active: boolean;
  channel_count: number;
  channels: IDVRChannel[];
  issues: string[];
}

export interface ISystemData {
  status: string;
  cpu: {
    usage_percent: number;
    core_count: number;
    load_average_1m: number;
    load_average_5m: number;
    load_average_15m: number;
  };
  ram: {
    total_mb: number;
    used_mb: number;
    free_mb: number;
    usage_percent: number;
  };
  sd_card: {
    mount_point: string;
    total_gb: number;
    used_gb: number;
    free_gb: number;
    usage_percent: number;
    is_readonly: boolean;
    health_status: string;
  };
  issues: string[];
}

export interface IGatewayHealthTelemetry {
  gateway_id: string;
  gateway_type: string;
  timestamp: number;
  overall_status: "HEALTHY" | "DEGRADED" | "CRITICAL";
  has_critical_issue: boolean;
  connectivity: IConnectivityData;
  dvr: IDVRData;
  system: ISystemData;
  issues: string[];
  collection_duration_ms: number;
}
