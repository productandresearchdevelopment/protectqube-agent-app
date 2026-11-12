import { getToken, handleFetchError } from "@/utils/common";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IRole, IModule, IUser } from "@/types/model";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

const getAuthHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface IModuleType {
  id: string;
  name: string;
  icon?: string | null;
  description?: string | null;
}

export interface IRoleModulePermission {
  module_id: number;
  role_id: string;
  checked: boolean;
  name: string;
  route?: string | null;
  icon?: string | null;
  parent_id?: number | null;
  module_type_id: string;
  module_type_name?: string | null;
  description?: string | null;
}

// =========================================================================
// USERS API
// =========================================================================

export const fetchUsers = async (params?: { search?: string; role_id?: string }) => {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.role_id && params.role_id !== "all") query.append("role_id", params.role_id);

  const res = await fetch(`${API_BASE_URL}/users?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleFetchError(res);
  const data = await res.json();
  return (data.data || []) as IUser[];
};

export const useUsers = (params?: { search?: string; role_id?: string }) => {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => fetchUsers(params),
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      username: string;
      email: string;
      password: string;
      phone?: string;
      address?: string;
      role_id: string;
    }) => {
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) await handleFetchError(res);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string;
      name?: string;
      username?: string;
      email?: string;
      password?: string;
      phone?: string;
      address?: string;
      role_id?: string;
    }) => {
      const res = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) await handleFetchError(res);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) await handleFetchError(res);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
};

// =========================================================================
// ROLES API
// =========================================================================

export const fetchRoles = async (params?: { search?: string }) => {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);

  const res = await fetch(`${API_BASE_URL}/roles?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleFetchError(res);
  const data = await res.json();
  return (data.data || []) as (IRole & { user_count?: number })[];
};

export const useRoles = (params?: { search?: string }) => {
  return useQuery({
    queryKey: ["roles", params],
    queryFn: () => fetchRoles(params),
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      alias: string;
      color?: string;
      description?: string;
    }) => {
      const res = await fetch(`${API_BASE_URL}/roles`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) await handleFetchError(res);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string;
      name?: string;
      alias?: string;
      color?: string;
      description?: string;
    }) => {
      const res = await fetch(`${API_BASE_URL}/roles/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) await handleFetchError(res);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/roles/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) await handleFetchError(res);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
};

// =========================================================================
// ROLE PERMISSIONS
// =========================================================================

export const fetchRolePermissions = async (roleId: string) => {
  if (!roleId) return [];
  const res = await fetch(`${API_BASE_URL}/roles/${roleId}/permissions`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleFetchError(res);
  const data = await res.json();
  return (data.data || []) as IRoleModulePermission[];
};

export const useRolePermissions = (roleId?: string | null) => {
  return useQuery({
    queryKey: ["rolePermissions", roleId],
    queryFn: () => fetchRolePermissions(roleId || ""),
    enabled: Boolean(roleId),
  });
};

export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      roleId,
      permissions,
    }: {
      roleId: string;
      permissions: { module_id: number; checked: boolean }[];
    }) => {
      const res = await fetch(`${API_BASE_URL}/roles/${roleId}/permissions`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ permissions }),
      });
      if (!res.ok) await handleFetchError(res);
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["rolePermissions", vars.roleId] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
};

export const useUpdateSinglePermission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      roleId,
      moduleId,
      checked,
    }: {
      roleId: string;
      moduleId: number;
      checked: boolean;
    }) => {
      const res = await fetch(`${API_BASE_URL}/roles/${roleId}/permission`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ module_id: moduleId, checked }),
      });
      if (!res.ok) await handleFetchError(res);
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["rolePermissions", vars.roleId] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
};

export type RoleModulePermissionMap = Record<string, boolean>;

export const checkRoleModulesBatch = async (
  roleId: string,
  modules: string[]
): Promise<RoleModulePermissionMap> => {
  const res = await fetch(`${API_BASE_URL}/roles/${roleId}/modules/check`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ modules }),
  });
  if (!res.ok) await handleFetchError(res);
  const data = await res.json();
  return (data.data || {}) as RoleModulePermissionMap;
};

export const useCheckRoleModules = (roleId?: string, modules: string[] = []) => {
  return useQuery<RoleModulePermissionMap, Error>({
    queryKey: ["role-module-check-batch", roleId, modules],
    queryFn: () => checkRoleModulesBatch(roleId!, modules),
    enabled: Boolean(roleId && modules.length > 0),
    staleTime: 1000 * 60 * 5,
  });
};

// =========================================================================
// MODULES API
// =========================================================================

export const fetchModules = async (params?: { search?: string }) => {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);

  const res = await fetch(`${API_BASE_URL}/modules?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleFetchError(res);
  const data = await res.json();
  return (data.data || []) as (IModule & {
    parent_name?: string | null;
    module_type?: IModuleType | null;
  })[];
};

export const useModules = (params?: { search?: string }) => {
  return useQuery({
    queryKey: ["modules", params],
    queryFn: () => fetchModules(params),
  });
};

export const useCreateModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      module_type_id: string;
      parent_id?: number | null;
      path?: string;
      route?: string;
      icon?: string;
      description?: string;
    }) => {
      const res = await fetch(`${API_BASE_URL}/modules`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) await handleFetchError(res);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      queryClient.invalidateQueries({ queryKey: ["rolePermissions"] });
    },
  });
};

