"use client";

import { useState } from "react";
import { LockOpen, X } from "lucide-react";
import { formatSemesterLabel, formatYearLevel } from "@/lib/grades-utils";
import type { GradeSemesterType, GradeTermWithEntries } from "@/lib/types";

interface AddGradeTermModalProps {
  open: boolean;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (input: {
    academicYear: string;
    semesterType: GradeSemesterType;
    yearLevel: number;
  }) => void;
}

export function AddGradeTermModal({
  open,
  isPending,
  onClose,
  onSubmit,
}: AddGradeTermModalProps) {
  const [newAcademicYear, setNewAcademicYear] = useState("2025-2026");
  const [newSemesterType, setNewSemesterType] =
    useState<GradeSemesterType>("1st");
  const [newYearLevel, setNewYearLevel] = useState(2);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold">Add Semester</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              academicYear: newAcademicYear,
              semesterType: newSemesterType,
              yearLevel: newYearLevel,
            });
          }}
          className="space-y-4"
        >
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
              onClick={onClose}
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
  );
}

interface ConfirmUnlockModalProps {
  open: boolean;
  activeTerm: GradeTermWithEntries | null;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmUnlockModal({
  open,
  activeTerm,
  isPending,
  onClose,
  onConfirm,
}: ConfirmUnlockModalProps) {
  if (!open || !activeTerm) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4"
      onClick={onClose}
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
          is currently locked in read-only mode to protect your saved grades.
          Unlocking lets you add, edit, or remove grades, and you can lock it
          again when finished.
        </p>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            Keep Locked
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className="rounded-xl bg-amber-500 text-white px-4 py-2 text-xs font-semibold hover:bg-amber-600 cursor-pointer disabled:opacity-50"
          >
            Unlock &amp; Change Grades
          </button>
        </div>
      </div>
    </div>
  );
}

interface ConfirmDeleteTermModalProps {
  open: boolean;
  activeTerm: GradeTermWithEntries | null;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteTermModal({
  open,
  activeTerm,
  isPending,
  onClose,
  onConfirm,
}: ConfirmDeleteTermModalProps) {
  if (!open || !activeTerm) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4"
      onClick={onClose}
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
            onClick={onClose}
            className="rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className="rounded-xl bg-rose-600 text-white px-4 py-2 text-xs font-semibold hover:bg-rose-700 cursor-pointer disabled:opacity-50"
          >
            Delete Semester
          </button>
        </div>
      </div>
    </div>
  );
}
