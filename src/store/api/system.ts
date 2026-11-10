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

