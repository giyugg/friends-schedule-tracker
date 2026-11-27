"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Pencil,
  Trash2,
  Users,
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
import { AddMemberPopover } from "./add-member-popover";

interface SectionRosterCardProps {
  section: SectionWithMembers;
  entryCount: number;
  profiles: Profile[];
  sectionsByUserId: ReadonlyMap<string, SectionWithMembers[]>;
  requestedSemesterParam?: string;
  isPending: boolean;
  onEdit: (section: SectionWithMembers) => void;
  onDelete: (section: SectionWithMembers) => void;
  runAction: (fn: () => Promise<ActionResult>) => void;
}

export function SectionRosterCard({
  section,
  entryCount,
  profiles,
  sectionsByUserId,
  requestedSemesterParam,
  isPending,
  onEdit,
  onDelete,
  runAction,
}: SectionRosterCardProps) {
  const academic = getSectionAcademicInfo(section);
  const theme = getCollegeTheme(academic.college?.code);

  const scheduleParams = new URLSearchParams();
  scheduleParams.set("tab", "schedules");
  scheduleParams.set("section", section.id);
  if (requestedSemesterParam) {
    scheduleParams.set("semester", requestedSemesterParam);
  }
  const manageScheduleHref = `/admin?${scheduleParams.toString()}`;

  const weeklyParams = new URLSearchParams();
  weeklyParams.set("section", section.id);
  if (requestedSemesterParam) {
    weeklyParams.set("semester", requestedSemesterParam);
  }
  const weeklyHref = `/weekly?${weeklyParams.toString()}`;

  return (
    <div
      className={`rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition flex flex-col justify-between ${theme.borderHoverClass}`}
    >
      <div>
        {/* College Accent Strip */}
        <div
          className={`h-1.5 w-full rounded-t-[15px] ${theme.accentBarClass}`}
        />

        <div className="p-4 sm:p-5 space-y-4">
          {/* Card Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {academic.college ? (
                  <span
                    title={academic.college.name}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${theme.badgeClass}`}
                  >
                    {academic.college.code}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onEdit(section)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold cursor-pointer ${theme.badgeClass}`}
                  >
                    Assign College & Program
                  </button>
                )}

                <h3 className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-slate-100">
                  {section.code}
                </h3>

                {academic.specialization && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                    {academic.specialization}
                  </span>
                )}
              </div>

              {(academic.program || academic.college) && (
                <p
                  title={
                    academic.college && academic.program
                      ? `${academic.college.name} — ${academic.program.name}`
                      : undefined
                  }
                  className="text-xs text-slate-500 dark:text-slate-400 truncate"
                >
                  {academic.program
                    ? academic.program.name
                    : academic.college?.name}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onEdit(section)}
                title="Edit section details"
                aria-label={`Edit ${section.code}`}
                className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(section)}
                title="Delete section"
                aria-label={`Delete ${section.code}`}
                className="h-8 w-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Assigned Roster Area */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Users className="h-3 w-3" />
                Section Roster ({section.members.length})
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {section.members.map((member) => (
                <div
                  key={member.id}
                  title={`${member.display_name} (${member.email})`}
                  className="group inline-flex items-center gap-2 pl-1.5 pr-1.5 py-1 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  <span
                    className={`h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${theme.avatarClass}`}
                  >
                    {getInitials(member.display_name)}
                  </span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[165px] truncate">
                    {member.display_name}
                  </span>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      runAction(() =>
                        toggleSectionMemberAction({
                          sectionId: section.id,
                          userId: member.id,
                          assign: false,
                        })
                      )
                    }
                    title={`Remove ${member.display_name} from ${section.code}`}
                    aria-label={`Remove ${member.display_name} from ${section.code}`}
                    className="h-5 w-5 rounded-md flex items-center justify-center text-slate-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-300 transition cursor-pointer disabled:opacity-40"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {section.members.length === 0 && (
                <span className="text-xs text-slate-400 dark:text-slate-500 italic mr-1">
                  Empty roster
                </span>
              )}

              <AddMemberPopover
                section={section}
                profiles={profiles}
                sectionsByUserId={sectionsByUserId}
                isPending={isPending}
                runAction={runAction}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer — Schedule Stats & Quick Navigation */}
      <div className="px-4 sm:px-5 py-2.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/35 rounded-b-2xl flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] ${
              entryCount > 0
                ? "bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-900/70"
            }`}
          >
            <BookOpen className="h-3 w-3" />
            {entryCount} {entryCount === 1 ? "class" : "classes"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href={weeklyHref}
            title={`View ${section.code} weekly timetable`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition"
          >
            <CalendarDays className="h-3 w-3" />
            <span>Weekly</span>
          </Link>

          <Link
            href={manageScheduleHref}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-rose-300 hover:text-rose-700 dark:hover:border-rose-700 dark:hover:text-rose-300 transition"
          >
            <span>Manage Schedule</span>
            <ArrowUpRight className="h-3 w-3 opacity-70" />
          </Link>
        </div>
      </div>
    </div>
  );
}
