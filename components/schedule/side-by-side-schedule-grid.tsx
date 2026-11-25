"use client";

import {
  formatSectionTooltip,
  getSectionAcademicInfo,
} from "@/lib/academic-catalog";
import {
  COLOR_PRESETS,
  DAYS,
  formatTime12h,
  getEntryColorClasses,
  START_HOUR,
  TIME_SLOTS,
  timeToSlotIndex,
  TOTAL_SLOTS,
} from "@/lib/schedule-utils";
import type {
  DayOfWeek,
  ScheduleEntry,
  SectionWithMembers,
} from "@/lib/types";

export const SCHEDULE_ROW_HEIGHT = 24; // ultra-compact px per 30-min slot (all 7AM-8PM fits cleanly)
const TIME_COL_WIDTH = 114;
const SECTION_COL_WIDTH = 152;

export function computeNowTopPx(
  manilaNow: { dayOfWeek: number; minutesFromMidnight: number },
  selectedDay: DayOfWeek
): number | null {
  if (manilaNow.dayOfWeek !== selectedDay) return null;
  const startMins = START_HOUR * 60;
  const endMins = startMins + TOTAL_SLOTS * 30;
  if (
    manilaNow.minutesFromMidnight < startMins ||
    manilaNow.minutesFromMidnight > endMins
  ) {
    return null;
  }
  return ((manilaNow.minutesFromMidnight - startMins) / 30) * SCHEDULE_ROW_HEIGHT;
}

interface SideBySideScheduleGridProps {
  sections: SectionWithMembers[];
  entriesBySection: Map<string, ScheduleEntry[]>;
  selectedDay: DayOfWeek;
  currentUserId: string;
  nowTopPx: number | null;
  onSelectEntry: (selection: {
    entry: ScheduleEntry;
    section: SectionWithMembers;
  }) => void;
  maxHeightClass?: string;
  showCollegeBadge?: boolean;
  getMemberRole?: (userId: string) => string | null;
}

export function SideBySideScheduleGrid({
  sections,
  entriesBySection,
  selectedDay,
  currentUserId,
  nowTopPx,
  onSelectEntry,
  maxHeightClass = "max-h-[82vh]",
  showCollegeBadge = false,
  getMemberRole,
}: SideBySideScheduleGridProps) {
  return (
    <div className="w-fit max-w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
      <div className={`overflow-x-auto ${maxHeightClass} overflow-y-auto`}>
        <div
          style={{
            width: `${TIME_COL_WIDTH + sections.length * SECTION_COL_WIDTH}px`,
          }}
        >
          {/* Sticky Header Row */}
          <div
            className="sticky top-0 z-20 grid border-b border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur"
            style={{
              gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(${sections.length}, ${SECTION_COL_WIDTH}px)`,
            }}
          >
            <div className="sticky left-0 z-30 bg-slate-100/95 dark:bg-slate-900/95 border-r border-slate-200 dark:border-slate-800 px-2 py-2 flex items-center justify-center">
              <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-800 dark:text-slate-100">
                {DAYS.find((d) => d.value === selectedDay)?.label}
              </span>
            </div>

            {sections.map((section) => {
              const isMine = section.members.some(
                (m) => m.id === currentUserId
              );
              const academic = showCollegeBadge
                ? getSectionAcademicInfo(section)
                : null;
              return (
                <div
                  key={section.id}
                  title={
                    showCollegeBadge ? formatSectionTooltip(section) : undefined
                  }
                  className={`min-w-0 px-2 py-1.5 text-center border-r last:border-r-0 border-slate-200 dark:border-slate-800 flex flex-col justify-center ${
                    isMine ? "bg-rose-50/60 dark:bg-rose-950/30" : ""
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate flex items-center justify-center gap-1">
                    {academic?.college && (
                      <span className="shrink-0 px-1 py-0.2 rounded text-[9px] font-bold uppercase bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                        {academic.college.code}
                      </span>
                    )}
                    <span className="truncate">{section.code}</span>
                  </div>

                  {getMemberRole ? (
                    <div className="text-[10px] leading-snug text-slate-500 dark:text-slate-400 mt-0.5 space-y-0.5">
                      {section.members.map((m) => {
                        const roleLabel = getMemberRole(m.id);
                        return (
                          <div key={m.id} className="leading-tight">
                            <div className="truncate">{m.display_name}</div>
                            {roleLabel && (
                              <div className="text-[9px] font-semibold text-sky-600 dark:text-sky-400 truncate">
                                {roleLabel}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
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
                  )}
                </div>
              );
            })}
          </div>

          {/* Grid Body */}
          <div
            className="relative grid"
            style={{
              gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(${sections.length}, ${SECTION_COL_WIDTH}px)`,
              height: `${TOTAL_SLOTS * SCHEDULE_ROW_HEIGHT}px`,
            }}
          >
            {/* Left Sticky Time Column */}
            <div className="sticky left-0 z-10 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              {TIME_SLOTS.map((slot) => (
                <div
                  key={slot.index}
                  style={{ height: `${SCHEDULE_ROW_HEIGHT}px` }}
                  title={
                    slot.isBreak ? `${slot.label} (Lunch Time)` : slot.label
                  }
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
            {sections.map((section) => {
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
                      style={{ height: `${SCHEDULE_ROW_HEIGHT}px` }}
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
                    const top = startIdx * SCHEDULE_ROW_HEIGHT + 1;
                    const height = spanSlots * SCHEDULE_ROW_HEIGHT - 2;
                    const colors = getEntryColorClasses(entry);
                    const isInternship = entry.category === "internship";

                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => onSelectEntry({ entry, section })}
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
  );
}

export function ScheduleColorLegend() {
  return (
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
  );
}
