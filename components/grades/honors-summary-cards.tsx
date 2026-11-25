"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  GraduationCap,
  Trophy,
  XCircle,
} from "lucide-react";
import {
  evaluateGoldGear,
  evaluateLatinHonors,
  formatGwa,
} from "@/lib/grades-utils";
import type { GradeTermWithEntries } from "@/lib/types";

interface HonorsSummaryCardsProps {
  effectiveTerms: GradeTermWithEntries[];
}

export function HonorsSummaryCards({
  effectiveTerms,
}: HonorsSummaryCardsProps) {
  const [selectedPairIndex, setSelectedPairIndex] = useState<number | null>(
    null
  );

  const goldGear = useMemo(
    () => evaluateGoldGear(effectiveTerms),
    [effectiveTerms]
  );

  const displayedPair = useMemo(() => {
    if (goldGear.allPairs.length === 0) return null;
    if (
      selectedPairIndex !== null &&
      selectedPairIndex >= 0 &&
      selectedPairIndex < goldGear.allPairs.length
    ) {
      return goldGear.allPairs[selectedPairIndex];
    }
    return goldGear.latestPair;
  }, [goldGear, selectedPairIndex]);

  const latinHonors = useMemo(
    () => evaluateLatinHonors(effectiveTerms),
    [effectiveTerms]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Cumulative GWA */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Cumulative GWA
            </span>
            <GraduationCap className="h-4 w-4 text-rose-500" />
          </div>

          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-3xl font-bold tracking-tight tabular-nums">
              {formatGwa(latinHonors.cumulativeStats.rawGwa, 4)}
            </span>
            {latinHonors.cumulativeStats.roundedGwa !== null && (
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                (rounded{" "}
                <strong className="text-slate-700 dark:text-slate-200">
                  {latinHonors.cumulativeStats.roundedGwa.toFixed(2)}
                </strong>
                )
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="text-slate-400">Semesters</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
              {effectiveTerms.length}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Acad. Units</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
              {latinHonors.cumulativeStats.academicUnits}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Lowest Grade</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
              {latinHonors.cumulativeStats.lowestNumericGrade !== null
                ? latinHonors.cumulativeStats.lowestNumericGrade.toFixed(2)
                : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Gold Gear Awards */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Gold Gear Awards
            </span>
            <Trophy className="h-4 w-4 text-amber-500" />
          </div>

          {displayedPair ? (
            <>
              <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${
                    displayedPair.status === "presidents_list"
                      ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800"
                      : displayedPair.status === "deans_list"
                        ? "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-800"
                        : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                  }`}
                >
                  {displayedPair.awardLabel}
                </span>

                {goldGear.allPairs.length > 1 && (
                  <select
                    aria-label="Select Gold Gear consecutive semester pair"
                    value={selectedPairIndex ?? goldGear.allPairs.length - 1}
                    onChange={(e) =>
                      setSelectedPairIndex(Number(e.target.value))
                    }
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-[11px] font-medium outline-none cursor-pointer"
                  >
                    {goldGear.allPairs.map((pair, idx) => (
                      <option key={pair.currTerm.id} value={idx}>
                        {pair.prevTerm.academic_year} 2nd +{" "}
                        {pair.currTerm.academic_year} 1st
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <ul className="mt-3 space-y-1.5 text-xs">
                {displayedPair.checklist.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300"
                  >
                    {item.passed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <span>
                      <strong className="font-semibold text-slate-800 dark:text-slate-100">
                        {item.label}:
                      </strong>{" "}
                      {item.detail}
                    </span>
                  </li>
                ))}
              </ul>

              {displayedPair.warnings.length > 0 && (
                <div className="mt-2.5 space-y-1">
                  {displayedPair.warnings.map((w) => (
                    <p
                      key={w}
                      className="text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-1"
                    >
                      <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </p>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {goldGear.hint}
            </p>
          )}
        </div>
      </div>

      {/* 3. BulSU Latin Honor Basis */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              BulSU Latin Honor Basis
            </span>
            <Award className="h-4 w-4 text-violet-500" />
          </div>

          <div className="mt-2.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${
                latinHonors.standing === "summa_cum_laude"
                  ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800"
                  : latinHonors.standing === "magna_cum_laude"
                    ? "bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/60 dark:text-violet-200 dark:border-violet-800"
                    : latinHonors.standing === "cum_laude"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800"
                      : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
              }`}
            >
              {latinHonors.standingLabel}
            </span>
          </div>

          <div className="mt-3 space-y-1.5 text-xs">
            {latinHonors.tiers.map((tier) => (
              <div
                key={tier.tier}
                className="flex items-center justify-between gap-2 text-slate-600 dark:text-slate-300"
              >
                <span className="flex items-center gap-1.5">
                  {tier.qualified ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <span className="h-3.5 w-3.5 rounded-full border border-slate-300 dark:border-slate-700 inline-block shrink-0" />
                  )}
                  <span
                    className={
                      tier.qualified
                        ? "font-semibold text-slate-900 dark:text-slate-100"
                        : ""
                    }
                  >
                    {tier.label}
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 tabular-nums">
                  {tier.gwaRange} · min {tier.minGradeAllowed.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {latinHonors.disqualificationReason && (
            <p className="mt-2.5 text-[11px] text-rose-600 dark:text-rose-400 flex items-start gap-1">
              <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{latinHonors.disqualificationReason}</span>
            </p>
          )}

          {latinHonors.warnings.length > 0 && (
            <div className="mt-2 space-y-1">
              {latinHonors.warnings.map((w) => (
                <p
                  key={w}
                  className="text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-1"
                >
                  <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
