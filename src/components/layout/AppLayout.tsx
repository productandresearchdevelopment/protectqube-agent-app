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
  Zap,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useCurrentUser } from "@/store/api/auth";
import { removeToken } from "@/utils/common";
import { toast } from "sonner";
import { AIPreventiveLogo } from "@/components/ui/AIPreventiveLogo";

interface AppLayoutProps {
  title: string;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ title, children }) => {
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
  }, []);

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
        <div className={`p-4 border-b border-white/10 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <AIPreventiveLogo className="size-7 text-white shrink-0" />
            {!isCollapsed && (
              <span className="text-base sm:text-[17px] font-extrabold tracking-tight text-white truncate">
                Protect<span className="text-[#ff7a59]">Q</span>ube AI Ops
              </span>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className={`p-3 ${isCollapsed ? "space-y-2 px-2" : "space-y-1.5"}`}>
          <Link
            href="/"
            title="Overview"
            className={`flex items-center ${isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3.5 py-2.5"} text-sm font-medium rounded-xl transition-all ${
              pathname === "/"
                ? "bg-[#0073ea] text-white shadow-md shadow-blue-500/25 font-semibold"
                : "text-slate-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <Home className="size-5 shrink-0" />
            {!isCollapsed && <span>Overview</span>}
          </Link>

          <Link
            href="/system-health"
            title="System Health"
            className={`flex items-center ${isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3.5 py-2.5"} text-sm font-medium rounded-xl transition-all ${
              pathname === "/system-health"
                ? "bg-[#0073ea] text-white shadow-md shadow-blue-500/25 font-semibold"
                : "text-slate-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <Cog className="size-5 shrink-0" />
            {!isCollapsed && <span>System Health</span>}
          </Link>

          <Link
            href="/cellular-connectivity"
            title="Cellular Connectivity"
            className={`flex items-center ${isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3.5 py-2.5"} text-sm font-medium rounded-xl transition-all ${
              pathname === "/cellular-connectivity"
                ? "bg-[#0073ea] text-white shadow-md shadow-blue-500/25 font-semibold"
                : "text-slate-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <Radio className="size-5 shrink-0" />
            {!isCollapsed && <span>Cellular Connectivity</span>}
          </Link>

          <Link
            href="/dvr-recording"
            title="DVR & Recording"
            className={`flex items-center ${isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3.5 py-2.5"} text-sm font-medium rounded-xl transition-all ${
              pathname === "/dvr-recording"
                ? "bg-[#0073ea] text-white shadow-md shadow-blue-500/25 font-semibold"
                : "text-slate-300 hover:text-white hover:bg-white/10"
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
              className={`w-full flex items-center ${isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3.5 py-2.5"} text-sm font-medium rounded-xl transition-all text-left outline-none cursor-pointer ${
                pathname.startsWith("/reports") && (!reportOpen || isCollapsed)
                  ? "bg-[#0073ea] text-white font-semibold shadow-md shadow-blue-500/25"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} min-w-0`}>
                <FileText className="size-5 shrink-0" />
                {!isCollapsed && <span className="truncate">Report</span>}
              </div>
              {!isCollapsed && (
                <ChevronDown
                  className={`size-4 shrink-0 transition-transform duration-300 ease-in-out ${
                    reportOpen ? "rotate-180 text-white" : "rotate-0 text-slate-400"
                  }`}
                />
              )}
            </button>

            {/* Smooth Accordion Submenu (Visible when expanded) */}
            {!isCollapsed && (
              <AnimatePresence initial={false}>
                {reportOpen && (
                  <motion.div
                    key="report-dropdown-menu"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: "auto",
                      opacity: 1,
                      transition: {
                        height: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
                        opacity: { duration: 0.2, delay: 0.04 },
                      },
                    }}
                    exit={{
                      height: 0,
                      opacity: 0,
                      transition: {
                        height: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
                        opacity: { duration: 0.12 },
                      },
                    }}
                    className="overflow-hidden"
                  >
                    <div className="relative mt-1 ml-5.5 flex flex-col gap-1 border-l border-white/20 pl-3.5 py-1">
                      <Link
                        href="/reports/cellular"
                        className={`flex items-center gap-2.5 text-xs font-medium rounded-lg px-3 py-2 transition-all ${
                          pathname === "/reports/cellular"
                            ? "bg-[#0073ea] text-white font-semibold shadow-sm"
                            : "text-slate-300 hover:text-white hover:bg-white/10"
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
                            : "text-slate-300 hover:text-white hover:bg-white/10"
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
                            : "text-slate-300 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <Activity className="size-4 shrink-0" />
                        <span className="truncate">Report Health</span>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </nav>
      </div>

      <div className="border-t border-white/10 p-3 bg-black/20">
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"} p-1 rounded-xl`}>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-linear-to-tr from-[#00c875] to-[#0073ea] text-xs font-bold text-white shadow-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
          </span>
          {!isCollapsed && (
            <>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-white">
                  {user?.name || "Administrator"}
                </span>
                <span className="block truncate text-[10px] text-slate-400">
                  {user?.role_name || "Super Admin"}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Log out"
              >
                <LogOut className="size-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6f8fb] dark:bg-[#0c101d] flex">
      <aside
        className={`hidden md:flex ${
          desktopCollapsed ? "w-20" : "w-64"
        } shrink-0 bg-[#070c1a] min-h-screen text-white border-r border-slate-800/80 shadow-2xl flex-col sticky top-0 h-screen overflow-y-auto transition-all duration-300 ease-in-out`}
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
              className="relative w-64 max-w-[80vw] bg-[#070c1a] h-full text-white shadow-2xl z-10 flex flex-col"
            >
              {navContent(false)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#121626]/90 backdrop-blur-md px-4 md:px-6 shadow-xs transition-colors">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-xl transition-colors cursor-pointer"
              aria-label="Open mobile menu"
            >
              <Menu className="size-5" />
            </button>

            <button
              onClick={() => setDesktopCollapsed((prev) => !prev)}
              className="hidden md:flex items-center justify-center p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
              title={desktopCollapsed ? "Expand sidebar" : "Minimize sidebar"}
              aria-label="Toggle sidebar collapse"
            >
              <PanelLeft className="size-5" />
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

            <h1 className="text-sm md:text-base font-bold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Toggle theme"
            >
              {mounted && theme === "dark" ? (
                <Sun className="size-4 text-amber-400" />
              ) : (
                <Moon className="size-4 text-slate-600" />
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
