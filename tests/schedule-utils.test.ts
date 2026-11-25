import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeCommonFreeSlots,
  getLiveSectionStatus,
  resolveActiveSemester,
  timeToMinutes,
  timeToSlotIndex,
} from "../lib/schedule-utils.ts";
import type { ScheduleEntry, Semester } from "../lib/types.ts";

function makeScheduleEntry(
  overrides: Partial<ScheduleEntry> &
    Pick<ScheduleEntry, "start_time" | "end_time" | "course_code">
): ScheduleEntry {
  return {
    id: overrides.id ?? `entry-${overrides.course_code}`,
    section_id: overrides.section_id ?? "sec-1",
    day_of_week: overrides.day_of_week ?? 1,
    start_time: overrides.start_time,
    end_time: overrides.end_time,
    course_code: overrides.course_code,
    instructor: overrides.instructor ?? null,
    location: overrides.location ?? "ONLINE CLASS",
    category: overrides.category ?? "major",
    modality: overrides.modality ?? "online",
    color_override: overrides.color_override ?? null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

describe("schedule-utils", () => {
  it("converts times to minutes and 30-min slot indices", () => {
    assert.equal(timeToMinutes("07:00:00"), 420);
    assert.equal(timeToSlotIndex("07:00"), 0);
    assert.equal(timeToSlotIndex("08:30"), 3);
  });

  it("computes common overlapping free slots across multiple sections", () => {
    const entries: ScheduleEntry[] = [
      makeScheduleEntry({
        section_id: "sec-1",
        day_of_week: 1,
        start_time: "07:00",
        end_time: "10:00",
        course_code: "IS 201",
      }),
      makeScheduleEntry({
        section_id: "sec-2",
        day_of_week: 1,
        start_time: "09:00",
        end_time: "12:00",
        course_code: "IT 202",
      }),
    ];

    const windows = computeCommonFreeSlots(entries, ["sec-1", "sec-2"], 1);
    assert.equal(windows.length, 1);
    assert.equal(windows[0].startTime, "12:00");
    assert.equal(windows[0].endTime, "20:00");
  });

  it("chains back-to-back classes in getLiveSectionStatus", () => {
    const entries: ScheduleEntry[] = [
      makeScheduleEntry({
        day_of_week: 2,
        start_time: "08:00",
        end_time: "10:00",
        course_code: "IS 201",
      }),
      makeScheduleEntry({
        day_of_week: 2,
        start_time: "10:00",
        end_time: "12:00",
        course_code: "IS 202",
      }),
    ];

    const status = getLiveSectionStatus(entries, {
      dayOfWeek: 2,
      minutesFromMidnight: 9 * 60, // 9:00 AM Tuesday
      timeLabel: "9:00 AM",
    });

    assert.equal(status.state, "in_class");
    if (status.state === "in_class") {
      assert.equal(status.hasBackToBack, true);
      assert.equal(status.freeAtTime, "12:00");
      assert.equal(status.minutesUntilFree, 180);
    }
  });

  it("resolves active semester with predictable fallback priority", () => {
    const semesters: Semester[] = [
      {
        id: "archived",
        name: "Old Sem",
        is_active: false,
        is_archived: true,
        created_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "active",
        name: "Current Sem",
        is_active: true,
        is_archived: false,
        created_at: "2026-01-01T00:00:00Z",
      },
    ];

    assert.equal(resolveActiveSemester(semesters)?.id, "active");
    assert.equal(resolveActiveSemester(semesters, "archived")?.id, "archived");
    assert.equal(resolveActiveSemester(semesters, "missing")?.id, "active");
  });
});
