"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarX2, Sparkles, Users } from "lucide-react";
import {
  DAYS,
  formatTime12h,
  getEntryColorClasses,
  TIME_SLOTS,
  timeToSlotIndex,
  TOTAL_SLOTS,
} from "@/lib/schedule-utils";
import type {
  ScheduleEntry,
  SectionWithMembers,
  Semester,
} from "@/lib/types";
import { ClassDetailModal } from "./class-detail-modal";

interface SectionWeeklyViewProps {
  semester: Semester | null;
  sections: SectionWithMembers[];
  entries: ScheduleEntry[];
  currentUserId: string;
  isAdmin: boolean;
}

const ROW_HEIGHT = 28;

export function SectionWeeklyView({
  semester,
  sections,
  entries,
  currentUserId,
  isAdmin,
}: SectionWeeklyViewProps) {
  const defaultSectionId = useMemo(() => {
    const mine = sections.find((s) =>
      s.members.some((m) => m.id === currentUserId)
    );
    return mine?.id ?? sections[0]?.id ?? "";
  }, [sections, currentUserId]);

  const [selectedSectionId, setSelectedSectionId] = useState(defaultSectionId);
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(
    null
  );

  const activeSection = useMemo(
    () =>
      sections.find((s) => s.id === selectedSectionId) ?? sections[0] ?? null,
    [sections, selectedSectionId]
  );

  const entriesByDay = useMemo(() => {
    const map = new Map<number, ScheduleEntry[]>();
    if (!activeSection) return map;
    for (const entry of entries) {
      if (entry.section_id !== activeSection.id) continue;
      const list = map.get(entry.day_of_week) ?? [];
      list.push(entry);
      map.set(entry.day_of_week, list);
    }
    return map;
  }, [entries, activeSection]);

  if (!semester || !activeSection) {
    return (
      <div className="max-w-2xl mx-auto mt-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
        <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-500 mb-4">
          <CalendarX2 className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold">No Sections Available</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          {isAdmin
            ? "Create a semester and add sections in the Admin panel to see weekly timetables."
            : "Schedules for this semester haven't been added yet."}
        </p>
        {isAdmin && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-sm font-semibold"
          >
            <Sparkles className="h-4 w-4" />
            Open Admin Panel
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Header & Switcher */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {activeSection.code}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {semester.name}
            </span>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 flex items-start gap-1.5 mt-1">
            <Users className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              {activeSection.members.length > 0 ? (
                activeSection.members.map((m, idx) => (
                  <span key={m.id}>
                    {idx > 0 && <br />}
                    {m.display_name}
                  </span>
                ))
              ) : (
                "Unassigned"
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="section-picker"
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide"
          >
            Section
          </label>
          <select
            id="section-picker"
            value={activeSection.id}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm font-semibold outline-none focus:border-rose-400 cursor-pointer"
          >
            {sections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mon–Sat Weekly Grid */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[82vh] overflow-y-auto">
          <div className="min-w-[860px]">
            <div
              className="sticky top-0 z-20 grid border-b border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur"
              style={{
                gridTemplateColumns: "122px repeat(6, minmax(122px, 1fr))",
              }}
            >
              <div className="sticky left-0 z-30 bg-slate-100/95 dark:bg-slate-900/95 border-r border-slate-200 dark:border-slate-800 px-2 py-2 text-center text-[11px] font-extrabold uppercase tracking-wider">
                {activeSection.code}
              </div>
              {DAYS.map((day) => (
                <div
                  key={day.value}
                  className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 border-r last:border-r-0 border-slate-200 dark:border-slate-800"
                >
                  {day.label}
                </div>
              ))}
            </div>

            <div
              className="grid"
              style={{
                gridTemplateColumns: "122px repeat(6, minmax(122px, 1fr))",
                height: `${TOTAL_SLOTS * ROW_HEIGHT}px`,
              }}
            >
              {/* Time Column */}
              <div className="sticky left-0 z-10 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                {TIME_SLOTS.map((slot) => (
                  <div
                    key={slot.index}
                    style={{ height: `${ROW_HEIGHT}px` }}
                    title={slot.isBreak ? `${slot.label} (Lunch Time)` : slot.label}
                    className={`px-1.5 flex items-center justify-center text-[10px] font-medium border-b border-slate-100 dark:border-slate-800/80 tabular-nums whitespace-nowrap ${
                      slot.isBreak
                        ? "bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <span>{slot.label}</span>
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              {DAYS.map((day) => {
                const dayEntries = entriesByDay.get(day.value) ?? [];
                return (
                  <div
                    key={day.value}
                    className="relative min-w-0 border-r last:border-r-0 border-slate-200/80 dark:border-slate-800"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <div
                        key={slot.index}
                        style={{ height: `${ROW_HEIGHT}px` }}
                        className={`border-b border-slate-100 dark:border-slate-800/70 ${
                          slot.isBreak
                            ? "bg-emerald-50/60 dark:bg-emerald-950/25"
                            : ""
                        }`}
                      />
                    ))}

                    {dayEntries.map((entry) => {
                      const startIdx = Math.max(
                        0,
                        timeToSlotIndex(entry.start_time)
                      );
                      const endIdx = Math.min(
                        TOTAL_SLOTS,
                        timeToSlotIndex(entry.end_time)
                      );
                      const spanSlots = Math.max(1, endIdx - startIdx);
                      const top = startIdx * ROW_HEIGHT + 1;
                      const height = spanSlots * ROW_HEIGHT - 2;
                      const colors = getEntryColorClasses(entry);

                      return (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => setSelectedEntry(entry)}
                          style={{ top: `${top}px`, height: `${height}px` }}
                          className={`absolute left-0.5 right-0.5 rounded-lg border px-1.5 py-0.5 text-center flex flex-col items-center justify-center overflow-hidden shadow-xs hover:brightness-95 dark:hover:brightness-110 transition cursor-pointer ${colors.cardClass}`}
                        >
                          <span className="font-bold text-[11px] leading-tight truncate max-w-full">
                            {entry.course_code}
                          </span>
                          {entry.instructor && spanSlots >= 2 && (
                            <span className="text-[10px] opacity-90 leading-tight line-clamp-1 max-w-full">
                              {entry.instructor}
                            </span>
                          )}
                          {entry.location && spanSlots >= 2 && (
                            <span className="text-[9px] font-semibold uppercase tracking-wide opacity-85 leading-tight line-clamp-1 max-w-full">
                              {entry.location}
                            </span>
                          )}
                          {spanSlots === 1 && (
                            <span className="text-[9px] opacity-75">
                              {formatTime12h(entry.start_time)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <ClassDetailModal
        entry={selectedEntry}
        section={activeSection}
        onClose={() => setSelectedEntry(null)}
      />
    </div>
  );
}
