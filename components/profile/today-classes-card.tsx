"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  Clock,
  Coffee,
  MapPin,
  Radio,
} from "lucide-react";
import {
  DAYS,
  formatCompactDuration,
  formatTime12h,
  getLiveSectionStatus,
  timeToMinutes,
} from "@/lib/schedule-utils";
import { useManilaTime } from "@/lib/use-manila-time";
import type { ScheduleEntry, Semester } from "@/lib/types";

interface TodayClassesCardProps {
  activeSemester: Semester | null;
  hasAssignedSection: boolean;
  myAllEntries: ScheduleEntry[];
  buildHref: (path: string) => string;
}

export function TodayClassesCard({
  activeSemester,
  hasAssignedSection,
  myAllEntries,
  buildHref,
}: TodayClassesCardProps) {
  const manilaNow = useManilaTime(60_000);

  const myLiveStatus = useMemo(() => {
    if (!hasAssignedSection) return null;
    return getLiveSectionStatus(myAllEntries, manilaNow);
  }, [hasAssignedSection, myAllEntries, manilaNow]);

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
    return DAYS.find((d) => d.value === manilaNow.dayOfWeek)?.label ?? "Today";
  }, [manilaNow.dayOfWeek]);

  return (
    <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Radio className="h-4 w-4 text-rose-500 animate-pulse" />
            My Class Status
          </h3>
          <span
            suppressHydrationWarning
            className="text-[11px] font-medium text-slate-500 dark:text-slate-400"
          >
            {manilaDayLabel} · {manilaNow.timeLabel}
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
                No classes scheduled for {manilaDayLabel}. Enjoy your free day!
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
              All your {manilaDayLabel} classes have finished. You&apos;re free
              for the rest of the day!
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
  );
}
