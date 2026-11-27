"use client";

import { useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  deleteScheduleEntryAction,
  saveScheduleEntryAction,
} from "@/app/actions/admin/schedules";
import type { ActionResult } from "@/app/actions/admin/types";
import {
  COLOR_PRESETS,
  DAYS,
  formatTime12h,
  getEntryColorClasses,
  normalizeTime,
  resolveColorKey,
  TIME_OPTIONS,
} from "@/lib/schedule-utils";
import type {
  ColorKey,
  DayOfWeek,
  ScheduleCategory,
  ScheduleEntry,
  ScheduleModality,
  SectionWithMembers,
  Semester,
} from "@/lib/types";

interface SchedulesTabProps {
  activeSemester: Semester | null;
  sections: SectionWithMembers[];
  entries: ScheduleEntry[];
  initialSectionId?: string;
  isPending: boolean;
  runAction: (fn: () => Promise<ActionResult>) => void;
}

export function SchedulesTab({
  activeSemester,
  sections,
  entries,
  initialSectionId,
  isPending,
  runAction,
}: SchedulesTabProps) {
  const [schedSectionId, setSchedSectionId] = useState(() =>
    initialSectionId && sections.some((s) => s.id === initialSectionId)
      ? initialSectionId
      : (sections[0]?.id ?? "")
  );
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

  const activeSchedSectionId = sections.some((s) => s.id === schedSectionId)
    ? schedSectionId
    : (sections[0]?.id ?? "");

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

  if (!activeSemester || sections.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {!activeSemester
            ? "Create a semester first in the Semesters tab."
            : `Add at least one section to "${activeSemester.name}" in the Sections & Rosters tab first.`}
        </p>
      </div>
    );
  }

  return (
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
              {sections.find((s) => s.id === activeSchedSectionId)?.code} ·{" "}
              {DAYS.find((d) => d.value === schedDay)?.label}
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
            No classes on this day yet. Use the form on the left to add one.
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
                          runAction(() => deleteScheduleEntryAction(entry.id));
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
  );
}
