"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Building2, KeyRound, Moon, Shield, Sun, Users } from "lucide-react";
import { useTheme } from "@/components/layout/theme-provider";
import type { Profile, VisibilityGroupWithMembers } from "@/lib/types";
import { formatDate } from "./profile-helpers";

interface MyGroupsAndAccountProps {
  profile: Profile;
  myGroups: VisibilityGroupWithMembers[];
  buildHref: (path: string) => string;
}

export function MyGroupsAndAccount({
  profile,
  myGroups,
  buildHref,
}: MyGroupsAndAccountProps) {
  const { theme, toggleTheme } = useTheme();

  const circles = useMemo(
    () => myGroups.filter((g) => g.type === "circle"),
    [myGroups]
  );
  const organizations = useMemo(
    () => myGroups.filter((g) => g.type === "organization"),
    [myGroups]
  );

  return (
    <>
      {/* My Groups: Circles & Organizations */}
      <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="h-4 w-4 text-rose-500" />
            My Groups ({myGroups.length})
          </h3>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              {circles.length} Circle{circles.length === 1 ? "" : "s"}
            </span>
            <span>•</span>
            <span>
              {organizations.length} Organization
              {organizations.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {myGroups.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {myGroups.map((group) => {
              const isOrg = group.type === "organization";
              const orgRole = isOrg ? group.memberRoles[profile.id] : null;
              const Icon = isOrg ? Building2 : Users;

              return (
                <Link
                  key={group.id}
                  href={buildHref(`/groups/${group.id}`)}
                  className="group rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-3.5 hover:border-rose-300 dark:hover:border-rose-800/80 hover:bg-white dark:hover:bg-slate-900 transition flex flex-col justify-between gap-2.5"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`h-7 w-7 shrink-0 rounded-lg flex items-center justify-center ${
                            isOrg
                              ? "bg-sky-100 text-sky-600 dark:bg-sky-950/80 dark:text-sky-300"
                              : "bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-300"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition">
                          {group.name}
                        </span>
                      </div>
                      <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {group.memberIds.length}
                      </span>
                    </div>

                    {group.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {group.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider ${
                        isOrg
                          ? "text-sky-600 dark:text-sky-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isOrg ? "Organization" : "Circle"}
                    </span>
                    {orgRole && (
                      <span className="px-2 py-0.5 rounded-md bg-sky-100/80 dark:bg-sky-950/70 text-sky-800 dark:text-sky-200 text-[10px] font-semibold">
                        {orgRole}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-4 text-xs text-slate-500 dark:text-slate-400">
            You are not a member of any circle of friends or organization yet.
          </div>
        )}
      </section>

      {/* Account Details & Quick Actions */}
      <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Shield className="h-4 w-4 text-slate-500" />
          Account Details &amp; Quick Actions
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 p-3">
            <div className="text-slate-500 dark:text-slate-400">Email</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 truncate mt-0.5">
              {profile.email}
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 p-3">
            <div className="text-slate-500 dark:text-slate-400">
              Account Role
            </div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 capitalize mt-0.5">
              {profile.role}
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 p-3">
            <div className="text-slate-500 dark:text-slate-400">
              Member Since
            </div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
              {formatDate(profile.created_at)}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <Link
            href="/change-password"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Change Password
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            {theme === "dark" ? (
              <>
                <Sun className="h-3.5 w-3.5" />
                Switch to Light Mode
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5" />
                Switch to Dark Mode
              </>
            )}
          </button>

          {profile.role === "admin" && (
            <Link
              href={buildHref("/admin")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/70 bg-rose-50/70 dark:bg-rose-950/40 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100/70 dark:hover:bg-rose-950/70 transition"
            >
              <Shield className="h-3.5 w-3.5" />
              Open Admin Dashboard
            </Link>
          )}
        </div>
      </section>
    </>
  );
}
