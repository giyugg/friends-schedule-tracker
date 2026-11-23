"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  CalendarDays,
  Clock,
  KeyRound,
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  Shield,
  Sun,
  X,
} from "lucide-react";
import { useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import { useTheme } from "./theme-provider";
import type { Profile, Semester } from "@/lib/types";

interface AppNavProps {
  profile: Profile;
  semesters: Semester[];
  activeSemesterId: string | null;
}

export function AppNav({
  profile,
  semesters,
  activeSemesterId,
}: AppNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const semesterParam = searchParams.get("semester");
  const buildHref = (path: string) =>
    semesterParam ? `${path}?semester=${semesterParam}` : path;

  const navItems = [
    { href: "/", label: "Daily Grid", icon: LayoutGrid },
    { href: "/weekly", label: "Section Weekly", icon: CalendarDays },
    { href: "/free-time", label: "Free Time", icon: Clock },
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

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand + Nav */}
        <div className="flex items-center gap-6 min-w-0">
          <Link
            href={buildHref("/")}
            className="flex items-center gap-2.5 shrink-0"
          >
            <div className="h-9 w-9 rounded-xl bg-[#F19C99]/35 dark:bg-[#6E2C2A] border border-[#DF7A76]/50 flex items-center justify-center text-[#9E2A26] dark:text-[#FDE8E8]">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <span className="font-bold text-sm sm:text-base tracking-tight block">
                COF Schedules
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                College Schedule Tracker
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={buildHref(item.href)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Semester Switcher + Theme + Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {semesters.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5">
              <select
                aria-label="Select semester"
                value={activeSemesterId ?? ""}
                onChange={(e) => handleSemesterChange(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-rose-400 cursor-pointer max-w-[200px]"
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

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="text-right leading-tight">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-end gap-1.5">
                {profile.display_name}
                {profile.role === "admin" && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                    Admin
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {profile.email}
              </div>
            </div>

            <Link
              href="/change-password"
              title="Change password"
              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <KeyRound className="h-4 w-4" />
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                title="Sign out"
                className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60 dark:hover:text-rose-300 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="md:hidden h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer"
          >
            {mobileOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 space-y-3">
          {semesters.length > 0 && (
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-slate-400 shrink-0" />
              <select
                aria-label="Select semester"
                value={activeSemesterId ?? ""}
                onChange={(e) => {
                  handleSemesterChange(e.target.value);
                  setMobileOpen(false);
                }}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm font-medium"
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

          <nav className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={buildHref(item.href)}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium ${
                    isActive
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                      : "bg-slate-100/70 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">
                {profile.display_name}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {profile.email}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/change-password"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium flex items-center gap-1.5"
              >
                <KeyRound className="h-3.5 w-3.5" />
                Password
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
