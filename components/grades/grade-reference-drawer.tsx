"use client";

import { useMemo, useState } from "react";
import { BookOpen, Calculator, ChevronDown, ChevronUp } from "lucide-react";
import {
  getGradeInfo,
  percentageToGrade,
  TRANSMUTATION_TABLE,
} from "@/lib/grades-utils";
import { gradeBadgeClasses } from "./grades-view-helpers";

export function GradeReferenceDrawer() {
  const [showReference, setShowReference] = useState(false);
  const [converterInput, setConverterInput] = useState("");

  const converterResult = useMemo(() => {
    if (!converterInput.trim()) return null;
    const val = Number(converterInput);
    const grade = percentageToGrade(val);
    if (!grade) return null;
    return getGradeInfo(grade);
  }, [converterInput]);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <button
        type="button"
        onClick={() => setShowReference((prev) => !prev)}
        className="w-full px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <BookOpen className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-semibold">
            Transmutation Table &amp; Honor Eligibility Reference
          </span>
        </div>
        {showReference ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {showReference && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transmutation Table + Quick Converter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Transmutation Table
              </h3>
              <div className="flex items-center gap-2">
                <Calculator className="h-3.5 w-3.5 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Quick % check..."
                  value={converterInput}
                  onChange={(e) => setConverterInput(e.target.value)}
                  className="w-32 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 text-xs tabular-nums outline-none focus:border-rose-400"
                />
                {converterResult && (
                  <span
                    className={`rounded-md border px-2 py-0.5 text-xs font-bold tabular-nums ${gradeBadgeClasses(
                      converterResult.grade
                    )}`}
                  >
                    {converterResult.grade}
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/60 text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-3.5 py-2">Grade</th>
                    <th className="px-3.5 py-2">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {TRANSMUTATION_TABLE.map((row) => (
                    <tr key={row.grade}>
                      <td className="px-3.5 py-1.5 font-bold tabular-nums">
                        {row.grade}
                      </td>
                      <td className="px-3.5 py-1.5 text-slate-600 dark:text-slate-300">
                        {row.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gold Gear & BulSU Latin Honor Criteria */}
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                1. Gold Gear Awards
              </h3>
              <p>
                <strong className="text-slate-900 dark:text-slate-100">
                  1.1 President&apos;s List Award:
                </strong>{" "}
                GWA of 1.20–1.00 with no grade lower than 2.0 in any subject
                enrolled for the last two consecutive semesters prior to the
                award.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-slate-100">
                  1.2 Dean&apos;s List Award:
                </strong>{" "}
                GWA of 1.75–1.21 with no grade lower than 2.0 in any subject
                enrolled for the last two consecutive semesters prior to the
                award.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-slate-100">
                  1.3 General Eligibility:
                </strong>{" "}
                Candidates must be officially enrolled with a minimum of 15
                academic units (or as prescribed in the regular curriculum) in
                the last two consecutive semesters (2nd semester of the
                preceding academic year and 1st semester of the current academic
                year). Open to students from 2nd year to senior year.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                2. BulSU Latin Honor Basis
              </h3>
              <p>
                <strong className="text-slate-900 dark:text-slate-100">
                  2.1 Summa Cum Laude:
                </strong>{" "}
                GWA of 1.00–1.20 with no grade lower than 2.00.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-slate-100">
                  2.2 Magna Cum Laude:
                </strong>{" "}
                GWA of 1.21–1.45 with no grade lower than 2.25.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-slate-100">
                  2.3 Cum Laude:
                </strong>{" "}
                GWA of 1.46–1.75 with no grade lower than 2.50.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
