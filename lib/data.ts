import "server-only";

import { createClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/config";
import type {
  Profile,
  ScheduleEntry,
  SectionMember,
  SectionWithMembers,
  Semester,
  VisibilityGroup,
  VisibilityGroupWithMembers,
} from "./types";

export interface ScheduleBundle {
  semesters: Semester[];
  activeSemester: Semester | null;
  sections: SectionWithMembers[];
  entries: ScheduleEntry[];
  profiles: Profile[];
  visibilityGroups: VisibilityGroupWithMembers[];
}

export interface GroupDashboardBundle {
  semesters: Semester[];
  activeSemester: Semester | null;
  visibilityGroups: VisibilityGroupWithMembers[];
  group: VisibilityGroupWithMembers;
  members: Profile[];
  sections: SectionWithMembers[];
  entries: ScheduleEntry[];
}

export async function getScheduleBundle(
  requestedSemesterId?: string
): Promise<ScheduleBundle> {
  if (!isSupabaseConfigured()) {
    return {
      semesters: [],
      activeSemester: null,
      sections: [],
      entries: [],
      profiles: [],
      visibilityGroups: [],
    };
  }

  const supabase = await createClient();

  const [
    { data: semestersData },
    { data: profilesData },
    { data: groupsData },
    { data: groupMembersData },
  ] = await Promise.all([
    supabase
      .from("semesters")
      .select("*")
      .order("is_active", { ascending: false })
      .order("is_archived", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("*")
      .order("display_name", { ascending: true }),
    supabase
      .from("visibility_groups")
      .select("*")
      .order("type", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("visibility_group_members")
      .select("group_id, user_id, role_label"),
  ]);

  const semesters = (semestersData ?? []) as Semester[];
  const profiles = (profilesData ?? []) as Profile[];

  const membersByGroup = new Map<string, string[]>();
  const rolesByGroup = new Map<string, Record<string, string | null>>();
  for (const row of (groupMembersData ?? []) as {
    group_id: string;
    user_id: string;
    role_label?: string | null;
  }[]) {
    const list = membersByGroup.get(row.group_id) ?? [];
    list.push(row.user_id);
    membersByGroup.set(row.group_id, list);

    const roleMap = rolesByGroup.get(row.group_id) ?? {};
    roleMap[row.user_id] = row.role_label?.trim() || null;
    rolesByGroup.set(row.group_id, roleMap);
  }

  const visibilityGroups: VisibilityGroupWithMembers[] = (
    (groupsData ?? []) as VisibilityGroup[]
  ).map((g) => ({
    ...g,
    memberIds: membersByGroup.get(g.id) ?? [],
    memberRoles:
      g.type === "organization" ? (rolesByGroup.get(g.id) ?? {}) : {},
  }));

  const activeSemester =
    (requestedSemesterId
      ? semesters.find((s) => s.id === requestedSemesterId)
      : undefined) ??
    semesters.find((s) => s.is_active) ??
    semesters.find((s) => !s.is_archived) ??
    semesters[0] ??
    null;

  if (!activeSemester) {
    return {
      semesters,
      activeSemester: null,
      sections: [],
      entries: [],
      profiles,
      visibilityGroups,
    };
  }

  const { data: sectionsData } = await supabase
    .from("sections")
    .select("*")
    .eq("semester_id", activeSemester.id)
    .order("display_order", { ascending: true })
    .order("code", { ascending: true });

  const rawSections = sectionsData ?? [];
  const sectionIds = rawSections.map((s) => s.id);

  if (sectionIds.length === 0) {
    return {
      semesters,
      activeSemester,
      sections: [],
      entries: [],
      profiles,
      visibilityGroups,
    };
  }

  const [{ data: membersData }, { data: entriesData }] = await Promise.all([
    supabase
      .from("section_members")
      .select("section_id, user_id")
      .in("section_id", sectionIds),
    supabase
      .from("schedule_entries")
      .select("*")
      .in("section_id", sectionIds)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true }),
  ]);

  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const membersBySection = new Map<
    string,
    Pick<Profile, "id" | "display_name" | "email">[]
  >();

  for (const row of (membersData ?? []) as SectionMember[]) {
    const profile = profileMap.get(row.user_id);
    if (!profile) continue;
    const list = membersBySection.get(row.section_id) ?? [];
    list.push({
      id: profile.id,
      display_name: profile.display_name,
      email: profile.email,
    });
    membersBySection.set(row.section_id, list);
  }

  const sections: SectionWithMembers[] = rawSections.map((section) => ({
    ...section,
    members: (membersBySection.get(section.id) ?? []).sort((a, b) =>
      a.display_name.localeCompare(b.display_name)
    ),
  }));

  const entries = (entriesData ?? []) as ScheduleEntry[];

  return {
    semesters,
    activeSemester,
    sections,
    entries,
    profiles,
    visibilityGroups,
  };
}

export async function getGroupDashboardBundle(
  groupId: string,
  requestedSemesterId?: string
): Promise<GroupDashboardBundle | null> {
  const bundle = await getScheduleBundle(requestedSemesterId);
  const group = bundle.visibilityGroups.find((g) => g.id === groupId);
  if (!group) return null;

  const groupMemberSet = new Set(group.memberIds);
  const members = bundle.profiles
    .filter((p) => groupMemberSet.has(p.id))
    .sort((a, b) => a.display_name.localeCompare(b.display_name));

  const sections = bundle.sections
    .map((sec) => ({
      ...sec,
      members: sec.members.filter((m) => groupMemberSet.has(m.id)),
    }))
    .filter((sec) => sec.members.length > 0);

  const visibleSectionIds = new Set(sections.map((s) => s.id));
  const entries = bundle.entries.filter((e) =>
    visibleSectionIds.has(e.section_id)
  );

  return {
    semesters: bundle.semesters,
    activeSemester: bundle.activeSemester,
    visibilityGroups: bundle.visibilityGroups,
    group,
    members,
    sections,
    entries,
  };
}
