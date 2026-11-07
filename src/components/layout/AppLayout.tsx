"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  Cog,
  Radio,
  Video,
  FileText,
  Activity,
  Menu,
  X,
  PanelLeft,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useCurrentUser } from "@/store/api/auth";
import { getToken, removeToken } from "@/utils/common";
import { toast } from "sonner";
import { AIPreventiveLogo } from "@/components/ui/AIPreventiveLogo";

interface AppLayoutProps {
  title?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  title,
  headerRight,
  children,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { data: user } = useCurrentUser();

  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [reportOpen, setReportOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (!getToken()) {
      router.push("/auth/login");
    }
  }, [router, pathname]);

  useEffect(() => {
    if (pathname.startsWith("/reports")) {
      setReportOpen(true);
    }
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    removeToken();
    toast.info("Anda telah logout.");
    router.push("/auth/login");
  };

  const navContent = (isCollapsed: boolean) => (
    <div className="flex flex-col h-full justify-between select-none">
      <div>
        <div
          className={`h-16 px-4 border-b border-[#1e4682]/70 flex items-center shrink-0 ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          <Link href="/" className="flex items-center gap-2.5 min-w-0 group">
            <AIPreventiveLogo className="size-7 text-white shrink-0 transition-transform group-hover:scale-105" />
            {!isCollapsed && (
              <span className="text-base sm:text-[17px] font-extrabold tracking-tight text-white truncate">
                Protect<span className="text-[#ff7a59]">Q</span>ube AIOPS
              </span>
            )}
          </Link>

          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className={`p-3 ${isCollapsed ? "space-y-2 px-2" : "space-y-1.5"}`}>
          <Link
            href="/"
            title="Overview"
            className={`flex items-center ${
              isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3.5 py-2.5"
            } text-sm font-medium rounded-xl transition-all ${
              pathname === "/"
                ? "bg-[#0073ea] text-white shadow-md shadow-blue-500/25 font-semibold"
                : "text-slate-200 hover:text-white hover:bg-white/10"
            }`}
          >
            <Home className="size-5 shrink-0" />
            {!isCollapsed && <span>Overview</span>}
          </Link>

          <Link
            href="/system-health"
            title="System Health"
            className={`flex items-center ${
              isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3.5 py-2.5"
            } text-sm font-medium rounded-xl transition-all ${
              pathname === "/system-health"
                ? "bg-[#0073ea] text-white shadow-md shadow-blue-500/25 font-semibold"
                : "text-slate-200 hover:text-white hover:bg-white/10"
            }`}
          >
            <Cog className="size-5 shrink-0" />
            {!isCollapsed && <span>System Health</span>}
          </Link>

          <Link
            href="/cellular"
            title="Cellular"
            className={`flex items-center ${
              isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3.5 py-2.5"
            } text-sm font-medium rounded-xl transition-all ${
              pathname === "/cellular" || pathname === "/cellular-connectivity"
                ? "bg-[#0073ea] text-white shadow-md shadow-blue-500/25 font-semibold"
                : "text-slate-200 hover:text-white hover:bg-white/10"
            }`}
          >
            <Radio className="size-5 shrink-0" />
            {!isCollapsed && <span>Cellular</span>}
          </Link>

          <Link
            href="/dvr-recording"
            title="DVR & Recording"
            className={`flex items-center ${
              isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3.5 py-2.5"
            } text-sm font-medium rounded-xl transition-all ${
              pathname === "/dvr-recording"
                ? "bg-[#0073ea] text-white shadow-md shadow-blue-500/25 font-semibold"
                : "text-slate-200 hover:text-white hover:bg-white/10"
            }`}
          >
            <Video className="size-5 shrink-0" />
            {!isCollapsed && <span>DVR & Recording</span>}
          </Link>

          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => {
                if (isCollapsed) {
                  setDesktopCollapsed(false);
                  setReportOpen(true);
                } else {
                  setReportOpen((prev) => !prev);
                }
              }}
              title="Report"
              className={`w-full flex items-center ${
                isCollapsed
                  ? "justify-center px-2 py-2.5"
                  : "justify-between px-3.5 py-2.5"
              } text-sm font-medium rounded-xl transition-all text-left outline-none cursor-pointer ${
                pathname.startsWith("/reports") && (!reportOpen || isCollapsed)
                  ? "bg-[#0073ea] text-white font-semibold shadow-md shadow-blue-500/25"
                  : "text-slate-200 hover:text-white hover:bg-white/10"
              }`}
            >
              <div
                className={`flex items-center ${
                  isCollapsed ? "justify-center" : "gap-3"
                } min-w-0`}
              >
                <FileText className="size-5 shrink-0" />
                {!isCollapsed && <span className="truncate">Report</span>}
              </div>
              {!isCollapsed && (
                <ChevronDown
                  className={`size-4 shrink-0 transition-transform duration-200 ${
                    reportOpen ? "rotate-180 text-white" : "text-slate-300"
                  }`}
                />
              )}
            </button>

            <AnimatePresence initial={false}>
              {reportOpen && !isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="relative mt-1 ml-5.5 flex flex-col gap-1 border-l border-white/20 pl-3.5 py-1">
                    <Link
                      href="/reports/cellular"
                      className={`flex items-center gap-2.5 text-xs font-medium rounded-lg px-3 py-2 transition-all ${
                        pathname === "/reports/cellular"
                          ? "bg-[#0073ea] text-white font-semibold shadow-sm"
                          : "text-slate-200 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <Radio className="size-4 shrink-0" />
                      <span className="truncate">Report Cellular</span>
                    </Link>

                    <Link
                      href="/reports/dvr"
                      className={`flex items-center gap-2.5 text-xs font-medium rounded-lg px-3 py-2 transition-all ${
                        pathname === "/reports/dvr"
                          ? "bg-[#0073ea] text-white font-semibold shadow-sm"
                          : "text-slate-200 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <Video className="size-4 shrink-0" />
                      <span className="truncate">Report DVR</span>
                    </Link>

                    <Link
                      href="/reports/health"
                      className={`flex items-center gap-2.5 text-xs font-medium rounded-lg px-3 py-2 transition-all ${
                        pathname === "/reports/health"
                          ? "bg-[#0073ea] text-white font-semibold shadow-sm"
                          : "text-slate-200 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <Activity className="size-4 shrink-0" />
                      <span className="truncate">Report Health</span>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      </div>

      <div className="border-t border-[#1e4682]/70 p-3 bg-[#0d2347]/80">
        <div
          className={`flex items-center ${
            isCollapsed ? "justify-center flex-col gap-2" : "justify-between gap-2"
          } p-1 rounded-xl`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-linear-to-tr from-[#00c875] to-[#0073ea] text-xs font-bold text-white shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
            </span>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-white">
                  {user?.name || "Administrator"}
                </span>
                <span className="block truncate text-[10px] text-slate-300">
                  {user?.role_name || "Super Admin"}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Ganti tema (Dark / Light)"
              aria-label="Toggle theme"
            >
              {mounted && theme === "dark" ? (
                <Sun className="size-4 text-amber-400" />
              ) : (
                <Moon className="size-4 text-slate-300" />
              )}
            </button>

            <button
              onClick={handleLogout}
              className="text-slate-300 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6f8fb] dark:bg-[#0c101d] flex text-slate-800 dark:text-slate-100 transition-colors">
      <aside
        className={`hidden md:flex ${
          desktopCollapsed ? "w-20" : "w-64"
        } shrink-0 bg-[#122d5a] min-h-screen text-white border-r border-[#1e4682]/70 shadow-2xl flex-col sticky top-0 h-screen overflow-y-auto transition-all duration-300 ease-in-out`}
      >
        {navContent(desktopCollapsed)}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-64 max-w-[80vw] bg-[#122d5a] h-full text-white shadow-2xl z-10 flex flex-col border-r border-[#1e4682]/70"
            >
              {navContent(false)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <main className="flex-1 min-h-screen flex flex-col overflow-x-hidden">
        {(title || headerRight) && (
          <div className="h-16 px-4 md:px-6 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer"
                aria-label="Open mobile menu"
              >
                <Menu className="size-5" />
              </button>

              <button
                onClick={() => setDesktopCollapsed((prev) => !prev)}
                className="hidden md:flex items-center justify-center p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={desktopCollapsed ? "Expand sidebar" : "Minimize sidebar"}
                aria-label="Toggle sidebar collapse"
              >
                <PanelLeft className="size-5" />
              </button>

              {title && (
                <h1 className="text-base sm:text-[17px] font-bold text-slate-900 dark:text-white tracking-tight">
                  {title}
                </h1>
              )}
            </div>

            {headerRight && (
              <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
                {headerRight}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 px-4 md:px-6 pb-6 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
