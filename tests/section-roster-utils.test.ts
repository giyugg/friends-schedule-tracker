import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildSemesterRosterIndex,
  filterSectionsByQueryAndCollege,
  getInitials,
  getSectionCandidatePool,
} from "../lib/section-roster-utils.ts";
import type { Profile, SectionWithMembers } from "../lib/types.ts";

const profiles: Profile[] = [
  {
    id: "u1",
    email: "kyle@ms.bulsu.edu.ph",
    display_name: "Kyle A. Acuña",
    role: "admin",
    must_change_password: false,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "u2",
    email: "mark@ms.bulsu.edu.ph",
    display_name: "Mark Renz P. Lunag",
    role: "member",
    must_change_password: false,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "u3",
    email: "darl@ms.bulsu.edu.ph",
    display_name: "Darl Shanen G. Floresca",
    role: "member",
    must_change_password: false,
    created_at: "2026-01-01T00:00:00Z",
  },
];

const sections: SectionWithMembers[] = [
  {
    id: "s1",
    semester_id: "sem1",
    code: "BSIS 2A-G1",
    college_code: "CICT",
    program_code: "BSIS",
    section_name: "2A-G1",
    specialization: null,
    created_at: "2026-01-01T00:00:00Z",
    members: [
      {
        id: "u2",
        display_name: "Mark Renz P. Lunag",
        email: "mark@ms.bulsu.edu.ph",
      },
    ],
  },
  {
    id: "s2",
    semester_id: "sem1",
    code: "BSIS 2B-G2",
    college_code: "CICT",
    program_code: "BSIS",
    section_name: "2B-G2",
    specialization: null,
    created_at: "2026-01-01T00:00:00Z",
    members: [
      {
        id: "u1",
        display_name: "Kyle A. Acuña",
        email: "kyle@ms.bulsu.edu.ph",
      },
    ],
  },
  {
    id: "s3",
    semester_id: "sem1",
    code: "BSCpE 2A",
    college_code: "COE",
    program_code: "BSCpE",
    section_name: "2A",
    specialization: null,
    created_at: "2026-01-01T00:00:00Z",
    members: [],
  },
];

describe("section-roster-utils", () => {
  it("extracts 1-2 letter uppercase initials cleanly", () => {
    assert.equal(getInitials("Kyle A. Acuña"), "KA");
    assert.equal(getInitials("Giyu"), "GI");
    assert.equal(getInitials("   "), "?");
  });

  it("indexes semester rosters, unassigned friends, and class counts", () => {
    const index = buildSemesterRosterIndex(sections, profiles, [
      { section_id: "s1" },
      { section_id: "s1" },
      { section_id: "s2" },
    ]);

    assert.equal(index.assignedFriendCount, 2);
    assert.equal(index.unassignedProfiles.length, 1);
    assert.equal(index.unassignedProfiles[0].id, "u3");
    assert.equal(index.emptySectionsCount, 1);
    assert.equal(index.unassignedProgramSectionsCount, 0);
    assert.equal(index.entryCountBySectionId.get("s1"), 2);
    assert.equal(index.entryCountBySectionId.get("s3") ?? 0, 0);
  });

  it("partitions candidate pool into unassigned first and transferable second while excluding current section members", () => {
    const index = buildSemesterRosterIndex(sections, profiles, []);
    const pool = getSectionCandidatePool({
      targetSectionId: "s2",
      profiles,
      sectionsByUserId: index.sectionsByUserId,
    });

    // u1 is already in s2 -> excluded
    assert.equal(pool.totalCount, 2);
    assert.equal(pool.unassigned.length, 1);
    assert.equal(pool.unassigned[0].id, "u3");
    assert.equal(pool.transferable.length, 1);
    assert.equal(pool.transferable[0].profile.id, "u2");
    assert.equal(pool.transferable[0].fromSections[0].code, "BSIS 2A-G1");

    // Searching by current section code matches transferable friends
    const filteredPool = getSectionCandidatePool({
      targetSectionId: "s2",
      profiles,
      sectionsByUserId: index.sectionsByUserId,
      query: "2a-g1",
    });
    assert.equal(filteredPool.unassigned.length, 0);
    assert.equal(filteredPool.transferable.length, 1);
    assert.equal(filteredPool.transferable[0].profile.id, "u2");
  });

  it("filters sections by college, empty status, and member/program search query", () => {
    const coeOnly = filterSectionsByQueryAndCollege({
      sections,
      filterMode: "COE",
    });
    assert.equal(coeOnly.length, 1);
    assert.equal(coeOnly[0].id, "s3");

    const emptyOnly = filterSectionsByQueryAndCollege({
      sections,
      filterMode: "empty",
    });
    assert.equal(emptyOnly.length, 1);
    assert.equal(emptyOnly[0].id, "s3");

    const byMemberSearch = filterSectionsByQueryAndCollege({
      sections,
      filterMode: "all",
      query: "mark renz",
    });
    assert.equal(byMemberSearch.length, 1);
    assert.equal(byMemberSearch[0].code, "BSIS 2A-G1");
  });
});
