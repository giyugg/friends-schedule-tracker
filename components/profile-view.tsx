"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Database,
  GraduationCap,
  KeyRound,
  Layers,
  Loader2,
  Lock,
  Mail,
  Moon,
  Pencil,
  Shield,
  Sun,
  Trophy,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";
import {
  cancelDisplayNameChangeRequestAction,
  requestDisplayNameChangeAction,
} from "@/app/actions/profile";
import { useTheme } from "./theme-provider";
import { timeToMinutes } from "@/lib/schedule-utils";
import {
  evaluateGoldGear,
  evaluateLatinHonors,
  formatGwa,
} from "@/lib/grades-utils";
import type {
  GradeTermWithEntries,
  Profile,
  ProfileChangeRequest,
  ScheduleEntry,
  SectionWithMembers,
  Semester,
  VisibilityGroupWithMembers,
} from "@/lib/types";

interface ProfileViewProps {
  profile: Profile;
  activeSemester: Semester | null;
  userSection: SectionWithMembers | null;
  sectionEntries: ScheduleEntry[];
  visibilityGroups: VisibilityGroupWithMembers[];
  gradeTerms: GradeTermWithEntries[];
  gradesMigrationRequired?: boolean;
  changeRequests: ProfileChangeRequest[];
  requestsMigrationRequired?: boolean;
}

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-PH", {
      dateStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatWeeklyHours(totalMinutes: number): string {
  const hours = totalMinutes / 60;
  if (Number.isInteger(hours)) return `${hours} hr${hours === 1 ? "" : "s"}`;
  return `${hours.toFixed(1)} hrs`;
}

