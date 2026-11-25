"use client";

import { useState } from "react";
import { Archive, Plus, Trash2 } from "lucide-react";
import {
  createSemesterAction,
  deleteSemesterAction,
  setActiveSemesterAction,
  toggleArchiveSemesterAction,
} from "@/app/actions/admin/semesters";
import type { ActionResult } from "@/app/actions/admin/types";
import type { Semester } from "@/lib/types";

interface SemestersTabProps {
  semesters: Semester[];
  isPending: boolean;
  runAction: (fn: () => Promise<ActionResult>) => void;
}

export function SemestersTab({
  semesters,
  isPending,
  runAction,
}: SemestersTabProps) {
  const [newSemName, setNewSemName] = useState("");
  const [newSemActive, setNewSemActive] = useState(semesters.length === 0);
  const [cloneFromSemId, setCloneFromSemId] = useState("");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 h-fit">
        <h2 className="font-bold text-base">Create Semester</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runAction(async () => {
              const res = await createSemesterAction({
                name: newSemName,
                setActive: newSemActive,
                cloneFromSemesterId: cloneFromSemId || undefined,
              });
              if (res.ok) {
                setNewSemName("");
                setCloneFromSemId("");
              }
              return res;
            });
          }}
          className="space-y-3.5"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Semester Name
            </label>
            <input
              type="text"
              required
              value={newSemName}
              onChange={(e) => setNewSemName(e.target.value)}
              placeholder="e.g., 2026-2027 1st Sem"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            />
          </div>

          {semesters.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Copy Sections & Rosters From (optional)
              </label>
              <select
                value={cloneFromSemId}
                onChange={(e) => setCloneFromSemId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="">Start blank</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={newSemActive}
              onChange={(e) => setNewSemActive(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            Set as active semester
          </label>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold py-2.5 text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Semester
          </button>
        </form>
      </div>

      <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
        <h2 className="font-bold text-base">
          All Semesters ({semesters.length})
        </h2>

        {semesters.length === 0 ? (
          <p className="text-sm text-slate-500">
            No semesters created yet. Create your first semester on the left!
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {semesters.map((sem) => (
              <div
                key={sem.id}
                className="py-3 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{sem.name}</span>
                  {sem.is_active && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                      Active
                    </span>
                  )}
                  {sem.is_archived && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] font-semibold">
                      Archived
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!sem.is_active && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        runAction(() => setActiveSemesterAction(sem.id))
                      }
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold cursor-pointer"
                    >
                      Set Active
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      runAction(() =>
                        toggleArchiveSemesterAction(sem.id, !sem.is_archived)
                      )
                    }
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    {sem.is_archived ? "Unarchive" : "Archive"}
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      if (
                        confirm(
                          `Delete "${sem.name}" and ALL its sections and schedules?`
                        )
                      ) {
                        runAction(() => deleteSemesterAction(sem.id));
                      }
                    }}
                    className="h-8 w-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 flex items-center justify-center text-slate-500 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
