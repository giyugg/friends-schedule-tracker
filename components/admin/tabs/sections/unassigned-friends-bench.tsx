"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Search,
  Sparkles,
  UserPlus,
  X,
} from "lucide-react";
import { toggleSectionMemberAction } from "@/app/actions/admin/sections";
import type { ActionResult } from "@/app/actions/admin/types";
import {
  getCollegeTheme,
  getSectionAcademicInfo,
} from "@/lib/academic-catalog";
import { getInitials } from "@/lib/section-roster-utils";
import type { Profile, SectionWithMembers } from "@/lib/types";

interface UnassignedFriendsBenchProps {
  semesterName: string;
  totalProfilesCount: number;
  unassignedProfiles: Profile[];
  sections: SectionWithMembers[];
  isPending: boolean;
  runAction: (fn: () => Promise<ActionResult>) => void;
}

export function UnassignedFriendsBench({
  semesterName,
  totalProfilesCount,
  unassignedProfiles,
  sections,
  isPending,
  runAction,
}: UnassignedFriendsBenchProps) {
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [sectionQuery, setSectionQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!activeUserId) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setActiveUserId(null);
        setSectionQuery("");
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveUserId(null);
        setSectionQuery("");
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeUserId]);

  useEffect(() => {
    if (activeUserId) {
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [activeUserId]);

  const filteredSections = useMemo(() => {
    const q = sectionQuery.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter((sec) => {
      const info = getSectionAcademicInfo(sec);
      return (
        sec.code.toLowerCase().includes(q) ||
        info.college?.code.toLowerCase().includes(q) ||
        info.program?.name.toLowerCase().includes(q)
      );
    });
  }, [sections, sectionQuery]);

  if (totalProfilesCount === 0) return null;

  if (unassignedProfiles.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/20 px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            All <strong>{totalProfilesCount}</strong>{" "}
            {totalProfilesCount === 1 ? "friend is" : "friends are"} assigned to
            a section in <strong>{semesterName}</strong>.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="rounded-2xl border border-[#DF7A76]/45 dark:border-rose-900/60 bg-gradient-to-r from-rose-50/75 via-white to-amber-50/50 dark:from-rose-950/25 dark:via-slate-900 dark:to-amber-950/15 p-4 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-[#F19C99]/35 dark:bg-[#6E2C2A] border border-[#DF7A76]/50 flex items-center justify-center text-[#9E2A26] dark:text-[#FDE8E8] shrink-0">
            <UserPlus className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Unassigned Friends
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                {unassignedProfiles.length} of {totalProfilesCount}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {sections.length > 0
                ? "Click a friend below to assign them directly to a section for this semester."
                : "Create a section first, then assign friends here."}
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-rose-700/80 dark:text-rose-300/80">
          <Sparkles className="h-3 w-3" />
          1-click placement
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {unassignedProfiles.map((profile) => {
          const isOpen = activeUserId === profile.id;
          return (
            <div key={profile.id} className="relative">
              <button
                type="button"
                disabled={isPending || sections.length === 0}
                onClick={() => {
                  setActiveUserId(isOpen ? null : profile.id);
                  setSectionQuery("");
                }}
                title={`${profile.display_name} (${profile.email})`}
                className={`group inline-flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  isOpen
                    ? "border-rose-400 dark:border-rose-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                    : "border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 hover:border-rose-300 dark:hover:border-rose-700"
                }`}
              >
                <span className="h-6 w-6 rounded-lg bg-[#F19C99]/35 dark:bg-[#6E2C2A] border border-[#DF7A76]/40 flex items-center justify-center text-[10px] font-bold text-[#9E2A26] dark:text-[#FDE8E8]">
                  {getInitials(profile.display_name)}
                </span>
                <span className="max-w-[160px] truncate">
                  {profile.display_name}
                </span>
                {sections.length > 0 && (
                  <span className="inline-flex items-center gap-0.5 pl-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    Assign
                    <ChevronDown
                      className={`h-3 w-3 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </span>
                )}
              </button>

              {isOpen && (
                <div className="absolute left-0 top-full mt-1.5 z-40 w-72 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
                  <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative flex items-center">
                      <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={sectionQuery}
                        onChange={(e) => setSectionQuery(e.target.value)}
                        placeholder={`Assign ${profile.display_name.split(" ")[0]} to…`}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-8 pr-7 py-1.5 text-xs outline-none focus:border-rose-400"
                      />
                      {sectionQuery && (
                        <button
                          type="button"
                          onClick={() => setSectionQuery("")}
                          className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
                    {filteredSections.length === 0 ? (
                      <div className="py-5 text-center text-xs text-slate-400">
                        No matching sections found.
                      </div>
                    ) : (
                      filteredSections.map((sec) => {
                        const academic = getSectionAcademicInfo(sec);
                        const theme = getCollegeTheme(academic.college?.code);
                        return (
                          <button
                            key={sec.id}
                            type="button"
                            disabled={isPending}
                            onClick={() => {
                              setActiveUserId(null);
                              setSectionQuery("");
                              runAction(() =>
                                toggleSectionMemberAction({
                                  sectionId: sec.id,
                                  userId: profile.id,
                                  assign: true,
                                })
                              );
                            }}
                            className="w-full px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center justify-between gap-2 text-left transition cursor-pointer disabled:opacity-50"
                          >
                            <div className="min-w-0 flex items-center gap-2">
                              {academic.college && (
                                <span
                                  className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${theme.badgeClass}`}
                                >
                                  {academic.college.code}
                                </span>
                              )}
                              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {sec.code}
                              </span>
                            </div>
                            <span className="shrink-0 text-[10px] font-medium text-slate-400">
                              {sec.members.length}{" "}
                              {sec.members.length === 1 ? "member" : "members"}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
