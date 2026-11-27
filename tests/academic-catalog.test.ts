import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  UNASSIGNED_COLLEGE_GROUP_KEY,
  composeSectionCode,
  getCollegeTheme,
  getSectionAcademicInfo,
  groupSectionsByCollege,
  sortSections,
} from "../lib/academic-catalog.ts";

describe("academic-catalog", () => {
  it("composes canonical section codes with optional specialization", () => {
    assert.equal(composeSectionCode("bsis", "2b-g2", ""), "BSIS 2B-G2");
    assert.equal(composeSectionCode("BSIT", "3a-g1", "wmd"), "BSIT 3A-G1 WMD");
  });

  it("resolves college and program metadata and sorts assigned before unassigned", () => {
    const unassigned = {
      code: "LEGACY 1A",
      college_code: null,
      program_code: null,
      section_name: null,
      specialization: null,
    };
    const cictSection = {
      code: "BSIS 2B-G2",
      college_code: "CICT",
      program_code: "BSIS",
      section_name: "2B-G2",
      specialization: null,
    };

    const info = getSectionAcademicInfo(cictSection);
    assert.equal(info.isAssigned, true);
    assert.equal(info.college?.code, "CICT");
    assert.equal(info.program?.code, "BSIS");

    const sorted = sortSections([unassigned, cictSection]);
    assert.equal(sorted[0].code, "BSIS 2B-G2");
    assert.equal(sorted[1].code, "LEGACY 1A");
  });

  it("returns distinct college themes and falls back cleanly for unassigned sections", () => {
    const cictTheme = getCollegeTheme("cict");
    const coeTheme = getCollegeTheme("COE");
    const fallbackTheme = getCollegeTheme(null);

    assert.ok(cictTheme.badgeClass.includes("indigo"));
    assert.ok(coeTheme.badgeClass.includes("amber"));
    assert.notEqual(cictTheme.accentBarClass, coeTheme.accentBarClass);
    assert.ok(fallbackTheme.badgeClass.includes("amber"));
  });

  it("groups sections by college in canonical order with legacy sections last", () => {
    const legacy = {
      code: "LEGACY 1A",
      college_code: null,
      program_code: null,
      section_name: null,
      specialization: null,
    };
    const cictBsis = {
      code: "BSIS 2B-G2",
      college_code: "CICT",
      program_code: "BSIS",
      section_name: "2B-G2",
      specialization: null,
    };
    const cictBsit = {
      code: "BSIT 3A-G1 WMD",
      college_code: "CICT",
      program_code: "BSIT",
      section_name: "3A-G1",
      specialization: "WMD",
    };
    const cafaArch = {
      code: "BSArch 1A",
      college_code: "CAFA",
      program_code: "BSArch",
      section_name: "1A",
      specialization: null,
    };

    const groups = groupSectionsByCollege([
      legacy,
      cictBsit,
      cafaArch,
      cictBsis,
    ]);
    assert.equal(groups.length, 3);
    assert.equal(groups[0].key, "CAFA");
    assert.deepEqual(
      groups[0].sections.map((s) => s.code),
      ["BSArch 1A"]
    );
    assert.equal(groups[1].key, "CICT");
    assert.deepEqual(
      groups[1].sections.map((s) => s.code),
      ["BSIS 2B-G2", "BSIT 3A-G1 WMD"]
    );
    assert.equal(groups[2].key, UNASSIGNED_COLLEGE_GROUP_KEY);
    assert.equal(groups[2].college, null);
    assert.deepEqual(
      groups[2].sections.map((s) => s.code),
      ["LEGACY 1A"]
    );
  });
});
