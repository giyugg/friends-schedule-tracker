"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Database,
  GraduationCap,
  Lock,
  LockOpen,
  Plus,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  createGradeTermAction,
  deleteGradeTermAction,
  saveGradeTermEntriesAction,
  unlockGradeTermAction,
} from "@/app/actions/grades";
import {
  computeTermStats,
  formatGwa,
  formatSemesterLabel,
  sortGradeTerms,
} from "@/lib/grades-utils";
import type {
  GradeEntry,
  GradeSemesterType,
  GradeTermWithEntries,
} from "@/lib/types";
import { GradeReferenceDrawer } from "./grade-reference-drawer";
import { GradeTermEditor } from "./grade-term-editor";
import {
  AddGradeTermModal,
  ConfirmDeleteTermModal,
  ConfirmUnlockModal,
} from "./grade-term-modals";
import {
  makeDraftRows,
  makeEmptyRow,
  type DraftRow,
} from "./grades-view-helpers";
import { HonorsSummaryCards } from "./honors-summary-cards";

interface GradesViewProps {
  initialTerms: GradeTermWithEntries[];
  migrationRequired?: boolean;
}

export function GradesView({
  initialTerms,
  migrationRequired = false,
}: GradesViewProps) {
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

  const [showAddTermModal, setShowAddTermModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  const handleCreateTerm = (input: {
    academicYear: string;
    semesterType: GradeSemesterType;
    yearLevel: number;
  }) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await createGradeTermAction(input);
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
      <HonorsSummaryCards effectiveTerms={effectiveTerms} />

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
            <GradeTermEditor
              activeTerm={activeTerm}
              activeTermStats={activeTermStats}
              activeDraft={activeDraft}
              isPending={isPending}
              onRequestUnlock={() => setShowUnlockModal(true)}
              onRequestDelete={() => setShowDeleteModal(true)}
              onRowChange={handleRowChange}
              onAddRow={handleAddRow}
              onRemoveRow={handleRemoveRow}
              onSaveEntries={handleSaveEntries}
            />
          )}
        </div>
      )}

      {/* Collapsible Transmutation Table & Honor Criteria Reference */}
      <GradeReferenceDrawer />

      {/* Modals */}
      <AddGradeTermModal
        open={showAddTermModal}
        isPending={isPending}
        onClose={() => setShowAddTermModal(false)}
        onSubmit={handleCreateTerm}
      />

      <ConfirmUnlockModal
        open={showUnlockModal}
        activeTerm={activeTerm}
        isPending={isPending}
        onClose={() => setShowUnlockModal(false)}
        onConfirm={handleConfirmUnlock}
      />

      <ConfirmDeleteTermModal
        open={showDeleteModal}
        activeTerm={activeTerm}
        isPending={isPending}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDeleteTerm}
      />
    </div>
  );
}