export const useUpdateModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: number;
      name?: string;
      module_type_id?: string;
      parent_id?: number | null;
      path?: string;
      route?: string;
      icon?: string;
      description?: string;
    }) => {
      const res = await fetch(`${API_BASE_URL}/modules/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) await handleFetchError(res);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      queryClient.invalidateQueries({ queryKey: ["rolePermissions"] });
    },
  });
};

export const useDeleteModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE_URL}/modules/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) await handleFetchError(res);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      queryClient.invalidateQueries({ queryKey: ["rolePermissions"] });
    },
  });
};

// =========================================================================
// MODULE TYPES API
// =========================================================================

export const fetchModuleTypes = async () => {
  const res = await fetch(`${API_BASE_URL}/module-types`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleFetchError(res);
  const data = await res.json();
  return (data.data || []) as IModuleType[];
};

export const useModuleTypes = () => {
  return useQuery({
    queryKey: ["moduleTypes"],
    queryFn: fetchModuleTypes,
  });
};

export const useCreateModuleType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      icon?: string;
      description?: string;
    }) => {
      const res = await fetch(`${API_BASE_URL}/module-types`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) await handleFetchError(res);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moduleTypes"] });
    },
  });
};

export const useUpdateModuleType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string;
      name?: string;
      icon?: string;
      description?: string;
    }) => {
      const res = await fetch(`${API_BASE_URL}/module-types/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) await handleFetchError(res);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moduleTypes"] });
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
  });
};

export const useDeleteModuleType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/module-types/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) await handleFetchError(res);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moduleTypes"] });
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
  });
};

// =========================================================================
// CLIENTS API
// =========================================================================
export interface IClient {
  id: string;
  name: string;
  code?: string | null;
  is_active: boolean;
  devices_count?: number;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
}

export interface IClientListResponse {
  status: boolean;
  data: IClient[];
  total: number;
  page: number;
  page_size: number;
}

export const fetchClients = async (params?: {
  search?: string;
  is_active?: boolean;
  all?: boolean;
  page?: number;
  page_size?: number;
}): Promise<IClientListResponse> => {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.is_active !== undefined) query.append("is_active", String(params.is_active));
  if (params?.all) query.append("all", "true");
  if (params?.page) query.append("page", String(params.page));
  if (params?.page_size) query.append("page_size", String(params.page_size));

  const res = await fetch(`${API_BASE_URL}/clients?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleFetchError(res);
  return res.json();
};

export const useClients = (params?: {
  search?: string;
  is_active?: boolean;
  all?: boolean;
  page?: number;
  page_size?: number;
}) => {
  return useQuery({
    queryKey: ["clients", params],
    queryFn: () => fetchClients(params),
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; code?: string; is_active?: boolean }) => {
      const res = await fetch(`${API_BASE_URL}/clients`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) await handleFetchError(res);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: { name?: string; code?: string; is_active?: boolean };
    }) => {
      const res = await fetch(`${API_BASE_URL}/clients/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) await handleFetchError(res);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/clients/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) await handleFetchError(res);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });
};

// =========================================================================
// DEVICES API (Configuration & Master Fleet Management)
// =========================================================================
export interface IDetectedCamera {
  id: string;
  channel: number;
  name: string;
  is_online: boolean;
  resolution?: string;
  recording_status?: string;
}

export interface IConfigDevice {
  id: string;
  name: string;
  location?: string | null;
  lat?: number | null;
  long?: number | null;
  hardware_model?: string | null;
  operational_start?: string | null;
  operational_end?: string | null;
  is_active: boolean;
  client_id?: string | null;
  client_name?: string | null;
  property: Record<string, any>;
  total_cameras?: number | null;
  selected_cameras?: string[] | null;
  detected_cameras?: IDetectedCamera[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface IDeviceListResponse {
  status: boolean;
  data: IConfigDevice[];
  total: number;
  page: number;
  page_size: number;
}

export const fetchConfigDevices = async (params?: {
  search?: string;
  client_id?: string;
  is_active?: boolean | string;
  page?: number;
  page_size?: number;
}): Promise<IDeviceListResponse> => {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.client_id) query.append("client_id", params.client_id);
  if (params?.is_active !== undefined && params?.is_active !== "all") {
    query.append("is_active", String(params.is_active));
  }
  if (params?.page) query.append("page", String(params.page));
  if (params?.page_size) query.append("page_size", String(params.page_size));

  const res = await fetch(`${API_BASE_URL}/devices?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleFetchError(res);
  return res.json();
};

export const fetchConfigDevice = async (id: string): Promise<{ status: boolean; data: IConfigDevice }> => {
  const res = await fetch(`${API_BASE_URL}/devices/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleFetchError(res);
  return res.json();
};

export const useConfigDevices = (params?: {
  search?: string;
  client_id?: string;
  is_active?: boolean | string;
  page?: number;
  page_size?: number;
}) => {
  return useQuery({
    queryKey: ["devices", params],
    queryFn: () => fetchConfigDevices(params),
  });
};

export const useConfigDevice = (id?: string | null) => {
  return useQuery({
    queryKey: ["devices", id],
    queryFn: () => fetchConfigDevice(id!),
    enabled: Boolean(id),
  });
};

export const useUpdateConfigDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        client_id?: string | null;
        location?: string;
        lat?: number | null;
        long?: number | null;
        hardware_model?: string;
        operational_start?: string | null;
        operational_end?: string | null;
        is_active?: boolean;
        property?: Record<string, any>;
        total_cameras?: number;
        selected_cameras?: string[];
      };
    }) => {
      const res = await fetch(`${API_BASE_URL}/devices/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) await handleFetchError(res);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["slaReport"] });
      queryClient.invalidateQueries({ queryKey: ["systemHealthDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["dvrFleet"] });
      queryClient.invalidateQueries({ queryKey: ["dvrReports"] });
    },
  });
};

