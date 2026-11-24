import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/config";
import type {
  GradeEntry,
  GradeTerm,
  GradeTermWithEntries,
  Profile,
  ProfileChangeRequest,
  ProfileChangeRequestWithUser,
  ScheduleEntry,
  SectionMember,
  SectionWithMembers,
  Semester,
  VisibilityGroup,
  VisibilityGroupWithMembers,
} from "./types";
import { sortGradeTerms } from "./grades-utils";

export interface ShellData {
  semesters: Semester[];
  visibilityGroups: VisibilityGroupWithMembers[];
}

export async function getShellData(): Promise<ShellData> {
  "use cache: private";
  cacheLife({ stale: 300 });
  cacheTag("shell", "semesters", "groups");

  if (!isSupabaseConfigured()) {
    return {
      semesters: [],
      visibilityGroups: [],
    };
  }

  const supabase = await createClient();

  const [
    { data: semestersData },
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
      .from("visibility_groups")
      .select("*")
      .order("type", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("visibility_group_members")
      .select("group_id, user_id, role_label"),
  ]);

  const semesters = (semestersData ?? []) as Semester[];

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

  return {
    semesters,
    visibilityGroups,
  };
}

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
  "use cache: private";
  cacheLife({ stale: 300 });
  cacheTag("semesters", "sections", "schedules", "groups", "profiles");

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

  const [shell, { data: profilesData }] = await Promise.all([
    getShellData(),
    supabase
      .from("profiles")
      .select("*")
      .order("display_name", { ascending: true }),
  ]);

  const { semesters, visibilityGroups } = shell;
  const profiles = (profilesData ?? []) as Profile[];

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
  "use cache: private";
  cacheLife({ stale: 300 });
  cacheTag("semesters", "sections", "schedules", "groups", "profiles");

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

export interface GradesBundle {
  semesters: Semester[];
  activeSemester: Semester | null;
  visibilityGroups: VisibilityGroupWithMembers[];
  gradeTerms: GradeTermWithEntries[];
  migrationRequired: boolean;
}

