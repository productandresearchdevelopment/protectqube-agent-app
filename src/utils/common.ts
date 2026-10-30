import { showSuccessToast } from "./toast";
import * as HugeIcons from "@hugeicons/core-free-icons";
import { useCookies } from "@/hooks/useCookies";

export const regexPassword =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

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
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const cookie = useCookies().get("accessToken");
  if (cookie) return cookie;
  const local = localStorage.getItem("accessToken");
  if (local) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useCookies().set("accessToken", local, { maxAge: 86400, path: "/", sameSite: "Lax" });
    return local;
  }
  return null;
};

export const setToken = (accessToken: string, refreshToken?: string) => {
  if (typeof document === "undefined") return;
  const cookies = useCookies();
  cookies.set("accessToken", accessToken, { maxAge: 86400, path: "/", sameSite: "Lax" });
  localStorage.setItem("accessToken", accessToken);
  if (refreshToken) {
    cookies.set("refreshToken", refreshToken, { maxAge: 604800, path: "/", sameSite: "Lax" });
    localStorage.setItem("refreshToken", refreshToken);
  }
};

export const removeToken = () => {
  if (typeof document === "undefined") return;
  const cookies = useCookies();
  cookies.remove("accessToken", { path: "/" });
  cookies.remove("refreshToken", { path: "/" });
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};

export const getSessionIdFromToken = (token: string | null): string => {
  if (!token) return "";
  try {
    const parts = token.split(".");
    if (parts.length < 2) return "";
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return payload.session_id || "";
  } catch (err) {
    console.error("Failed to parse JWT:", err);
    return "";
  }
};

export function toTitleCase(input: string): string {
  if (!input) return "";

  return input
    .trim()
    .replace(/[_\s]+/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function toUpperCase(input: string): string {
  if (!input) return "";
  return input
    .trim()
    .replace(/[_\s]+/g, " ")
    .toUpperCase();
}

export function toLowerCase(input: string): string {
  if (!input) return "";
  return input
    .trim()
    .replace(/[_\s]+/g, " ")
    .toLowerCase();
}

export const formatText = (text: string) => {
  const clean = text.replace(/_/g, " ");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

export const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

export const formatCurrency = (
  value: number | string | null,
  currency: string,
) => {
  if (value === null || value === undefined || value === "") return "";

  const numeric =
    typeof value === "number"
      ? value
      : Number(value.toString().replace(/[^0-9]/g, ""));

  const localeMap: Record<string, string> = {
    IDR: "id-ID",
    USD: "en-US",
    JPY: "ja-JP",
    CNY: "zh-CN",
  };

  return new Intl.NumberFormat(localeMap[currency] || "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numeric);
};

export const parseCurrency = (value: string) => {
  return Number(value.replace(/[^0-9]/g, ""));
};

export const parseRupiah = (value: string) => {
  return Number(value.replace(/[^0-9]/g, ""));
};

export const formatRupiah = (value: number | string | null) => {
  if (value === "" || value === null || value === undefined) return "";

  const number =
    typeof value === "number"
      ? value
      : Number(value.toString().replace(/[^0-9]/g, ""));

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

export const maskRupiah = (value: number) => {
  const formatted = formatRupiah(value);
  return formatted.replace(/\d/g, "x");
};

export const formatLargeNumber = (value: number) => {
  if (value >= 1000000000000) {
    return `Rp ${(value / 1000000000000).toFixed(3)} T`;
  } else if (value >= 1000000000) {
    return `Rp ${(value / 1000000000).toFixed(3)} M`;
  } else if (value >= 1000000) {
    return `Rp ${(value / 1000000).toFixed(3)} Jt`;
  }
  return formatRupiah(value);
};

export const DEFAULT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
};

export const DEFAULT_DATETIME_FORMAT: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "Asia/Jakarta",
};

export const formatDate = (
  date?: string | Date | null,
  userFormat?: Intl.DateTimeFormatOptions,
  locale = "id-ID",
) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString(
    locale,
    userFormat ?? DEFAULT_DATE_FORMAT,
  );
};

export const formatDuration = (minutes?: number | null) => {
  if (typeof minutes !== "number" || minutes <= 0) return "0m";

  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const mins = minutes % 60;

  const parts: string[] = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);

  return parts.join(" ");
};

export const buildQueryParams = <T extends object>(params: T): string => {
  const searchParams = new URLSearchParams();

  (Object.entries(params) as [keyof T, T[keyof T]][]).forEach(
    ([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(String(key), String(value));
      }
    },
  );

  return searchParams.toString();
};

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    showSuccessToast("Copied to clipboard");
  } catch (err) {
    console.error("Failed to copy text: ", err);
  }
};

export const resolveIcon = (iconName?: string) => {
  if (!iconName) return HugeIcons.FolderIcon;
  return HugeIcons[iconName as keyof typeof HugeIcons] || HugeIcons.FolderIcon;
};

export const appendIfExists = (
  formData: FormData,
  key: string,
  value?: unknown,
) => {
  if (value === undefined || value === null) return;

  if (typeof value === "object") {
    formData.append(key, JSON.stringify(value));
  } else {
    formData.append(key, String(value));
  }
};

export const formatToWIB = (dateInput?: string | number | Date | null): string => {
  if (!dateInput) return "-";
  try {
    let date: Date;

    if (typeof dateInput === "number") {
      date = new Date(dateInput);
    } else if (typeof dateInput === "string") {
      let str = dateInput.trim();

      if (str.includes("(UTC+7") || str.includes("WIB")) {
        str = str.replace(/\s*\([^)]*\)/g, "").replace(/\s*WIB/g, "").trim();
      }

      if (str.endsWith(" UTC")) {
        str = str.replace(" UTC", "Z");
      } else if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(str)) {
        str = str.replace(" ", "T") + "+07:00";
      }
      date = new Date(str);
    } else {
      date = dateInput;
    }

    if (isNaN(date.getTime())) {
      return String(dateInput);
    }

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