export function ProfileView({
  profile,
  activeSemester,
  userSection,
  sectionEntries,
  visibilityGroups,
  gradeTerms,
  gradesMigrationRequired = false,
  changeRequests,
  requestsMigrationRequired = false,
}: ProfileViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.display_name);
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

  const circles = useMemo(
    () => myGroups.filter((g) => g.type === "circle"),
    [myGroups]
  );
  const organizations = useMemo(
    () => myGroups.filter((g) => g.type === "organization"),
    [myGroups]
  );

  // Schedule metrics for the user's section in the active semester
  const scheduleStats = useMemo(() => {
    let totalMinutes = 0;
    let ftfCount = 0;
    let onlineCount = 0;
    let hybridCount = 0;
    const uniqueCourses = new Set<string>();

    for (const entry of sectionEntries) {
      totalMinutes += Math.max(
        0,
        timeToMinutes(entry.end_time) - timeToMinutes(entry.start_time)
      );
      uniqueCourses.add(entry.course_code.trim().toUpperCase());
      if (entry.modality === "ftf") ftfCount += 1;
      else if (entry.modality === "online") onlineCount += 1;
      else hybridCount += 1;
    }

    return {
      totalMinutes,
      totalClasses: sectionEntries.length,
      uniqueCourseCount: uniqueCourses.size,
      ftfCount,
      onlineCount,
      hybridCount,
    };
  }, [sectionEntries]);

  // Private academic summary
  const latinEval = useMemo(() => evaluateLatinHonors(gradeTerms), [gradeTerms]);
  const goldGearEval = useMemo(() => evaluateGoldGear(gradeTerms), [gradeTerms]);

  // Display name change requests
  const pendingRequest = useMemo(
    () => changeRequests.find((r) => r.status === "pending") ?? null,
    [changeRequests]
  );
  const latestResolvedRequest = useMemo(
    () =>
      changeRequests.find(
        (r) => r.status === "approved" || r.status === "rejected"
      ) ?? null,
    [changeRequests]
  );

  const handleOpenEdit = () => {
    setFeedback(null);
    setNameInput(profile.display_name);
    setEditingName(true);
  };

  const handleSubmitNameChange = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await requestDisplayNameChangeAction(nameInput);
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: res.error ?? "Unable to submit display name change.",
        });
        return;
      }
      setEditingName(false);
      setFeedback({
        type: "success",
        text: res.message ?? "Display name change submitted.",
      });
      router.refresh();
    });
  };

  const handleCancelRequest = (requestId: string) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await cancelDisplayNameChangeRequestAction(requestId);
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: res.error ?? "Failed to cancel request.",
        });
        return;
      }
      setFeedback({
        type: "success",
        text: res.message ?? "Request cancelled.",
      });
      router.refresh();
    });
  };

  const sectionMates = useMemo(() => {
    if (!userSection) return [];
    return userSection.members.filter((m) => m.id !== profile.id);
  }, [userSection, profile.id]);

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
      <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-16 w-16 shrink-0 rounded-2xl bg-[#F19C99]/35 dark:bg-[#6E2C2A] border border-[#DF7A76]/50 flex items-center justify-center text-xl font-bold text-[#9E2A26] dark:text-[#FDE8E8] tracking-tight">
              {getInitials(profile.display_name)}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
                  {profile.display_name}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    profile.role === "admin"
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {profile.role === "admin" && <Shield className="h-3 w-3" />}
                  {profile.role === "admin" ? "Admin" : "Member"}
                </span>
                {userSection && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300">
                    <Layers className="h-3 w-3" />
                    {userSection.code}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5 truncate">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  Member since {formatDate(profile.created_at)}
                </span>
              </div>
            </div>
          </div>

          {!editingName && (
            <button
              type="button"
              onClick={handleOpenEdit}
              disabled={
                Boolean(pendingRequest) ||
                (requestsMigrationRequired && profile.role !== "admin")
              }
              title={
                pendingRequest
                  ? "Cancel your pending request first to submit a new one"
                  : "Edit display name"
              }
              className="inline-flex items-center justify-center gap-1.5 self-start sm:self-auto px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" />
              {profile.role === "admin"
                ? "Edit Display Name"
                : "Request Name Change"}
            </button>
          )}
        </div>

        {/* Inline Display Name Form */}
        {editingName && (
          <form
            onSubmit={handleSubmitNameChange}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="profile-display-name"
                className="text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                New Display Name
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {profile.role === "admin"
                  ? "Admin changes apply immediately"
                  : "Requires admin approval before taking effect"}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="profile-display-name"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                minLength={2}
                maxLength={80}
                required
                placeholder="Enter your display name"
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-rose-400"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition cursor-pointer"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {profile.role === "admin"
                    ? "Save Name"
                    : "Submit for Approval"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingName(false);
                    setNameInput(profile.display_name);
                  }}
                  disabled={isPending}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Pending Name Change Banner */}
        {pendingRequest && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200 dark:border-amber-900/70 bg-amber-50/70 dark:bg-amber-950/30 px-4 py-3">
            <div className="space-y-0.5 text-xs">
              <div className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                Display Name Change Pending Approval
              </div>
              <div className="text-amber-800/90 dark:text-amber-300/90 flex flex-wrap items-center gap-1.5">
                <span className="line-through opacity-75">
                  {pendingRequest.current_display_name}
                </span>
                <ArrowRight className="h-3 w-3 shrink-0" />
                <span className="font-semibold">
                  {pendingRequest.requested_display_name}
                </span>
                <span className="opacity-70">
                  · Submitted {formatDateTime(pendingRequest.created_at)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleCancelRequest(pendingRequest.id)}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-1 self-start sm:self-auto px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-xs font-semibold text-amber-800 dark:text-amber-200 hover:bg-amber-100/70 dark:hover:bg-amber-950/60 disabled:opacity-50 transition cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              Cancel Request
            </button>
          </div>
        )}

        {/* Most Recent Reviewed Request Status (when no pending request) */}
        {!pendingRequest && latestResolvedRequest && (
          <div
            className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs ${
              latestResolvedRequest.status === "approved"
                ? "border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/25 text-emerald-800 dark:text-emerald-200"
                : "border-rose-200/80 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/25 text-rose-800 dark:text-rose-200"
            }`}
          >
            {latestResolvedRequest.status === "approved" ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
            )}
            <div className="space-y-0.5">
              <div>
                <span className="font-semibold">
                  Last name request{" "}
                  {latestResolvedRequest.status === "approved"
                    ? "approved"
                    : "rejected"}
                </span>{" "}
                ({latestResolvedRequest.current_display_name} →{" "}
                {latestResolvedRequest.requested_display_name}) on{" "}
                {formatDateTime(
                  latestResolvedRequest.reviewed_at ??
                    latestResolvedRequest.updated_at
                )}
              </div>
              {latestResolvedRequest.review_note && (
                <div className="opacity-90">
                  Admin note: &ldquo;{latestResolvedRequest.review_note}&rdquo;
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schedule & Section Snapshot */}
        <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-sky-500" />
                Schedule &amp; Section Snapshot
              </h3>
              {userSection && (
                <span className="px-2.5 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-semibold border border-sky-200/70 dark:border-sky-900/60">
                  {userSection.code}
                </span>
              )}
            </div>

            {userSection ? (
              <>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 p-3">
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Weekly Hours
                    </div>
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {formatWeeklyHours(scheduleStats.totalMinutes)}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 p-3">
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Sessions
                    </div>
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {scheduleStats.totalClasses}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 p-3">
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Courses
                    </div>
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {scheduleStats.uniqueCourseCount}
                    </div>
                  </div>
                </div>

                {/* Modality Breakdown */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-medium">
                    FTF: {scheduleStats.ftfCount}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium">
                    Online: {scheduleStats.onlineCount}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-medium">
                    Hybrid: {scheduleStats.hybridCount}
                  </span>
                </div>

                {/* Section-mates */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Section-mates ({sectionMates.length})
                  </div>
                  {sectionMates.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {sectionMates.map((mate) => (
                        <span
                          key={mate.id}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200"
                        >
                          {mate.display_name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      You are the only member assigned to {userSection.code} in
                      this semester.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-4 text-xs text-slate-500 dark:text-slate-400">
                You are not assigned to a section for{" "}
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {activeSemester?.name ?? "the current semester"}
                </span>{" "}
                yet. Ask an admin to add you to your section roster.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-3 text-xs font-semibold">
            <Link
              href={buildHref("/weekly")}
              className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:underline"
            >
              Open Section Weekly
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Link
              href={buildHref("/daily")}
              className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:underline"
            >
              Daily Grid
            </Link>
          </div>
        </section>

        {/* Private Academic & Grades Summary */}
        <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-emerald-500" />
                Academic &amp; Grades Summary
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                <Lock className="h-3 w-3" />
                Private
              </span>
            </div>

            {gradesMigrationRequired ? (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-4 text-xs text-slate-500 dark:text-slate-400">
                Grades storage is not initialized yet. Open the Grades tab for
                setup details.
              </div>
            ) : gradeTerms.length > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 p-3">
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Cumulative GWA
                    </div>
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {formatGwa(latinEval.cumulativeStats.roundedGwa)}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 p-3">
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Academic Units
                    </div>
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {latinEval.cumulativeStats.academicUnits}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 p-3">
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Terms Logged
                    </div>
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {gradeTerms.length}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 px-3 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                      <Trophy className="h-3.5 w-3.5 text-amber-500" />
                      Latin Honor Standing
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {latinEval.standingLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 px-3 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                      <Award className="h-3.5 w-3.5 text-sky-500" />
                      Gold Gear Awards
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {goldGearEval.latestPair
                        ? goldGearEval.latestPair.awardLabel
                        : "Needs 2-Term Pair"}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-4 text-xs text-slate-500 dark:text-slate-400">
                No grades recorded yet. Your grades are completely private and
                only visible to you.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs font-semibold">
            <Link
              href={buildHref("/grades")}
              className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Manage Private Grades
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </div>

      {/* My Groups: Circles & Organizations */}
      <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="h-4 w-4 text-rose-500" />
            My Groups ({myGroups.length})
          </h3>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>{circles.length} Circle{circles.length === 1 ? "" : "s"}</span>
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
            <div className="text-slate-500 dark:text-slate-400">Account Role</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 capitalize mt-0.5">
              {profile.role}
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 p-3">
            <div className="text-slate-500 dark:text-slate-400">Member Since</div>
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
    </div>
  );
}
