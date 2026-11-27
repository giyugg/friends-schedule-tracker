"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  Layers,
  Plus,
  RotateCcw,
  Search,
  Users,
  X,
} from "lucide-react";
import type { ActionResult } from "@/app/actions/admin/types";
import {
  COLLEGES,
  getCollegeTheme,
  getSectionAcademicInfo,
} from "@/lib/academic-catalog";
import {
  buildSemesterRosterIndex,
  filterSectionsByQueryAndCollege,
  type SectionFilterMode,
} from "@/lib/section-roster-utils";
import type {
  Profile,
  ScheduleEntry,
  SectionWithMembers,
  Semester,
} from "@/lib/types";
import { DeleteSectionModal, SectionFormModal } from "./sections/section-modals";
import { SectionRosterCard } from "./sections/section-roster-card";
import { UnassignedFriendsBench } from "./sections/unassigned-friends-bench";

interface SectionsTabProps {
  activeSemester: Semester | null;
  requestedSemesterParam?: string;
  sections: SectionWithMembers[];
  entries: ScheduleEntry[];
  profiles: Profile[];
  isPending: boolean;
  runAction: (fn: () => Promise<ActionResult>) => void;
}

export function SectionsTab({
  activeSemester,
  requestedSemesterParam,
  sections,
  entries,
  profiles,
  isPending,
  runAction,
}: SectionsTabProps) {
  const [filterMode, setFilterMode] = useState<SectionFilterMode>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalState, setModalState] = useState<
    | { type: "create" }
    | { type: "edit"; section: SectionWithMembers }
    | { type: "delete"; section: SectionWithMembers }
    | null
  >(null);

  const rosterIndex = useMemo(
    () => buildSemesterRosterIndex(sections, profiles, entries),
    [sections, profiles, entries]
  );

  const collegeOptions = useMemo(() => {
    const countsByCode = new Map<string, number>();
    for (const sec of sections) {
      const info = getSectionAcademicInfo(sec);
      if (info.college) {
        countsByCode.set(
          info.college.code,
          (countsByCode.get(info.college.code) ?? 0) + 1
        );
      }
    }
    return COLLEGES.filter((c) => countsByCode.has(c.code)).map((college) => ({
      college,
      count: countsByCode.get(college.code) ?? 0,
    }));
  }, [sections]);

  const effectiveFilterMode: SectionFilterMode = useMemo(() => {
    if (filterMode === "all") return "all";
    if (filterMode === "empty") {
      return rosterIndex.emptySectionsCount > 0 ? "empty" : "all";
    }
    if (filterMode === "unassigned") {
      return rosterIndex.unassignedProgramSectionsCount > 0
        ? "unassigned"
        : "all";
    }
    return collegeOptions.some((opt) => opt.college.code === filterMode)
      ? filterMode
      : "all";
  }, [
    filterMode,
    rosterIndex.emptySectionsCount,
    rosterIndex.unassignedProgramSectionsCount,
    collegeOptions,
  ]);

  const filteredSections = useMemo(
    () =>
      filterSectionsByQueryAndCollege({
        sections,
        filterMode: effectiveFilterMode,
        query: searchQuery,
      }),
    [sections, effectiveFilterMode, searchQuery]
  );

  if (!activeSemester) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500">
        Create a semester first in the Semesters tab.
      </div>
    );
  }

  const hasActiveFilters =
    effectiveFilterMode !== "all" || searchQuery.trim().length > 0;

  return (
    <div className="space-y-5">
      {/* Command Bar: Semester Summary, Search, Filters & "+ New Section" */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                Sections & Rosters
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-900/60">
                {activeSemester.name}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-indigo-500" />
                <strong className="text-slate-800 dark:text-slate-200">
                  {sections.length}
                </strong>{" "}
                {sections.length === 1 ? "section" : "sections"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-rose-500" />
                <strong className="text-slate-800 dark:text-slate-200">
                  {rosterIndex.assignedFriendCount}/{profiles.length}
                </strong>{" "}
                friends assigned
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                <strong className="text-slate-800 dark:text-slate-200">
                  {entries.length}
                </strong>{" "}
                scheduled {entries.length === 1 ? "class" : "classes"}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={() => setModalState({ type: "create" })}
            className="inline-flex items-center justify-center gap-2 self-start sm:self-auto px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs sm:text-sm font-semibold hover:opacity-90 transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Plus className="h-4 w-4 text-rose-400 dark:text-rose-600" />
            <span>New Section</span>
          </button>
        </div>

        {sections.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* College & Status Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  effectiveFilterMode === "all"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                All ({sections.length})
              </button>

              {collegeOptions.map(({ college, count }) => {
                const theme = getCollegeTheme(college.code);
                const active = effectiveFilterMode === college.code;
                return (
                  <button
                    key={college.code}
                    type="button"
                    title={college.name}
                    onClick={() => setFilterMode(college.code)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      active
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${theme.dotClass}`}
                    />
                    <span>
                      {college.code} ({count})
                    </span>
                  </button>
                );
              })}

              {rosterIndex.emptySectionsCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterMode("empty")}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    effectiveFilterMode === "empty"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  Empty Roster ({rosterIndex.emptySectionsCount})
                </button>
              )}

              {rosterIndex.unassignedProgramSectionsCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterMode("unassigned")}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    effectiveFilterMode === "unassigned"
                      ? "bg-amber-600 text-white"
                      : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                  }`}
                >
                  Needs Program ({rosterIndex.unassignedProgramSectionsCount})
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72 shrink-0">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search section, program, or friend…"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-8 pr-8 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-rose-400 dark:focus:border-rose-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Unassigned Friends Bench */}
      <UnassignedFriendsBench
        semesterName={activeSemester.name}
        totalProfilesCount={profiles.length}
        unassignedProfiles={rosterIndex.unassignedProfiles}
        sections={sections}
        isPending={isPending}
        runAction={runAction}
      />

      {/* Sections Grid / Empty States */}
      {sections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center space-y-3">
          <div className="h-12 w-12 mx-auto rounded-2xl bg-[#F19C99]/30 dark:bg-[#6E2C2A] border border-[#DF7A76]/50 flex items-center justify-center text-[#9E2A26] dark:text-[#FDE8E8]">
            <Layers className="h-5 w-5" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              No sections in {activeSemester.name} yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Create your first college section block (e.g., BSIS 2A-G1 or BSIT
              3A-G1 DBA) to start assigning friends and building schedules.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalState({ type: "create" })}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold hover:opacity-90 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create First Section
          </button>
        </div>
      ) : filteredSections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-2.5">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No sections match your current filter
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Try clearing your search query or switching back to All sections.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setFilterMode("all");
                setSearchQuery("");
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSections.map((section) => (
            <SectionRosterCard
              key={section.id}
              section={section}
              entryCount={
                rosterIndex.entryCountBySectionId.get(section.id) ?? 0
              }
              profiles={profiles}
              sectionsByUserId={rosterIndex.sectionsByUserId}
              requestedSemesterParam={requestedSemesterParam}
              isPending={isPending}
              onEdit={(target) =>
                setModalState({ type: "edit", section: target })
              }
              onDelete={(target) =>
                setModalState({ type: "delete", section: target })
              }
              runAction={runAction}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {(modalState?.type === "create" || modalState?.type === "edit") && (
        <SectionFormModal
          key={
            modalState.type === "edit"
              ? `edit:${modalState.section.id}`
              : "create"
          }
          mode={modalState.type}
          activeSemester={activeSemester}
          section={modalState.type === "edit" ? modalState.section : null}
          isPending={isPending}
          onClose={() => setModalState(null)}
          runAction={runAction}
        />
      )}

      {modalState?.type === "delete" && (
        <DeleteSectionModal
          section={modalState.section}
          entryCount={
            rosterIndex.entryCountBySectionId.get(modalState.section.id) ?? 0
          }
          isPending={isPending}
          onClose={() => setModalState(null)}
          runAction={runAction}
        />
      )}
    </div>
  );
}
