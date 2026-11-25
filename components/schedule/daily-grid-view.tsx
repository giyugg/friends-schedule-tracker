"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CalendarX2,
  Filter,
  GraduationCap,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import {
  COLLEGES,
  formatSectionTooltip,
  getSectionAcademicInfo,
} from "@/lib/academic-catalog";
import {
  DAYS,
  formatMemberNames,
  getDefaultDayOfWeek,
} from "@/lib/schedule-utils";
import { useManilaTime } from "@/lib/use-manila-time";
import type {
  DayOfWeek,
  ScheduleEntry,
  SectionWithMembers,
  Semester,
  VisibilityGroupWithMembers,
} from "@/lib/types";
import { ClassDetailModal } from "./class-detail-modal";
import {
  computeNowTopPx,
  ScheduleColorLegend,
  SideBySideScheduleGrid,
} from "./side-by-side-schedule-grid";

interface DailyGridViewProps {
  semester: Semester | null;
  sections: SectionWithMembers[];
  entries: ScheduleEntry[];
  currentUserId: string;
  isAdmin: boolean;
  groups?: VisibilityGroupWithMembers[];
  initialGroupPresetId?: string;
}

function getGroupSectionIds(
  group: VisibilityGroupWithMembers,
  sections: SectionWithMembers[]
): Set<string> {
  const memberSet = new Set(group.memberIds);
  const ids = new Set<string>();
  for (const sec of sections) {
    if (sec.members.some((m) => memberSet.has(m.id))) {
      ids.add(sec.id);
    }
  }
  return ids;
}

