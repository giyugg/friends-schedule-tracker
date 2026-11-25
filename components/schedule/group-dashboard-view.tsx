"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CalendarDays,
  CalendarX2,
  LayoutGrid,
  Radio,
  Shield,
  Users,
} from "lucide-react";
import {
  DAYS,
  getDefaultDayOfWeek,
  getLiveSectionStatus,
} from "@/lib/schedule-utils";
import { useManilaTime } from "@/lib/use-manila-time";
import type {
  DayOfWeek,
  Profile,
  ScheduleEntry,
  SectionWithMembers,
  Semester,
  VisibilityGroupWithMembers,
} from "@/lib/types";
import { ClassDetailModal } from "./class-detail-modal";
import {
  GroupMemberRoster,
  type GroupMemberStatusItem,
} from "./group-member-roster";
import {
  computeNowTopPx,
  ScheduleColorLegend,
  SideBySideScheduleGrid,
} from "./side-by-side-schedule-grid";

interface GroupDashboardViewProps {
  group: VisibilityGroupWithMembers;
  semester: Semester | null;
  semesterParam: string | null;
  members: Profile[];
  sections: SectionWithMembers[];
  entries: ScheduleEntry[];
  currentUserId: string;
  isAdmin: boolean;
}

export function GroupDashboardView({
  group,
  semester,
  semesterParam,
  members,
  sections,
  entries,
  currentUserId,
  isAdmin,
}: GroupDashboardViewProps) {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getDefaultDayOfWeek);
  const [selectedModal, setSelectedModal] = useState<{
    entry: ScheduleEntry;
    section: SectionWithMembers;
  } | null>(null);
  const manilaNow = useManilaTime();

  const entriesBySectionAll = useMemo(() => {
    const map = new Map<string, ScheduleEntry[]>();
    for (const entry of entries) {
      const list = map.get(entry.section_id) ?? [];
      list.push(entry);
      map.set(entry.section_id, list);
    }
    return map;
  }, [entries]);

  const sectionsByMember = useMemo(() => {
    const map = new Map<string, SectionWithMembers[]>();
    for (const sec of sections) {
      for (const m of sec.members) {
        const list = map.get(m.id) ?? [];
        list.push(sec);
        map.set(m.id, list);
      }
    }
    return map;
  }, [sections]);

  const memberStatuses = useMemo<GroupMemberStatusItem[]>(() => {
    return members.map((member) => {
      const memberSections = sectionsByMember.get(member.id) ?? [];
      const primarySection = memberSections[0] ?? null;

      if (!primarySection) {
        return {
          member,
          sections: memberSections,
          status: null,
        };
      }

      // If a member belongs to multiple sections, combine their entries for live status
      const combinedEntries = memberSections.flatMap(
        (sec) => entriesBySectionAll.get(sec.id) ?? []
      );
      return {
        member,
        sections: memberSections,
        status: getLiveSectionStatus(combinedEntries, manilaNow),
      };
    });
  }, [members, sectionsByMember, entriesBySectionAll, manilaNow]);

  const inClassCount = useMemo(
    () =>
      memberStatuses.filter((item) => item.status?.state === "in_class").length,
    [memberStatuses]
  );

  const freeCount = useMemo(
    () =>
      memberStatuses.filter(
        (item) => item.status && item.status.state !== "in_class"
      ).length,
    [memberStatuses]
  );

  const entriesBySectionForDay = useMemo(() => {
    const map = new Map<string, ScheduleEntry[]>();
    for (const entry of entries) {
      if (entry.day_of_week !== selectedDay) continue;
      const list = map.get(entry.section_id) ?? [];
      list.push(entry);
      map.set(entry.section_id, list);
    }
    return map;
  }, [entries, selectedDay]);

  const nowTopPx = useMemo(
    () => computeNowTopPx(manilaNow, selectedDay),
    [manilaNow, selectedDay]
  );

  const buildDailyHref = () => {
    const params = new URLSearchParams();
    if (semesterParam) params.set("semester", semesterParam);
    params.set("preset", group.id);
    return `/daily?${params.toString()}`;
  };

  const buildWeeklyHref = (sectionId: string) => {
    const params = new URLSearchParams();
    if (semesterParam) params.set("semester", semesterParam);
    params.set("section", sectionId);
    return `/weekly?${params.toString()}`;
  };

  const isOrg = group.type === "organization";
  const GroupIcon = isOrg ? Building2 : Users;
  const getMemberRole = (userId: string) =>
    isOrg ? (group.memberRoles[userId] ?? null) : null;

  return (
    <div className="space-y-6">
      {/* 1. Group Header */}
      <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className={`h-11 w-11 shrink-0 rounded-2xl border flex items-center justify-center ${
                isOrg
                  ? "bg-sky-50 dark:bg-sky-950/60 border-sky-200/80 dark:border-sky-900 text-sky-600 dark:text-sky-300"
                  : "bg-rose-50 dark:bg-rose-950/60 border-rose-200/80 dark:border-rose-900 text-rose-600 dark:text-rose-300"
              }`}
            >
              <GroupIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
                  {group.name}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                    isOrg
                      ? "bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300"
                      : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                  }`}
                >
                  {isOrg ? "Organization" : "Circle"}
                </span>
                {semester && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {semester.name}
                  </span>
                )}
              </div>
              {group.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {group.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-2">
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {members.length} member{members.length === 1 ? "" : "s"}
                </span>
                <span>·</span>
                <span>
                  {sections.length} section{sections.length === 1 ? "" : "s"}
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Radio className="h-3.5 w-3.5 text-emerald-500" />
                  <span suppressHydrationWarning className="tabular-nums font-medium">
                    {manilaNow.timeLabel}
                  </span>
                </span>
                <span>·</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {freeCount} Free
                </span>
                <span>·</span>
                <span className="text-rose-600 dark:text-rose-400 font-semibold">
                  {inClassCount} In Class
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href={buildDailyHref()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold hover:opacity-90 transition"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              View in Daily Grid
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
              >
                <Shield className="h-3.5 w-3.5" />
                Manage in Admin
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 2 & 3. Live Status Board + Member Directory */}
      <GroupMemberRoster
        members={members}
        memberStatuses={memberStatuses}
        sectionsByMember={sectionsByMember}
        currentUserId={currentUserId}
        getMemberRole={getMemberRole}
        buildWeeklyHref={buildWeeklyHref}
      />

      {/* 4. Group Daily Schedule */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-rose-500" />
              Group Daily Schedule
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Side-by-side timetable for {group.name}&apos;s sections
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {DAYS.map((day) => {
              const isSelected = selectedDay === day.value;
              const isToday = manilaNow.dayOfWeek === day.value;
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => setSelectedDay(day.value)}
                  className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs"
                      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{day.label}</span>
                  {isToday && (
                    <span
                      title="Today"
                      className={`ml-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle ${
                        isSelected
                          ? "bg-rose-400 dark:bg-rose-600"
                          : "bg-rose-500"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {!semester || sections.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
            <CalendarX2 className="h-7 w-7 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              No section schedules for this group yet
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Assign group members to sections in the current semester to see
              their timetable here.
            </p>
          </div>
        ) : (
          <>
            <SideBySideScheduleGrid
              sections={sections}
              entriesBySection={entriesBySectionForDay}
              selectedDay={selectedDay}
              currentUserId={currentUserId}
              nowTopPx={nowTopPx}
              onSelectEntry={setSelectedModal}
              maxHeightClass="max-h-[75vh]"
              showCollegeBadge={false}
              getMemberRole={getMemberRole}
            />

            <ScheduleColorLegend />
          </>
        )}
      </section>

      <ClassDetailModal
        entry={selectedModal?.entry ?? null}
        section={selectedModal?.section ?? null}
        onClose={() => setSelectedModal(null)}
      />
    </div>
  );
}
