"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { useLogin } from "@/store/api/auth";
import { AIPreventiveLogo } from "@/components/ui/AIPreventiveLogo";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loginMutation = useLogin();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("savedIdentifier");
      if (saved) {
        setIdentifier(saved);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage("Please enter your username");
      return;
    }
    if (!password.trim()) {
      setErrorMessage("Please enter your password");
      return;
    }

    try {
      const loggedInUser = await loginMutation.mutateAsync({
        username_or_email: identifier.trim(),
        password: password.trim(),
      });
      if (rememberMe) {
        localStorage.setItem("savedIdentifier", identifier.trim());
      } else {
        localStorage.removeItem("savedIdentifier");
      }

      // Check if user has permission for "/" (Overview) or first allowed route
      const isPrivileged = Boolean(
        loggedInUser?.role_name?.toLowerCase().includes("super") ||
        loggedInUser?.role_alias?.toLowerCase().includes("super") ||
        loggedInUser?.role_name?.toLowerCase() === "developer" ||
        loggedInUser?.role_alias?.toLowerCase() === "developer"
      );

      let targetUrl = "/";
      if (!isPrivileged && loggedInUser?.permissions && loggedInUser.permissions.length > 0) {
        const candidateRoutes = [
          "/system-health",
          "/cellular",
          "/dvr-recording",
          "/reports/cellular",
          "/reports/dvr",
          "/reports/health",
        ];
        const allowed = candidateRoutes.find((r) =>
          loggedInUser.permissions.some(
            (p: string) => p === r || p.startsWith(r) || r.startsWith(p)
          )
        );
        targetUrl = allowed || loggedInUser.permissions.find((p: string) => p && p.startsWith("/")) || "/";
      }

      window.location.href = targetUrl;
    } catch (err: any) {
      setErrorMessage(
        err.message || "Incorrect username or password. Please check and try again."
      );
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#0a0d14] text-slate-900 dark:text-slate-100 font-sans selection:bg-[#ff7a59]/20">
      {/* LEFT SECTION: 4 COLUMNS - Simple Image & AI Agent Description */}
      <div className="lg:col-span-4 relative min-h-105 lg:min-h-screen flex flex-col justify-between p-8 sm:p-10 lg:p-12 overflow-hidden bg-slate-950">
        {/* Simple Background Image */}
        <img
          src="/images/smartbox-minimal.jpg"
          alt="ProtectQube SmartBox Edge AI Agent"
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.75] contrast-[1.1]"
        />

        {/* Ambient Dark Overlay for clean readability */}
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-black/60 pointer-events-none" />

        {/* Top Logo & Branding: Pure Text + Icon (NO card) */}
        <div className="relative z-10 flex items-center gap-3">
          <AIPreventiveLogo className="size-8 text-white shrink-0" />
          <div className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>
              Protect<span className="text-[#ff7a59]">Q</span>ube
            </span>
            <span className="text-white">AIOPS</span>
          </div>
        </div>

        {/* Bottom AI Agent Explanation (Pure description, no quotes/people) */}
        <div className="relative z-10 max-w-sm space-y-2 pt-14 lg:pt-0">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
            SmartBox Edge AI Agent
          </h2>
          <p className="text-sm text-slate-300/90 leading-relaxed">
            Autonomous AI Agent embedded directly in SmartBox Gateway for edge device health monitoring, cellular connectivity, and real-time telemetry.
          </p>
        </div>
      </div>

      {/* RIGHT SECTION: 8 COLUMNS - Pure Clean Form (No card, pure Apple minimalism) */}
      <div className="lg:col-span-8 flex flex-col justify-between p-6 sm:p-12 lg:p-16 min-h-125 lg:min-h-screen">
        <div className="hidden lg:block" />

        <div className="w-full max-w-105 mx-auto my-auto py-8">
          {/* Header: Just ProtectQube AIOPS and simple login prompt */}
          <div className="space-y-2 mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Protect<span className="text-[#ff7a59]">Q</span>ube AIOPS
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Please sign in to your account to continue.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-3 text-xs font-medium text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Username
              </label>
              <input
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 text-sm bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ff7a59]/30 focus:border-[#ff7a59] transition-all duration-150 placeholder:text-slate-400 text-slate-900 dark:text-white"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-4 pr-11 py-3 text-sm bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ff7a59]/30 focus:border-[#ff7a59] transition-all duration-150 placeholder:text-slate-400 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Toggle: Remember sign in details */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-600 dark:text-slate-400 select-none">
                Remember sign in details
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={rememberMe}
                onClick={() => setRememberMe(!rememberMe)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  rememberMe ? "bg-[#ff7a59]" : "bg-slate-200 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    rememberMe ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3 px-4 rounded-xl bg-[#ff7a59] hover:bg-[#ff6842] active:scale-[0.99] text-white font-medium text-sm shadow-sm transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Log in</span>
              )}
            </button>
          </form>
        </div>

        {/* Minimal Footer */}
        <div className="text-center py-4 text-xs text-slate-400 dark:text-slate-500 font-normal">
          ProtectQube SmartBox Edge Gateway • Autonomous Telemetry Sentinel
        </div>
      </div>
    </div>
  );
}
