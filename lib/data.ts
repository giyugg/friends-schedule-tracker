import "server-only";

import { createClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/config";
import type {
  Profile,
  ScheduleEntry,
  SectionMember,
  SectionWithMembers,
  Semester,
} from "./types";

export interface ScheduleBundle {
  semesters: Semester[];
  activeSemester: Semester | null;
  sections: SectionWithMembers[];
  entries: ScheduleEntry[];
  profiles: Profile[];
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
    };
  }

  const supabase = await createClient();

  const [{ data: semestersData }, { data: profilesData }] = await Promise.all([
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
  ]);

  const semesters = (semestersData ?? []) as Semester[];
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

  return {
    semesters,
    activeSemester,
    sections,
    entries: (entriesData ?? []) as ScheduleEntry[],
    profiles,
  };
}
