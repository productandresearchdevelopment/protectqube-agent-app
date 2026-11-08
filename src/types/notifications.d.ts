export interface INotification {
  id: string;
  event_code: string;
  title: string;
  body: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  is_read: boolean;
  read_at?: string;
  data?: Record<string, unknown>;
  created_at: string;
}

export interface INotificationListResponse {
  status: boolean;
  total: number;
  unread_count: number;
  page: number;
  limit: number;
  data: INotification[];
}

export interface INotificationTarget {
  id: string;
  provider_key: string;
  external_id: string;
  display_name: string;
  type: "chat" | "group" | "channel" | "email" | "webhook" | string;
  source: "sync" | "manual" | string;
  config?: Record<string, unknown>;
  is_active: boolean;
  last_synced_at?: string;
  created_at?: string;
}

export interface INotificationChannelConfig {
  channel_type: string;
  name: string;
  is_enabled: boolean;
  recipient?: string;
  recipient_roles?: string[];
  recipient_users?: string[];
  destination_ids?: string[];
}

export interface INotificationEvent {
  id: string;
  event_code: string;
  name: string;
  category: "cellular" | "hardware" | "dvr" | "sla" | string;
  description?: string;
  channels: INotificationChannelConfig[];
  created_at?: string;
  updated_at?: string;
}

export interface INotificationEventListResponse {
  status: boolean;
  total: number;
  page: number;
  limit: number;
  data: INotificationEvent[];
}

export interface IRoleRecipient {
  id: string;
  name: string;
  alias: string;
  user_count: number;
}

export interface IUserRecipient {
  id: string;
  name: string;
  username: string;
  email: string;
  role_name?: string;
}

export interface IRecipientsOptions {
  roles: IRoleRecipient[];
  users: IUserRecipient[];
}

export interface IProviderField {
  name: string;
  label: string;
  type: "text" | "password" | "number";
  required: boolean;
  placeholder?: string;
  help?: string;
}

export interface IIntegrationProvider {
  provider_key: string;
  display_name: string;
  description: string;
  icon: string;
  status: "CONNECTED" | "NOT_CONFIGURED" | "DISABLED" | "ERROR";
  destination_id?: string;
  last_tested_at?: string;
  schema: {
    fields: IProviderField[];
  };
  config: Record<string, unknown>;
}

export interface INotificationDelivery {
  id: string;
  notification_id?: string;
  destination_id?: string;
  channel_type: string;
  recipient?: string;
  status: "SUCCESS" | "FAILED";
  error_message?: string;
  response_payload?: Record<string, unknown>;
  sent_at: string;
}

export interface INotificationDeliveryListResponse {
  status: boolean;
  total: number;
  page: number;
  limit: number;
  data: INotificationDelivery[];
}
