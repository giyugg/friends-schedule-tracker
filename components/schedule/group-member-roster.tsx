"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Clock,
  MapPin,
  Radio,
  Users,
} from "lucide-react";
import {
  formatSectionTooltip,
  getSectionAcademicInfo,
} from "@/lib/academic-catalog";
import {
  formatCompactDuration,
  formatTime12h,
  type LiveStatus,
} from "@/lib/schedule-utils";
import type { Profile, SectionWithMembers } from "@/lib/types";

export interface GroupMemberStatusItem {
  member: Profile;
  sections: SectionWithMembers[];
  status: LiveStatus | null;
}

interface GroupMemberRosterProps {
  members: Profile[];
  memberStatuses: GroupMemberStatusItem[];
  sectionsByMember: Map<string, SectionWithMembers[]>;
  currentUserId: string;
  getMemberRole: (userId: string) => string | null;
  buildWeeklyHref: (sectionId: string) => string;
}

export function GroupMemberRoster({
  members,
  memberStatuses,
  sectionsByMember,
  currentUserId,
  getMemberRole,
  buildWeeklyHref,
}: GroupMemberRosterProps) {
  return (
    <>
      {/* Live Status Board */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
              <Radio className="h-4 w-4 text-emerald-500" />
              Live Status Board
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Who&apos;s free or in class right now (Asia/Manila)
            </p>
          </div>
        </div>

        {memberStatuses.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No members in this group yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {memberStatuses.map(
              ({ member, sections: memberSections, status }) => {
                const isMe = member.id === currentUserId;
                const isInClass = status?.state === "in_class";
                const roleLabel = getMemberRole(member.id);
                return (
                  <div
                    key={member.id}
                    className={`rounded-2xl border p-3.5 flex flex-col justify-between gap-2.5 bg-white dark:bg-slate-900 ${
                      isMe
                        ? "border-rose-300/80 dark:border-rose-900/80"
                        : "border-slate-200/80 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                          <span className="truncate">
                            {member.display_name}
                          </span>
                          {isMe && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                              You
                            </span>
                          )}
                        </div>
                        {roleLabel && (
                          <div className="mt-1">
                            <span className="inline-block max-w-full truncate px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-900">
                              {roleLabel}
                            </span>
                          </div>
                        )}
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-1">
                          {memberSections.length > 0 ? (
                            memberSections.map((sec, idx) => {
                              const academic = getSectionAcademicInfo(sec);
                              return (
                                <span
                                  key={sec.id}
                                  title={formatSectionTooltip(sec)}
                                  className="inline-flex items-center gap-1"
                                >
                                  {idx > 0 && (
                                    <span className="text-slate-300 dark:text-slate-600">
                                      ·
                                    </span>
                                  )}
                                  {academic.college && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-900">
                                      {academic.college.code}
                                    </span>
                                  )}
                                  <span>{sec.code}</span>
                                </span>
                              );
                            })
                          ) : (
                            <span>No section assigned</span>
                          )}
                        </div>
                      </div>

                      {status ? (
                        <span
                          className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isInClass
                              ? "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300"
                              : "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300"
                          }`}
                        >
                          {status.state === "in_class"
                            ? "In Class"
                            : status.state === "done"
                              ? "Done"
                              : status.state === "sunday"
                                ? "Sunday"
                                : "Free"}
                        </span>
                      ) : (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          Unassigned
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                      {!status && (
                        <span className="text-slate-400 block truncate">
                          Not assigned to a section this semester
                        </span>
                      )}
                      {status?.state === "in_class" && (
                        <>
                          <div className="flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                            <span className="font-semibold">
                              {status.currentEntry.course_code}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="truncate">
                              {status.currentEntry.location ||
                                status.currentEntry.modality.toUpperCase()}
                            </span>
                            <span className="text-slate-400 shrink-0">
                              (til {formatTime12h(status.currentEntry.end_time)})
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              Free in{" "}
                              {formatCompactDuration(status.minutesUntilFree)}
                              {status.hasBackToBack
                                ? ` (back-to-back til ${formatTime12h(status.freeAtTime)})`
                                : ""}
                            </span>
                          </div>
                        </>
                      )}
                      {status?.state === "free" &&
                        (status.nextEntry ? (
                          <>
                            <div className="truncate">
                              Next:{" "}
                              <strong>{status.nextEntry.course_code}</strong> at{" "}
                              {formatTime12h(status.nextEntry.start_time)} (
                              {status.nextEntry.location ||
                                status.nextEntry.modality.toUpperCase()}
                              )
                            </div>
                            {status.minutesUntilNext !== null && (
                              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <Clock className="h-3 w-3 shrink-0" />
                                <span>
                                  Next class in{" "}
                                  {formatCompactDuration(
                                    status.minutesUntilNext
                                  )}
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="block">Free all day</span>
                        ))}
                      {status?.state === "done" && (
                        <span className="block">Done with classes today</span>
                      )}
                      {status?.state === "sunday" && (
                        <span className="block">No Sunday classes</span>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </section>

      {/* Member Directory */}
      <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
            <Users className="h-4 w-4 text-rose-500" />
            Member Directory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click a member&apos;s section to open their weekly timetable
          </p>
        </div>

        {members.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No members assigned to this group.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {members.map((member) => {
              const memberSections = sectionsByMember.get(member.id) ?? [];
              const isMe = member.id === currentUserId;
              const roleLabel = getMemberRole(member.id);
              return (
                <div
                  key={member.id}
                  className="py-2.5 flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex flex-wrap items-center gap-1.5">
                      <span className="truncate">{member.display_name}</span>
                      {roleLabel && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-900">
                          {roleLabel}
                        </span>
                      )}
                      {isMe && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {member.email}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {memberSections.length > 0 ? (
                      memberSections.map((sec) => (
                        <Link
                          key={sec.id}
                          href={buildWeeklyHref(sec.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/60 dark:hover:text-rose-200 transition"
                        >
                          <CalendarDays className="h-3 w-3" />
                          <span>{sec.code}</span>
                          <ArrowUpRight className="h-3 w-3 opacity-60" />
                        </Link>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">
                        No section
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
