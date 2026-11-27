"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  Building2,
  CalendarPlus,
  Layers,
  Shield,
  UserCheck,
  Users,
} from "lucide-react";
import type { ActionResult } from "@/app/actions/admin/types";
import {
  ADMIN_TAB_LABELS,
  isAdminTab,
  type AdminTab,
  type Profile,
  type ProfileChangeRequestWithUser,
  type ScheduleEntry,
  type SectionWithMembers,
  type Semester,
  type VisibilityGroupWithMembers,
} from "@/lib/types";
import { AccountsTab } from "./tabs/accounts-tab";
import { DirectoryTab } from "./tabs/directory-tab";
import { RequestsTab } from "./tabs/requests-tab";
import { SchedulesTab } from "./tabs/schedules-tab";
import { SectionsTab } from "./tabs/sections-tab";
import { SemestersTab } from "./tabs/semesters-tab";

const TAB_ICONS: Record<AdminTab, typeof BookOpen> = {
  schedules: BookOpen,
  sections: Layers,
  directory: Building2,
  accounts: Users,
  requests: UserCheck,
  semesters: CalendarPlus,
};

interface AdminDashboardProps {
  currentAdminId: string;
  semesters: Semester[];
  activeSemester: Semester | null;
  sections: SectionWithMembers[];
  entries: ScheduleEntry[];
  profiles: Profile[];
  visibilityGroups: VisibilityGroupWithMembers[];
  profileRequests: ProfileChangeRequestWithUser[];
  requestsMigrationRequired?: boolean;
  hasServiceRoleKey: boolean;
  initialTab?: AdminTab;
}

export function AdminDashboard({
  currentAdminId,
  semesters,
  activeSemester,
  sections,
  entries,
  profiles,
  visibilityGroups,
  profileRequests,
  requestsMigrationRequired = false,
  hasServiceRoleKey,
  initialTab,
}: AdminDashboardProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const sectionParam = searchParams.get("section");
  const semesterParam = searchParams.get("semester");
  const defaultTab: AdminTab =
    semesters.length === 0 ? "semesters" : "schedules";
  const tab: AdminTab = isAdminTab(tabParam)
    ? tabParam
    : (initialTab ?? defaultTab);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    tab: AdminTab;
    type: "success" | "error";
    text: string;
  } | null>(null);

  const runAction = (fn: () => Promise<ActionResult>) => {
    const actionTab = tab;
    setFeedback(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        setFeedback({
          tab: actionTab,
          type: "error",
          text: res.error ?? "Something went wrong.",
        });
      } else if (res.message) {
        setFeedback({ tab: actionTab, type: "success", text: res.message });
      }
    });
  };

  const ActiveTabIcon = TAB_ICONS[tab];
  const visibleFeedback = feedback && feedback.tab === tab ? feedback : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-6 w-6 text-rose-500" />
              Admin Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-950 text-xs font-semibold">
              <ActiveTabIcon className="h-3.5 w-3.5" />
              {ADMIN_TAB_LABELS[tab]}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage semesters, sections, class schedules, and accounts.
            {activeSemester && (
              <>
                {" "}
                Currently viewing:{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {activeSemester.name}
                </strong>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Feedback Banner */}
      {visibleFeedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            visibleFeedback.type === "error"
              ? "border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300"
              : "border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
          }`}
        >
          {visibleFeedback.text}
        </div>
      )}

      {tab === "schedules" && (
        <SchedulesTab
          key={`${activeSemester?.id ?? "none"}:${sectionParam ?? ""}`}
          activeSemester={activeSemester}
          sections={sections}
          entries={entries}
          initialSectionId={sectionParam ?? undefined}
          isPending={isPending}
          runAction={runAction}
        />
      )}

      {tab === "sections" && (
        <SectionsTab
          activeSemester={activeSemester}
          requestedSemesterParam={semesterParam ?? undefined}
          sections={sections}
          entries={entries}
          profiles={profiles}
          isPending={isPending}
          runAction={runAction}
        />
      )}

      {tab === "directory" && (
        <DirectoryTab
          profiles={profiles}
          sections={sections}
          visibilityGroups={visibilityGroups}
          isPending={isPending}
          runAction={runAction}
        />
      )}

      {tab === "accounts" && (
        <AccountsTab
          currentAdminId={currentAdminId}
          profiles={profiles}
          sections={sections}
          hasServiceRoleKey={hasServiceRoleKey}
          isPending={isPending}
          runAction={runAction}
        />
      )}

      {tab === "semesters" && (
        <SemestersTab
          semesters={semesters}
          isPending={isPending}
          runAction={runAction}
        />
      )}

      {tab === "requests" && (
        <RequestsTab
          profileRequests={profileRequests}
          requestsMigrationRequired={requestsMigrationRequired}
          isPending={isPending}
          runAction={runAction}
        />
      )}
    </div>
  );
}
