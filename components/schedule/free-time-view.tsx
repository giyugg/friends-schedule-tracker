"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  Coffee,
  MapPin,
  Radio,
  Users,
} from "lucide-react";
import {
  computeCommonFreeSlots,
  DAYS,
  formatCompactDuration,
  formatDuration,
  formatMemberNames,
  formatTime12h,
  getDefaultDayOfWeek,
  getLiveSectionStatus,
  TIME_SLOTS,
} from "@/lib/schedule-utils";
import { useManilaTime } from "@/lib/use-manila-time";
import type {
  DayOfWeek,
  ScheduleEntry,
  SectionWithMembers,
  Semester,
  VisibilityGroupWithMembers,
} from "@/lib/types";

interface FreeTimeViewProps {
  semester: Semester | null;
  sections: SectionWithMembers[];
  entries: ScheduleEntry[];
  groups?: VisibilityGroupWithMembers[];
}

export function FreeTimeView({
  semester,
  sections,
  entries,
  groups = [],
}: FreeTimeViewProps) {
  const manilaNow = useManilaTime();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getDefaultDayOfWeek);
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>(() =>
    sections.map((s) => s.id)
  );

  const entriesBySection = useMemo(() => {
    const map = new Map<string, ScheduleEntry[]>();
    for (const entry of entries) {
      const list = map.get(entry.section_id) ?? [];
      list.push(entry);
      map.set(entry.section_id, list);
    }
    return map;
  }, [entries]);

  const liveStatuses = useMemo(
    () =>
      sections.map((section) => ({
        section,
        status: getLiveSectionStatus(
          entriesBySection.get(section.id) ?? [],
          manilaNow
        ),
      })),
    [sections, entriesBySection, manilaNow]
  );

  const commonFreeWindows = useMemo(
    () => computeCommonFreeSlots(entries, selectedSectionIds, selectedDay),
    [entries, selectedSectionIds, selectedDay]
  );

  const freeSlotSet = useMemo(() => {
    const set = new Set<number>();
    for (const w of commonFreeWindows) {
      for (let i = w.startSlot; i < w.endSlot; i++) {
        set.add(i);
      }
    }
    return set;
  }, [commonFreeWindows]);

  const toggleSection = (id: string) => {
    setSelectedSectionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const groupPresets = useMemo(
    () =>
      groups
        .map((group) => {
          const memberSet = new Set(group.memberIds);
          const sectionIds = sections
            .filter((sec) => sec.members.some((m) => memberSet.has(m.id)))
            .map((sec) => sec.id);
          return { group, sectionIds };
        })
        .filter((item) => item.sectionIds.length > 0),
    [groups, sections]
  );

  if (!semester || sections.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
        <Coffee className="h-8 w-8 mx-auto text-slate-400 mb-3" />
        <h2 className="text-lg font-bold">No Schedules to Compare Yet</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Once sections and classes are added, you can see who&apos;s free right
          now and find overlapping hangout windows.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Live Status Board */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Radio className="h-5 w-5 text-emerald-500" />
              Who&apos;s Free Right Now
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Live status in Philippine Time (Asia/Manila) ·{" "}
              <span
                suppressHydrationWarning
                className="font-semibold text-slate-700 dark:text-slate-200"
              >
                {manilaNow.timeLabel}
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {liveStatuses.map(({ section, status }) => {
            const isFree =
              status.state === "free" ||
              status.state === "done" ||
              status.state === "sunday";
            return (
              <div
                key={section.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate">
                      {formatMemberNames(section.members)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {section.code}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      isFree
                        ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300"
                        : "bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300"
                    }`}
                  >
                    {status.state === "in_class"
                      ? "In Class"
                      : status.state === "done"
                        ? "Done Today"
                        : status.state === "sunday"
                          ? "Sunday"
                          : "Free Now"}
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {status.state === "in_class" && (
                    <div className="space-y-1">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {status.currentEntry.course_code}
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {status.currentEntry.location ||
                            status.currentEntry.modality.toUpperCase()}
                        </span>
                        <span>·</span>
                        <span className="shrink-0">
                          until {formatTime12h(status.currentEntry.end_time)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          Free in{" "}
                          {formatCompactDuration(status.minutesUntilFree)}
                          {status.hasBackToBack
                            ? ` (back-to-back til ${formatTime12h(status.freeAtTime)})`
                            : ""}
                        </span>
                      </div>
                    </div>
                  )}
                  {status.state === "free" &&
                    (status.nextEntry ? (
                      <div className="space-y-1">
                        <div>
                          Next: <strong>{status.nextEntry.course_code}</strong>{" "}
                          at {formatTime12h(status.nextEntry.start_time)}
                        </div>
                        {status.minutesUntilNext !== null && (
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span>
                              Next class in{" "}
                              {formatCompactDuration(status.minutesUntilNext)}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span>No classes scheduled today</span>
                    ))}
                  {status.state === "done" && (
                    <span>All classes finished for today</span>
                  )}
                  {status.state === "sunday" && <span>No Sunday classes</span>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Common Free Time Finder */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Users className="h-5 w-5 text-rose-500" />
              Common Free Time Finder
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Select friends/sections and a day to see when everyone is free at
              the same time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedSectionIds(sections.map((s) => s.id))}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={() => setSelectedSectionIds([])}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Clear
            </button>
            {groupPresets.length > 0 && (
              <>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />
                {groupPresets.map(({ group, sectionIds }) => {
                  const isPresetActive =
                    selectedSectionIds.length === sectionIds.length &&
                    sectionIds.every((id) => selectedSectionIds.includes(id));
                  const isOrg = group.type === "organization";
                  const Icon = isOrg ? Building2 : Users;
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setSelectedSectionIds(sectionIds)}
                      title={
                        group.description ??
                        `Select ${group.name}'s sections (${sectionIds.length})`
                      }
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        isPresetActive
                          ? isOrg
                            ? "border-sky-400 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-200"
                            : "border-rose-400 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-200"
                          : "border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Icon
                        className={`h-3 w-3 shrink-0 ${
                          isOrg ? "text-sky-500" : "text-rose-500"
                        }`}
                      />
                      <span>{group.name}</span>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Day Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {DAYS.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => setSelectedDay(day.value)}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                selectedDay === day.value
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>

        {/* Section Checkboxes */}
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => {
            const checked = selectedSectionIds.includes(section.id);
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => toggleSection(section.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-2 cursor-pointer ${
                  checked
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200"
                    : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                <CheckCircle2
                  className={`h-3.5 w-3.5 ${
                    checked
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "opacity-30"
                  }`}
                />
                <span>
                  {formatMemberNames(section.members)} · {section.code}
                </span>
              </button>
            );
          })}
        </div>

        {/* Visual Timeline Bar */}
        {selectedSectionIds.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              7:00 AM – 8:00 PM Availability Bar (Green = Everyone Free)
            </div>
            <div className="grid grid-cols-26 gap-0.5 h-8 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 p-1">
              {TIME_SLOTS.map((slot) => {
                const isFree = freeSlotSet.has(slot.index);
                return (
                  <div
                    key={slot.index}
                    title={`${slot.label}: ${isFree ? "Everyone Free" : "Someone in class"}`}
                    className={`rounded-sm transition ${
                      isFree
                        ? "bg-emerald-400 dark:bg-emerald-500"
                        : "bg-rose-300/70 dark:bg-rose-900/70"
                    }`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 tabular-nums">
              <span>7:00 AM</span>
              <span>10:00 AM</span>
              <span>1:00 PM</span>
              <span>4:00 PM</span>
              <span>8:00 PM</span>
            </div>
          </div>
        )}

        {/* Free Windows List */}
        <div className="pt-2">
          {selectedSectionIds.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Pick at least one section above to view available free slots.
            </p>
          ) : commonFreeWindows.length === 0 ? (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 p-4 text-sm text-amber-800 dark:text-amber-200">
              No overlapping free slots between 7:00 AM and 8:00 PM for the
              selected sections on{" "}
              {DAYS.find((d) => d.value === selectedDay)?.label}.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {commonFreeWindows.map((win) => (
                <div
                  key={`${win.startTime}-${win.endTime}`}
                  className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="font-semibold text-sm text-emerald-950 dark:text-emerald-100">
                      {formatTime12h(win.startTime)} –{" "}
                      {formatTime12h(win.endTime)}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-200/70 dark:bg-emerald-900/70 text-emerald-900 dark:text-emerald-200 text-xs font-bold shrink-0">
                    {formatDuration(win.durationMinutes)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
