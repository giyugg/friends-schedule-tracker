"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Layers,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  createSectionAction,
  deleteSectionAction,
  updateSectionAction,
} from "@/app/actions/admin/sections";
import type { RunAdminAction } from "@/app/actions/admin/types";
import {
  COLLEGES,
  composeSectionCode,
  getCollegeByCode,
  getCollegeTheme,
  getProgramEntryByCode,
  getProgramsByCollege,
  getSectionAcademicInfo,
} from "@/lib/academic-catalog";
import type { SectionWithMembers, Semester } from "@/lib/types";

interface SectionFormModalProps {
  mode: "create" | "edit";
  activeSemester: Semester;
  section?: SectionWithMembers | null;
  isPending: boolean;
  onClose: () => void;
  runAction: RunAdminAction;
}

export function SectionFormModal({
  mode,
  activeSemester,
  section,
  isPending,
  onClose,
  runAction,
}: SectionFormModalProps) {
  const initialValues = useMemo(() => {
    if (mode === "edit" && section) {
      const academic = getSectionAcademicInfo(section);
      const parts = section.code.trim().split(/\s+/);
      return {
        collegeCode: academic.college?.code ?? "",
        programCode: academic.program?.code ?? "",
        sectionName:
          section.section_name ?? (parts.length >= 2 ? parts[1] : section.code),
        specialization:
          section.specialization ??
          (parts.length >= 3 ? parts.slice(2).join(" ") : ""),
      };
    }
    return {
      collegeCode: "",
      programCode: "",
      sectionName: "",
      specialization: "",
    };
  }, [mode, section]);

  const [collegeCode, setCollegeCode] = useState(initialValues.collegeCode);
  const [programCode, setProgramCode] = useState(initialValues.programCode);
  const [sectionName, setSectionName] = useState(initialValues.sectionName);
  const [specialization, setSpecialization] = useState(
    initialValues.specialization
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPending, onClose]);

  const programs = useMemo(
    () => getProgramsByCollege(collegeCode),
    [collegeCode]
  );
  const selectedCollege = useMemo(
    () => getCollegeByCode(collegeCode),
    [collegeCode]
  );
  const programEntry = useMemo(
    () => getProgramEntryByCode(programCode),
    [programCode]
  );
  const previewCode = useMemo(() => {
    if (!programCode || !sectionName.trim()) return "";
    return composeSectionCode(programCode, sectionName, specialization);
  }, [programCode, sectionName, specialization]);

  const previewTheme = getCollegeTheme(collegeCode || null);
  const commonSpecs = programEntry?.program.commonSpecializations ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeCode || !programCode || !sectionName.trim()) return;

    setErrorMessage(null);

    runAction(
      async () => {
        const res =
          mode === "create"
            ? await createSectionAction({
                semesterId: activeSemester.id,
                collegeCode,
                programCode,
                sectionName,
                specialization,
              })
            : await updateSectionAction({
                id: section!.id,
                collegeCode,
                programCode,
                sectionName,
                specialization,
              });

        if (res.ok) {
          onClose();
        } else {
          setErrorMessage(res.error ?? "Something went wrong.");
        }
        return res;
      },
      { suppressErrorBanner: true }
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      onClick={() => {
        if (!isPending) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="section-form-modal-title"
        className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`h-1.5 w-full ${previewTheme.accentBarClass}`} />

        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-[#F19C99]/30 dark:bg-[#6E2C2A] border border-[#DF7A76]/50 flex items-center justify-center text-[#9E2A26] dark:text-[#FDE8E8]">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h2
                  id="section-form-modal-title"
                  className="font-bold text-base text-slate-900 dark:text-slate-100"
                >
                  {mode === "create" ? "Create New Section" : "Edit Section"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeSemester.name}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            aria-label="Close modal"
            className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 transition cursor-pointer disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 dark:border-rose-900/80 bg-rose-50 dark:bg-rose-950/60 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-300 flex items-start gap-2"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              College
            </label>
            <select
              required
              value={collegeCode}
              onChange={(e) => {
                setCollegeCode(e.target.value);
                setProgramCode("");
                setSpecialization("");
                setErrorMessage(null);
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-rose-400 dark:focus:border-rose-500"
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
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Program / Course
            </label>
            <select
              required
              disabled={!collegeCode}
              value={programCode}
              onChange={(e) => {
                setProgramCode(e.target.value);
                setSpecialization("");
                setErrorMessage(null);
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-rose-400 dark:focus:border-rose-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">
                {collegeCode ? "Select a program…" : "Select a college first…"}
              </option>
              {programs.map((prog) => (
                <option key={prog.code} value={prog.code}>
                  {prog.code} — {prog.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Section Block / Group
              </label>
              <input
                type="text"
                required
                maxLength={30}
                value={sectionName}
                onChange={(e) => {
                  setSectionName(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="e.g., 2B-G2, 3A-G1"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm outline-none focus:border-rose-400 dark:focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Specialization / Track{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                type="text"
                maxLength={30}
                list="modal-section-spec-suggestions"
                value={specialization}
                onChange={(e) => {
                  setSpecialization(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="e.g., DBA, WMD, BA"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm outline-none focus:border-rose-400 dark:focus:border-rose-500"
              />
              {commonSpecs.length > 0 && (
                <datalist id="modal-section-spec-suggestions">
                  {commonSpecs.map((spec) => (
                    <option key={spec} value={spec} />
                  ))}
                </datalist>
              )}
            </div>
          </div>

          {commonSpecs.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Quick tracks:</span>
              {commonSpecs.map((spec) => {
                const active =
                  specialization.trim().toUpperCase() === spec.toUpperCase();
                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => {
                      setSpecialization(active ? "" : spec);
                      setErrorMessage(null);
                    }}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border transition cursor-pointer ${
                      active
                        ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white"
                        : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400"
                    }`}
                  >
                    {spec}
                  </button>
                );
              })}
            </div>
          )}

          {/* Live Section Card Preview */}
          <div
            className={`rounded-xl border p-3.5 transition ${previewTheme.softSurfaceClass}`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-rose-500" />
                Card Preview
              </span>
              {selectedCollege && (
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${previewTheme.badgeClass}`}
                >
                  {selectedCollege.code}
                </span>
              )}
            </div>

            {previewCode ? (
              <div>
                <div className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {previewCode}
                </div>
                {programEntry && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {programEntry.program.name}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400 dark:text-slate-500">
                Choose a college, program, and section block to preview the
                section code.
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isPending ||
                !collegeCode ||
                !programCode ||
                !sectionName.trim()
              }
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold hover:opacity-90 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : mode === "create" ? (
                <Plus className="h-3.5 w-3.5" />
              ) : null}
              {mode === "create" ? "Create Section" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DeleteSectionModalProps {
  section: SectionWithMembers;
  entryCount: number;
  isPending: boolean;
  onClose: () => void;
  runAction: RunAdminAction;
}

export function DeleteSectionModal({
  section,
  entryCount,
  isPending,
  onClose,
  runAction,
}: DeleteSectionModalProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPending, onClose]);

  const academic = getSectionAcademicInfo(section);
  const memberCount = section.members.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      onClick={() => {
        if (!isPending) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-section-modal-title"
        className="w-full max-w-md rounded-2xl border border-rose-200 dark:border-rose-900/70 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 to-amber-500" />

        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-rose-100 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2
                  id="delete-section-modal-title"
                  className="font-bold text-base text-slate-900 dark:text-slate-100"
                >
                  Delete {section.code}?
                </h2>
                {academic.program && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {academic.program.name}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              aria-label="Close modal"
              className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 transition cursor-pointer disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 dark:border-rose-900/80 bg-rose-50 dark:bg-rose-950/60 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-300 flex items-start gap-2"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            This permanently deletes the section from the semester. Review what
            will be affected before continuing:
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Users className="h-3.5 w-3.5 text-amber-500" />
                {memberCount} {memberCount === 1 ? "Member" : "Members"}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {memberCount > 0
                  ? "Will return to Unassigned"
                  : "Roster is already empty"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <BookOpen className="h-3.5 w-3.5 text-rose-500" />
                {entryCount} {entryCount === 1 ? "Class" : "Classes"}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {entryCount > 0
                  ? "Permanently removed"
                  : "No scheduled classes"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setErrorMessage(null);
                runAction(
                  async () => {
                    const res = await deleteSectionAction(section.id);
                    if (res.ok) {
                      onClose();
                    } else {
                      setErrorMessage(res.error ?? "Something went wrong.");
                    }
                    return res;
                  },
                  { suppressErrorBanner: true }
                );
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Delete Section
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
