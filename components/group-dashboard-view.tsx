"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  CalendarX2,
  Clock,
  LayoutGrid,
  MapPin,
  Radio,
  Shield,
  Users,
} from "lucide-react";
import {
  COLOR_PRESETS,
  DAYS,
  formatCompactDuration,
  formatTime12h,
  getDefaultDayOfWeek,
  getEntryColorClasses,
  getLiveSectionStatus,
  getManilaNow,
  START_HOUR,
  TIME_SLOTS,
  timeToSlotIndex,
  TOTAL_SLOTS,
} from "@/lib/schedule-utils";
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
  formatSectionTooltip,
  getSectionAcademicInfo,
} from "@/lib/academic-catalog";

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

const ROW_HEIGHT = 24;
const TIME_COL_WIDTH = 114;
const SECTION_COL_WIDTH = 152;

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
  const [manilaNow, setManilaNow] = useState(() => getManilaNow());

  useEffect(() => {
    const id = setInterval(() => setManilaNow(getManilaNow()), 60_000);
    return () => clearInterval(id);
  }, []);

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

  const memberStatuses = useMemo(() => {
    return members.map((member) => {
      const memberSections = sectionsByMember.get(member.id) ?? [];
      const primarySection = memberSections[0] ?? null;

      if (!primarySection) {
        return {
          member,
          sections: memberSections,
          status: null as ReturnType<typeof getLiveSectionStatus> | null,
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

  const nowTopPx = useMemo(() => {
    if (manilaNow.dayOfWeek !== selectedDay) return null;
    const startMins = START_HOUR * 60;
    const endMins = startMins + TOTAL_SLOTS * 30;
    if (
      manilaNow.minutesFromMidnight < startMins ||
      manilaNow.minutesFromMidnight > endMins
    ) {
      return null;
    }
    return ((manilaNow.minutesFromMidnight - startMins) / 30) * ROW_HEIGHT;
  }, [manilaNow, selectedDay]);

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
                  <span className="tabular-nums font-medium">
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

      {/* 2. Live Status Board */}
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
            {memberStatuses.map(({ member, sections: memberSections, status }) => {
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
                        <span className="truncate">{member.display_name}</span>
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
                                {formatCompactDuration(status.minutesUntilNext)}
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
            })}
          </div>
        )}
      </section>

      {/* 3. Member Directory */}
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
            <div className="w-fit max-w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <div className="overflow-x-auto max-h-[75vh] overflow-y-auto">
                <div
                  style={{
                    width: `${TIME_COL_WIDTH + sections.length * SECTION_COL_WIDTH}px`,
                  }}
                >
                  {/* Sticky Header Row */}
                  <div
                    className="sticky top-0 z-20 grid border-b border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur"
                    style={{
                      gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(${sections.length}, ${SECTION_COL_WIDTH}px)`,
                    }}
                  >
                    <div className="sticky left-0 z-30 bg-slate-100/95 dark:bg-slate-900/95 border-r border-slate-200 dark:border-slate-800 px-2 py-2 flex items-center justify-center">
                      <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-800 dark:text-slate-100">
                        {DAYS.find((d) => d.value === selectedDay)?.label}
                      </span>
                    </div>

                    {sections.map((section) => {
                      const isMine = section.members.some(
                        (m) => m.id === currentUserId
                      );
                      return (
                        <div
                          key={section.id}
                          className={`min-w-0 px-2 py-1.5 text-center border-r last:border-r-0 border-slate-200 dark:border-slate-800 flex flex-col justify-center ${
                            isMine ? "bg-rose-50/60 dark:bg-rose-950/30" : ""
                          }`}
                        >
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {section.code}
                          </div>
                          <div className="text-[10px] leading-snug text-slate-500 dark:text-slate-400 mt-0.5 space-y-0.5">
                            {section.members.map((m) => {
                              const roleLabel = getMemberRole(m.id);
                              return (
                                <div key={m.id} className="leading-tight">
                                  <div className="truncate">{m.display_name}</div>
                                  {roleLabel && (
                                    <div className="text-[9px] font-semibold text-sky-600 dark:text-sky-400 truncate">
                                      {roleLabel}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Grid Body */}
                  <div
                    className="relative grid"
                    style={{
                      gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(${sections.length}, ${SECTION_COL_WIDTH}px)`,
                      height: `${TOTAL_SLOTS * ROW_HEIGHT}px`,
                    }}
                  >
                    {/* Left Sticky Time Column */}
                    <div className="sticky left-0 z-10 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      {TIME_SLOTS.map((slot) => (
                        <div
                          key={slot.index}
                          style={{ height: `${ROW_HEIGHT}px` }}
                          title={
                            slot.isBreak
                              ? `${slot.label} (Lunch Time)`
                              : slot.label
                          }
                          className={`px-1.5 flex items-center justify-center gap-1 text-[10px] font-medium border-b border-slate-100 dark:border-slate-800/80 tabular-nums whitespace-nowrap ${
                            slot.isBreak
                              ? "bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          <span>{slot.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Section Columns */}
                    {sections.map((section) => {
                      const sectionEntries =
                        entriesBySectionForDay.get(section.id) ?? [];
                      return (
                        <div
                          key={section.id}
                          className="relative min-w-0 border-r last:border-r-0 border-slate-200/80 dark:border-slate-800"
                        >
                          {TIME_SLOTS.map((slot) => (
                            <div
                              key={slot.index}
                              style={{ height: `${ROW_HEIGHT}px` }}
                              className={`border-b border-slate-100 dark:border-slate-800/70 ${
                                slot.isBreak
                                  ? "bg-emerald-50/60 dark:bg-emerald-950/25"
                                  : ""
                              }`}
                            />
                          ))}

                          {sectionEntries.map((entry) => {
                            const startIdx = Math.max(
                              0,
                              timeToSlotIndex(entry.start_time)
                            );
                            const endIdx = Math.min(
                              TOTAL_SLOTS,
                              timeToSlotIndex(entry.end_time)
                            );
                            const spanSlots = Math.max(1, endIdx - startIdx);
                            const top = startIdx * ROW_HEIGHT + 1;
                            const height = spanSlots * ROW_HEIGHT - 2;
                            const colors = getEntryColorClasses(entry);
                            const isInternship =
                              entry.category === "internship";

                            return (
                              <button
                                key={entry.id}
                                type="button"
                                onClick={() =>
                                  setSelectedModal({ entry, section })
                                }
                                style={{
                                  top: `${top}px`,
                                  height: `${height}px`,
                                }}
                                className={`absolute left-0.5 right-0.5 rounded-lg border px-1.5 py-0.5 text-center flex flex-col items-center justify-center overflow-hidden shadow-xs hover:brightness-95 dark:hover:brightness-110 transition cursor-pointer ${colors.cardClass}`}
                              >
                                <span
                                  className={`font-bold leading-tight truncate max-w-full ${
                                    isInternship && spanSlots >= 6
                                      ? "text-sm tracking-widest uppercase"
                                      : "text-[11px]"
                                  }`}
                                >
                                  {entry.course_code}
                                </span>
                                {entry.instructor && spanSlots >= 2 && (
                                  <span className="text-[10px] opacity-90 leading-tight line-clamp-1 max-w-full">
                                    {entry.instructor}
                                  </span>
                                )}
                                {entry.location && spanSlots >= 2 && (
                                  <span className="text-[9px] font-semibold uppercase tracking-wide opacity-85 leading-tight line-clamp-1 max-w-full">
                                    {entry.location}
                                  </span>
                                )}
                                {spanSlots === 1 && (
                                  <span className="text-[9px] opacity-75">
                                    {formatTime12h(entry.start_time)}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}

                    {/* Current Time Line */}
                    {nowTopPx !== null && (
                      <div
                        style={{ top: `${nowTopPx}px` }}
                        className="pointer-events-none absolute left-0 right-0 z-15 flex items-center"
                      >
                        <div className="h-2.5 w-2.5 rounded-full bg-rose-500 -ml-1 shadow" />
                        <div className="flex-1 h-0.5 bg-rose-500/80" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Color Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-slate-400 px-1">
              {(["coral", "blush", "amber", "cream"] as const).map((key) => (
                <span key={key} className="flex items-center gap-1.5">
                  <span
                    className={`h-3 w-3 rounded border ${COLOR_PRESETS[key].swatchClass}`}
                  />
                  {COLOR_PRESETS[key].name}
                </span>
              ))}
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border bg-emerald-50 border-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800" />
                12:00 PM – 1:00 PM Lunch Time
              </span>
            </div>
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
