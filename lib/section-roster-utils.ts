import { getSectionAcademicInfo } from "./academic-catalog.ts";
import type { Profile, ScheduleEntry, SectionWithMembers } from "./types.ts";

export function getInitials(displayName: string): string {
  const cleaned = displayName.trim().replace(/\s+/g, " ");
  if (!cleaned) return "?";
  const parts = cleaned.split(" ").filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const first = parts[0][0] ?? "";
  const last = parts[parts.length - 1][0] ?? "";
  return `${first}${last}`.toUpperCase();
}

export interface SemesterRosterIndex {
  sectionsByUserId: Map<string, SectionWithMembers[]>;
  unassignedProfiles: Profile[];
  assignedFriendCount: number;
  emptySectionsCount: number;
  unassignedProgramSectionsCount: number;
  entryCountBySectionId: Map<string, number>;
}

export function buildSemesterRosterIndex(
  sections: readonly SectionWithMembers[],
  profiles: readonly Profile[],
  entries: readonly Pick<ScheduleEntry, "section_id">[]
): SemesterRosterIndex {
  const sectionsByUserId = new Map<string, SectionWithMembers[]>();
  let emptySectionsCount = 0;
  let unassignedProgramSectionsCount = 0;

  for (const section of sections) {
    if (section.members.length === 0) {
      emptySectionsCount++;
    }
    if (!getSectionAcademicInfo(section).isAssigned) {
      unassignedProgramSectionsCount++;
    }
    for (const member of section.members) {
      const list = sectionsByUserId.get(member.id) ?? [];
      list.push(section);
      sectionsByUserId.set(member.id, list);
    }
  }

  const entryCountBySectionId = new Map<string, number>();
  for (const entry of entries) {
    entryCountBySectionId.set(
      entry.section_id,
      (entryCountBySectionId.get(entry.section_id) ?? 0) + 1
    );
  }

  const unassignedProfiles: Profile[] = [];
  let assignedFriendCount = 0;

  for (const profile of profiles) {
    const current = sectionsByUserId.get(profile.id);
    if (!current || current.length === 0) {
      unassignedProfiles.push(profile);
    } else {
      assignedFriendCount++;
    }
  }

  unassignedProfiles.sort((a, b) =>
    a.display_name.localeCompare(b.display_name)
  );

  return {
    sectionsByUserId,
    unassignedProfiles,
    assignedFriendCount,
    emptySectionsCount,
    unassignedProgramSectionsCount,
    entryCountBySectionId,
  };
}

export interface TransferableCandidate {
  profile: Profile;
  fromSections: SectionWithMembers[];
}

export interface SectionCandidatePool {
  unassigned: Profile[];
  transferable: TransferableCandidate[];
  totalCount: number;
}

export function getSectionCandidatePool(params: {
  targetSectionId: string;
  profiles: readonly Profile[];
  sectionsByUserId: ReadonlyMap<string, SectionWithMembers[]>;
  query?: string;
}): SectionCandidatePool {
  const { targetSectionId, profiles, sectionsByUserId } = params;
  const normalizedQuery = (params.query ?? "").trim().toLowerCase();

  const unassigned: Profile[] = [];
  const transferable: TransferableCandidate[] = [];

  for (const profile of profiles) {
    const existingSections = sectionsByUserId.get(profile.id) ?? [];
    // Skip friends already assigned to this section
    if (existingSections.some((sec) => sec.id === targetSectionId)) {
      continue;
    }

    if (normalizedQuery) {
      const matchesName = profile.display_name
        .toLowerCase()
        .includes(normalizedQuery);
      const matchesEmail = profile.email
        .toLowerCase()
        .includes(normalizedQuery);
      const matchesSection = existingSections.some((sec) =>
        sec.code.toLowerCase().includes(normalizedQuery)
      );
      if (!matchesName && !matchesEmail && !matchesSection) {
        continue;
      }
    }

    if (existingSections.length === 0) {
      unassigned.push(profile);
    } else {
      transferable.push({
        profile,
        fromSections: existingSections,
      });
    }
  }

  unassigned.sort((a, b) => a.display_name.localeCompare(b.display_name));
  transferable.sort((a, b) =>
    a.profile.display_name.localeCompare(b.profile.display_name)
  );

  return {
    unassigned,
    transferable,
    totalCount: unassigned.length + transferable.length,
  };
}

export type SectionFilterMode = "all" | "empty" | "unassigned" | string;

export function filterSectionsByQueryAndCollege(params: {
  sections: readonly SectionWithMembers[];
  filterMode: SectionFilterMode;
  query?: string;
}): SectionWithMembers[] {
  const { sections, filterMode } = params;
  const normalizedQuery = (params.query ?? "").trim().toLowerCase();

  return sections.filter((section) => {
    const academic = getSectionAcademicInfo(section);

    if (filterMode === "empty" && section.members.length > 0) {
      return false;
    } else if (filterMode === "unassigned" && academic.isAssigned) {
      return false;
    } else if (
      filterMode !== "all" &&
      filterMode !== "empty" &&
      filterMode !== "unassigned" &&
      academic.college?.code !== filterMode
    ) {
      return false;
    }

    if (!normalizedQuery) return true;

    if (section.code.toLowerCase().includes(normalizedQuery)) return true;
    if (academic.college?.code.toLowerCase().includes(normalizedQuery)) {
      return true;
    }
    if (academic.college?.name.toLowerCase().includes(normalizedQuery)) {
      return true;
    }
    if (academic.program?.code.toLowerCase().includes(normalizedQuery)) {
      return true;
    }
    if (academic.program?.name.toLowerCase().includes(normalizedQuery)) {
      return true;
    }
    if (academic.specialization?.toLowerCase().includes(normalizedQuery)) {
      return true;
    }
    if (
      section.members.some(
        (m) =>
          m.display_name.toLowerCase().includes(normalizedQuery) ||
          m.email.toLowerCase().includes(normalizedQuery)
      )
    ) {
      return true;
    }

    return false;
  });
}
