import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  composeSectionCode,
  getSectionAcademicInfo,
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
});
