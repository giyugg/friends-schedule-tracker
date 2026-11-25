"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { getSectionAcademicInfo } from "@/lib/academic-catalog";
import { timeToMinutes } from "@/lib/schedule-utils";
import type {
  Profile,
  ScheduleEntry,
  SectionWithMembers,
  Semester,
} from "@/lib/types";
import { formatWeeklyHours } from "./profile-helpers";

interface ScheduleSnapshotCardProps {
  activeSemester: Semester | null;
  userSection: SectionWithMembers | null;
  sectionEntries: ScheduleEntry[];
  sectionMates: Pick<Profile, "id" | "display_name" | "email">[];
  buildHref: (path: string) => string;
}

export function ScheduleSnapshotCard({
  activeSemester,
  userSection,
  sectionEntries,
  sectionMates,
  buildHref,
}: ScheduleSnapshotCardProps) {
  const academic = useMemo(
    () => (userSection ? getSectionAcademicInfo(userSection) : null),
    [userSection]
  );

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

  return (
    <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-sky-500" />
            Schedule &amp; Section Snapshot
          </h3>
          {userSection && (
            <div className="flex items-center gap-1.5">
              {academic?.college && (
                <span
                  title={academic.college.name}
                  className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold border border-indigo-200/70 dark:border-indigo-900/60"
                >
                  {academic.college.code}
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-semibold border border-sky-200/70 dark:border-sky-900/60">
                {userSection.code}
              </span>
            </div>
          )}
        </div>

        {(academic?.college || academic?.program) && (
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
                {academic.specialization ? ` · ${academic.specialization}` : ""}
              </>
            )}
          </p>
        )}

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
                  You are the only member assigned to {userSection.code} in this
                  semester.
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
  );
}
