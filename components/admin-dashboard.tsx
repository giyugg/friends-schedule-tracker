"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Archive,
  BookOpen,
  CalendarPlus,
  Check,
  Copy,
  KeyRound,
  Layers,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import {
  createFriendAccountAction,
  createSectionAction,
  createSemesterAction,
  deleteFriendAccountAction,
  deleteScheduleEntryAction,
  deleteSectionAction,
  deleteSemesterAction,
  resetFriendPasswordAction,
  saveScheduleEntryAction,
  setActiveSemesterAction,
  toggleArchiveSemesterAction,
  toggleSectionMemberAction,
  updateFriendProfileAction,
  updateSectionAction,
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
import type {
  ColorKey,
  DayOfWeek,
  Profile,
  ScheduleCategory,
  ScheduleEntry,
  ScheduleModality,
  SectionWithMembers,
  Semester,
  UserRole,
} from "@/lib/types";

type AdminTab = "schedules" | "sections" | "accounts" | "semesters";

interface AdminDashboardProps {
  currentAdminId: string;
  semesters: Semester[];
  activeSemester: Semester | null;
  sections: SectionWithMembers[];
  entries: ScheduleEntry[];
  profiles: Profile[];
  hasServiceRoleKey: boolean;
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
  hasServiceRoleKey,
}: AdminDashboardProps) {
  const [tab, setTab] = useState<AdminTab>(
    semesters.length === 0 ? "semesters" : "schedules"
  );
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const runAction = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error ?? "Something went wrong." });
      } else if (res.message) {
        setFeedback({ type: "success", text: res.message });
      }
    });
  };

  // --- Schedules Tab State ---
  const [schedSectionId, setSchedSectionId] = useState(sections[0]?.id ?? "");
  const [schedDay, setSchedDay] = useState<DayOfWeek>(1);
  const [editingEntryId, setEditingEntryId] = useState<string | undefined>();
  const [courseCode, setCourseCode] = useState("");
  const [instructor, setInstructor] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("09:00");
  const [category, setCategory] = useState<ScheduleCategory>("major");
  const [modality, setModality] = useState<ScheduleModality>("online");
  const [colorOverride, setColorOverride] = useState<ColorKey | "">("");

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
    setLocation("");
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
    setLocation(entry.location ?? "");
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
  const [newSectionCode, setNewSectionCode] = useState("");
  const [newSectionOrder, setNewSectionOrder] = useState(sections.length + 1);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionCode, setEditSectionCode] = useState("");
  const [editSectionOrder, setEditSectionOrder] = useState(0);

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

  // --- Semesters Tab State ---
  const [newSemName, setNewSemName] = useState("");
  const [newSemActive, setNewSemActive] = useState(semesters.length === 0);
  const [cloneFromSemId, setCloneFromSemId] = useState("");

  const tabs: { id: AdminTab; label: string; icon: typeof BookOpen }[] = [
    { id: "schedules", label: "Schedules", icon: BookOpen },
    { id: "sections", label: "Sections & Rosters", icon: Layers },
    { id: "accounts", label: "Friend Accounts", icon: Users },
    { id: "semesters", label: "Semesters", icon: CalendarPlus },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-rose-500" />
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
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

      {/* Tab Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setFeedback(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                active
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            feedback.type === "error"
              ? "border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300"
              : "border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
          }`}
        >
          {feedback.text}
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
                      onChange={(e) => setCourseCode(e.target.value)}
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
                        Room / Modality Label
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g., ONLINE CLASS, Prog Lab 2"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
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
                          setModality(e.target.value as ScheduleModality)
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
                      code: newSectionCode,
                      displayOrder: newSectionOrder,
                    });
                    if (res.ok) {
                      setNewSectionCode("");
                      setNewSectionOrder((n) => n + 1);
                    }
                    return res;
                  });
                }}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col sm:flex-row gap-3 items-end"
              >
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    New Section Code ({activeSemester.name})
                  </label>
                  <input
                    type="text"
                    required
                    value={newSectionCode}
                    onChange={(e) => setNewSectionCode(e.target.value)}
                    placeholder="e.g., BSIS 2A-G1, BSIT 2A-G1"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
                  />
                </div>
                <div className="w-full sm:w-28">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Column Order
                  </label>
                  <input
                    type="number"
                    value={newSectionOrder}
                    onChange={(e) => setNewSectionOrder(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Add Section
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sections.map((section) => {
                  const memberIds = new Set(section.members.map((m) => m.id));
                  const isEditing = editingSectionId === section.id;

                  return (
                    <div
                      key={section.id}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={editSectionCode}
                              onChange={(e) =>
                                setEditSectionCode(e.target.value)
                              }
                              className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2.5 py-1 text-sm font-bold"
                            />
                            <input
                              type="number"
                              value={editSectionOrder}
                              onChange={(e) =>
                                setEditSectionOrder(Number(e.target.value))
                              }
                              className="w-16 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                runAction(async () => {
                                  const res = await updateSectionAction({
                                    id: section.id,
                                    code: editSectionCode,
                                    displayOrder: editSectionOrder,
                                  });
                                  if (res.ok) setEditingSectionId(null);
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
                            <div className="font-bold text-base flex items-center gap-2">
                              {section.code}
                              <span className="text-[11px] font-medium text-slate-400">
                                #{section.display_order}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {formatMemberNames(section.members)}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSectionId(section.id);
                              setEditSectionCode(section.code);
                              setEditSectionOrder(section.display_order);
                            }}
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
                                runAction(() => deleteSectionAction(section.id));
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
      {/* TAB 3: FRIEND ACCOUNTS                                               */}
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
    </div>
  );
}
