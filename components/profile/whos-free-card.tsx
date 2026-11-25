"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Coffee } from "lucide-react";
import {
  formatCompactDuration,
  formatTime12h,
  getLiveSectionStatus,
  type LiveStatus,
} from "@/lib/schedule-utils";
import { useManilaTime } from "@/lib/use-manila-time";
import type {
  Profile,
  ScheduleEntry,
  SectionWithMembers,
  VisibilityGroupWithMembers,
} from "@/lib/types";
import { getInitials } from "./profile-helpers";

type FreeOnlyStatus = Exclude<LiveStatus, { state: "in_class" }>;

interface WhosFreeCardProps {
  currentUserId: string;
  hasAssignedSection: boolean;
  myAllEntries: ScheduleEntry[];
  mySectionIdSet: Set<string>;
  hasSectionMates: boolean;
  myGroups: VisibilityGroupWithMembers[];
  visibleProfiles: Profile[];
  sectionsByUser: Map<string, SectionWithMembers[]>;
  entriesBySection: Map<string, ScheduleEntry[]>;
  buildHref: (path: string) => string;
}

export function WhosFreeCard({
  currentUserId,
  hasAssignedSection,
  myAllEntries,
  mySectionIdSet,
  hasSectionMates,
  myGroups,
  visibleProfiles,
  sectionsByUser,
  entriesBySection,
  buildHref,
}: WhosFreeCardProps) {
  const manilaNow = useManilaTime(60_000);
  const [freeFilter, setFreeFilter] = useState<string>("all");

  const myLiveStatus = useMemo(() => {
    if (!hasAssignedSection) return null;
    return getLiveSectionStatus(myAllEntries, manilaNow);
  }, [hasAssignedSection, myAllEntries, manilaNow]);

  const allFreeVisiblePeople = useMemo(() => {
    const items: {
      person: Profile;
      sectionCodes: string[];
      isClassmate: boolean;
      sharedGroupIds: string[];
      sharedGroupNames: string[];
      status: FreeOnlyStatus;
    }[] = [];

    for (const person of visibleProfiles) {
      if (person.id === currentUserId) continue;
      const personSections = sectionsByUser.get(person.id) ?? [];
      if (personSections.length === 0) continue;

      const personEntries = personSections.flatMap(
        (sec) => entriesBySection.get(sec.id) ?? []
      );
      const status = getLiveSectionStatus(personEntries, manilaNow);

      // Strictly include ONLY people who are currently free
      if (status.state === "in_class") continue;

      const isClassmate = personSections.some((sec) =>
        mySectionIdSet.has(sec.id)
      );
      const sharedGroups = myGroups.filter((g) =>
        g.memberIds.includes(person.id)
      );

      items.push({
        person,
        sectionCodes: personSections.map((s) => s.code),
        isClassmate,
        sharedGroupIds: sharedGroups.map((g) => g.id),
        sharedGroupNames: sharedGroups.map((g) => g.name),
        status,
      });
    }

    // Sort: free all day / done / sunday first, then longest free window until next class, then A-Z
    items.sort((a, b) => {
      const rank = (st: FreeOnlyStatus) => {
        if (st.state === "free" && st.minutesUntilNext !== null) {
          return st.minutesUntilNext;
        }
        return Number.MAX_SAFE_INTEGER;
      };
      const diff = rank(b.status) - rank(a.status);
      if (diff !== 0) return diff;
      return a.person.display_name.localeCompare(b.person.display_name);
    });

    return items;
  }, [
    visibleProfiles,
    currentUserId,
    sectionsByUser,
    entriesBySection,
    manilaNow,
    mySectionIdSet,
    myGroups,
  ]);

  const filteredFreePeople = useMemo(() => {
    if (freeFilter === "all") return allFreeVisiblePeople;
    if (freeFilter === "section") {
      return allFreeVisiblePeople.filter((item) => item.isClassmate);
    }
    return allFreeVisiblePeople.filter((item) =>
      item.sharedGroupIds.includes(freeFilter)
    );
  }, [allFreeVisiblePeople, freeFilter]);

  return (
    <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
      <div className="space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Coffee className="h-4 w-4 text-emerald-500" />
            Who&apos;s Free Right Now
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
            {filteredFreePeople.length} free
          </span>
        </div>

        {myLiveStatus?.state === "in_class" && (
          <div className="rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 px-3 py-2 text-[11px] text-amber-800 dark:text-amber-200">
            You&apos;re in class right now — you&apos;ll be free at{" "}
            <strong>{formatTime12h(myLiveStatus.freeAtTime)}</strong> (in{" "}
            {formatCompactDuration(myLiveStatus.minutesUntilFree)}).
          </div>
        )}

        {/* Quick Filter Pills */}
        {(hasSectionMates || myGroups.length > 0) && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setFreeFilter("all")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                freeFilter === "all"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700"
              }`}
            >
              All ({allFreeVisiblePeople.length})
            </button>

            {hasSectionMates && (
              <button
                type="button"
                onClick={() => setFreeFilter("section")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                  freeFilter === "section"
                    ? "bg-sky-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700"
                }`}
              >
                My Section
              </button>
            )}

            {myGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setFreeFilter(group.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                  freeFilter === group.id
                    ? group.type === "organization"
                      ? "bg-sky-600 text-white"
                      : "bg-rose-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700"
                }`}
              >
                {group.name}
              </button>
            ))}
          </div>
        )}

        {/* Free-Only People List */}
        {filteredFreePeople.length > 0 ? (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {filteredFreePeople.map((item) => {
              const freeLabel =
                item.status.state === "sunday"
                  ? "Sunday"
                  : item.status.state === "done"
                    ? "Done for today"
                    : item.status.nextEntry &&
                        item.status.minutesUntilNext !== null
                      ? `Free ${formatCompactDuration(
                          item.status.minutesUntilNext
                        )} · until ${formatTime12h(
                          item.status.nextEntry.start_time
                        )}`
                      : "No classes today";

              return (
                <div
                  key={item.person.id}
                  className="flex items-center justify-between gap-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 shrink-0 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 flex items-center justify-center text-[11px] font-bold">
                      {getInitials(item.person.display_name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {item.person.display_name}
                        </span>
                        {item.sectionCodes.map((code) => (
                          <span
                            key={code}
                            className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                          >
                            {code}
                          </span>
                        ))}
                        {item.isClassmate && (
                          <span className="px-1.5 py-0.5 rounded bg-sky-100/80 dark:bg-sky-950/70 text-[10px] font-semibold text-sky-700 dark:text-sky-300">
                            Classmate
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium truncate">
                        {freeLabel}
                      </div>
                    </div>
                  </div>

                  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-5 text-center text-xs text-slate-500 dark:text-slate-400">
            Nobody in this view is free right now — everyone visible is
            currently in class (or unassigned to a section).
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
        <Link
          href={buildHref("/free-time")}
          className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          Find Common Free Time
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <span className="text-[11px] text-slate-400">
          Showing only people you can view
        </span>
      </div>
    </section>
  );
}
