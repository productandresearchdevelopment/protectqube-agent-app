import {
  INotificationListResponse,
  INotificationEvent,
  INotificationEventListResponse,
  INotificationDeliveryListResponse,
  IRecipientsOptions,
  INotificationTarget,
} from "@/types/notifications";
import { getToken, handleFetchError } from "@/utils/common";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export const fetchNotifications = async (
  page: number = 1,
  limit: number = 20,
  unreadOnly: boolean = false,
  filters?: {
    read_status?: string;
    severity?: string;
    search?: string;
  }
): Promise<INotificationListResponse> => {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    unread_only: String(unreadOnly),
  });
  if (filters?.read_status) params.append("read_status", filters.read_status);
  if (filters?.severity) params.append("severity", filters.severity);
  if (filters?.search) params.append("search", filters.search);

  const res = await fetch(`${API_BASE_URL}/notifications?${params.toString()}`, {
    headers,
    cache: "no-store",
  });
  if (!res.ok) await handleFetchError(res);
  return res.json();
};

export const useNotifications = (
  page = 1,
  limit = 20,
  unreadOnly = false,
  filters?: {
    read_status?: string;
    severity?: string;
    search?: string;
  }
) => {
  return useQuery({
    queryKey: ["notifications", page, limit, unreadOnly, filters?.read_status, filters?.severity, filters?.search],
    queryFn: () => fetchNotifications(page, limit, unreadOnly, filters),
    refetchInterval: 10000,
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = getToken();
      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: "PUT",
        headers,
      });
      if (!res.ok) await handleFetchError(res);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const token = getToken();
      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: "PUT",
        headers,
      });
      if (!res.ok) await handleFetchError(res);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useRecipientsOptions = () => {
  return useQuery({
    queryKey: ["notificationRecipientsOptions"],
    queryFn: async (): Promise<IRecipientsOptions> => {
      const token = getToken();
      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/notifications/recipients-options`, { headers });
      if (!res.ok) await handleFetchError(res);
      const json = await res.json();
      return json.data;
    },
  });
};

export const fetchNotificationEvents = async (
  page: number = 1,
  limit: number = 50,
  filters?: { search?: string; category?: string; configured_only?: boolean }
): Promise<INotificationEventListResponse> => {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (filters?.search) params.append("search", filters.search);
  if (filters?.category && filters.category !== "ALL") params.append("category", filters.category);
  if (filters?.configured_only !== undefined) params.append("configured_only", String(filters.configured_only));

  const res = await fetch(`${API_BASE_URL}/notifications/events?${params.toString()}`, { headers });
  if (!res.ok) await handleFetchError(res);
  return res.json();
};

export const useNotificationEvents = (
  page: number = 1,
  limit: number = 50,
  filters?: { search?: string; category?: string; configured_only?: boolean }
) => {
  return useQuery({
    queryKey: ["notificationEvents", page, limit, filters?.search, filters?.category, filters?.configured_only],
    queryFn: () => fetchNotificationEvents(page, limit, filters),
  });
};

export const useCreateNotificationEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<INotificationEvent>) => {
      const token = getToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/notifications/events`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) await handleFetchError(res);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationEvents"] });
    },
  });
};

export const useUpdateNotificationEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<INotificationEvent> & { id: string }) => {
      const token = getToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/notifications/events/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) await handleFetchError(res);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationEvents"] });
    },
  });
};

export const useDeleteNotificationEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = getToken();
      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/notifications/events/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) await handleFetchError(res);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationEvents"] });
    },
  });
};

export const fetchNotificationDeliveries = async (
  page: number = 1,
  limit: number = 20,
  status?: string
): Promise<INotificationDeliveryListResponse> => {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (status) params.append("status", status);

  const res = await fetch(`${API_BASE_URL}/notifications/deliveries?${params.toString()}`, {
    headers,
    cache: "no-store",
  });
  if (!res.ok) await handleFetchError(res);
  return res.json();
};

export const useNotificationDeliveries = (page = 1, limit = 20, status?: string) => {
  return useQuery({
    queryKey: ["notificationDeliveries", page, limit, status],
    queryFn: () => fetchNotificationDeliveries(page, limit, status),
    refetchInterval: 10000,
  });
};

export const fetchDestinations = async (providerKey?: string): Promise<INotificationTarget[]> => {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const queryStr = providerKey ? `?provider_key=${encodeURIComponent(providerKey)}` : "";
  const res = await fetch(`${API_BASE_URL}/notifications/destinations${queryStr}`, {
    headers,
    cache: "no-store",
  });
  if (!res.ok) await handleFetchError(res);
  const json = await res.json();
  return json.data || [];
};

export const useDestinations = (providerKey?: string) => {
  return useQuery({
    queryKey: ["notificationDestinations", providerKey],
    queryFn: () => fetchDestinations(providerKey),
    enabled: !!providerKey,
  });
};

export const useCreateDestination = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      provider_key: string;
      external_id: string;
      display_name: string;
      type?: string;
      config?: Record<string, unknown>;
    }) => {
      const token = getToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/notifications/destinations`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) await handleFetchError(res);
      const json = await res.json();
      return json.data as INotificationTarget;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["notificationDestinations", variables.provider_key] });
      queryClient.invalidateQueries({ queryKey: ["notificationDestinations"] });
    },
  });
};

export const useDeleteDestination = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, provider_key }: { id: string; provider_key?: string }) => {
      const token = getToken();
      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/notifications/destinations/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) await handleFetchError(res);
      return res.json();
    },
    onSuccess: (_, variables) => {
      if (variables.provider_key) {
        queryClient.invalidateQueries({ queryKey: ["notificationDestinations", variables.provider_key] });
      }
      queryClient.invalidateQueries({ queryKey: ["notificationDestinations"] });
    },
  });
};

export const useSyncDestinations = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (provider_key: string) => {
      const token = getToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/notifications/destinations/sync`, {
        method: "POST",
        headers,
        body: JSON.stringify({ provider_key }),
      });
      if (!res.ok) await handleFetchError(res);
      return res.json();
    },
    onSuccess: (_, provider_key) => {
      queryClient.invalidateQueries({ queryKey: ["notificationDestinations", provider_key] });
      queryClient.invalidateQueries({ queryKey: ["notificationDestinations"] });
    },
  });
};
