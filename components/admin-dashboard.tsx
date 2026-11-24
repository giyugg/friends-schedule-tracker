"use client";

import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  Archive,
  ArrowRight,
  BookOpen,
  Building2,
  CalendarPlus,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Database,
  Eye,
  KeyRound,
  Layers,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import {
  createFriendAccountAction,
  createSectionAction,
  createSemesterAction,
  createVisibilityGroupAction,
  deleteFriendAccountAction,
  deleteScheduleEntryAction,
  deleteSectionAction,
  deleteSemesterAction,
  deleteVisibilityGroupAction,
  resetFriendPasswordAction,
  reviewProfileChangeRequestAction,
  saveScheduleEntryAction,
  setActiveSemesterAction,
  toggleArchiveSemesterAction,
  toggleSectionMemberAction,
  toggleVisibilityGroupMemberAction,
  updateFriendProfileAction,
  updateOrganizationMemberRoleAction,
  updateSectionAction,
  updateVisibilityGroupAction,
} from "@/app/actions/admin";
import {
  COLOR_PRESETS,
  DAYS,
  formatMemberNames,
  formatTime12h,
  getEntryColorClasses,
  normalizeTime,
  resolveColorKey,
  TIME_OPTIONS,
} from "@/lib/schedule-utils";
import {
  COLLEGES,
  composeSectionCode,
  getProgramEntryByCode,
  getProgramsByCollege,
  getSectionAcademicInfo,
} from "@/lib/academic-catalog";
import {
  ADMIN_TAB_LABELS,
  isAdminTab,
  type AdminTab,
  type ColorKey,
  type DayOfWeek,
  type Profile,
  type ProfileChangeRequestWithUser,
  type ScheduleCategory,
  type ScheduleEntry,
  type ScheduleModality,
  type SectionWithMembers,
  type Semester,
  type UserRole,
  type VisibilityGroupType,
  type VisibilityGroupWithMembers,
} from "@/lib/types";

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

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "COF-";
  for (let i = 0; i < 8; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
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

  const runAction = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => {
    const actionTab = tab;
    setFeedback(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        setFeedback({ tab: actionTab, type: "error", text: res.error ?? "Something went wrong." });
      } else if (res.message) {
        setFeedback({ tab: actionTab, type: "success", text: res.message });
      }
    });
  };

  // --- Schedules Tab State ---
  const [schedSectionId, setSchedSectionId] = useState(sections[0]?.id ?? "");
  const [schedDay, setSchedDay] = useState<DayOfWeek>(1);
  const [editingEntryId, setEditingEntryId] = useState<string | undefined>();
  const [courseCode, setCourseCode] = useState("");
  const [instructor, setInstructor] = useState("");
  const [location, setLocation] = useState("ONLINE CLASS");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("09:00");
  const [category, setCategory] = useState<ScheduleCategory>("major");
  const [modality, setModality] = useState<ScheduleModality>("online");
  const [colorOverride, setColorOverride] = useState<ColorKey | "">("");

  const handleModalityChange = (next: ScheduleModality) => {
    setModality(next);
    if (next === "online") {
      setLocation("ONLINE CLASS");
    } else if (location.trim().toUpperCase() === "ONLINE CLASS") {
      setLocation("");
    }
  };

  const handleCourseCodeChange = (next: string) => {
    setCourseCode(next);
    const normalized = next.trim().toUpperCase();
    if (!normalized) return;
    if (normalized.startsWith("INTERN")) {
      setCategory("internship");
    } else if (normalized.startsWith("I") || normalized.startsWith("C")) {
      setCategory("major");
    } else {
      setCategory("minor");
    }
  };

  const activeSchedSectionId =
    sections.some((s) => s.id === schedSectionId)
      ? schedSectionId
      : sections[0]?.id ?? "";

  const filteredEntries = useMemo(
    () =>
      entries
        .filter(
          (e) =>
            e.section_id === activeSchedSectionId && e.day_of_week === schedDay
        )
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [entries, activeSchedSectionId, schedDay]
  );

  const resetScheduleForm = () => {
    setEditingEntryId(undefined);
    setCourseCode("");
    setInstructor("");
    setLocation("ONLINE CLASS");
    setStartTime("07:00");
    setEndTime("09:00");
    setCategory("major");
    setModality("online");
    setColorOverride("");
  };

  const loadEntryForEdit = (entry: ScheduleEntry) => {
    setEditingEntryId(entry.id);
    setSchedSectionId(entry.section_id);
    setSchedDay(entry.day_of_week);
    setCourseCode(entry.course_code);
    setInstructor(entry.instructor ?? "");
    setLocation(
      entry.modality === "online" ? "ONLINE CLASS" : (entry.location ?? "")
    );
    setStartTime(normalizeTime(entry.start_time));
    setEndTime(normalizeTime(entry.end_time));
    setCategory(entry.category);
    setModality(entry.modality);
    setColorOverride(entry.color_override ?? "");
  };

  const previewColorKey = resolveColorKey(
    category,
    modality,
    colorOverride || null
  );

  // --- Sections Tab State ---
  const [newCollegeCode, setNewCollegeCode] = useState("");
  const [newProgramCode, setNewProgramCode] = useState("");
  const [newSectionName, setNewSectionName] = useState("");
  const [newSpecialization, setNewSpecialization] = useState("");
  const [sectionCollegeFilter, setSectionCollegeFilter] = useState<string>("all");
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editCollegeCode, setEditCollegeCode] = useState("");
  const [editProgramCode, setEditProgramCode] = useState("");
  const [editSectionName, setEditSectionName] = useState("");
  const [editSpecialization, setEditSpecialization] = useState("");

  const newPrograms = useMemo(
    () => getProgramsByCollege(newCollegeCode),
    [newCollegeCode]
  );
  const newProgramEntry = useMemo(
    () => getProgramEntryByCode(newProgramCode),
    [newProgramCode]
  );
  const newSectionPreview = useMemo(() => {
    if (!newProgramCode || !newSectionName.trim()) return "";
    return composeSectionCode(newProgramCode, newSectionName, newSpecialization);
  }, [newProgramCode, newSectionName, newSpecialization]);

  const editPrograms = useMemo(
    () => getProgramsByCollege(editCollegeCode),
    [editCollegeCode]
  );
  const editProgramEntry = useMemo(
    () => getProgramEntryByCode(editProgramCode),
    [editProgramCode]
  );
  const editSectionPreview = useMemo(() => {
    if (!editProgramCode || !editSectionName.trim()) return "";
    return composeSectionCode(
      editProgramCode,
      editSectionName,
      editSpecialization
    );
  }, [editProgramCode, editSectionName, editSpecialization]);

  const sectionCollegeOptions = useMemo(() => {
    const presentCodes = new Set<string>();
    let unassignedCount = 0;
    for (const sec of sections) {
      const info = getSectionAcademicInfo(sec);
      if (info.college) {
        presentCodes.add(info.college.code);
      } else {
        unassignedCount++;
      }
    }
    const colleges = COLLEGES.filter((c) => presentCodes.has(c.code));
    return { colleges, unassignedCount };
  }, [sections]);

  const filteredSections = useMemo(() => {
    if (sectionCollegeFilter === "all") return sections;
    if (sectionCollegeFilter === "unassigned") {
      return sections.filter((s) => !getSectionAcademicInfo(s).isAssigned);
    }
    return sections.filter(
      (s) => getSectionAcademicInfo(s).college?.code === sectionCollegeFilter
    );
  }, [sections, sectionCollegeFilter]);

  // --- Accounts Tab State ---
  const [newAccName, setNewAccName] = useState("");
  const [newAccEmail, setNewAccEmail] = useState("");
  const [newAccPass, setNewAccPass] = useState(() => generateTempPassword());
  const [newAccRole, setNewAccRole] = useState<UserRole>("member");
  const [newAccSectionId, setNewAccSectionId] = useState("");
  const [copiedPass, setCopiedPass] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetTempPass, setResetTempPass] = useState("");
  const [editProfileId, setEditProfileId] = useState<string | null>(null);
  const [editProfileName, setEditProfileName] = useState("");
  const [editProfileRole, setEditProfileRole] = useState<UserRole>("member");

  // --- Directory Tab State ---
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupType, setNewGroupType] =
    useState<VisibilityGroupType>("circle");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupType, setEditGroupType] =
    useState<VisibilityGroupType>("circle");
  const [editGroupDesc, setEditGroupDesc] = useState("");
  const [roleDrafts, setRoleDrafts] = useState<Record<string, string>>({});
  const [previewUserId, setPreviewUserId] = useState(
    () => profiles.find((p) => p.role !== "admin")?.id ?? profiles[0]?.id ?? ""
  );

  const previewVisibility = useMemo(() => {
    const target = profiles.find((p) => p.id === previewUserId);
    if (!target) return null;

    if (target.role === "admin") {
      return {
        target,
        isAdmin: true,
        groups: visibilityGroups.filter((g) => g.memberIds.includes(target.id)),
        visiblePeople: profiles.map((p) => ({
          profile: p,
          reasons: [p.id === target.id ? "Self" : "Admin Access"],
        })),
        visibleSectionCodes: sections.map((s) => s.code),
      };
    }

    const mySectionIds = new Set(
      sections
        .filter((s) => s.members.some((m) => m.id === target.id))
        .map((s) => s.id)
    );
    const myGroups = visibilityGroups.filter((g) =>
      g.memberIds.includes(target.id)
    );

    const visiblePeople: { profile: Profile; reasons: string[] }[] = [];
    const visibleUserIds = new Set<string>([target.id]);

    for (const p of profiles) {
      const reasons: string[] = [];
      if (p.id === target.id) {
        reasons.push("Self");
      }
      if (
        p.id !== target.id &&
        sections.some(
          (s) =>
            mySectionIds.has(s.id) && s.members.some((m) => m.id === p.id)
        )
      ) {
        reasons.push("Classmate");
      }
      for (const g of myGroups) {
        if (p.id !== target.id && g.memberIds.includes(p.id)) {
          reasons.push(g.name);
        }
      }
      if (reasons.length > 0) {
        visibleUserIds.add(p.id);
        visiblePeople.push({ profile: p, reasons });
      }
    }

    const visibleSectionCodes = sections
      .filter((s) => s.members.some((m) => visibleUserIds.has(m.id)))
      .map((s) => s.code);

    return {
      target,
      isAdmin: false,
      groups: myGroups,
      visiblePeople,
      visibleSectionCodes,
    };
  }, [previewUserId, profiles, sections, visibilityGroups]);

  // --- Semesters Tab State ---
  const [newSemName, setNewSemName] = useState("");
  const [newSemActive, setNewSemActive] = useState(semesters.length === 0);
  const [cloneFromSemId, setCloneFromSemId] = useState("");

  // --- Profile Requests Tab State ---
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const pendingProfileRequests = useMemo(
    () => profileRequests.filter((r) => r.status === "pending"),
    [profileRequests]
  );
  const resolvedProfileRequests = useMemo(
    () => profileRequests.filter((r) => r.status !== "pending"),
    [profileRequests]
  );

  const tabIcons: Record<AdminTab, typeof BookOpen> = {
    schedules: BookOpen,
    sections: Layers,
    directory: Building2,
    accounts: Users,
    requests: UserCheck,
    semesters: CalendarPlus,
  };
  const ActiveTabIcon = tabIcons[tab];
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
            Manage semesters, sections, class schedules, and friend accounts.
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

      {/* ==================================================================== */}
      {/* TAB 1: SCHEDULES                                                     */}
      {/* ==================================================================== */}
      {tab === "schedules" && (
        <>
          {!activeSemester || sections.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {!activeSemester
                  ? "Create a semester first in the Semesters tab."
                  : `Add at least one section to "${activeSemester.name}" in the Sections & Rosters tab first.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Column */}
              <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 h-fit">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-base">
                    {editingEntryId ? "Edit Class" : "Add Class"}
                  </h2>
                  {editingEntryId && (
                    <button
                      type="button"
                      onClick={resetScheduleForm}
                      className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                    >
                      Cancel edit
                    </button>
                  )}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    runAction(async () => {
                      const res = await saveScheduleEntryAction({
                        id: editingEntryId,
                        sectionId: activeSchedSectionId,
                        dayOfWeek: schedDay,
                        startTime,
                        endTime,
                        courseCode,
                        instructor,
                        location,
                        category,
                        modality,
                        colorOverride,
                      });
                      if (res.ok) resetScheduleForm();
                      return res;
                    });
                  }}
                  className="space-y-3.5"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Section
                      </label>
                      <select
                        value={activeSchedSectionId}
                        onChange={(e) => setSchedSectionId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm"
                      >
                        {sections.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.code}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Day
                      </label>
                      <select
                        value={schedDay}
                        onChange={(e) =>
                          setSchedDay(Number(e.target.value) as DayOfWeek)
                        }
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm"
                      >
                        {DAYS.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Start Time
                      </label>
                      <select
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm"
                      >
                        {TIME_OPTIONS.slice(0, -1).map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        End Time
                      </label>
                      <select
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm"
                      >
                        {TIME_OPTIONS.slice(1).map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Course Code / Title
                    </label>
                    <input
                      type="text"
                      required
                      value={courseCode}
                      onChange={(e) => handleCourseCodeChange(e.target.value)}
                      placeholder="e.g., IS 207, IT 208*, INTERNSHIP"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Instructor (optional)
                      </label>
                      <input
                        type="text"
                        value={instructor}
                        onChange={(e) => setInstructor(e.target.value)}
                        placeholder="e.g., Flores, Mavel S."
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Room
                      </label>
                      <input
                        type="text"
                        value={modality === "online" ? "ONLINE CLASS" : location}
                        disabled={modality === "online"}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g., Prog Lab 2, ACAD 4"
                        className={`w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm ${
                          modality === "online"
                            ? "bg-slate-100 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                            : "bg-white dark:bg-slate-950"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) =>
                          setCategory(e.target.value as ScheduleCategory)
                        }
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm"
                      >
                        <option value="major">Major</option>
                        <option value="minor">Minor / GenEd</option>
                        <option value="internship">Internship</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Modality
                      </label>
                      <select
                        value={modality}
                        onChange={(e) =>
                          handleModalityChange(e.target.value as ScheduleModality)
                        }
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm"
                      >
                        <option value="online">Online</option>
                        <option value="ftf">Face-to-Face (FTF)</option>
                        <option value="hybrid">FTF / Online (Hybrid)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Color (Auto-selected, or override)
                    </label>
                    <select
                      value={colorOverride}
                      onChange={(e) =>
                        setColorOverride(e.target.value as ColorKey | "")
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm"
                    >
                      <option value="">
                        Auto ({COLOR_PRESETS[resolveColorKey(category, modality)].name})
                      </option>
                      {(Object.keys(COLOR_PRESETS) as ColorKey[]).map((key) => (
                        <option key={key} value={key}>
                          {COLOR_PRESETS[key].name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Live Color Preview */}
                  <div
                    className={`rounded-xl border p-3 text-center ${COLOR_PRESETS[previewColorKey].cardClass}`}
                  >
                    <div className="text-xs font-bold">
                      {courseCode.trim() || "COURSE CODE"}
                    </div>
                    <div className="text-[11px] opacity-85">
                      {instructor.trim() || "Instructor"} ·{" "}
                      {location.trim() || modality.toUpperCase()}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold py-2.5 text-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {editingEntryId ? "Update Class" : "Add Class"}
                  </button>
                </form>
              </div>

              {/* Existing Classes List */}
              <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-bold text-base">
                      {sections.find((s) => s.id === activeSchedSectionId)?.code}{" "}
                      · {DAYS.find((d) => d.value === schedDay)?.label}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {filteredEntries.length} class
                      {filteredEntries.length === 1 ? "" : "es"} scheduled
                    </p>
                  </div>

                  <div className="flex gap-1">
                    {DAYS.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setSchedDay(d.value)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                          schedDay === d.value
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {d.short}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredEntries.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500">
                    No classes on this day yet. Use the form on the left to add
                    one.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredEntries.map((entry) => {
                      const colors = getEntryColorClasses(entry);
                      return (
                        <div
                          key={entry.id}
                          className={`rounded-xl border p-3.5 flex items-center justify-between gap-3 ${colors.cardClass}`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">
                                {entry.course_code}
                              </span>
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${colors.badgeClass}`}
                              >
                                {formatTime12h(entry.start_time)} –{" "}
                                {formatTime12h(entry.end_time)}
                              </span>
                            </div>
                            <div className="text-xs opacity-90 mt-0.5 truncate">
                              {entry.instructor || "N/A"} ·{" "}
                              {entry.location || entry.modality.toUpperCase()}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => loadEntryForEdit(entry)}
                              title="Edit class"
                              className="h-8 w-8 rounded-lg bg-white/60 dark:bg-black/25 hover:bg-white dark:hover:bg-black/40 flex items-center justify-center cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => {
                                if (confirm(`Delete ${entry.course_code}?`)) {
                                  runAction(() =>
                                    deleteScheduleEntryAction(entry.id)
                                  );
                                }
                              }}
                              title="Delete class"
                              className="h-8 w-8 rounded-lg bg-white/60 dark:bg-black/25 hover:bg-rose-500 hover:text-white flex items-center justify-center cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: SECTIONS & ROSTERS                                            */}
      {/* ==================================================================== */}
      {tab === "sections" && (
        <div className="space-y-5">
          {!activeSemester ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500">
              Create a semester first in the Semesters tab.
            </div>
          ) : (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runAction(async () => {
                    const res = await createSectionAction({
                      semesterId: activeSemester.id,
                      collegeCode: newCollegeCode,
                      programCode: newProgramCode,
                      sectionName: newSectionName,
                      specialization: newSpecialization,
                    });
                    if (res.ok) {
                      setNewSectionName("");
                      setNewSpecialization("");
                    }
                    return res;
                  });
                }}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-bold text-base">
                      Add Section ({activeSemester.name})
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Select a college and program, then enter the section code and optional track.
                    </p>
                  </div>
                  {newSectionPreview && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-900 text-xs font-semibold text-sky-800 dark:text-sky-200">
                      <span className="text-sky-500 dark:text-sky-400 font-medium">
                        Preview:
                      </span>
                      <span>{newSectionPreview}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      College
                    </label>
                    <select
                      required
                      value={newCollegeCode}
                      onChange={(e) => {
                        setNewCollegeCode(e.target.value);
                        setNewProgramCode("");
                        setNewSpecialization("");
                      }}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm"
                    >
                      <option value="">Select a college…</option>
                      {COLLEGES.map((college) => (
                        <option key={college.code} value={college.code}>
                          {college.code} — {college.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Program / Course
                    </label>
                    <select
                      required
                      disabled={!newCollegeCode}
                      value={newProgramCode}
                      onChange={(e) => {
                        setNewProgramCode(e.target.value);
                        setNewSpecialization("");
                      }}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {newCollegeCode
                          ? "Select a program…"
                          : "Select a college first…"}
                      </option>
                      {newPrograms.map((prog) => (
                        <option key={prog.code} value={prog.code}>
                          {prog.code} — {prog.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-5">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Section
                    </label>
                    <input
                      type="text"
                      required
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                      placeholder="e.g., 2B-G2, 3A-G1"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Specialization / Track (optional)
                    </label>
                    <input
                      type="text"
                      list="new-section-spec-suggestions"
                      value={newSpecialization}
                      onChange={(e) => setNewSpecialization(e.target.value)}
                      placeholder="e.g., DBA, WMD, BA"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
                    />
                    {newProgramEntry?.program.commonSpecializations && (
                      <datalist id="new-section-spec-suggestions">
                        {newProgramEntry.program.commonSpecializations.map(
                          (spec) => (
                            <option key={spec} value={spec} />
                          )
                        )}
                      </datalist>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={isPending || !newCollegeCode || !newProgramCode}
                      className="w-full px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>
                </div>
              </form>

              {(sectionCollegeOptions.colleges.length > 0 ||
                sectionCollegeOptions.unassignedCount > 0) && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Filter by College:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSectionCollegeFilter("all")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      sectionCollegeFilter === "all"
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    All ({sections.length})
                  </button>
                  {sectionCollegeOptions.colleges.map((college) => {
                    const count = sections.filter(
                      (s) =>
                        getSectionAcademicInfo(s).college?.code === college.code
                    ).length;
                    return (
                      <button
                        key={college.code}
                        type="button"
                        title={college.name}
                        onClick={() => setSectionCollegeFilter(college.code)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          sectionCollegeFilter === college.code
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        {college.code} ({count})
                      </button>
                    );
                  })}
                  {sectionCollegeOptions.unassignedCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setSectionCollegeFilter("unassigned")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        sectionCollegeFilter === "unassigned"
                          ? "bg-amber-600 text-white"
                          : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                      }`}
                    >
                      Needs Assignment ({sectionCollegeOptions.unassignedCount})
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSections.map((section) => {
                  const memberIds = new Set(section.members.map((m) => m.id));
                  const isEditing = editingSectionId === section.id;
                  const academic = getSectionAcademicInfo(section);

                  return (
                    <div
                      key={section.id}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        {isEditing ? (
                          <div className="flex-1 space-y-2.5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <select
                                value={editCollegeCode}
                                onChange={(e) => {
                                  setEditCollegeCode(e.target.value);
                                  setEditProgramCode("");
                                }}
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs"
                              >
                                <option value="">Select college…</option>
                                {COLLEGES.map((c) => (
                                  <option key={c.code} value={c.code}>
                                    {c.code} — {c.name}
                                  </option>
                                ))}
                              </select>
                              <select
                                disabled={!editCollegeCode}
                                value={editProgramCode}
                                onChange={(e) =>
                                  setEditProgramCode(e.target.value)
                                }
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs disabled:opacity-60"
                              >
                                <option value="">
                                  {editCollegeCode
                                    ? "Select program…"
                                    : "Select college first…"}
                                </option>
                                {editPrograms.map((p) => (
                                  <option key={p.code} value={p.code}>
                                    {p.code} — {p.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                type="text"
                                value={editSectionName}
                                onChange={(e) =>
                                  setEditSectionName(e.target.value)
                                }
                                placeholder="Section (e.g., 2B-G2)"
                                className="flex-1 min-w-[110px] rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2.5 py-1 text-xs font-semibold"
                              />
                              <input
                                type="text"
                                list="edit-section-spec-suggestions"
                                value={editSpecialization}
                                onChange={(e) =>
                                  setEditSpecialization(e.target.value)
                                }
                                placeholder="Track (optional)"
                                className="w-28 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2.5 py-1 text-xs"
                              />
                              {editProgramEntry?.program
                                .commonSpecializations && (
                                <datalist id="edit-section-spec-suggestions">
                                  {editProgramEntry.program.commonSpecializations.map(
                                    (spec) => (
                                      <option key={spec} value={spec} />
                                    )
                                  )}
                                </datalist>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[11px] text-slate-500">
                                {editSectionPreview ? (
                                  <>
                                    Code:{" "}
                                    <strong className="text-slate-800 dark:text-slate-200">
                                      {editSectionPreview}
                                    </strong>
                                  </>
                                ) : (
                                  "Choose college, program, and section"
                                )}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingSectionId(null)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={
                                    isPending ||
                                    !editCollegeCode ||
                                    !editProgramCode ||
                                    !editSectionName.trim()
                                  }
                                  onClick={() =>
                                    runAction(async () => {
                                      const res = await updateSectionAction({
                                        id: section.id,
                                        collegeCode: editCollegeCode,
                                        programCode: editProgramCode,
                                        sectionName: editSectionName,
                                        specialization: editSpecialization,
                                      });
                                      if (res.ok) setEditingSectionId(null);
                                      return res;
                                    })
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="min-w-0">
                            <div className="font-bold text-base flex flex-wrap items-center gap-2">
                              {academic.college ? (
                                <span
                                  title={academic.college.name}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-900"
                                >
                                  {academic.college.code}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                                  Assign College & Program
                                </span>
                              )}
                              <span>{section.code}</span>
                            </div>
                            {(academic.college || academic.program) && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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
                            )}
                            <div className="text-xs text-slate-500 mt-0.5">
                              {formatMemberNames(section.members)}
                            </div>
                          </div>
                        )}

                        {!isEditing && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const parts = section.code
                                  .trim()
                                  .split(/\s+/);
                                setEditingSectionId(section.id);
                                setEditCollegeCode(
                                  academic.college?.code ?? ""
                                );
                                setEditProgramCode(
                                  academic.program?.code ?? ""
                                );
                                setEditSectionName(
                                  section.section_name ??
                                    (parts.length >= 2 ? parts[1] : section.code)
                                );
                                setEditSpecialization(
                                  section.specialization ??
                                    (parts.length >= 3
                                      ? parts.slice(2).join(" ")
                                      : "")
                                );
                              }}
                              title="Edit section"
                              className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  confirm(
                                    `Delete section ${section.code} and all its classes?`
                                  )
                                ) {
                                  runAction(() =>
                                    deleteSectionAction(section.id)
                                  );
                                }
                              }}
                              title="Delete section"
                              className="h-8 w-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 flex items-center justify-center text-slate-500 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
                          Assign Friends to {section.code}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {profiles.map((p) => {
                            const assigned = memberIds.has(p.id);
                            return (
                              <button
                                key={p.id}
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                  runAction(() =>
                                    toggleSectionMemberAction({
                                      sectionId: section.id,
                                      userId: p.id,
                                      assign: !assigned,
                                    })
                                  )
                                }
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                                  assigned
                                    ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white"
                                    : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400"
                                }`}
                              >
                                {p.display_name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: DIRECTORY (Circles of Friends & Organizations)                */}
      {/* ==================================================================== */}
      {tab === "directory" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 px-4 py-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <strong className="text-slate-900 dark:text-slate-100">
              Visibility Rule:
            </strong>{" "}
            Every member automatically sees <strong>themselves</strong>, their{" "}
            <strong>classmates</strong> (same section), and anyone who shares at
            least one <strong>Circle of Friends</strong> or{" "}
            <strong>Organization</strong> with them. Admins always see everyone.
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Create Group + Visibility Preview */}
            <div className="lg:col-span-5 space-y-5">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
                <h2 className="font-bold text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-rose-500" />
                  Create Circle / Organization
                </h2>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    runAction(async () => {
                      const res = await createVisibilityGroupAction({
                        name: newGroupName,
                        type: newGroupType,
                        description: newGroupDesc,
                      });
                      if (res.ok) {
                        setNewGroupName("");
                        setNewGroupDesc("");
                      }
                      return res;
                    });
                  }}
                  className="space-y-3.5"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Group Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="e.g., COF, BulSU Dev Org, BSIS Squad"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Group Type
                    </label>
                    <select
                      value={newGroupType}
                      onChange={(e) =>
                        setNewGroupType(e.target.value as VisibilityGroupType)
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm"
                    >
                      <option value="circle">Circle of Friends</option>
                      <option value="organization">Organization</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Description (optional)
                    </label>
                    <input
                      type="text"
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                      placeholder="Short note about this group"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold py-2.5 text-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Create Group
                  </button>
                </form>
              </div>

              {/* Who Can See Whom Preview */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3.5">
                <h2 className="font-bold text-base flex items-center gap-2">
                  <Eye className="h-4 w-4 text-emerald-500" />
                  Visibility Preview
                </h2>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Inspect User
                  </label>
                  <select
                    value={previewUserId}
                    onChange={(e) => setPreviewUserId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm"
                  >
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.display_name} ({p.role})
                      </option>
                    ))}
                  </select>
                </div>

                {previewVisibility && (
                  <div className="space-y-3 pt-1 text-xs">
                    <div>
                      <div className="font-semibold text-slate-500 uppercase tracking-wide text-[10px] mb-1">
                        Visible Sections ({previewVisibility.visibleSectionCodes.length})
                      </div>
                      {previewVisibility.visibleSectionCodes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {previewVisibility.visibleSectionCodes.map((code) => (
                            <span
                              key={code}
                              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium"
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">
                          No sections visible yet
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="font-semibold text-slate-500 uppercase tracking-wide text-[10px] mb-1.5">
                        Can See ({previewVisibility.visiblePeople.length})
                      </div>
                      <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                        {previewVisibility.visiblePeople.map(
                          ({ profile: p, reasons }) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between gap-2 py-1 border-b last:border-b-0 border-slate-100 dark:border-slate-800"
                            >
                              <span className="font-medium truncate">
                                {p.display_name}
                              </span>
                              <div className="flex flex-wrap justify-end gap-1 shrink-0">
                                {reasons.map((r) => (
                                  <span
                                    key={r}
                                    className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold"
                                  >
                                    {r}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: All Circles & Organizations */}
            <div className="lg:col-span-7 space-y-4">
              {visibilityGroups.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center space-y-1.5">
                  <p className="font-semibold text-sm">
                    No Circles or Organizations Yet
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Without a group, non-admin users only see their own
                    classmates. Create a Circle of Friends or Organization on
                    the left to let members see each other&apos;s schedules.
                  </p>
                </div>
              ) : (
                visibilityGroups.map((group) => {
                  const memberSet = new Set(group.memberIds);
                  const isEditing = editingGroupId === group.id;

                  return (
                    <div
                      key={group.id}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        {isEditing ? (
                          <div className="flex flex-wrap items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={editGroupName}
                              onChange={(e) => setEditGroupName(e.target.value)}
                              className="flex-1 min-w-[140px] rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2.5 py-1 text-sm font-bold"
                            />
                            <select
                              value={editGroupType}
                              onChange={(e) =>
                                setEditGroupType(
                                  e.target.value as VisibilityGroupType
                                )
                              }
                              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-xs"
                            >
                              <option value="circle">Circle</option>
                              <option value="organization">Organization</option>
                            </select>
                            <input
                              type="text"
                              value={editGroupDesc}
                              onChange={(e) => setEditGroupDesc(e.target.value)}
                              placeholder="Description"
                              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2.5 py-1 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                runAction(async () => {
                                  const res = await updateVisibilityGroupAction(
                                    {
                                      id: group.id,
                                      name: editGroupName,
                                      type: editGroupType,
                                      description: editGroupDesc,
                                    }
                                  );
                                  if (res.ok) setEditingGroupId(null);
                                  return res;
                                })
                              }
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-base">
                                {group.name}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                  group.type === "organization"
                                    ? "bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300"
                                    : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                                }`}
                              >
                                {group.type === "organization"
                                  ? "Organization"
                                  : "Circle"}
                              </span>
                              <span className="text-xs text-slate-400">
                                {group.memberIds.length} member
                                {group.memberIds.length === 1 ? "" : "s"}
                              </span>
                            </div>
                            {group.description && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                {group.description}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingGroupId(isEditing ? null : group.id);
                              setEditGroupName(group.name);
                              setEditGroupType(group.type);
                              setEditGroupDesc(group.description ?? "");
                            }}
                            className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete group "${group.name}"?`)) {
                                runAction(() =>
                                  deleteVisibilityGroupAction(group.id)
                                );
                              }
                            }}
                            className="h-8 w-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 flex items-center justify-center text-slate-500 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
                          Members in {group.name}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {profiles.map((p) => {
                            const assigned = memberSet.has(p.id);
                            return (
                              <button
                                key={p.id}
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                  runAction(() =>
                                    toggleVisibilityGroupMemberAction({
                                      groupId: group.id,
                                      userId: p.id,
                                      assign: !assigned,
                                    })
                                  )
                                }
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                                  assigned
                                    ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white"
                                    : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400"
                                }`}
                              >
                                {p.display_name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {group.type === "organization" &&
                        group.memberIds.length > 0 && (
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-[11px] font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">
                                Organization Roles (Labels Only)
                              </div>
                              <span className="text-[10px] text-slate-400">
                                Informational only · no extra permissions
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              {profiles
                                .filter((p) => memberSet.has(p.id))
                                .map((p) => {
                                  const draftKey = `${group.id}:${p.id}`;
                                  const savedRole =
                                    group.memberRoles[p.id] ?? "";
                                  const draftValue =
                                    roleDrafts[draftKey] !== undefined
                                      ? roleDrafts[draftKey]
                                      : savedRole;
                                  const isDirty =
                                    draftValue.trim() !== savedRole;

                                  const handleSaveRole = () => {
                                    if (!isDirty) return;
                                    runAction(async () => {
                                      const res =
                                        await updateOrganizationMemberRoleAction(
                                          {
                                            groupId: group.id,
                                            userId: p.id,
                                            roleLabel: draftValue,
                                          }
                                        );
                                      if (res.ok) {
                                        setRoleDrafts((prev) => {
                                          const next = { ...prev };
                                          delete next[draftKey];
                                          return next;
                                        });
                                      }
                                      return res;
                                    });
                                  };

                                  return (
                                    <div
                                      key={p.id}
                                      className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/80 px-3 py-2"
                                    >
                                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 sm:w-44 shrink-0 truncate">
                                        {p.display_name}
                                      </span>
                                      <input
                                        type="text"
                                        maxLength={60}
                                        value={draftValue}
                                        onChange={(e) =>
                                          setRoleDrafts((prev) => ({
                                            ...prev,
                                            [draftKey]: e.target.value,
                                          }))
                                        }
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleSaveRole();
                                          }
                                        }}
                                        placeholder="e.g., Relations Lead, VP Internal…"
                                        className="flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs outline-none focus:border-sky-400"
                                      />
                                      <button
                                        type="button"
                                        disabled={isPending || !isDirty}
                                        onClick={handleSaveRole}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition shrink-0 ${
                                          isDirty
                                            ? "bg-sky-600 text-white hover:bg-sky-700 cursor-pointer"
                                            : "bg-slate-200/70 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                                        }`}
                                      >
                                        Save
                                      </button>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: FRIEND ACCOUNTS                                               */}
      {/* ==================================================================== */}
      {tab === "accounts" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 h-fit">
            <h2 className="font-bold text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-rose-500" />
              Create Friend Account
            </h2>

            {!hasServiceRoleKey && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-200">
                Add <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
                to <code className="font-mono">.env.local</code> to create and
                reset accounts directly from here.
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                runAction(async () => {
                  const res = await createFriendAccountAction({
                    displayName: newAccName,
                    email: newAccEmail,
                    initialPassword: newAccPass,
                    role: newAccRole,
                    sectionId: newAccSectionId || undefined,
                  });
                  if (res.ok) {
                    setNewAccName("");
                    setNewAccEmail("");
                    setNewAccPass(generateTempPassword());
                    setNewAccRole("member");
                  }
                  return res;
                });
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  placeholder="e.g., Giyu, Mark, Zeke"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newAccEmail}
                  onChange={(e) => setNewAccEmail(e.target.value)}
                  placeholder="friend@ms.bulsu.edu.ph"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Initial Password (forced change on first login)
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    required
                    minLength={8}
                    value={newAccPass}
                    onChange={(e) => setNewAccPass(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-mono"
                  />
                  <button
                    type="button"
                    title="Generate new password"
                    onClick={() => setNewAccPass(generateTempPassword())}
                    className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Copy password"
                    onClick={() => {
                      navigator.clipboard.writeText(newAccPass);
                      setCopiedPass(true);
                      setTimeout(() => setCopiedPass(false), 1500);
                    }}
                    className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    {copiedPass ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Assign Section
                  </label>
                  <select
                    value={newAccSectionId}
                    onChange={(e) => setNewAccSectionId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm"
                  >
                    <option value="">None yet</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Role
                  </label>
                  <select
                    value={newAccRole}
                    onChange={(e) => setNewAccRole(e.target.value as UserRole)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm"
                  >
                    <option value="member">Friend (View-only)</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending || !hasServiceRoleKey}
                className="w-full rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold py-2.5 text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Create Account
              </button>
            </form>
          </div>

          {/* Existing Accounts */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <h2 className="font-bold text-base">
              All Accounts ({profiles.length})
            </h2>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {profiles.map((p) => {
                const isMe = p.id === currentAdminId;
                const isEditing = editProfileId === p.id;
                const isResetting = resetUserId === p.id;

                return (
                  <div key={p.id} className="py-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate">
                            {p.display_name}
                          </span>
                          {p.role === "admin" && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold uppercase">
                              Admin
                            </span>
                          )}
                          {p.must_change_password && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                              Pending Password Change
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {p.email}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          title="Edit profile"
                          onClick={() => {
                            setEditProfileId(isEditing ? null : p.id);
                            setEditProfileName(p.display_name);
                            setEditProfileRole(p.role);
                          }}
                          className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Reset temporary password"
                          disabled={!hasServiceRoleKey}
                          onClick={() => {
                            setResetUserId(isResetting ? null : p.id);
                            setResetTempPass(generateTempPassword());
                          }}
                          className="h-8 w-8 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-600 flex items-center justify-center text-slate-500 disabled:opacity-40 cursor-pointer"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </button>
                        {!isMe && (
                          <button
                            type="button"
                            title="Delete account"
                            disabled={!hasServiceRoleKey || isPending}
                            onClick={() => {
                              if (
                                confirm(
                                  `Permanently delete ${p.display_name} (${p.email})?`
                                )
                              ) {
                                runAction(() => deleteFriendAccountAction(p.id));
                              }
                            }}
                            className="h-8 w-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 flex items-center justify-center text-slate-500 disabled:opacity-40 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={editProfileName}
                          onChange={(e) => setEditProfileName(e.target.value)}
                          className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2.5 py-1 text-xs"
                        />
                        <select
                          value={editProfileRole}
                          disabled={isMe}
                          onChange={(e) =>
                            setEditProfileRole(e.target.value as UserRole)
                          }
                          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-xs"
                        >
                          <option value="member">Friend</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            runAction(async () => {
                              const res = await updateFriendProfileAction({
                                userId: p.id,
                                displayName: editProfileName,
                                role: editProfileRole,
                              });
                              if (res.ok) setEditProfileId(null);
                              return res;
                            })
                          }
                          className="px-3 py-1 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    )}

                    {isResetting && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={resetTempPass}
                          onChange={(e) => setResetTempPass(e.target.value)}
                          placeholder="New temporary password"
                          className="flex-1 rounded-lg border border-amber-300 dark:border-amber-800 bg-transparent px-2.5 py-1 text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            runAction(async () => {
                              const res = await resetFriendPasswordAction({
                                userId: p.id,
                                temporaryPassword: resetTempPass,
                              });
                              if (res.ok) setResetUserId(null);
                              return res;
                            })
                          }
                          className="px-3 py-1 rounded-lg bg-amber-600 text-white text-xs font-semibold cursor-pointer"
                        >
                          Set Temp Password
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: SEMESTERS                                                     */}
      {/* ==================================================================== */}
      {tab === "semesters" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 h-fit">
            <h2 className="font-bold text-base">Create Semester</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runAction(async () => {
                  const res = await createSemesterAction({
                    name: newSemName,
                    setActive: newSemActive,
                    cloneFromSemesterId: cloneFromSemId || undefined,
                  });
                  if (res.ok) {
                    setNewSemName("");
                    setCloneFromSemId("");
                  }
                  return res;
                });
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Semester Name
                </label>
                <input
                  type="text"
                  required
                  value={newSemName}
                  onChange={(e) => setNewSemName(e.target.value)}
                  placeholder="e.g., 2026-2027 1st Sem"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                />
              </div>

              {semesters.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Copy Sections & Rosters From (optional)
                  </label>
                  <select
                    value={cloneFromSemId}
                    onChange={(e) => setCloneFromSemId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm"
                  >
                    <option value="">Start blank</option>
                    {semesters.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={newSemActive}
                  onChange={(e) => setNewSemActive(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                Set as active semester
              </label>

              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold py-2.5 text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Create Semester
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <h2 className="font-bold text-base">
              All Semesters ({semesters.length})
            </h2>

            {semesters.length === 0 ? (
              <p className="text-sm text-slate-500">
                No semesters created yet. Create your first semester on the
                left!
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {semesters.map((sem) => (
                  <div
                    key={sem.id}
                    className="py-3 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{sem.name}</span>
                      {sem.is_active && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                          Active
                        </span>
                      )}
                      {sem.is_archived && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] font-semibold">
                          Archived
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!sem.is_active && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            runAction(() => setActiveSemesterAction(sem.id))
                          }
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold cursor-pointer"
                        >
                          Set Active
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          runAction(() =>
                            toggleArchiveSemesterAction(
                              sem.id,
                              !sem.is_archived
                            )
                          )
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Archive className="h-3.5 w-3.5" />
                        {sem.is_archived ? "Unarchive" : "Archive"}
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                          if (
                            confirm(
                              `Delete "${sem.name}" and ALL its sections and schedules?`
                            )
                          ) {
                            runAction(() => deleteSemesterAction(sem.id));
                          }
                        }}
                        className="h-8 w-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 flex items-center justify-center text-slate-500 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: PROFILE REQUESTS                                              */}
      {/* ==================================================================== */}
      {tab === "requests" && (
        <div className="space-y-6">
          {requestsMigrationRequired ? (
            <div className="rounded-2xl border border-amber-200 dark:border-amber-900/70 bg-amber-50/70 dark:bg-amber-950/30 p-6 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-200">
                <Database className="h-4 w-4" />
                Database Migration Required
              </div>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90">
                Run{" "}
                <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 font-mono">
                  supabase/migrations/005_profile_change_requests.sql
                </code>{" "}
                in your Supabase SQL Editor to enable the Profile Requests
                approval queue.
              </p>
            </div>
          ) : (
            <>
              {/* Pending Queue */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      Pending Approvals ({pendingProfileRequests.length})
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Review display name change requests submitted by members.
                    </p>
                  </div>
                </div>

                {pendingProfileRequests.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    No pending profile change requests right now.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingProfileRequests.map((req) => {
                      const noteValue = reviewNotes[req.id] ?? "";
                      return (
                        <div
                          key={req.id}
                          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-4 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                <span className="text-slate-500 dark:text-slate-400 line-through">
                                  {req.current_display_name}
                                </span>
                                <ArrowRight className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                                <span className="text-slate-900 dark:text-white">
                                  {req.requested_display_name}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {req.user_email} · Submitted{" "}
                                {new Intl.DateTimeFormat("en-PH", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                }).format(new Date(req.created_at))}
                              </div>
                            </div>

                            <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                              Pending
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input
                              type="text"
                              value={noteValue}
                              onChange={(e) =>
                                setReviewNotes((prev) => ({
                                  ...prev,
                                  [req.id]: e.target.value,
                                }))
                              }
                              maxLength={200}
                              placeholder="Optional note (e.g., reason if rejecting)"
                              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-rose-400"
                            />

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                  runAction(async () => {
                                    const res =
                                      await reviewProfileChangeRequestAction({
                                        requestId: req.id,
                                        decision: "approved",
                                        reviewNote: noteValue,
                                      });
                                    if (res.ok) {
                                      setReviewNotes((prev) => {
                                        const next = { ...prev };
                                        delete next[req.id];
                                        return next;
                                      });
                                    }
                                    return res;
                                  })
                                }
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50 transition cursor-pointer"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Approve
                              </button>

                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                  runAction(async () => {
                                    const res =
                                      await reviewProfileChangeRequestAction({
                                        requestId: req.id,
                                        decision: "rejected",
                                        reviewNote: noteValue,
                                      });
                                    if (res.ok) {
                                      setReviewNotes((prev) => {
                                        const next = { ...prev };
                                        delete next[req.id];
                                        return next;
                                      });
                                    }
                                    return res;
                                  })
                                }
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/80 text-xs font-semibold disabled:opacity-50 transition cursor-pointer"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent Request History */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Recent History ({resolvedProfileRequests.length})
                </h2>

                {resolvedProfileRequests.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No resolved requests yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {resolvedProfileRequests.map((req) => (
                      <div
                        key={req.id}
                        className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                            <span className="text-slate-500 dark:text-slate-400">
                              {req.current_display_name}
                            </span>
                            <ArrowRight className="h-3 w-3 text-slate-400" />
                            <span className="font-semibold">
                              {req.requested_display_name}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-500 dark:text-slate-400">
                              {req.user_email}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {req.reviewed_at
                              ? `Reviewed ${new Intl.DateTimeFormat("en-PH", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                }).format(new Date(req.reviewed_at))}`
                              : `Updated ${new Intl.DateTimeFormat("en-PH", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                }).format(new Date(req.updated_at))}`}
                            {req.reviewer_display_name &&
                              ` by ${req.reviewer_display_name}`}
                            {req.review_note && ` · Note: "${req.review_note}"`}
                          </div>
                        </div>

                        <span
                          className={`self-start sm:self-auto px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                            req.status === "approved"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : req.status === "rejected"
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
