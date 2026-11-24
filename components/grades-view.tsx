"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Award,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Database,
  GraduationCap,
  Lock,
  LockOpen,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import {
  createGradeTermAction,
  deleteGradeTermAction,
  saveGradeTermEntriesAction,
  unlockGradeTermAction,
} from "@/app/actions/grades";
import {
  computeTermStats,
  evaluateGoldGear,
  evaluateLatinHonors,
  formatGwa,
  formatSemesterLabel,
  formatYearLevel,
  getGradeInfo,
  percentageToGrade,
  sortGradeTerms,
  TRANSMUTATION_TABLE,
} from "@/lib/grades-utils";
import type {
  GradeEntry,
  GradeSemesterType,
  GradeTermWithEntries,
  GradeValue,
} from "@/lib/types";

interface GradesViewProps {
  initialTerms: GradeTermWithEntries[];
  migrationRequired?: boolean;
}

interface DraftRow {
  localId: string;
  courseCode: string;
  courseName: string;
  units: string;
  gradeValue: GradeValue;
  isAcademic: boolean;
}

function makeDraftRows(entries: GradeEntry[]): DraftRow[] {
  return entries.map((e) => ({
    localId: e.id,
    courseCode: e.course_code,
    courseName: e.course_name,
    units: String(e.units),
    gradeValue: e.grade_value,
    isAcademic: e.is_academic,
  }));
}

function makeEmptyRow(): DraftRow {
  return {
    localId: `new-${Math.random().toString(36).slice(2, 10)}`,
    courseCode: "",
    courseName: "",
    units: "3",
    gradeValue: "1.00",
    isAcademic: true,
  };
}

