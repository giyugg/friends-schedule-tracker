"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  CalendarDays,
  Clock,
  GraduationCap,
  KeyRound,
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  Sun,
  Users,
  X,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { useTheme } from "./theme-provider";
import type { Profile, Semester, VisibilityGroupWithMembers } from "@/lib/types";

interface AppShellProps {
  profile: Profile;
  semesters: Semester[];
  activeSemesterId: string | null;
  visibilityGroups?: VisibilityGroupWithMembers[];
  children: ReactNode;
}

export function AppShell({
  profile,
  semesters,
  activeSemesterId,
  visibilityGroups = [],
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const semesterParam = searchParams.get("semester");

  const buildHref = (path: string) => {
    const params = new URLSearchParams();
    if (semesterParam) params.set("semester", semesterParam);
    const query = params.toString();
    return query ? `${path}?${query}` : path;
  };

  // Show groups the user is associated with (for admins, show all groups)
  const associatedGroups =
    profile.role === "admin"
      ? visibilityGroups
      : visibilityGroups.filter((g) => g.memberIds.includes(profile.id));

  const navItems = [
    { href: "/daily", label: "Daily Grid", icon: LayoutGrid },
    { href: "/weekly", label: "Section Weekly", icon: CalendarDays },
    { href: "/free-time", label: "Free Time", icon: Clock },
    { href: "/grades", label: "Grades", icon: GraduationCap },
    ...(profile.role === "admin"
      ? [{ href: "/admin", label: "Admin", icon: Shield }]
      : []),
  ];

  const handleSemesterChange = (nextSemesterId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextSemesterId) {
      params.set("semester", nextSemesterId);
    } else {
      params.delete("semester");
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const renderSidebarContent = (isMobile = false) => {
    const isCompact = !isMobile && collapsed;

    return (
      <div className="flex flex-col h-full">
        {/* Brand + Collapse Toggle */}
        <div
          className={`h-16 px-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center ${
            isCompact ? "justify-center" : "justify-between"
          }`}
        >
          <Link
            href="/"
            onClick={() => isMobile && setMobileOpen(false)}
            className="flex items-center gap-2.5 min-w-0"
            title="Schedule TBA"
          >
            <div className="h-9 w-9 shrink-0 rounded-xl bg-[#F19C99]/35 dark:bg-[#6E2C2A] border border-[#DF7A76]/50 flex items-center justify-center text-[#9E2A26] dark:text-[#FDE8E8]">
              <CalendarDays className="h-4 w-4" />
            </div>
            {!isCompact && (
              <div className="leading-tight truncate">
                <span className="font-bold text-sm tracking-tight block truncate">
                  Schedule TBA
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                  Schedule Tracker
                </span>
              </div>
            )}
          </Link>

          {!isMobile && !isCompact && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              title="Collapse sidebar"
              className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}

          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Expand Button when collapsed */}
        {isCompact && (
          <div className="px-2 pt-3 flex justify-center">
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              title="Expand sidebar"
              className="h-9 w-9 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Semester Switcher */}
        {semesters.length > 0 && !isCompact && (
          <div className="px-3 pt-4">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1 mb-1.5">
              Semester
            </label>
            <select
              aria-label="Select semester"
              value={activeSemesterId ?? ""}
              onChange={(e) => {
                handleSemesterChange(e.target.value);
                if (isMobile) setMobileOpen(false);
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-rose-400 cursor-pointer"
            >
              {semesters.map((sem) => (
                <option key={sem.id} value={sem.id}>
                  {sem.name}
                  {sem.is_active
                    ? " (Active)"
                    : sem.is_archived
                      ? " (Archived)"
                      : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Vertical Navigation */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5">
          <div className="space-y-1">
            {!isCompact && (
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2.5 mb-1.5">
                Views
              </div>
            )}
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={buildHref(item.href)}
                  title={isCompact ? item.label : undefined}
                  onClick={() => isMobile && setMobileOpen(false)}
                  className={`flex items-center gap-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isCompact
                      ? "justify-center h-10 w-10 mx-auto"
                      : "px-3 py-2.5"
                  } ${
                    isActive
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!isCompact && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>

          {/* Associated Circles & Organizations */}
          {associatedGroups.length > 0 && (
            <div className="space-y-1 pt-3 border-t border-slate-200/70 dark:border-slate-800/80">
              {!isCompact && (
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2.5 mb-1.5">
                  {profile.role === "admin" ? "Groups" : "My Groups"}
                </div>
              )}

              {associatedGroups.map((group) => {
                const groupHref = `/groups/${group.id}`;
                const isSelected = pathname === groupHref;
                const Icon =
                  group.type === "organization" ? Building2 : Users;
                return (
                  <Link
                    key={group.id}
                    href={buildHref(groupHref)}
                    title={
                      isCompact
                        ? `${group.name} (${group.type})`
                        : group.description ?? group.name
                    }
                    onClick={() => isMobile && setMobileOpen(false)}
                    className={`w-full flex items-center gap-2.5 rounded-xl text-xs font-medium transition-colors ${
                      isCompact
                        ? "justify-center h-9 w-9 mx-auto"
                        : "px-3 py-2 text-left"
                    } ${
                      isSelected
                        ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-200 font-semibold border border-rose-200/80 dark:border-rose-900/70"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon
                      className={`h-3.5 w-3.5 shrink-0 ${
                        group.type === "organization"
                          ? "text-sky-500"
                          : "text-rose-500"
                      }`}
                    />
                    {!isCompact && (
                      <>
                        <span className="truncate flex-1">{group.name}</span>
                        <span className="text-[10px] opacity-65 shrink-0">
                          {group.memberIds.length}
                        </span>
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* Footer: Profile + Theme + Password + Sign Out */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5">
          {!isCompact && (
            <div className="px-1.5 leading-tight">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                <span className="truncate">{profile.display_name}</span>
                {profile.role === "admin" && (
                  <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                    Admin
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {profile.email}
              </div>
            </div>
          )}

          <div
            className={`flex items-center gap-1.5 ${
              isCompact ? "flex-col" : "justify-between"
            }`}
          >
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
              className={`h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer ${
                isCompact ? "w-9" : "flex-1"
              }`}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <Link
              href="/change-password"
              title="Change password"
              onClick={() => isMobile && setMobileOpen(false)}
              className={`h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                isCompact ? "w-9" : "flex-1"
              }`}
            >
              <KeyRound className="h-4 w-4" />
            </Link>

            <form action={logoutAction} className={isCompact ? "" : "flex-1"}>
              <button
                type="submit"
                title="Sign out"
                className={`h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60 dark:hover:text-rose-300 transition cursor-pointer ${
                  isCompact ? "w-9" : "w-full"
                }`}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Desktop Left Sidebar */}
      <aside
        className={`hidden md:block shrink-0 sticky top-0 h-screen border-r border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 transition-[width] duration-200 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {renderSidebarContent(false)}
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
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 px-4 sm:px-6 py-5">{children}</main>
    </div>
  );
}