export function DailyGridView({
  semester,
  sections,
  entries,
  currentUserId,
  isAdmin,
  groups = [],
  initialGroupPresetId,
}: DailyGridViewProps) {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getDefaultDayOfWeek);
  const [searchQuery, setSearchQuery] = useState("");
  const [hiddenSectionIds, setHiddenSectionIds] = useState<Set<string>>(() => {
    if (initialGroupPresetId) {
      const presetGroup = groups.find((g) => g.id === initialGroupPresetId);
      if (presetGroup) {
        const groupSecIds = getGroupSectionIds(presetGroup, sections);
        if (groupSecIds.size > 0) {
          return new Set(
            sections.filter((s) => !groupSecIds.has(s.id)).map((s) => s.id)
          );
        }
      }
    }
    return new Set();
  });
  const [selectedModal, setSelectedModal] = useState<{
    entry: ScheduleEntry;
    section: SectionWithMembers;
  } | null>(null);
  const manilaNow = useManilaTime();

  const visibleSections = useMemo(
    () => sections.filter((s) => !hiddenSectionIds.has(s.id)),
    [sections, hiddenSectionIds]
  );

  const groupPresets = useMemo(
    () =>
      groups
        .map((group) => ({
          group,
          sectionIds: getGroupSectionIds(group, sections),
        }))
        .filter((item) => item.sectionIds.size > 0),
    [groups, sections]
  );

  const collegePresets = useMemo(() => {
    const byCollege = new Map<string, Set<string>>();
    for (const sec of sections) {
      const info = getSectionAcademicInfo(sec);
      if (!info.college) continue;
      const set = byCollege.get(info.college.code) ?? new Set<string>();
      set.add(sec.id);
      byCollege.set(info.college.code, set);
    }
    return COLLEGES.filter((c) => byCollege.has(c.code)).map((college) => ({
      college,
      sectionIds: byCollege.get(college.code) ?? new Set<string>(),
    }));
  }, [sections]);

  const selectGroupPreset = (sectionIds: Set<string>) => {
    setHiddenSectionIds(
      new Set(sections.filter((s) => !sectionIds.has(s.id)).map((s) => s.id))
    );
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const entriesBySection = useMemo(() => {
    const map = new Map<string, ScheduleEntry[]>();
    for (const entry of entries) {
      if (entry.day_of_week !== selectedDay) continue;
      if (normalizedQuery) {
        const hay =
          `${entry.course_code} ${entry.instructor ?? ""} ${entry.location ?? ""}`.toLowerCase();
        if (!hay.includes(normalizedQuery)) continue;
      }
      const list = map.get(entry.section_id) ?? [];
      list.push(entry);
      map.set(entry.section_id, list);
    }
    return map;
  }, [entries, selectedDay, normalizedQuery]);

  const toggleSection = (id: string) => {
    setHiddenSectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const showOnlyMine = () => {
    const mine = sections.filter((s) =>
      s.members.some((m) => m.id === currentUserId)
    );
    if (mine.length === 0) return;
    const mineIds = new Set(mine.map((m) => m.id));
    setHiddenSectionIds(
      new Set(sections.filter((s) => !mineIds.has(s.id)).map((s) => s.id))
    );
  };

  const nowTopPx = useMemo(
    () => computeNowTopPx(manilaNow, selectedDay),
    [manilaNow, selectedDay]
  );

  if (!semester || sections.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
        <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-500 mb-4">
          <CalendarX2 className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold">
          {!semester ? "No Semesters Yet" : `No Sections in ${semester.name}`}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          {isAdmin
            ? "Head to the Admin panel to create a semester, add sections, and enter schedules."
            : "Your admin hasn't added schedules for this semester yet. Check back soon!"}
        </p>
        {isAdmin && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-sm font-semibold hover:opacity-90 transition"
          >
            <Sparkles className="h-4 w-4" />
            Open Admin Panel
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Controls: Day Tabs + Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {DAYS.map((day) => {
            const isSelected = selectedDay === day.value;
            const isToday = manilaNow.dayOfWeek === day.value;
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => setSelectedDay(day.value)}
                className={`relative px-3.5 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
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

        <div className="relative w-full lg:w-72">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter course, prof, room…"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-3 py-2 text-sm outline-none focus:border-rose-400"
          />
        </div>
      </div>

      {/* Column Filter Pills (Show All, My Section, Group Presets, Individual Sections) */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mr-1">
          <Filter className="h-3.5 w-3.5" />
          Columns:
        </span>
        <button
          type="button"
          onClick={() => setHiddenSectionIds(new Set())}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
            hiddenSectionIds.size === 0
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
              : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          Show All
        </button>
        {sections.some((s) =>
          s.members.some((m) => m.id === currentUserId)
        ) && (
          <button
            type="button"
            onClick={showOnlyMine}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition cursor-pointer"
          >
            My Section
          </button>
        )}

        {groupPresets.length > 0 && (
          <>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />
            {groupPresets.map(({ group, sectionIds }) => {
              const isPresetActive =
                visibleSections.length === sectionIds.size &&
                visibleSections.every((s) => sectionIds.has(s.id));
              const isOrg = group.type === "organization";
              const Icon = isOrg ? Building2 : Users;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => selectGroupPreset(sectionIds)}
                  title={
                    group.description ??
                    `Show ${group.name}'s sections (${sectionIds.size})`
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                    isPresetActive
                      ? isOrg
                        ? "border-sky-400 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-200 font-semibold"
                        : "border-rose-400 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-200 font-semibold"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon
                    className={`h-3 w-3 shrink-0 ${
                      isOrg ? "text-sky-500" : "text-rose-500"
                    }`}
                  />
                  <span>{group.name}</span>
                </button>
              );
            })}
          </>
        )}

        {collegePresets.length > 0 && (
          <>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />
            {collegePresets.map(({ college, sectionIds }) => {
              const isPresetActive =
                visibleSections.length === sectionIds.size &&
                visibleSections.every((s) => sectionIds.has(s.id));
              return (
                <button
                  key={college.code}
                  type="button"
                  onClick={() => selectGroupPreset(sectionIds)}
                  title={`${college.name} (${sectionIds.size} section${sectionIds.size === 1 ? "" : "s"})`}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                    isPresetActive
                      ? "border-indigo-400 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-200 font-semibold"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <GraduationCap className="h-3 w-3 shrink-0 text-indigo-500" />
                  <span>{college.code}</span>
                </button>
              );
            })}
          </>
        )}

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />
        {sections.map((section) => {
          const isVisible = !hiddenSectionIds.has(section.id);
          const tooltip = [
            formatSectionTooltip(section),
            section.members.length > 0
              ? formatMemberNames(section.members)
              : null,
          ]
            .filter(Boolean)
            .join(" — ");
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => toggleSection(section.id)}
              title={tooltip}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                isVisible
                  ? "border-slate-300 dark:border-slate-700 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950"
                  : "border-slate-200 dark:border-slate-800 bg-transparent text-slate-400 line-through hover:text-slate-600"
              }`}
            >
              {section.code}
            </button>
          );
        })}
      </div>

      {/* Main Side-by-Side Schedule Grid */}
      <SideBySideScheduleGrid
        sections={visibleSections}
        entriesBySection={entriesBySection}
        selectedDay={selectedDay}
        currentUserId={currentUserId}
        nowTopPx={nowTopPx}
        onSelectEntry={setSelectedModal}
        maxHeightClass="max-h-[82vh]"
        showCollegeBadge={true}
      />

      {/* Color Legend */}
      <ScheduleColorLegend />

      <ClassDetailModal
        entry={selectedModal?.entry ?? null}
        section={selectedModal?.section ?? null}
        onClose={() => setSelectedModal(null)}
      />
    </div>
  );
}
