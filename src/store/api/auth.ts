import { IUser } from "@/types/model";
import { getToken, handleFetchError, setToken, removeToken } from "@/utils/common";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export const loginApi = async (credentials: { username_or_email: string; password: string }) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    await handleFetchError(response);
  }

  const result = await response.json();
  const { access_token, refresh_token, user } = result.data;
  setToken(access_token, refresh_token);
  return user;
};

export const fetchCurrentUser = async (): Promise<IUser | null> => {
  const token = getToken();
  if (!token) return null;

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    removeToken();
    return null;
  }

  const result = await response.json();
  return result.data;
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    staleTime: 1000 * 60 * 5,
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: loginApi,
    onSuccess: (user) => {
      queryClient.setQueryData(["currentUser"], user);
    },
  });
};
