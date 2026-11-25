"use client";

import { Lock, LockOpen, Plus, Save, Trash2 } from "lucide-react";
import {
  formatGwa,
  formatSemesterLabel,
  formatYearLevel,
  getGradeInfo,
  TRANSMUTATION_TABLE,
  type GradeStats,
} from "@/lib/grades-utils";
import type { GradeTermWithEntries, GradeValue } from "@/lib/types";
import {
  formatDateShort,
  gradeBadgeClasses,
  type DraftRow,
} from "./grades-view-helpers";

interface GradeTermEditorProps {
  activeTerm: GradeTermWithEntries;
  activeTermStats: GradeStats;
  activeDraft: { rows: DraftRow[]; dirty: boolean };
  isPending: boolean;
  onRequestUnlock: () => void;
  onRequestDelete: () => void;
  onRowChange: (
    localId: string,
    patch: Partial<Omit<DraftRow, "localId">>
  ) => void;
  onAddRow: () => void;
  onRemoveRow: (localId: string) => void;
  onSaveEntries: (lockAfterSave: boolean) => void;
}

export function GradeTermEditor({
  activeTerm,
  activeTermStats,
  activeDraft,
  isPending,
  onRequestUnlock,
  onRequestDelete,
  onRowChange,
  onAddRow,
  onRemoveRow,
  onSaveEntries,
}: GradeTermEditorProps) {
  return (
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
                <span> (+{activeTermStats.nonAcademicUnits} non-acad)</span>
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
                  Last unlocked {formatDateShort(activeTerm.last_unlocked_at)}
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
            onClick={onRequestUnlock}
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
                  <th className="px-4 py-3 min-w-[120px]">Course Code</th>
                  <th className="px-3 py-3 min-w-[180px]">Subject Name</th>
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
                          onRowChange(row.localId, {
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
                          onRowChange(row.localId, {
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
                          onRowChange(row.localId, {
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
                          onRowChange(row.localId, {
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
                          onRowChange(row.localId, {
                            isAcademic: e.target.checked,
                          })
                        }
                        className="h-4 w-4 accent-slate-900 dark:accent-white cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => onRemoveRow(row.localId)}
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
                onClick={onAddRow}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Subject
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={onRequestDelete}
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
                onClick={() => onSaveEntries(false)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                Save Draft
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={() => onSaveEntries(true)}
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
  );
}
