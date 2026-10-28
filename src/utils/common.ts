export const handleFetchError = async (response: Response): Promise<never> => {
  let errorMessage = "An unexpected error occurred";
  try {
    const errorData = await response.json();
    errorMessage = errorData.detail || errorData.message || errorMessage;
  } catch {
    // Ignore parse error
  }
  throw new Error(errorMessage);
};

export const getToken = (): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(^| )accessToken=([^;]+)/);
  return match ? decodeURIComponent(match[2]) : localStorage.getItem("accessToken");
};

export const setToken = (accessToken: string, refreshToken?: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `accessToken=${encodeURIComponent(accessToken)}; path=/; max-age=86400; SameSite=Lax`;
  localStorage.setItem("accessToken", accessToken);
  if (refreshToken) {
    document.cookie = `refreshToken=${encodeURIComponent(refreshToken)}; path=/; max-age=604800; SameSite=Lax`;
    localStorage.setItem("refreshToken", refreshToken);
  }
};

export const removeToken = () => {
  if (typeof document === "undefined") return;
  document.cookie = "accessToken=; path=/; max-age=0";
  document.cookie = "refreshToken=; path=/; max-age=0";
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};
