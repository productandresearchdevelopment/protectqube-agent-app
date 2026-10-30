export interface CookieOptions {
  maxAge?: number;
  path?: string;
  sameSite?: "Lax" | "Strict" | "None";
  secure?: boolean;
}

export const useCookies = () => {
  return {
    get: (name: string): string | undefined => {
      if (typeof document === "undefined") return undefined;
      const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
      return match ? decodeURIComponent(match[2]) : undefined;
    },
    set: (name: string, value: string, options: CookieOptions = {}) => {
      if (typeof document === "undefined") return;
      const maxAge = options.maxAge ?? 86400;
      const path = options.path ?? "/";
      const sameSite = options.sameSite ?? "Lax";
      const secure = options.secure ? "; Secure" : "";
      document.cookie = `${name}=${encodeURIComponent(value)}; path=${path}; max-age=${maxAge}; SameSite=${sameSite}${secure}`;
    },
    remove: (name: string, options: { path?: string } = {}) => {
      if (typeof document === "undefined") return;
      const path = options.path ?? "/";
      document.cookie = `${name}=; path=${path}; max-age=0`;
    },
  };
};
