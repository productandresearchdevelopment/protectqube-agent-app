"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radio,
  Video,
  Cpu,
  Settings,
  ChevronLeft,
  ChevronRight,
  Boxes,
  Bell,
  Search,
  CheckCircle2,
  HelpCircle,
  LogOut,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/store/api/auth";
import { removeToken } from "@/utils/common";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AIPreventiveLogo } from "@/components/ui/AIPreventiveLogo";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useCurrentUser();

  const handleLogout = () => {
    removeToken();
    toast.info("Anda telah logout.");
    router.push("/auth/login");
  };

  const navItems = [
    {
      name: "Overview",
      href: "/",
      icon: LayoutDashboard,
      badge: "Live",
      badgeColor: "bg-[#00c875]",
    },
    {
      name: "System Health",
      href: "/system-health",
      icon: Cpu,
      badge: "SBC",
      badgeColor: "bg-[#0073ea]",
    },
    {
      name: "Cellular Connectivity",
      href: "/cellular-connectivity",
      icon: Radio,
      badge: "Modem/SIM",
      badgeColor: "bg-[#0073ea]",
    },
    {
      name: "DVR & Recording",
      href: "/dvr-recording",
      icon: Video,
      badge: "CCTV/HDD",
      badgeColor: "bg-[#0073ea]",
    },
    {
      name: "Gateway Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Monday.com Main Sidebar */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex bg-[#292f4c] text-white transition-all duration-300 shadow-xl",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col w-full h-full justify-between">
          {/* Top Section */}
          <div>
            {/* Monday Header / Brand */}
            <div className="h-16 flex items-center justify-between px-3.5 border-b border-white/10">
              <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
                <AIPreventiveLogo className="w-7 h-7 text-white shrink-0" />
                {!collapsed && (
                  <span className="font-extrabold text-base sm:text-[17px] tracking-tight text-white truncate">
                    Protect<span className="text-[#ff7a59]">Q</span>ube AI Ops
                  </span>
                )}
              </Link>
              <button
                onClick={onToggleCollapse}
                className="hidden md:flex items-center justify-center w-6 h-6 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>

            {/* Workspace Label */}
            {!collapsed && (
              <div className="px-4 pt-4 pb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Agents Workspace
                </span>
              </div>
            )}

            {/* Nav Links */}
            <nav className="px-2 space-y-1 mt-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group",
                      isActive
                        ? "bg-[#0073ea] text-white shadow-md shadow-blue-500/20"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-slate-200 group-hover:scale-110 transition-transform" />
                    {!collapsed && (
                      <div className="flex items-center justify-between flex-1 min-w-0">
                        <span className="truncate">{item.name}</span>
                        {item.badge && (
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white shadow-sm shrink-0",
                              item.badgeColor
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Profile / Quick Actions Section */}
          <div className="p-3 border-t border-white/10 space-y-2">
            {!collapsed ? (
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-linear-to-tr from-[#00c875] to-[#0073ea] flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate">
                      {user?.name || "Admin"}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">
                      {user?.role_name || "Super Admin"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="w-full flex justify-center py-2 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