export async function getGradesBundle(
  userId: string,
  requestedSemesterId?: string
): Promise<GradesBundle> {
  "use cache: private";
  cacheLife({ stale: 300 });
  cacheTag("semesters", "groups", "grades");

  if (!isSupabaseConfigured()) {
    return {
      semesters: [],
      activeSemester: null,
      visibilityGroups: [],
      gradeTerms: [],
      migrationRequired: false,
    };
  }

  const supabase = await createClient();

  const [
    shell,
    { data: termsData, error: termsError },
    { data: entriesData, error: entriesError },
  ] = await Promise.all([
    getShellData(),
    supabase
      .from("grade_terms")
      .select("*")
      .eq("user_id", userId)
      .order("academic_year", { ascending: true }),
    supabase
      .from("grade_entries")
      .select("*")
      .eq("user_id", userId)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const { semesters, visibilityGroups } = shell;

  const activeSemester =
    (requestedSemesterId
      ? semesters.find((s) => s.id === requestedSemesterId)
      : undefined) ??
    semesters.find((s) => s.is_active) ??
    semesters.find((s) => !s.is_archived) ??
    semesters[0] ??
    null;

  const missingTable =
    termsError?.code === "42P01" ||
    entriesError?.code === "42P01" ||
    termsError?.code === "PGRST205" ||
    entriesError?.code === "PGRST205";

  if (missingTable) {
    return {
      semesters,
      activeSemester,
      visibilityGroups,
      gradeTerms: [],
      migrationRequired: true,
    };
  }

  const entriesByTerm = new Map<string, GradeEntry[]>();
  for (const raw of (entriesData ?? []) as (Omit<GradeEntry, "units"> & {
    units: number | string;
  })[]) {
    const entry: GradeEntry = {
      ...raw,
      units: Number(raw.units),
    };
    const list = entriesByTerm.get(entry.term_id) ?? [];
    list.push(entry);
    entriesByTerm.set(entry.term_id, list);
  }

  const gradeTerms = sortGradeTerms(
    ((termsData ?? []) as GradeTerm[]).map((term) => ({
      ...term,
      entries: entriesByTerm.get(term.id) ?? [],
    }))
  );

  return {
    semesters,
    activeSemester,
    visibilityGroups,
    gradeTerms,
    migrationRequired: false,
  };
}

export interface ProfileBundle {
  semesters: Semester[];
  activeSemester: Semester | null;
  visibilityGroups: VisibilityGroupWithMembers[];
  userSection: SectionWithMembers | null;
  sectionEntries: ScheduleEntry[];
  gradeTerms: GradeTermWithEntries[];
  gradesMigrationRequired: boolean;
  changeRequests: ProfileChangeRequest[];
  requestsMigrationRequired: boolean;
}

export async function getProfileBundle(
  userId: string,
  requestedSemesterId?: string
): Promise<ProfileBundle> {
  "use cache: private";
  cacheLife({ stale: 300 });
  cacheTag(
    "semesters",
    "sections",
    "schedules",
    "groups",
    "profiles",
    "grades",
    "profile-requests"
  );

  if (!isSupabaseConfigured()) {
    return {
      semesters: [],
      activeSemester: null,
      visibilityGroups: [],
      userSection: null,
      sectionEntries: [],
      gradeTerms: [],
      gradesMigrationRequired: false,
      changeRequests: [],
      requestsMigrationRequired: false,
    };
  }

  const supabase = await createClient();

  const [
    scheduleBundle,
    { data: termsData, error: termsError },
    { data: gradeEntriesData, error: gradeEntriesError },
    { data: requestsData, error: requestsError },
  ] = await Promise.all([
    getScheduleBundle(requestedSemesterId),
    supabase
      .from("grade_terms")
      .select("*")
      .eq("user_id", userId)
      .order("academic_year", { ascending: true }),
    supabase
      .from("grade_entries")
      .select("*")
      .eq("user_id", userId)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("profile_change_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const userSection =
    scheduleBundle.sections.find((sec) =>
      sec.members.some((m) => m.id === userId)
    ) ?? null;

  const sectionEntries = userSection
    ? scheduleBundle.entries.filter((e) => e.section_id === userSection.id)
    : [];

  const gradesMigrationRequired =
    termsError?.code === "42P01" ||
    gradeEntriesError?.code === "42P01" ||
    termsError?.code === "PGRST205" ||
    gradeEntriesError?.code === "PGRST205";

  let gradeTerms: GradeTermWithEntries[] = [];
  if (!gradesMigrationRequired) {
    const entriesByTerm = new Map<string, GradeEntry[]>();
    for (const raw of (gradeEntriesData ?? []) as (Omit<GradeEntry, "units"> & {
      units: number | string;
    })[]) {
      const entry: GradeEntry = {
        ...raw,
        units: Number(raw.units),
      };
      const list = entriesByTerm.get(entry.term_id) ?? [];
      list.push(entry);
      entriesByTerm.set(entry.term_id, list);
    }

    gradeTerms = sortGradeTerms(
      ((termsData ?? []) as GradeTerm[]).map((term) => ({
        ...term,
        entries: entriesByTerm.get(term.id) ?? [],
      }))
    );
  }

  const requestsMigrationRequired =
    requestsError?.code === "42P01" || requestsError?.code === "PGRST205";

  const changeRequests = requestsMigrationRequired
    ? []
    : ((requestsData ?? []) as ProfileChangeRequest[]);

  return {
    semesters: scheduleBundle.semesters,
    activeSemester: scheduleBundle.activeSemester,
    visibilityGroups: scheduleBundle.visibilityGroups,
    userSection,
    sectionEntries,
    gradeTerms,
    gradesMigrationRequired,
    changeRequests,
    requestsMigrationRequired,
  };
}

export interface AdminProfileRequestsBundle {
  requests: ProfileChangeRequestWithUser[];
  migrationRequired: boolean;
}

export async function getAdminProfileChangeRequests(
  profiles: Profile[]
): Promise<AdminProfileRequestsBundle> {
  "use cache: private";
  cacheLife({ stale: 300 });
  cacheTag("profile-requests", "profiles");

  if (!isSupabaseConfigured()) {
    return { requests: [], migrationRequired: false };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile_change_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error?.code === "42P01" || error?.code === "PGRST205") {
    return { requests: [], migrationRequired: true };
  }

  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const rawRequests = (data ?? []) as ProfileChangeRequest[];

  const enriched: ProfileChangeRequestWithUser[] = rawRequests.map((req) => {
    const user = profileMap.get(req.user_id);
    const reviewer = req.reviewed_by ? profileMap.get(req.reviewed_by) : null;
    return {
      ...req,
      user_email: user?.email ?? "Unknown user",
      user_display_name: user?.display_name ?? req.current_display_name,
      reviewer_display_name: reviewer?.display_name ?? null,
    };
  });

  // Sort pending requests first (oldest pending first so queue is FIFO), then resolved newest first
  enriched.sort((a, b) => {
    const aPending = a.status === "pending" ? 0 : 1;
    const bPending = b.status === "pending" ? 0 : 1;
    if (aPending !== bPending) return aPending - bPending;
    if (aPending === 0) {
      return a.created_at.localeCompare(b.created_at);
    }
    return b.created_at.localeCompare(a.created_at);
  });

  return {
    requests: enriched,
    migrationRequired: false,
  };
}

export async function getPendingProfileRequestsCount(): Promise<number> {
  "use cache: private";
  cacheLife({ stale: 300 });
  cacheTag("profile-requests");

  if (!isSupabaseConfigured()) {
    return 0;
  }

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("profile_change_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) {
    return 0;
  }

  return count ?? 0;
}
