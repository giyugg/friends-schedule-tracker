"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Award, GraduationCap, Lock, Trophy } from "lucide-react";
import {
  evaluateGoldGear,
  evaluateLatinHonors,
  formatGwa,
} from "@/lib/grades-utils";
import type { GradeTermWithEntries } from "@/lib/types";

interface AcademicSummaryCardProps {
  gradeTerms: GradeTermWithEntries[];
  gradesMigrationRequired: boolean;
  buildHref: (path: string) => string;
}

export function AcademicSummaryCard({
  gradeTerms,
  gradesMigrationRequired,
  buildHref,
}: AcademicSummaryCardProps) {
  const latinEval = useMemo(
    () => evaluateLatinHonors(gradeTerms),
    [gradeTerms]
  );
  const goldGearEval = useMemo(
    () => evaluateGoldGear(gradeTerms),
    [gradeTerms]
  );

  return (
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
            Grades storage is not initialized yet. Open the Grades tab for setup
            details.
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
            No grades recorded yet. Your grades are completely private and only
            visible to you.
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
  );
}
