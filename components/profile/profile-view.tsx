"use client";

import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Database,
  User,
  X,
} from "lucide-react";
import type {
  GradeTermWithEntries,
  Profile,
  ProfileChangeRequest,
  ScheduleEntry,
  SectionWithMembers,
  Semester,
  VisibilityGroupWithMembers,
} from "@/lib/types";
import { AcademicSummaryCard } from "./academic-summary-card";
import { MyGroupsAndAccount } from "./my-groups-and-account";
import { ProfileHeroCard } from "./profile-hero-card";
import { ScheduleSnapshotCard } from "./schedule-snapshot-card";
import { TodayClassesCard } from "./today-classes-card";
import { WhosFreeCard } from "./whos-free-card";

interface ProfileViewProps {
  profile: Profile;
  activeSemester: Semester | null;
  userSection: SectionWithMembers | null;
  sectionEntries: ScheduleEntry[];
  visibleProfiles: Profile[];
  visibleSections: SectionWithMembers[];
  visibleEntries: ScheduleEntry[];
  visibilityGroups: VisibilityGroupWithMembers[];
  gradeTerms: GradeTermWithEntries[];
  gradesMigrationRequired?: boolean;
  changeRequests: ProfileChangeRequest[];
  requestsMigrationRequired?: boolean;
}

export function ProfileView({
  profile,
  activeSemester,
  userSection,
  sectionEntries,
  visibleProfiles,
  visibleSections,
  visibleEntries,
  visibilityGroups,
  gradeTerms,
  gradesMigrationRequired = false,
  changeRequests,
  requestsMigrationRequired = false,
}: ProfileViewProps) {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const semesterParam = searchParams.get("semester");
  const buildHref = (path: string) => {
    if (!semesterParam) return path;
    const params = new URLSearchParams();
    params.set("semester", semesterParam);
    return `${path}?${params.toString()}`;
  };

  // Groups this user actually belongs to
  const myGroups = useMemo(
    () => visibilityGroups.filter((g) => g.memberIds.includes(profile.id)),
    [visibilityGroups, profile.id]
  );

  const sectionMates = useMemo(() => {
    if (!userSection) return [];
    return userSection.members.filter((m) => m.id !== profile.id);
  }, [userSection, profile.id]);

  const entriesBySection = useMemo(() => {
    const map = new Map<string, ScheduleEntry[]>();
    for (const entry of visibleEntries) {
      const list = map.get(entry.section_id) ?? [];
      list.push(entry);
      map.set(entry.section_id, list);
    }
    return map;
  }, [visibleEntries]);

  const sectionsByUser = useMemo(() => {
    const map = new Map<string, SectionWithMembers[]>();
    for (const sec of visibleSections) {
      for (const m of sec.members) {
        const list = map.get(m.id) ?? [];
        list.push(sec);
        map.set(m.id, list);
      }
    }
    return map;
  }, [visibleSections]);

  const myAllSections = useMemo(
    () => sectionsByUser.get(profile.id) ?? (userSection ? [userSection] : []),
    [sectionsByUser, profile.id, userSection]
  );

  const myAllEntries = useMemo(() => {
    if (myAllSections.length === 0) return sectionEntries;
    return myAllSections.flatMap((sec) => entriesBySection.get(sec.id) ?? []);
  }, [myAllSections, entriesBySection, sectionEntries]);

  const mySectionIdSet = useMemo(
    () => new Set(myAllSections.map((s) => s.id)),
    [myAllSections]
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <User className="h-6 w-6 text-rose-500" />
            My Profile
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your account details, current section, groups, and private academic
            snapshot.
          </p>
        </div>
        {activeSemester && (
          <div className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-600 dark:text-slate-300">
            <CalendarDays className="h-3.5 w-3.5 text-rose-500" />
            <span>{activeSemester.name}</span>
          </div>
        )}
      </div>

      {/* Action Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 dark:border-emerald-900/70 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200"
              : "border-rose-200 dark:border-rose-900/70 bg-rose-50/80 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Dismiss notification"
            className="opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Migration Notice (only if migration 005 has not been run) */}
      {requestsMigrationRequired && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 dark:border-amber-900/70 bg-amber-50/80 dark:bg-amber-950/30 px-4 py-3 text-xs text-amber-800 dark:text-amber-200">
          <Database className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold">
              Display name approval workflow needs database setup:
            </span>{" "}
            Run{" "}
            <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 font-mono">
              supabase/migrations/005_profile_change_requests.sql
            </code>{" "}
            in Supabase SQL Editor to enable member name change requests.
          </div>
        </div>
      )}

      {/* Hero Profile Card */}
      <ProfileHeroCard
        profile={profile}
        userSection={userSection}
        changeRequests={changeRequests}
        requestsMigrationRequired={requestsMigrationRequired}
        isPending={isPending}
        startTransition={startTransition}
        onFeedback={setFeedback}
      />

      {/* Live Status & Who's Free Right Now */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodayClassesCard
          activeSemester={activeSemester}
          hasAssignedSection={myAllSections.length > 0}
          myAllEntries={myAllEntries}
          buildHref={buildHref}
        />

        <WhosFreeCard
          currentUserId={profile.id}
          hasAssignedSection={myAllSections.length > 0}
          myAllEntries={myAllEntries}
          mySectionIdSet={mySectionIdSet}
          hasSectionMates={sectionMates.length > 0}
          myGroups={myGroups}
          visibleProfiles={visibleProfiles}
          sectionsByUser={sectionsByUser}
          entriesBySection={entriesBySection}
          buildHref={buildHref}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScheduleSnapshotCard
          activeSemester={activeSemester}
          userSection={userSection}
          sectionEntries={sectionEntries}
          sectionMates={sectionMates}
          buildHref={buildHref}
        />

        <AcademicSummaryCard
          gradeTerms={gradeTerms}
          gradesMigrationRequired={gradesMigrationRequired}
          buildHref={buildHref}
        />
      </div>

      {/* My Groups + Account Details */}
      <MyGroupsAndAccount
        profile={profile}
        myGroups={myGroups}
        buildHref={buildHref}
      />
    </div>
  );
}
