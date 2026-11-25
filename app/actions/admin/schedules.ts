"use server";

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { timeToMinutes } from "@/lib/schedule-utils";
import type {
  ColorKey,
  DayOfWeek,
  ScheduleCategory,
  ScheduleModality,
} from "@/lib/types";
import { revalidateSchedules } from "./revalidate";
import type { ActionResult } from "./types";

export async function saveScheduleEntryAction(input: {
  id?: string;
  sectionId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  courseCode: string;
  instructor: string;
  location: string;
  category: ScheduleCategory;
  modality: ScheduleModality;
  colorOverride: ColorKey | "";
}): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const courseCode = input.courseCode.trim();
  if (!courseCode) {
    return { ok: false, error: "Course code / title is required." };
  }

  const startMins = timeToMinutes(input.startTime);
  const endMins = timeToMinutes(input.endTime);

  if (endMins <= startMins) {
    return { ok: false, error: "End time must be after start time." };
  }

  // Overlap check within the same section and day
  const { data: existing } = await supabase
    .from("schedule_entries")
    .select("id, course_code, start_time, end_time")
    .eq("section_id", input.sectionId)
    .eq("day_of_week", input.dayOfWeek);

  const conflict = (existing ?? []).find((row) => {
    if (input.id && row.id === input.id) return false;
    const rowStart = timeToMinutes(row.start_time);
    const rowEnd = timeToMinutes(row.end_time);
    return startMins < rowEnd && endMins > rowStart;
  });

  if (conflict) {
    return {
      ok: false,
      error: `Time overlaps with "${conflict.course_code}" (${conflict.start_time.slice(0, 5)}–${conflict.end_time.slice(0, 5)}).`,
    };
  }

  const payload = {
    section_id: input.sectionId,
    day_of_week: input.dayOfWeek,
    start_time: input.startTime,
    end_time: input.endTime,
    course_code: courseCode,
    instructor: input.instructor.trim() || null,
    location:
      input.modality === "online"
        ? "ONLINE CLASS"
        : input.location.trim() || null,
    category: input.category,
    modality: input.modality,
    color_override: input.colorOverride || null,
  };

  if (input.id) {
    const { error } = await supabase
      .from("schedule_entries")
      .update(payload)
      .eq("id", input.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("schedule_entries").insert(payload);
    if (error) return { ok: false, error: error.message };
  }

  revalidateSchedules();
  return {
    ok: true,
    message: input.id ? "Class updated." : "Class added to schedule.",
  };
}

export async function deleteScheduleEntryAction(
  entryId: string
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("schedule_entries")
    .delete()
    .eq("id", entryId);

  if (error) return { ok: false, error: error.message };

  revalidateSchedules();
  return { ok: true, message: "Class removed." };
}
