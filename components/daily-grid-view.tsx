"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarX2, Filter, Search, Sparkles } from "lucide-react";
import {
  COLOR_PRESETS,
  DAYS,
  formatMemberNames,
  formatTime12h,
  getDefaultDayOfWeek,
  getEntryColorClasses,
  getManilaNow,
  START_HOUR,
  TIME_SLOTS,
  timeToSlotIndex,
  TOTAL_SLOTS,
} from "@/lib/schedule-utils";
import type {
  DayOfWeek,
  ScheduleEntry,
  SectionWithMembers,
  Semester,
} from "@/lib/types";
import { ClassDetailModal } from "./class-detail-modal";

interface DailyGridViewProps {
  semester: Semester | null;
  sections: SectionWithMembers[];
  entries: ScheduleEntry[];
  currentUserId: string;
  isAdmin: boolean;
}

const ROW_HEIGHT = 24; // ultra-compact px per 30-min slot (all 7AM-8PM fits cleanly)
const TIME_COL_WIDTH = 114;
const SECTION_COL_WIDTH = 152;

export function DailyGridView({
  semester,
  sections,
  entries,
  currentUserId,
  isAdmin,
}: DailyGridViewProps) {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getDefaultDayOfWeek);
  const [searchQuery, setSearchQuery] = useState("");
  const [hiddenSectionIds, setHiddenSectionIds] = useState<Set<string>>(
    () => new Set()
  );
  const [selectedModal, setSelectedModal] = useState<{
    entry: ScheduleEntry;
    section: SectionWithMembers;
  } | null>(null);
  const [manilaNow, setManilaNow] = useState(() => getManilaNow());

  useEffect(() => {
    const id = setInterval(() => setManilaNow(getManilaNow()), 60_000);
    return () => clearInterval(id);
  }, []);

  const visibleSections = useMemo(
    () => sections.filter((s) => !hiddenSectionIds.has(s.id)),
    [sections, hiddenSectionIds]
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const entriesBySection = useMemo(() => {
    const map = new Map<string, ScheduleEntry[]>();
    for (const entry of entries) {
      if (entry.day_of_week !== selectedDay) continue;
      if (normalizedQuery) {
        const hay =
          `${entry.course_code} ${entry.instructor ?? ""} ${entry.location ?? ""}`.toLowerCase();
        if (!hay.includes(normalizedQuery)) continue;
      }
      const list = map.get(entry.section_id) ?? [];
      list.push(entry);
      map.set(entry.section_id, list);
    }
    return map;
  }, [entries, selectedDay, normalizedQuery]);

  const toggleSection = (id: string) => {
    setHiddenSectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const showOnlyMine = () => {
    const mine = sections.filter((s) =>
      s.members.some((m) => m.id === currentUserId)
    );
    if (mine.length === 0) return;
    const mineIds = new Set(mine.map((m) => m.id));
    setHiddenSectionIds(
      new Set(sections.filter((s) => !mineIds.has(s.id)).map((s) => s.id))
    );
  };

  const nowTopPx = useMemo(() => {
    if (manilaNow.dayOfWeek !== selectedDay) return null;
    const startMins = START_HOUR * 60;
    const endMins = startMins + TOTAL_SLOTS * 30;
    if (
      manilaNow.minutesFromMidnight < startMins ||
      manilaNow.minutesFromMidnight > endMins
    ) {
      return null;
    }
    return ((manilaNow.minutesFromMidnight - startMins) / 30) * ROW_HEIGHT;
  }, [manilaNow, selectedDay]);

  if (!semester || sections.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
        <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-500 mb-4">
          <CalendarX2 className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold">
          {!semester ? "No Semesters Yet" : `No Sections in ${semester.name}`}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          {isAdmin
            ? "Head to the Admin panel to create a semester, add sections, and enter schedules."
            : "Your admin hasn't added schedules for this semester yet. Check back soon!"}
        </p>
        {isAdmin && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-sm font-semibold hover:opacity-90 transition"
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
      {/* Top Controls: Day Tabs + Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {DAYS.map((day) => {
            const isSelected = selectedDay === day.value;
            const isToday = manilaNow.dayOfWeek === day.value;
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => setSelectedDay(day.value)}
                className={`relative px-3.5 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>{day.label}</span>
                {isToday && (
                  <span
                    title="Today"
                    className={`ml-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle ${
                      isSelected
                        ? "bg-rose-400 dark:bg-rose-600"
                        : "bg-rose-500"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter course, prof, room…"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-3 py-2 text-sm outline-none focus:border-rose-400"
          />
        </div>
      </div>

      {/* Friend / Section Filter Pills */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mr-1">
          <Filter className="h-3.5 w-3.5" />
          Columns:
        </span>
        <button
          type="button"
          onClick={() => setHiddenSectionIds(new Set())}
          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
        >
          Show All
        </button>
        {sections.some((s) => s.members.some((m) => m.id === currentUserId)) && (
          <button
            type="button"
            onClick={showOnlyMine}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition cursor-pointer"
          >
            My Section
          </button>
        )}
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />
        {sections.map((section) => {
          const isVisible = !hiddenSectionIds.has(section.id);
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => toggleSection(section.id)}
              title={
                section.members.length > 0
                  ? formatMemberNames(section.members)
                  : section.code
              }
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                isVisible
                  ? "border-slate-300 dark:border-slate-700 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950"
                  : "border-slate-200 dark:border-slate-800 bg-transparent text-slate-400 line-through hover:text-slate-600"
              }`}
            >
              {section.code}
            </button>
          );
        })}
      </div>

      {/* Main Side-by-Side Schedule Grid */}
      <div className="w-fit max-w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[82vh] overflow-y-auto">
          <div
            style={{
              width: `${TIME_COL_WIDTH + visibleSections.length * SECTION_COL_WIDTH}px`,
            }}
          >
            {/* Sticky Header Row */}
            <div
              className="sticky top-0 z-20 grid border-b border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur"
              style={{
                gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(${visibleSections.length}, ${SECTION_COL_WIDTH}px)`,
              }}
            >
              <div className="sticky left-0 z-30 bg-slate-100/95 dark:bg-slate-900/95 border-r border-slate-200 dark:border-slate-800 px-2 py-2 flex items-center justify-center">
                <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-800 dark:text-slate-100">
                  {DAYS.find((d) => d.value === selectedDay)?.label}
                </span>
              </div>

              {visibleSections.map((section) => {
                const isMine = section.members.some(
                  (m) => m.id === currentUserId
                );
                return (
                  <div
                    key={section.id}
                    className={`min-w-0 px-2 py-1.5 text-center border-r last:border-r-0 border-slate-200 dark:border-slate-800 flex flex-col justify-center ${
                      isMine ? "bg-rose-50/60 dark:bg-rose-950/30" : ""
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {section.code}
                    </div>
                    <div className="text-[10px] leading-snug text-slate-500 dark:text-slate-400 mt-0.5">
                      {section.members.length > 0 ? (
                        section.members.map((m, idx) => (
                          <span key={m.id}>
                            {idx > 0 && <br />}
                            {m.display_name}
                          </span>
                        ))
                      ) : (
                        <span>Unassigned</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Grid Body */}
            <div
              className="relative grid"
              style={{
                gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(${visibleSections.length}, ${SECTION_COL_WIDTH}px)`,
                height: `${TOTAL_SLOTS * ROW_HEIGHT}px`,
              }}
            >
              {/* Left Sticky Time Column */}
              <div className="sticky left-0 z-10 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                {TIME_SLOTS.map((slot) => (
                  <div
                    key={slot.index}
                    style={{ height: `${ROW_HEIGHT}px` }}
                    title={slot.isBreak ? `${slot.label} (Lunch Time)` : slot.label}
                    className={`px-1.5 flex items-center justify-center gap-1 text-[10px] font-medium border-b border-slate-100 dark:border-slate-800/80 tabular-nums whitespace-nowrap ${
                      slot.isBreak
                        ? "bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <span>{slot.label}</span>
                  </div>
                ))}
              </div>

              {/* Section Columns */}
              {visibleSections.map((section) => {
                const sectionEntries = entriesBySection.get(section.id) ?? [];
                return (
                  <div
                    key={section.id}
                    className="relative min-w-0 border-r last:border-r-0 border-slate-200/80 dark:border-slate-800"
                  >
                    {/* Background 30-min cells */}
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

                    {/* Schedule Entry Cards */}
                    {sectionEntries.map((entry) => {
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
                      const isInternship = entry.category === "internship";

                      return (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => setSelectedModal({ entry, section })}
                          style={{ top: `${top}px`, height: `${height}px` }}
                          className={`absolute left-0.5 right-0.5 rounded-lg border px-1.5 py-0.5 text-center flex flex-col items-center justify-center overflow-hidden shadow-xs hover:brightness-95 dark:hover:brightness-110 transition cursor-pointer ${colors.cardClass}`}
                        >
                          <span
                            className={`font-bold leading-tight truncate max-w-full ${
                              isInternship && spanSlots >= 6
                                ? "text-sm tracking-widest uppercase"
                                : "text-[11px]"
                            }`}
                          >
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

              {/* Current Time Line */}
              {nowTopPx !== null && (
                <div
                  style={{ top: `${nowTopPx}px` }}
                  className="pointer-events-none absolute left-0 right-0 z-15 flex items-center"
                >
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-500 -ml-1 shadow" />
                  <div className="flex-1 h-0.5 bg-rose-500/80" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Color Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-slate-400 px-1">
        {(["coral", "blush", "amber", "cream"] as const).map((key) => (
          <span key={key} className="flex items-center gap-1.5">
            <span
              className={`h-3 w-3 rounded border ${COLOR_PRESETS[key].swatchClass}`}
            />
            {COLOR_PRESETS[key].name}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border bg-emerald-50 border-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800" />
          12:00 PM – 1:00 PM Lunch Time
        </span>
      </div>

      <ClassDetailModal
        entry={selectedModal?.entry ?? null}
        section={selectedModal?.section ?? null}
        onClose={() => setSelectedModal(null)}
      />
    </div>
  );
}
