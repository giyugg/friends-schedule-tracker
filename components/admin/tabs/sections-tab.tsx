"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  createSectionAction,
  deleteSectionAction,
  toggleSectionMemberAction,
  updateSectionAction,
} from "@/app/actions/admin/sections";
import type { ActionResult } from "@/app/actions/admin/types";
import {
  COLLEGES,
  composeSectionCode,
  getProgramEntryByCode,
  getProgramsByCollege,
  getSectionAcademicInfo,
} from "@/lib/academic-catalog";
import { formatMemberNames } from "@/lib/schedule-utils";
import type { Profile, SectionWithMembers, Semester } from "@/lib/types";

interface SectionsTabProps {
  activeSemester: Semester | null;
  sections: SectionWithMembers[];
  profiles: Profile[];
  isPending: boolean;
  runAction: (fn: () => Promise<ActionResult>) => void;
}

export function SectionsTab({
  activeSemester,
  sections,
  profiles,
  isPending,
  runAction,
}: SectionsTabProps) {
  const [newCollegeCode, setNewCollegeCode] = useState("");
  const [newProgramCode, setNewProgramCode] = useState("");
  const [newSectionName, setNewSectionName] = useState("");
  const [newSpecialization, setNewSpecialization] = useState("");
  const [sectionCollegeFilter, setSectionCollegeFilter] =
    useState<string>("all");
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editCollegeCode, setEditCollegeCode] = useState("");
  const [editProgramCode, setEditProgramCode] = useState("");
  const [editSectionName, setEditSectionName] = useState("");
  const [editSpecialization, setEditSpecialization] = useState("");

  const newPrograms = useMemo(
    () => getProgramsByCollege(newCollegeCode),
    [newCollegeCode]
  );
  const newProgramEntry = useMemo(
    () => getProgramEntryByCode(newProgramCode),
    [newProgramCode]
  );
  const newSectionPreview = useMemo(() => {
    if (!newProgramCode || !newSectionName.trim()) return "";
    return composeSectionCode(
      newProgramCode,
      newSectionName,
      newSpecialization
    );
  }, [newProgramCode, newSectionName, newSpecialization]);

  const editPrograms = useMemo(
    () => getProgramsByCollege(editCollegeCode),
    [editCollegeCode]
  );
  const editProgramEntry = useMemo(
    () => getProgramEntryByCode(editProgramCode),
    [editProgramCode]
  );
  const editSectionPreview = useMemo(() => {
    if (!editProgramCode || !editSectionName.trim()) return "";
    return composeSectionCode(
      editProgramCode,
      editSectionName,
      editSpecialization
    );
  }, [editProgramCode, editSectionName, editSpecialization]);

  const sectionCollegeOptions = useMemo(() => {
    const presentCodes = new Set<string>();
    let unassignedCount = 0;
    for (const sec of sections) {
      const info = getSectionAcademicInfo(sec);
      if (info.college) {
        presentCodes.add(info.college.code);
      } else {
        unassignedCount++;
      }
    }
    const colleges = COLLEGES.filter((c) => presentCodes.has(c.code));
    return { colleges, unassignedCount };
  }, [sections]);

  const filteredSections = useMemo(() => {
    if (sectionCollegeFilter === "all") return sections;
    if (sectionCollegeFilter === "unassigned") {
      return sections.filter((s) => !getSectionAcademicInfo(s).isAssigned);
    }
    return sections.filter(
      (s) => getSectionAcademicInfo(s).college?.code === sectionCollegeFilter
    );
  }, [sections, sectionCollegeFilter]);

  if (!activeSemester) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500">
        Create a semester first in the Semesters tab.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runAction(async () => {
            const res = await createSectionAction({
              semesterId: activeSemester.id,
              collegeCode: newCollegeCode,
              programCode: newProgramCode,
              sectionName: newSectionName,
              specialization: newSpecialization,
            });
            if (res.ok) {
              setNewSectionName("");
              setNewSpecialization("");
            }
            return res;
          });
        }}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-bold text-base">
              Add Section ({activeSemester.name})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a college and program, then enter the section code and
              optional track.
            </p>
          </div>
          {newSectionPreview && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-900 text-xs font-semibold text-sky-800 dark:text-sky-200">
              <span className="text-sky-500 dark:text-sky-400 font-medium">
                Preview:
              </span>
              <span>{newSectionPreview}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              College
            </label>
            <select
              required
              value={newCollegeCode}
              onChange={(e) => {
                setNewCollegeCode(e.target.value);
                setNewProgramCode("");
                setNewSpecialization("");
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm"
            >
              <option value="">Select a college…</option>
              {COLLEGES.map((college) => (
                <option key={college.code} value={college.code}>
                  {college.code} — {college.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Program / Course
            </label>
            <select
              required
              disabled={!newCollegeCode}
              value={newProgramCode}
              onChange={(e) => {
                setNewProgramCode(e.target.value);
                setNewSpecialization("");
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">
                {newCollegeCode
                  ? "Select a program…"
                  : "Select a college first…"}
              </option>
              {newPrograms.map((prog) => (
                <option key={prog.code} value={prog.code}>
                  {prog.code} — {prog.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Section
            </label>
            <input
              type="text"
              required
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="e.g., 2B-G2, 3A-G1"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-5">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Specialization / Track (optional)
            </label>
            <input
              type="text"
              list="new-section-spec-suggestions"
              value={newSpecialization}
              onChange={(e) => setNewSpecialization(e.target.value)}
              placeholder="e.g., DBA, WMD, BA"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
            />
            {newProgramEntry?.program.commonSpecializations && (
              <datalist id="new-section-spec-suggestions">
                {newProgramEntry.program.commonSpecializations.map((spec) => (
                  <option key={spec} value={spec} />
                ))}
              </datalist>
            )}
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isPending || !newCollegeCode || !newProgramCode}
              className="w-full px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>
      </form>

      {(sectionCollegeOptions.colleges.length > 0 ||
        sectionCollegeOptions.unassignedCount > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Filter by College:
          </span>
          <button
            type="button"
            onClick={() => setSectionCollegeFilter("all")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              sectionCollegeFilter === "all"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            All ({sections.length})
          </button>
          {sectionCollegeOptions.colleges.map((college) => {
            const count = sections.filter(
              (s) => getSectionAcademicInfo(s).college?.code === college.code
            ).length;
            return (
              <button
                key={college.code}
                type="button"
                title={college.name}
                onClick={() => setSectionCollegeFilter(college.code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  sectionCollegeFilter === college.code
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {college.code} ({count})
              </button>
            );
          })}
          {sectionCollegeOptions.unassignedCount > 0 && (
            <button
              type="button"
              onClick={() => setSectionCollegeFilter("unassigned")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                sectionCollegeFilter === "unassigned"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 hover:bg-amber-100 dark:hover:bg-amber-900/50"
              }`}
            >
              Needs Assignment ({sectionCollegeOptions.unassignedCount})
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSections.map((section) => {
          const memberIds = new Set(section.members.map((m) => m.id));
          const isEditing = editingSectionId === section.id;
          const academic = getSectionAcademicInfo(section);

          return (
            <div
              key={section.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                {isEditing ? (
                  <div className="flex-1 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={editCollegeCode}
                        onChange={(e) => {
                          setEditCollegeCode(e.target.value);
                          setEditProgramCode("");
                        }}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs"
                      >
                        <option value="">Select college…</option>
                        {COLLEGES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code} — {c.name}
                          </option>
                        ))}
                      </select>
                      <select
                        disabled={!editCollegeCode}
                        value={editProgramCode}
                        onChange={(e) => setEditProgramCode(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs disabled:opacity-60"
                      >
                        <option value="">
                          {editCollegeCode
                            ? "Select program…"
                            : "Select college first…"}
                        </option>
                        {editPrograms.map((p) => (
                          <option key={p.code} value={p.code}>
                            {p.code} — {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={editSectionName}
                        onChange={(e) => setEditSectionName(e.target.value)}
                        placeholder="Section (e.g., 2B-G2)"
                        className="flex-1 min-w-[110px] rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2.5 py-1 text-xs font-semibold"
                      />
                      <input
                        type="text"
                        list="edit-section-spec-suggestions"
                        value={editSpecialization}
                        onChange={(e) => setEditSpecialization(e.target.value)}
                        placeholder="Track (optional)"
                        className="w-28 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2.5 py-1 text-xs"
                      />
                      {editProgramEntry?.program.commonSpecializations && (
                        <datalist id="edit-section-spec-suggestions">
                          {editProgramEntry.program.commonSpecializations.map(
                            (spec) => (
                              <option key={spec} value={spec} />
                            )
                          )}
                        </datalist>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500">
                        {editSectionPreview ? (
                          <>
                            Code:{" "}
                            <strong className="text-slate-800 dark:text-slate-200">
                              {editSectionPreview}
                            </strong>
                          </>
                        ) : (
                          "Choose college, program, and section"
                        )}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingSectionId(null)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={
                            isPending ||
                            !editCollegeCode ||
                            !editProgramCode ||
                            !editSectionName.trim()
                          }
                          onClick={() =>
                            runAction(async () => {
                              const res = await updateSectionAction({
                                id: section.id,
                                collegeCode: editCollegeCode,
                                programCode: editProgramCode,
                                sectionName: editSectionName,
                                specialization: editSpecialization,
                              });
                              if (res.ok) setEditingSectionId(null);
                              return res;
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="min-w-0">
                    <div className="font-bold text-base flex flex-wrap items-center gap-2">
                      {academic.college ? (
                        <span
                          title={academic.college.name}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-900"
                        >
                          {academic.college.code}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                          Assign College & Program
                        </span>
                      )}
                      <span>{section.code}</span>
                    </div>
                    {(academic.college || academic.program) && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {academic.college && (
                          <span className="font-medium text-slate-700 dark:text-slate-200">
                            {academic.college.name}
                          </span>
                        )}
                        {academic.college && academic.program && (
                          <span className="text-slate-400 dark:text-slate-500">
                            {" "}
                            —{" "}
                          </span>
                        )}
                        {academic.program && (
                          <span>
                            {academic.program.name}
                            {academic.specialization && (
                              <span className="text-slate-400 dark:text-slate-500">
                                {" "}
                                · {academic.specialization}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="text-xs text-slate-500 mt-0.5">
                      {formatMemberNames(section.members)}
                    </div>
                  </div>
                )}

                {!isEditing && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const parts = section.code.trim().split(/\s+/);
                        setEditingSectionId(section.id);
                        setEditCollegeCode(academic.college?.code ?? "");
                        setEditProgramCode(academic.program?.code ?? "");
                        setEditSectionName(
                          section.section_name ??
                            (parts.length >= 2 ? parts[1] : section.code)
                        );
                        setEditSpecialization(
                          section.specialization ??
                            (parts.length >= 3 ? parts.slice(2).join(" ") : "")
                        );
                      }}
                      title="Edit section"
                      className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            `Delete section ${section.code} and all its classes?`
                          )
                        ) {
                          runAction(() => deleteSectionAction(section.id));
                        }
                      }}
                      title="Delete section"
                      className="h-8 w-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 flex items-center justify-center text-slate-500 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
                  Assign Friends to {section.code}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {profiles.map((p) => {
                    const assigned = memberIds.has(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          runAction(() =>
                            toggleSectionMemberAction({
                              sectionId: section.id,
                              userId: p.id,
                              assign: !assigned,
                            })
                          )
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                          assigned
                            ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white"
                            : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400"
                        }`}
                      >
                        {p.display_name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
