"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRightLeft, Plus, Search, UserPlus, X } from "lucide-react";
import { toggleSectionMemberAction } from "@/app/actions/admin/sections";
import type { ActionResult } from "@/app/actions/admin/types";
import {
  getInitials,
  getSectionCandidatePool,
} from "@/lib/section-roster-utils";
import type { Profile, SectionWithMembers } from "@/lib/types";

interface AddMemberPopoverProps {
  section: SectionWithMembers;
  profiles: Profile[];
  sectionsByUserId: ReadonlyMap<string, SectionWithMembers[]>;
  isPending: boolean;
  runAction: (fn: () => Promise<ActionResult>) => void;
}

export function AddMemberPopover({
  section,
  profiles,
  sectionsByUserId,
  isPending,
  runAction,
}: AddMemberPopoverProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const pool = useMemo(
    () =>
      getSectionCandidatePool({
        targetSectionId: section.id,
        profiles,
        sectionsByUserId,
        query,
      }),
    [section.id, profiles, sectionsByUserId, query]
  );

  const totalEligibleWithoutFilter = useMemo(
    () =>
      profiles.filter((p) => !section.members.some((m) => m.id === p.id))
        .length,
    [profiles, section.members]
  );

  const handleAssign = (userId: string) => {
    setOpen(false);
    setQuery("");
    runAction(() =>
      toggleSectionMemberAction({
        sectionId: section.id,
        userId,
        assign: true,
      })
    );
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        disabled={isPending || totalEligibleWithoutFilter === 0}
        onClick={() => {
          setOpen((prev) => !prev);
          setQuery("");
        }}
        title={
          totalEligibleWithoutFilter === 0
            ? "Everyone is already in this section"
            : `Add or move a friend to ${section.code}`
        }
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
          open
            ? "border-rose-400 dark:border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-200"
            : "border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-400 hover:text-rose-700 dark:hover:border-rose-600 dark:hover:text-rose-300 hover:bg-rose-50/50 dark:hover:bg-rose-950/25"
        }`}
      >
        <UserPlus className="h-3.5 w-3.5" />
        <span>Add Friend</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 z-30 w-80 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
          <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
            <div className="flex items-center justify-between gap-2 mb-1.5 px-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Add to {section.code}
              </span>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                }}
                aria-label="Close picker"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="relative flex items-center">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search friend or current section…"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-7 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-rose-400"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto p-1.5 space-y-2">
            {pool.totalCount === 0 ? (
              <div className="py-6 px-3 text-center text-xs text-slate-400">
                No matching friends found.
              </div>
            ) : (
              <>
                {pool.unassigned.length > 0 && (
                  <div>
                    <div className="px-2 py-1 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Unassigned ({pool.unassigned.length})
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Available
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {pool.unassigned.map((profile) => (
                        <button
                          key={profile.id}
                          type="button"
                          disabled={isPending}
                          onClick={() => handleAssign(profile.id)}
                          className="group w-full px-2 py-1.5 rounded-xl hover:bg-emerald-50/80 dark:hover:bg-emerald-950/35 flex items-center justify-between gap-2 text-left transition cursor-pointer disabled:opacity-50"
                        >
                          <div className="min-w-0 flex items-center gap-2">
                            <span className="h-7 w-7 shrink-0 rounded-lg bg-emerald-100 dark:bg-emerald-950 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-center text-[10px] font-bold text-emerald-800 dark:text-emerald-200">
                              {getInitials(profile.display_name)}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {profile.display_name}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {profile.email}
                              </div>
                            </div>
                          </div>
                          <span className="shrink-0 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold group-hover:bg-emerald-600 group-hover:text-white transition">
                            <Plus className="h-3 w-3" />
                            Add
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {pool.transferable.length > 0 && (
                  <div
                    className={
                      pool.unassigned.length > 0
                        ? "pt-1.5 border-t border-slate-100 dark:border-slate-800"
                        : ""
                    }
                  >
                    <div className="px-2 py-1 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        In Another Section ({pool.transferable.length})
                      </span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                        1-click transfer
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {pool.transferable.map(({ profile, fromSections }) => {
                        const fromLabel = fromSections
                          .map((s) => s.code)
                          .join(", ");
                        return (
                          <button
                            key={profile.id}
                            type="button"
                            disabled={isPending}
                            onClick={() => handleAssign(profile.id)}
                            className="group w-full px-2 py-1.5 rounded-xl hover:bg-amber-50/80 dark:hover:bg-amber-950/30 flex items-center justify-between gap-2 text-left transition cursor-pointer disabled:opacity-50"
                          >
                            <div className="min-w-0 flex items-center gap-2">
                              <span className="h-7 w-7 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                {getInitials(profile.display_name)}
                              </span>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                  {profile.display_name}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                  Currently in{" "}
                                  <strong className="text-slate-700 dark:text-slate-300">
                                    {fromLabel}
                                  </strong>
                                </div>
                              </div>
                            </div>
                            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100/80 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold group-hover:bg-amber-600 group-hover:text-white transition">
                              <ArrowRightLeft className="h-2.5 w-2.5" />
                              Move
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
