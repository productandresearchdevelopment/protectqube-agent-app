import {
  IIntegrationProvider,
} from "@/types/notifications";
import { getToken, handleFetchError } from "@/utils/common";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export interface IWhatsAppStatus {
  is_connected: boolean;
  is_logged_in: boolean;
  status: string;
  qr_code?: string | null;
  pairing_code?: string | null;
  phone?: string | null;
  jid?: string | null;
}

export const fetchIntegrations = async (): Promise<IIntegrationProvider[]> => {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/integrations`, {
    headers,
    cache: "no-store",
  });
  if (!res.ok) await handleFetchError(res);
  const json = await res.json();
  return json.data;
};

export const useIntegrations = () => {
  return useQuery({
    queryKey: ["integrations"],
    queryFn: fetchIntegrations,
  });
};

export const useConnectIntegration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      providerKey,
      config,
      name,
    }: {
      providerKey: string;
      config: Record<string, unknown>;
      name?: string;
    }) => {
      const token = getToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/integrations/${providerKey}/connect`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name, config }),
      });
      if (!res.ok) await handleFetchError(res);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
  });
};

export const useDisconnectIntegration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (providerKey: string) => {
      const token = getToken();
      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/integrations/${providerKey}/disconnect`, {
        method: "POST",
        headers,
      });
      if (!res.ok) await handleFetchError(res);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-status"] });
    },
  });
};

export const fetchWhatsAppStatus = async (): Promise<IWhatsAppStatus> => {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/integrations/whatsapp/status`, {
    headers,
    cache: "no-store",
  });
  if (!res.ok) await handleFetchError(res);
  const json = await res.json();
  return json.data;
};

export const useWhatsAppStatus = (enabled = true, refetchInterval: number | false = 2500) => {
  return useQuery({
    queryKey: ["whatsapp-status"],
    queryFn: fetchWhatsAppStatus,
    enabled,
    refetchInterval,
  });
};

export const useGenerateWhatsAppQR = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const token = getToken();
      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/integrations/whatsapp/qr`, {
        method: "POST",
        headers,
      });
      if (!res.ok) await handleFetchError(res);
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-status"] });
    },
  });
};

export const usePairWhatsAppPhone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (phone: string) => {
      const token = getToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/integrations/whatsapp/pair-phone`, {
        method: "POST",
        headers,
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) await handleFetchError(res);
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-status"] });
    },
  });
};
