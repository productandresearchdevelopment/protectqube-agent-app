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

/**
 * Mengonversi waktu UTC / ISO / timestamp ke Waktu Indonesia Barat (WIB / UTC+7).
 * Contoh output: "29 Okt 2026 15:31:45 WIB"
 */
export const formatToWIB = (dateInput?: string | number | Date | null): string => {
  if (!dateInput) return "-";
  try {
    let date: Date;

    if (typeof dateInput === "number") {
      date = new Date(dateInput);
    } else if (typeof dateInput === "string") {
      let str = dateInput.trim();

      // Bersihkan teks ekstra dari gateway seperti ' (UTC+7 / WIB)'
      if (str.includes("(UTC+7") || str.includes("WIB")) {
        str = str.replace(/\s*\([^)]*\)/g, "").replace(/\s*WIB/g, "").trim();
      }

      if (str.endsWith(" UTC")) {
        str = str.replace(" UTC", "Z");
      } else if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(str)) {
        // String format YYYY-MM-DD HH:mm(:ss) dari gateway sudah waktu lokal Indonesia (UTC+7)
        str = str.replace(" ", "T") + "+07:00";
      }
      date = new Date(str);
    } else {
      date = dateInput;
    }

    if (isNaN(date.getTime())) {
      return String(dateInput);
    }

    // Format dengan locale Indonesia dan timezone Asia/Jakarta (WIB)
    const formatter = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    return `${formatter.format(date)} WIB`.replace(/\./g, ":").replace(/,\s*/g, " ");
  } catch {
    return String(dateInput);
  }
};

