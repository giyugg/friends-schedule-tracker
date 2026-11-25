"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Menu, Moon, Sun } from "lucide-react";
import { resolveActiveSemester } from "@/lib/schedule-utils";
import {
  isAdminTab,
  type AdminTab,
  type Profile,
  type Semester,
  type VisibilityGroupWithMembers,
} from "@/lib/types";
import { SidebarContent } from "./sidebar-content";
import { useTheme } from "./theme-provider";

interface AppShellProps {
  profile: Profile;
  semesters: Semester[];
  activeSemesterId?: string | null;
  visibilityGroups?: VisibilityGroupWithMembers[];
  pendingProfileRequestsCount?: number;
  children: ReactNode;
}

export function AppShell({
  profile,
  semesters,
  activeSemesterId,
  visibilityGroups = [],
  pendingProfileRequestsCount = 0,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSemesterPending, startSemesterTransition] = useTransition();

  const isOnAdmin = pathname.startsWith("/admin");
  const [adminOpen, setAdminOpen] = useState(isOnAdmin);
  const [prevOnAdmin, setPrevOnAdmin] = useState(isOnAdmin);
  if (isOnAdmin !== prevOnAdmin) {
    setPrevOnAdmin(isOnAdmin);
    if (isOnAdmin) {
      setAdminOpen(true);
    }
  }

  const tabParam = searchParams.get("tab");
  const defaultAdminTab: AdminTab =
    semesters.length === 0 ? "semesters" : "schedules";
  const activeAdminTab: AdminTab = isAdminTab(tabParam)
    ? tabParam
    : defaultAdminTab;

  const semesterParam = searchParams.get("semester");
  const resolvedSemesterId =
    activeSemesterId ??
    resolveActiveSemester(semesters, semesterParam)?.id ??
    null;

  const buildHref = (path: string) => {
    const params = new URLSearchParams();
    if (semesterParam) params.set("semester", semesterParam);
    const query = params.toString();
    return query ? `${path}?${query}` : path;
  };

  const buildAdminTabHref = (tabId: AdminTab) => {
    const params = new URLSearchParams();
    if (semesterParam) params.set("semester", semesterParam);
    params.set("tab", tabId);
    return `/admin?${params.toString()}`;
  };

  // Show groups the user is associated with (for admins, show all groups)
  const associatedGroups =
    profile.role === "admin"
      ? visibilityGroups
      : visibilityGroups.filter((g) => g.memberIds.includes(profile.id));

  const handleSemesterChange = (nextSemesterId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextSemesterId) {
      params.set("semester", nextSemesterId);
    } else {
      params.delete("semester");
    }
    const query = params.toString();
    startSemesterTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  };

  const sharedSidebarProps = {
    collapsed,
    onCollapse: setCollapsed,
    onCloseMobile: () => setMobileOpen(false),
    pathname,
    profile,
    semesters,
    resolvedSemesterId,
    isSemesterPending,
    onSemesterChange: handleSemesterChange,
    associatedGroups,
    isOnAdmin,
    adminOpen,
    onToggleAdmin: () => setAdminOpen((open) => !open),
    onOpenAdminFromCompact: () => {
      setCollapsed(false);
      setAdminOpen(true);
    },
    activeAdminTab,
    pendingProfileRequestsCount,
    theme,
    onToggleTheme: toggleTheme,
    buildHref,
    buildAdminTabHref,
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Desktop Left Sidebar */}
      <aside
        className={`hidden md:block shrink-0 sticky top-0 h-screen border-r border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 transition-[width] duration-200 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <SidebarContent {...sharedSidebarProps} isMobile={false} />
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden sticky top-0 z-30 h-14 px-4 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer"
          >
            <Menu className="h-4 w-4" />
          </button>
          <Link href="/" className="font-bold text-sm tracking-tight">
            Schedule TBA
          </Link>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
      </header>

      {/* Mobile Slide-Over Sidebar */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex bg-slate-950/50 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="w-64 max-w-[80vw] h-full bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent {...sharedSidebarProps} isMobile={true} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 px-4 sm:px-6 py-5">{children}</main>
    </div>
  );
}
