import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeEntriesStats,
  evaluateGoldGear,
  evaluateLatinHonors,
  percentageToGrade,
  sortGradeTerms,
} from "../lib/grades-utils.ts";
import type { GradeEntry, GradeTermWithEntries } from "../lib/types.ts";

function makeEntry(
  overrides: Partial<GradeEntry> & Pick<GradeEntry, "course_code" | "grade_value">
): GradeEntry {
  return {
    id: overrides.id ?? `id-${overrides.course_code}`,
    term_id: overrides.term_id ?? "term-1",
    user_id: overrides.user_id ?? "user-1",
    course_code: overrides.course_code,
    course_name: overrides.course_name ?? "",
    units: overrides.units ?? 3,
    grade_value: overrides.grade_value,
    is_academic: overrides.is_academic ?? true,
    display_order: overrides.display_order ?? 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

describe("grades-utils", () => {
  it("converts percentages to BulSU transmuted grades accurately", () => {
    assert.equal(percentageToGrade(98), "1.00");
    assert.equal(percentageToGrade(95), "1.25");
    assert.equal(percentageToGrade(75), "3.00");
    assert.equal(percentageToGrade(70), "5.00");
    assert.equal(percentageToGrade(105), null);
    assert.equal(percentageToGrade(-1), null);
  });

  it("computes GWA while excluding non-academic units", () => {
    const stats = computeEntriesStats([
      makeEntry({ course_code: "IS 201", units: 3, grade_value: "1.25" }),
      makeEntry({ course_code: "IS 202", units: 3, grade_value: "1.75" }),
      makeEntry({
        course_code: "PE 3",
        units: 2,
        grade_value: "1.00",
        is_academic: false,
      }),
    ]);

    assert.equal(stats.academicUnits, 6);
    assert.equal(stats.nonAcademicUnits, 2);
    assert.equal(stats.roundedGwa, 1.5);
  });

  it("evaluates Summa Cum Laude and disqualifies on INC/failing marks", () => {
    const cleanTerm: GradeTermWithEntries = {
      id: "t1",
      user_id: "u1",
      academic_year: "2025-2026",
      semester_type: "1st",
      year_level: 2,
      is_locked: true,
      locked_at: null,
      last_unlocked_at: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      entries: [
        makeEntry({ course_code: "IS 201", units: 3, grade_value: "1.00" }),
        makeEntry({ course_code: "IS 202", units: 3, grade_value: "1.25" }),
      ],
    };

    const honors = evaluateLatinHonors([cleanTerm]);
    assert.equal(honors.standing, "summa_cum_laude");

    const disqualified = evaluateLatinHonors([
      {
        ...cleanTerm,
        entries: [
          ...cleanTerm.entries,
          makeEntry({ course_code: "IS 203", units: 3, grade_value: "INC" }),
        ],
      },
    ]);
    assert.equal(disqualified.standing, "not_qualified");
    assert.ok(disqualified.disqualificationReason);
  });

  it("evaluates Gold Gear consecutive 2nd Sem + next AY 1st Sem pairs", () => {
    const prevTerm: GradeTermWithEntries = {
      id: "prev",
      user_id: "u1",
      academic_year: "2024-2025",
      semester_type: "2nd",
      year_level: 1,
      is_locked: true,
      locked_at: null,
      last_unlocked_at: null,
      created_at: "2025-05-01T00:00:00Z",
      updated_at: "2025-05-01T00:00:00Z",
      entries: [
        makeEntry({ course_code: "A1", units: 9, grade_value: "1.25" }),
        makeEntry({ course_code: "A2", units: 6, grade_value: "1.25" }),
      ],
    };

    const currTerm: GradeTermWithEntries = {
      id: "curr",
      user_id: "u1",
      academic_year: "2025-2026",
      semester_type: "1st",
      year_level: 2,
      is_locked: true,
      locked_at: null,
      last_unlocked_at: null,
      created_at: "2025-12-01T00:00:00Z",
      updated_at: "2025-12-01T00:00:00Z",
      entries: [
        makeEntry({ course_code: "B1", units: 9, grade_value: "1.00" }),
        makeEntry({ course_code: "B2", units: 6, grade_value: "1.25" }),
      ],
    };

    const sorted = sortGradeTerms([currTerm, prevTerm]);
    assert.equal(sorted[0].id, "prev");

    const goldGear = evaluateGoldGear([currTerm, prevTerm]);
    assert.ok(goldGear.latestPair);
    assert.equal(goldGear.latestPair.status, "presidents_list");
  });
});
