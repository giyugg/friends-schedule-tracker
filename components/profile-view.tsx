"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  Building2,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Coffee,
  Database,
  GraduationCap,
  KeyRound,
  Layers,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Moon,
  Pencil,
  Radio,
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
import { getSectionAcademicInfo } from "@/lib/academic-catalog";
import {
  DAYS,
  formatCompactDuration,
  formatTime12h,
  getLiveSectionStatus,
  getManilaNow,
  timeToMinutes,
} from "@/lib/schedule-utils";
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
  visibleProfiles: Profile[];
  visibleSections: SectionWithMembers[];
  visibleEntries: ScheduleEntry[];
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
  const { theme, toggleTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  const [manilaNow, setManilaNow] = useState(() => getManilaNow());
  const [freeFilter, setFreeFilter] = useState<string>("all");

  useEffect(() => {
    const id = setInterval(() => setManilaNow(getManilaNow()), 60_000);
    return () => clearInterval(id);
  }, []);

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
    });
  };

  const sectionMates = useMemo(() => {
    if (!userSection) return [];
    return userSection.members.filter((m) => m.id !== profile.id);
  }, [userSection, profile.id]);

  // --- Live Class Status & Today's Classes (Manila Time) ---
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

  const myLiveStatus = useMemo(() => {
    if (myAllSections.length === 0) return null;
    return getLiveSectionStatus(myAllEntries, manilaNow);
  }, [myAllSections.length, myAllEntries, manilaNow]);

  const todaysClasses = useMemo(() => {
    if (manilaNow.dayOfWeek === 0) return [];
    const nowMins = manilaNow.minutesFromMidnight;
    return myAllEntries
      .filter((e) => e.day_of_week === manilaNow.dayOfWeek)
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
      .map((entry) => {
        const start = timeToMinutes(entry.start_time);
        const end = timeToMinutes(entry.end_time);
        const phase: "done" | "now" | "upcoming" =
          nowMins >= end ? "done" : nowMins >= start ? "now" : "upcoming";
        return { entry, phase };
      });
  }, [myAllEntries, manilaNow]);

  const manilaDayLabel = useMemo(() => {
    if (manilaNow.dayOfWeek === 0) return "Sunday";
    return (
      DAYS.find((d) => d.value === manilaNow.dayOfWeek)?.label ?? "Today"
    );
  }, [manilaNow.dayOfWeek]);

  const manilaTimeLabel = useMemo(() => {
    const h = Math.floor(manilaNow.minutesFromMidnight / 60);
    const m = manilaNow.minutesFromMidnight % 60;
    return formatTime12h(
      `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    );
  }, [manilaNow.minutesFromMidnight]);

  // --- Visibility-Scoped "Who's Free Right Now" ---
  const mySectionIdSet = useMemo(
    () => new Set(myAllSections.map((s) => s.id)),
    [myAllSections]
  );

  const allFreeVisiblePeople = useMemo(() => {
    const items: {
      person: Profile;
      sectionCodes: string[];
      isClassmate: boolean;
      sharedGroupIds: string[];
      sharedGroupNames: string[];
      status: Exclude<ReturnType<typeof getLiveSectionStatus>, { state: "in_class" }>;
    }[] = [];

    for (const person of visibleProfiles) {
      if (person.id === profile.id) continue;
      const personSections = sectionsByUser.get(person.id) ?? [];
      if (personSections.length === 0) continue;

      const personEntries = personSections.flatMap(
        (sec) => entriesBySection.get(sec.id) ?? []
      );
      const status = getLiveSectionStatus(personEntries, manilaNow);

      // Strictly include ONLY people who are currently free
      if (status.state === "in_class") continue;

      const isClassmate = personSections.some((sec) =>
        mySectionIdSet.has(sec.id)
      );
      const sharedGroups = myGroups.filter((g) =>
        g.memberIds.includes(person.id)
      );

      items.push({
        person,
        sectionCodes: personSections.map((s) => s.code),
        isClassmate,
        sharedGroupIds: sharedGroups.map((g) => g.id),
        sharedGroupNames: sharedGroups.map((g) => g.name),
        status,
      });
    }

    // Sort: free all day / done / sunday first, then longest free window until next class, then A-Z
    items.sort((a, b) => {
      const rank = (
        st: Exclude<ReturnType<typeof getLiveSectionStatus>, { state: "in_class" }>
      ) => {
        if (st.state === "free" && st.minutesUntilNext !== null) {
          return st.minutesUntilNext;
        }
        return Number.MAX_SAFE_INTEGER;
      };
      const diff = rank(b.status) - rank(a.status);
      if (diff !== 0) return diff;
      return a.person.display_name.localeCompare(b.person.display_name);
    });

    return items;
  }, [
    visibleProfiles,
    profile.id,
    sectionsByUser,
    entriesBySection,
    manilaNow,
    mySectionIdSet,
    myGroups,
  ]);

  const filteredFreePeople = useMemo(() => {
    if (freeFilter === "all") return allFreeVisiblePeople;
    if (freeFilter === "section") {
      return allFreeVisiblePeople.filter((item) => item.isClassmate);
    }
    return allFreeVisiblePeople.filter((item) =>
      item.sharedGroupIds.includes(freeFilter)
    );
  }, [allFreeVisiblePeople, freeFilter]);

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
                {userSection &&
                  (() => {
                    const academic = getSectionAcademicInfo(userSection);
                    if (!academic.college) return null;
                    return (
                      <span
                        title={academic.college.name}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-900"
                      >
                        <GraduationCap className="h-3 w-3" />
                        {academic.college.code}
                      </span>
                    );
                  })()}
                {userSection && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300">
                    <Layers className="h-3 w-3" />
                    {userSection.code}
                  </span>
                )}
              </div>
              {userSection &&
                (() => {
                  const academic = getSectionAcademicInfo(userSection);
                  if (!academic.college && !academic.program) return null;
                  return (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {academic.college && (
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          {academic.college.name}
                        </span>
                      )}
                      {academic.college && academic.program && (
                        <span className="text-slate-400 dark:text-slate-500">
                          {" "}
                          —{" "}
                        </span>
                      )}
                      {academic.program && (
                        <span>
                          {academic.program.name}
                          {academic.specialization && (
                            <span className="text-slate-400 dark:text-slate-500">
                              {" "}
                              · {academic.specialization}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  );
                })()}
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

      {/* Live Status & Who's Free Right Now */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Live Class Status + Today's Classes */}
        <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Radio className="h-4 w-4 text-rose-500 animate-pulse" />
                My Class Status
              </h3>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {manilaDayLabel} · {manilaTimeLabel}
              </span>
            </div>

            {!myLiveStatus ? (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-4 text-xs text-slate-500 dark:text-slate-400">
                Assign your section for{" "}
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {activeSemester?.name ?? "this semester"}
                </span>{" "}
                to track your live class status.
              </div>
            ) : myLiveStatus.state === "in_class" ? (
              <div className="rounded-xl border border-rose-200/80 dark:border-rose-900/70 bg-rose-50/70 dark:bg-rose-950/30 p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    In Class Right Now
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">
                    {myLiveStatus.currentEntry.modality}
                  </span>
                </div>

                <div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    {myLiveStatus.currentEntry.course_code}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-rose-500" />
                      {formatTime12h(myLiveStatus.currentEntry.start_time)} –{" "}
                      {formatTime12h(myLiveStatus.currentEntry.end_time)}
                    </span>
                    {myLiveStatus.currentEntry.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-rose-500" />
                        {myLiveStatus.currentEntry.location}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-rose-200/70 dark:border-rose-900/60 text-xs font-medium text-rose-800 dark:text-rose-200">
                  Free in{" "}
                  <strong>
                    {formatCompactDuration(myLiveStatus.minutesUntilFree)}
                  </strong>{" "}
                  (at {formatTime12h(myLiveStatus.freeAtTime)})
                  {myLiveStatus.hasBackToBack && (
                    <span className="ml-1.5 text-[11px] opacity-80">
                      · includes back-to-back class
                    </span>
                  )}
                </div>
              </div>
            ) : myLiveStatus.state === "free" ? (
              <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-900/70 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white">
                    <Coffee className="h-3 w-3" />
                    Free Right Now
                  </span>
                  {myLiveStatus.minutesUntilNext !== null && (
                    <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                      Next class in{" "}
                      {formatCompactDuration(myLiveStatus.minutesUntilNext)}
                    </span>
                  )}
                </div>

                {myLiveStatus.nextEntry ? (
                  <div className="space-y-0.5">
                    <div className="text-xs font-medium text-emerald-800/80 dark:text-emerald-300/80">
                      Up next:
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                      <span>{myLiveStatus.nextEntry.course_code}</span>
                      <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 border border-emerald-200/70 dark:border-emerald-900">
                        {myLiveStatus.nextEntry.modality}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>
                        {formatTime12h(myLiveStatus.nextEntry.start_time)} –{" "}
                        {formatTime12h(myLiveStatus.nextEntry.end_time)}
                      </span>
                      {myLiveStatus.nextEntry.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {myLiveStatus.nextEntry.location}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-800 dark:text-emerald-200">
                    No classes scheduled for {manilaDayLabel}. Enjoy your free
                    day!
                  </p>
                )}
              </div>
            ) : myLiveStatus.state === "done" ? (
              <div className="rounded-xl border border-sky-200/80 dark:border-sky-900/70 bg-sky-50/70 dark:bg-sky-950/30 p-4 space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-600 text-white">
                  <CalendarCheck2 className="h-3 w-3" />
                  Done for Today
                </div>
                <p className="text-xs text-sky-900/90 dark:text-sky-200 pt-1">
                  All your {manilaDayLabel} classes have finished. You&apos;re
                  free for the rest of the day!
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900">
                  <Coffee className="h-3 w-3" />
                  Weekend (Sunday)
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 pt-1">
                  No regular classes on Sundays. Recharge for the week ahead!
                </p>
              </div>
            )}

            {/* Compact Today's Classes List */}
            {todaysClasses.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Today&apos;s Classes ({todaysClasses.length})
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {todaysClasses.map(({ entry, phase }) => (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between gap-2.5 rounded-xl border px-3 py-2 text-xs ${
                        phase === "now"
                          ? "border-rose-300 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/40"
                          : phase === "done"
                            ? "border-slate-200/60 dark:border-slate-800/70 bg-slate-50/60 dark:bg-slate-950/30 opacity-65"
                            : "border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/40"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {entry.course_code}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {formatTime12h(entry.start_time)} –{" "}
                          {formatTime12h(entry.end_time)}
                          {entry.location ? ` · ${entry.location}` : ""}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          phase === "now"
                            ? "bg-rose-600 text-white"
                            : phase === "done"
                              ? "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              : "bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300"
                        }`}
                      >
                        {phase === "now"
                          ? "Now"
                          : phase === "done"
                            ? "Done"
                            : "Up next"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs font-semibold">
            <Link
              href={buildHref("/daily")}
              className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:underline"
            >
              Open Full Daily Grid
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        {/* Who's Free Right Now (Visibility-Scoped, Free Only) */}
        <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Coffee className="h-4 w-4 text-emerald-500" />
                Who&apos;s Free Right Now
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                {filteredFreePeople.length} free
              </span>
            </div>

            {myLiveStatus?.state === "in_class" && (
              <div className="rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 px-3 py-2 text-[11px] text-amber-800 dark:text-amber-200">
                You&apos;re in class right now — you&apos;ll be free at{" "}
                <strong>{formatTime12h(myLiveStatus.freeAtTime)}</strong> (in{" "}
                {formatCompactDuration(myLiveStatus.minutesUntilFree)}).
              </div>
            )}

            {/* Quick Filter Pills */}
            {(sectionMates.length > 0 || myGroups.length > 0) && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                <button
                  type="button"
                  onClick={() => setFreeFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                    freeFilter === "all"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700"
                  }`}
                >
                  All ({allFreeVisiblePeople.length})
                </button>

                {sectionMates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFreeFilter("section")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                      freeFilter === "section"
                        ? "bg-sky-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700"
                    }`}
                  >
                    My Section
                  </button>
                )}

                {myGroups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setFreeFilter(group.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                      freeFilter === group.id
                        ? group.type === "organization"
                          ? "bg-sky-600 text-white"
                          : "bg-rose-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700"
                    }`}
                  >
                    {group.name}
                  </button>
                ))}
              </div>
            )}

            {/* Free-Only People List */}
            {filteredFreePeople.length > 0 ? (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredFreePeople.map((item) => {
                  const freeLabel =
                    item.status.state === "sunday"
                      ? "Sunday"
                      : item.status.state === "done"
                        ? "Done for today"
                        : item.status.nextEntry &&
                            item.status.minutesUntilNext !== null
                          ? `Free ${formatCompactDuration(
                              item.status.minutesUntilNext
                            )} · until ${formatTime12h(
                              item.status.nextEntry.start_time
                            )}`
                          : "No classes today";

                  return (
                    <div
                      key={item.person.id}
                      className="flex items-center justify-between gap-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 shrink-0 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 flex items-center justify-center text-[11px] font-bold">
                          {getInitials(item.person.display_name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {item.person.display_name}
                            </span>
                            {item.sectionCodes.map((code) => (
                              <span
                                key={code}
                                className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                              >
                                {code}
                              </span>
                            ))}
                            {item.isClassmate && (
                              <span className="px-1.5 py-0.5 rounded bg-sky-100/80 dark:bg-sky-950/70 text-[10px] font-semibold text-sky-700 dark:text-sky-300">
                                Classmate
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium truncate">
                            {freeLabel}
                          </div>
                        </div>
                      </div>

                      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-5 text-center text-xs text-slate-500 dark:text-slate-400">
                Nobody in this view is free right now — everyone visible is
                currently in class (or unassigned to a section).
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
            <Link
              href={buildHref("/free-time")}
              className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Find Common Free Time
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <span className="text-[11px] text-slate-400">
              Showing only people you can view
            </span>
          </div>
        </section>
      </div>

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
                <div className="flex items-center gap-1.5">
                  {(() => {
                    const academic = getSectionAcademicInfo(userSection);
                    if (!academic.college) return null;
                    return (
                      <span
                        title={academic.college.name}
                        className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold border border-indigo-200/70 dark:border-indigo-900/60"
                      >
                        {academic.college.code}
                      </span>
                    );
                  })()}
                  <span className="px-2.5 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-semibold border border-sky-200/70 dark:border-sky-900/60">
                    {userSection.code}
                  </span>
                </div>
              )}
            </div>
            {userSection &&
              (() => {
                const academic = getSectionAcademicInfo(userSection);
                if (!academic.college && !academic.program) return null;
                return (
                  <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
                    {academic.college && (
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {academic.college.name}
                      </span>
                    )}
                    {academic.college && academic.program && " — "}
                    {academic.program && (
                      <>
                        {academic.program.name}
                        {academic.specialization
                          ? ` · ${academic.specialization}`
                          : ""}
                      </>
                    )}
                  </p>
                );
              })()}

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
                      {formatGwa(latinEval.cumulativeStats.roundedGwa, 2)}
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
