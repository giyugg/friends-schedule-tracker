"use client";

import Link, { useLinkStatus } from "next/link";
import {
  BookOpen,
  Building2,
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  Clock,
  GraduationCap,
  KeyRound,
  Layers,
  LayoutGrid,
  Loader2,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  Sun,
  User,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import {
  ADMIN_TAB_LABELS,
  type AdminTab,
  type Profile,
  type Semester,
  type VisibilityGroupWithMembers,
} from "@/lib/types";

const ADMIN_TAB_ITEMS: {
  id: AdminTab;
  label: string;
  icon: typeof BookOpen;
}[] = [
  { id: "schedules", label: ADMIN_TAB_LABELS.schedules, icon: BookOpen },
  { id: "sections", label: ADMIN_TAB_LABELS.sections, icon: Layers },
  { id: "directory", label: ADMIN_TAB_LABELS.directory, icon: Building2 },
  { id: "accounts", label: ADMIN_TAB_LABELS.accounts, icon: Users },
  { id: "requests", label: ADMIN_TAB_LABELS.requests, icon: UserCheck },
  { id: "semesters", label: ADMIN_TAB_LABELS.semesters, icon: CalendarPlus },
];

const NAV_ITEMS = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/daily", label: "Daily Grid", icon: LayoutGrid },
  { href: "/weekly", label: "Section Weekly", icon: CalendarDays },
  { href: "/free-time", label: "Free Time", icon: Clock },
  { href: "/grades", label: "Grades", icon: GraduationCap },
];

function NavLinkPendingIndicator() {
  const { pending } = useLinkStatus();
  return (
    <Loader2
      aria-hidden
      className={`h-3.5 w-3.5 shrink-0 animate-spin transition-opacity duration-150 ${
        pending ? "opacity-75" : "opacity-0"
      }`}
    />
  );
}

interface SidebarContentProps {
  isMobile?: boolean;
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  onCloseMobile: () => void;
  pathname: string;
  profile: Profile;
  semesters: Semester[];
  resolvedSemesterId: string | null;
  isSemesterPending: boolean;
  onSemesterChange: (semesterId: string) => void;
  associatedGroups: VisibilityGroupWithMembers[];
  isOnAdmin: boolean;
  adminOpen: boolean;
  onToggleAdmin: () => void;
  onOpenAdminFromCompact: () => void;
  activeAdminTab: AdminTab;
  pendingProfileRequestsCount: number;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  buildHref: (path: string) => string;
  buildAdminTabHref: (tabId: AdminTab) => string;
}

export function SidebarContent({
  isMobile = false,
  collapsed,
  onCollapse,
  onCloseMobile,
  pathname,
  profile,
  semesters,
  resolvedSemesterId,
  isSemesterPending,
  onSemesterChange,
  associatedGroups,
  isOnAdmin,
  adminOpen,
  onToggleAdmin,
  onOpenAdminFromCompact,
  activeAdminTab,
  pendingProfileRequestsCount,
  theme,
  onToggleTheme,
  buildHref,
  buildAdminTabHref,
}: SidebarContentProps) {
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
          onClick={() => isMobile && onCloseMobile()}
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
            onClick={() => onCollapse(true)}
            title="Collapse sidebar"
            className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}

        {isMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
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
            onClick={() => onCollapse(false)}
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
          <label className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1 mb-1.5">
            <span>Semester</span>
            {isSemesterPending && (
              <Loader2 className="h-3 w-3 animate-spin text-rose-500" />
            )}
          </label>
          <select
            aria-label="Select semester"
            value={resolvedSemesterId ?? ""}
            disabled={isSemesterPending}
            onChange={(e) => {
              onSemesterChange(e.target.value);
              if (isMobile) onCloseMobile();
            }}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-rose-400 cursor-pointer disabled:opacity-60 transition-opacity"
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
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={buildHref(item.href)}
                title={isCompact ? item.label : undefined}
                onClick={() => isMobile && onCloseMobile()}
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
                {!isCompact && (
                  <>
                    <span className="truncate flex-1">{item.label}</span>
                    <NavLinkPendingIndicator />
                  </>
                )}
              </Link>
            );
          })}

          {/* Admin Expandable Dropdown */}
          {profile.role === "admin" && (
            <div className="space-y-1">
              <button
                type="button"
                aria-expanded={!isCompact && adminOpen}
                title={isCompact ? "Admin" : undefined}
                onClick={() => {
                  if (isCompact) {
                    onOpenAdminFromCompact();
                  } else {
                    onToggleAdmin();
                  }
                }}
                className={`relative flex items-center gap-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  isCompact
                    ? "justify-center h-10 w-10 mx-auto"
                    : "w-full px-3 py-2.5 text-left"
                } ${
                  isOnAdmin && (isCompact || !adminOpen)
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs"
                    : isOnAdmin && adminOpen
                      ? "bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 font-semibold"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                }`}
              >
                <Shield className="h-4 w-4 shrink-0" />
                {isCompact && pendingProfileRequestsCount > 0 && (
                  <span
                    aria-label={`${pendingProfileRequestsCount} pending profile requests`}
                    className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-950"
                  />
                )}
                {!isCompact && (
                  <>
                    <span className="truncate flex-1">Admin</span>
                    {!adminOpen && pendingProfileRequestsCount > 0 && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none shrink-0 ${
                          isOnAdmin
                            ? "bg-rose-500 text-white"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {pendingProfileRequestsCount}
                      </span>
                    )}
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 opacity-70 transition-transform duration-150 ${
                        adminOpen ? "rotate-180" : ""
                      }`}
                    />
                  </>
                )}
              </button>

              {!isCompact && adminOpen && (
                <div className="pl-3 ml-3.5 border-l border-slate-200/80 dark:border-slate-800 space-y-0.5 py-0.5">
                  {ADMIN_TAB_ITEMS.map((subItem) => {
                    const SubIcon = subItem.icon;
                    const isSubActive =
                      isOnAdmin && activeAdminTab === subItem.id;
                    const badgeCount =
                      subItem.id === "requests"
                        ? pendingProfileRequestsCount
                        : 0;
                    return (
                      <Link
                        key={subItem.id}
                        href={buildAdminTabHref(subItem.id)}
                        onClick={() => isMobile && onCloseMobile()}
                        className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-colors ${
                          isSubActive
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-semibold shadow-xs"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                        }`}
                      >
                        <SubIcon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate flex-1">{subItem.label}</span>
                        <NavLinkPendingIndicator />
                        {badgeCount > 0 && (
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none shrink-0 ${
                              isSubActive
                                ? "bg-rose-500 text-white"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            }`}
                          >
                            {badgeCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
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
                  onClick={() => isMobile && onCloseMobile()}
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
                      <NavLinkPendingIndicator />
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
          <Link
            href={buildHref("/profile")}
            onClick={() => isMobile && onCloseMobile()}
            title="View your profile"
            className={`block rounded-xl px-2 py-1.5 leading-tight transition-colors ${
              pathname.startsWith("/profile")
                ? "bg-slate-100 dark:bg-slate-800/90"
                : "hover:bg-slate-100/80 dark:hover:bg-slate-800/60"
            }`}
          >
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
          </Link>
        )}

        <div
          className={`flex items-center gap-1.5 ${
            isCompact ? "flex-col" : "justify-between"
          }`}
        >
          <button
            type="button"
            onClick={onToggleTheme}
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
            onClick={() => isMobile && onCloseMobile()}
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
}