function formatDateShort(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function gradeBadgeClasses(grade: GradeValue): string {
  const info = getGradeInfo(grade);
  if (info.category === "failing") {
    return "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900";
  }
  if (info.category === "conditional") {
    return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900";
  }
  if (info.category === "special") {
    return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  }
  if (info.numericValue !== null && info.numericValue <= 1.5) {
    return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900";
  }
  if (info.numericValue !== null && info.numericValue <= 2.0) {
    return "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-900";
  }
  return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700";
}

export function GradesView({
  initialTerms,
  migrationRequired = false,
}: GradesViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const sortedTerms = useMemo(
    () => sortGradeTerms(initialTerms),
    [initialTerms]
  );

  const [selectedTermId, setSelectedTermId] = useState<string | null>(() => {
    if (sortedTerms.length === 0) return null;
    return sortedTerms[sortedTerms.length - 1].id;
  });

  // Resolve active term safely if initialTerms changed (e.g., after delete)
  const activeTerm = useMemo(() => {
    if (sortedTerms.length === 0) return null;
    return (
      sortedTerms.find((t) => t.id === selectedTermId) ??
      sortedTerms[sortedTerms.length - 1]
    );
  }, [sortedTerms, selectedTermId]);

  // Draft rows keyed by termId so switching tabs or receiving fresh server props stays predictable
  const [draftsByTerm, setDraftsByTerm] = useState<
    Record<string, { rows: DraftRow[]; dirty: boolean }>
  >({});

  const activeDraft = useMemo(() => {
    if (!activeTerm) return { rows: [] as DraftRow[], dirty: false };
    const stored = draftsByTerm[activeTerm.id];
    if (stored) return stored;
    return {
      rows:
        activeTerm.entries.length > 0
          ? makeDraftRows(activeTerm.entries)
          : activeTerm.is_locked
            ? []
            : [makeEmptyRow()],
      dirty: false,
    };
  }, [activeTerm, draftsByTerm]);

  // Modals & UI toggles
  const [showAddTermModal, setShowAddTermModal] = useState(false);
  const [newAcademicYear, setNewAcademicYear] = useState("2025-2026");
  const [newSemesterType, setNewSemesterType] =
    useState<GradeSemesterType>("1st");
  const [newYearLevel, setNewYearLevel] = useState(2);

  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReference, setShowReference] = useState(false);
  const [converterInput, setConverterInput] = useState("");
  const [selectedPairIndex, setSelectedPairIndex] = useState<number | null>(
    null
  );

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Merge live unsaved edits for the currently active unlocked term into stats & honors preview
  const effectiveTerms = useMemo<GradeTermWithEntries[]>(() => {
    return sortedTerms.map((term) => {
      if (term.is_locked) return term;
      const stored = draftsByTerm[term.id];
      if (!stored || !stored.dirty) return term;

      const syntheticEntries: GradeEntry[] = stored.rows
        .filter((r) => r.courseCode.trim().length > 0 || Number(r.units) > 0)
        .map((r, idx) => ({
          id: r.localId,
          term_id: term.id,
          user_id: term.user_id,
          course_code: r.courseCode.trim() || `SUBJ ${idx + 1}`,
          course_name: r.courseName.trim(),
          units: Number(r.units) > 0 ? Number(r.units) : 0,
          grade_value: r.gradeValue,
          is_academic: r.isAcademic,
          display_order: idx,
          created_at: term.created_at,
          updated_at: term.updated_at,
        }));

      return { ...term, entries: syntheticEntries };
    });
  }, [sortedTerms, draftsByTerm]);

  const activeEffectiveTerm = useMemo(() => {
    if (!activeTerm) return null;
    return effectiveTerms.find((t) => t.id === activeTerm.id) ?? activeTerm;
  }, [effectiveTerms, activeTerm]);

  const activeTermStats = useMemo(
    () => (activeEffectiveTerm ? computeTermStats(activeEffectiveTerm) : null),
    [activeEffectiveTerm]
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

  const converterResult = useMemo(() => {
    if (!converterInput.trim()) return null;
    const val = Number(converterInput);
    const grade = percentageToGrade(val);
    if (!grade) return null;
    return getGradeInfo(grade);
  }, [converterInput]);

  // Draft mutation helpers
  const updateActiveRows = (updater: (prev: DraftRow[]) => DraftRow[]) => {
    if (!activeTerm || activeTerm.is_locked) return;
    setDraftsByTerm((prev) => {
      const current = prev[activeTerm.id]?.rows ?? activeDraft.rows;
      return {
        ...prev,
        [activeTerm.id]: { rows: updater(current), dirty: true },
      };
    });
  };

  const handleRowChange = (
    localId: string,
    patch: Partial<Omit<DraftRow, "localId">>
  ) => {
    updateActiveRows((rows) =>
      rows.map((r) => (r.localId === localId ? { ...r, ...patch } : r))
    );
  };

  const handleAddRow = () => {
    updateActiveRows((rows) => [...rows, makeEmptyRow()]);
  };

  const handleRemoveRow = (localId: string) => {
    updateActiveRows((rows) => rows.filter((r) => r.localId !== localId));
  };

  const handleCreateTerm = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await createGradeTermAction({
        academicYear: newAcademicYear,
        semesterType: newSemesterType,
        yearLevel: newYearLevel,
      });
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: res.error ?? "Could not add semester.",
        });
        return;
      }
      setShowAddTermModal(false);
      if (res.termId) {
        setSelectedTermId(res.termId);
      }
      setFeedback({ type: "success", text: res.message ?? "Semester added." });
      router.refresh();
    });
  };

  const handleSaveEntries = (lockAfterSave: boolean) => {
    if (!activeTerm) return;
    setFeedback(null);

    const nonEmptyRows = activeDraft.rows.filter(
      (r) => r.courseCode.trim() !== "" || r.courseName.trim() !== ""
    );

    startTransition(async () => {
      const res = await saveGradeTermEntriesAction({
        termId: activeTerm.id,
        lockAfterSave,
        entries: nonEmptyRows.map((r) => ({
          courseCode: r.courseCode,
          courseName: r.courseName,
          units: Number(r.units),
          gradeValue: r.gradeValue,
          isAcademic: r.isAcademic,
        })),
      });

      if (!res.ok) {
        setFeedback({
          type: "error",
          text: res.error ?? "Failed to save grades.",
        });
        return;
      }

      setDraftsByTerm((prev) => {
        const next = { ...prev };
        delete next[activeTerm.id];
        return next;
      });
      setFeedback({
        type: "success",
        text: res.message ?? "Grades saved.",
      });
      router.refresh();
    });
  };

  const handleConfirmUnlock = () => {
    if (!activeTerm) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await unlockGradeTermAction(activeTerm.id);
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: res.error ?? "Failed to unlock semester.",
        });
        return;
      }
      setShowUnlockModal(false);
      setDraftsByTerm((prev) => {
        const next = { ...prev };
        delete next[activeTerm.id];
        return next;
      });
      setFeedback({
        type: "success",
        text: res.message ?? "Semester unlocked.",
      });
      router.refresh();
    });
  };

  const handleConfirmDeleteTerm = () => {
    if (!activeTerm) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await deleteGradeTermAction(activeTerm.id);
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: res.error ?? "Failed to delete semester.",
        });
        return;
      }
      setShowDeleteModal(false);
      setDraftsByTerm((prev) => {
        const next = { ...prev };
        delete next[activeTerm.id];
        return next;
      });
      setSelectedTermId(null);
      setFeedback({
        type: "success",
        text: res.message ?? "Semester deleted.",
      });
      router.refresh();
    });
  };

  if (migrationRequired) {
    return (
      <div className="max-w-2xl mx-auto mt-12 rounded-2xl border border-amber-200 dark:border-amber-900/70 bg-white dark:bg-slate-900 p-8 text-center shadow-xs">
        <Database className="h-9 w-9 mx-auto text-amber-500 mb-3" />
        <h2 className="text-lg font-bold">Grades Database Setup Required</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
          Run{" "}
          <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono">
            supabase/migrations/004_grades.sql
          </code>{" "}
          in your Supabase Dashboard SQL Editor, then refresh this page to start
          tracking your private grades and honor eligibility.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">Grades</h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 dark:border-emerald-900/70 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Private — Only visible to you
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Record your grades per semester, lock them when finalized, and track
            Gold Gear Awards &amp; BulSU Latin Honor standing.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFeedback(null);
            setShowAddTermModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Semester
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
            feedback.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200"
              : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
          }`}
        >
          <span className="font-medium">{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Dismiss message"
            className="opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Honors & Cumulative Summary Cards */}
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
                      value={
                        selectedPairIndex ?? goldGear.allPairs.length - 1
                      }
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

      {/* Empty State or Term Tabs + Editor */}
      {sortedTerms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-10 text-center">
          <GraduationCap className="h-10 w-10 mx-auto text-slate-400 mb-3" />
          <h2 className="text-lg font-bold">No Semesters Logged Yet</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
            Add your first semester to start entering your subjects, units, and
            grades. Everything here is strictly private to your account.
          </p>
          <button
            type="button"
            onClick={() => setShowAddTermModal(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Your First Semester
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Semester Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {effectiveTerms.map((term) => {
              const isSelected = term.id === activeTerm?.id;
              const stats = computeTermStats(term);
              return (
                <button
                  key={term.id}
                  type="button"
                  onClick={() => {
                    setFeedback(null);
                    setSelectedTermId(term.id);
                  }}
                  className={`shrink-0 flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white shadow-xs"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                  }`}
                >
                  {term.is_locked ? (
                    <Lock className="h-3.5 w-3.5 opacity-75" />
                  ) : (
                    <LockOpen className="h-3.5 w-3.5 opacity-60" />
                  )}
                  <span>
                    {term.academic_year} ·{" "}
                    {formatSemesterLabel(term.semester_type)}
                  </span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] tabular-nums ${
                      isSelected
                        ? "bg-white/20 dark:bg-slate-900/15"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {formatGwa(stats.rawGwa, 2)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Semester Card */}
          {activeTerm && activeTermStats && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
              {/* Term Header */}
              <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold">
                      AY {activeTerm.academic_year} —{" "}
                      {formatSemesterLabel(activeTerm.semester_type)}
                    </h2>
                    <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      {formatYearLevel(activeTerm.year_level)}
                    </span>
                    {activeTerm.is_locked ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                        <Lock className="h-3 w-3" />
                        Locked (Read-Only)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                        <LockOpen className="h-3 w-3" />
                        {activeDraft.dirty ? "Editing (Unsaved)" : "Unlocked"}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                    <span>
                      Term GWA:{" "}
                      <strong className="text-slate-900 dark:text-slate-100 tabular-nums">
                        {formatGwa(activeTermStats.rawGwa, 4)}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Academic Units:{" "}
                      <strong className="text-slate-900 dark:text-slate-100">
                        {activeTermStats.academicUnits}
                      </strong>
                      {activeTermStats.nonAcademicUnits > 0 && (
                        <span>
                          {" "}
                          (+{activeTermStats.nonAcademicUnits} non-acad)
                        </span>
                      )}
                    </span>
                    {activeTerm.is_locked && activeTerm.locked_at && (
                      <>
                        <span>•</span>
                        <span>Locked {formatDateShort(activeTerm.locked_at)}</span>
                      </>
                    )}
                    {!activeTerm.is_locked && activeTerm.last_unlocked_at && (
                      <>
                        <span>•</span>
                        <span>
                          Last unlocked{" "}
                          {formatDateShort(activeTerm.last_unlocked_at)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Locked Action Button */}
                {activeTerm.is_locked && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setShowUnlockModal(true)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition cursor-pointer shrink-0"
                  >
                    <LockOpen className="h-3.5 w-3.5" />
                    Change Grades
                  </button>
                )}
              </div>

              {/* Body: Locked Read-Only Table vs Unlocked Editable Table */}
              {activeTerm.is_locked ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                      <tr>
                        <th className="px-5 py-3">Course Code</th>
                        <th className="px-4 py-3">Subject Name</th>
                        <th className="px-4 py-3 text-right">Units</th>
                        <th className="px-4 py-3 text-center">GWA</th>
                        <th className="px-4 py-3 text-center">Grade</th>
                        <th className="px-5 py-3">Transmutation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {activeTerm.entries.map((entry) => {
                        const info = getGradeInfo(entry.grade_value);
                        return (
                          <tr
                            key={entry.id}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                          >
                            <td className="px-5 py-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                              {entry.course_code}
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                              {entry.course_name || (
                                <span className="text-slate-400 italic">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums font-medium">
                              {entry.units}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {entry.is_academic ? (
                                <span className="inline-block rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                  Academic
                                </span>
                              ) : (
                                <span className="inline-block rounded-md bg-slate-100/60 dark:bg-slate-800/50 px-2 py-0.5 text-[11px] text-slate-400">
                                  Excluded
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-block rounded-lg border px-2.5 py-0.5 text-xs font-bold tabular-nums ${gradeBadgeClasses(
                                  entry.grade_value
                                )}`}
                              >
                                {entry.grade_value}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              {info.description}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                        <tr>
                          <th className="px-4 py-3 min-w-[120px]">
                            Course Code
                          </th>
                          <th className="px-3 py-3 min-w-[180px]">
                            Subject Name
                          </th>
                          <th className="px-3 py-3 w-24">Units</th>
                          <th className="px-3 py-3 min-w-[180px]">Grade</th>
                          <th
                            className="px-3 py-3 text-center w-24"
                            title="Uncheck for non-academic subjects like NSTP or PE if excluded from GWA"
                          >
                            In GWA
                          </th>
                          <th className="px-3 py-3 w-12" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {activeDraft.rows.map((row) => (
                          <tr key={row.localId}>
                            <td className="px-4 py-2.5">
                              <input
                                type="text"
                                placeholder="e.g. IT 201"
                                value={row.courseCode}
                                onChange={(e) =>
                                  handleRowChange(row.localId, {
                                    courseCode: e.target.value,
                                  })
                                }
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs font-medium outline-none focus:border-rose-400"
                              />
                            </td>
                            <td className="px-3 py-2.5">
                              <input
                                type="text"
                                placeholder="e.g. Data Structures"
                                value={row.courseName}
                                onChange={(e) =>
                                  handleRowChange(row.localId, {
                                    courseName: e.target.value,
                                  })
                                }
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs outline-none focus:border-rose-400"
                              />
                            </td>
                            <td className="px-3 py-2.5">
                              <input
                                type="number"
                                min="0.5"
                                max="30"
                                step="0.5"
                                value={row.units}
                                onChange={(e) =>
                                  handleRowChange(row.localId, {
                                    units: e.target.value,
                                  })
                                }
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs tabular-nums outline-none focus:border-rose-400"
                              />
                            </td>
                            <td className="px-3 py-2.5">
                              <select
                                aria-label="Grade value"
                                value={row.gradeValue}
                                onChange={(e) =>
                                  handleRowChange(row.localId, {
                                    gradeValue: e.target.value as GradeValue,
                                  })
                                }
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-rose-400 cursor-pointer"
                              >
                                {TRANSMUTATION_TABLE.map((opt) => (
                                  <option key={opt.grade} value={opt.grade}>
                                    {opt.grade} — {opt.description}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <input
                                type="checkbox"
                                aria-label="Include in academic GWA"
                                checked={row.isAcademic}
                                onChange={(e) =>
                                  handleRowChange(row.localId, {
                                    isAcademic: e.target.checked,
                                  })
                                }
                                className="h-4 w-4 accent-slate-900 dark:accent-white cursor-pointer"
                              />
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(row.localId)}
                                title="Remove subject"
                                className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 inline-flex items-center justify-center transition cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Editor Footer Actions */}
                  <div className="px-5 py-3.5 bg-slate-50/70 dark:bg-slate-950/40 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleAddRow}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Subject
                      </button>

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => setShowDeleteModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/70 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete Semester
                      </button>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleSaveEntries(false)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Save Draft
                      </button>

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleSaveEntries(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-4 py-2 text-xs font-semibold hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        Save &amp; Lock Grades
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Collapsible Transmutation Table & Honor Criteria Reference */}
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
                  preceding academic year and 1st semester of the current
                  academic year). Open to students from 2nd year to senior year.
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

      {/* Add Semester Modal */}
      {showAddTermModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4"
          onClick={() => setShowAddTermModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">Add Semester</h3>
              <button
                type="button"
                onClick={() => setShowAddTermModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTerm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  required
                  placeholder="2025-2026"
                  pattern="\d{4}-\d{4}"
                  value={newAcademicYear}
                  onChange={(e) => setNewAcademicYear(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:border-rose-400"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Format: YYYY-YYYY (e.g., 2024-2025, 2025-2026)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Semester
                  </label>
                  <select
                    value={newSemesterType}
                    onChange={(e) =>
                      setNewSemesterType(e.target.value as GradeSemesterType)
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:border-rose-400 cursor-pointer"
                  >
                    <option value="1st">1st Semester</option>
                    <option value="2nd">2nd Semester</option>
                    <option value="midyear">Midyear</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Year Level
                  </label>
                  <select
                    value={newYearLevel}
                    onChange={(e) => setNewYearLevel(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:border-rose-400 cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6].map((yr) => (
                      <option key={yr} value={yr}>
                        {formatYearLevel(yr)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTermModal(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-4 py-2 text-xs font-semibold hover:opacity-90 cursor-pointer disabled:opacity-50"
                >
                  Create Semester
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Unlock ("Change Grades") Modal */}
      {showUnlockModal && activeTerm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4"
          onClick={() => setShowUnlockModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                <LockOpen className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold">Unlock Semester to Edit?</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>
                AY {activeTerm.academic_year}{" "}
                {formatSemesterLabel(activeTerm.semester_type)}
              </strong>{" "}
              is currently locked in read-only mode to protect your saved
              grades. Unlocking lets you add, edit, or remove grades, and you
              can lock it again when finished.
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowUnlockModal(false)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Keep Locked
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmUnlock}
                className="rounded-xl bg-amber-500 text-white px-4 py-2 text-xs font-semibold hover:bg-amber-600 cursor-pointer disabled:opacity-50"
              >
                Unlock &amp; Change Grades
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Semester Modal */}
      {showDeleteModal && activeTerm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">
              Delete Semester?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              This will permanently remove{" "}
              <strong>
                AY {activeTerm.academic_year}{" "}
                {formatSemesterLabel(activeTerm.semester_type)}
              </strong>{" "}
              and all of its recorded subjects.
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmDeleteTerm}
                className="rounded-xl bg-rose-600 text-white px-4 py-2 text-xs font-semibold hover:bg-rose-700 cursor-pointer disabled:opacity-50"
              >
                Delete Semester
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
