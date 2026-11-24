"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseAcademicYear, VALID_GRADE_VALUES } from "@/lib/grades-utils";
import type { GradeSemesterType, GradeValue } from "@/lib/types";

export interface GradeActionResult {
  ok: boolean;
  error?: string;
  message?: string;
  termId?: string;
}

export interface GradeEntryInput {
  courseCode: string;
  courseName: string;
  units: number;
  gradeValue: GradeValue;
  isAcademic: boolean;
}

export async function createGradeTermAction(input: {
  academicYear: string;
  semesterType: GradeSemesterType;
  yearLevel: number;
}): Promise<GradeActionResult> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const academicYear = input.academicYear.trim();
  const parsedAy = parseAcademicYear(academicYear);
  if (!parsedAy || parsedAy.end !== parsedAy.start + 1) {
    return {
      ok: false,
      error: "Academic Year must be in YYYY-YYYY format (e.g., 2025-2026).",
    };
  }

  if (!["1st", "2nd", "midyear"].includes(input.semesterType)) {
    return { ok: false, error: "Invalid semester type." };
  }

  const yearLevel = Math.trunc(Number(input.yearLevel));
  if (!Number.isFinite(yearLevel) || yearLevel < 1 || yearLevel > 6) {
    return { ok: false, error: "Year level must be between 1 and 6." };
  }

  const { data, error } = await supabase
    .from("grade_terms")
    .insert({
      user_id: profile.id,
      academic_year: academicYear,
      semester_type: input.semesterType,
      year_level: yearLevel,
      is_locked: false,
    })
    .select("id")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      return {
        ok: false,
        error: "You already have a record for that Academic Year and Semester.",
      };
    }
    return {
      ok: false,
      error: error?.message ?? "Failed to create semester.",
    };
  }

  updateTag("grades");
  revalidatePath("/grades");
  revalidatePath("/profile");
  return {
    ok: true,
    termId: data.id,
    message: `Added ${academicYear} (${input.semesterType === "midyear" ? "Midyear" : `${input.semesterType} Semester`}).`,
  };
}

export async function saveGradeTermEntriesAction(input: {
  termId: string;
  entries: GradeEntryInput[];
  lockAfterSave: boolean;
}): Promise<GradeActionResult> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: term, error: termError } = await supabase
    .from("grade_terms")
    .select("id, is_locked")
    .eq("id", input.termId)
    .eq("user_id", profile.id)
    .single();

  if (termError || !term) {
    return { ok: false, error: "Semester not found." };
  }

  if (term.is_locked) {
    return {
      ok: false,
      error: "This semester is locked. Unlock it first to modify grades.",
    };
  }

  if (input.lockAfterSave && input.entries.length === 0) {
    return {
      ok: false,
      error: "Add at least one subject before locking this semester.",
    };
  }

  const sanitized: {
    term_id: string;
    user_id: string;
    course_code: string;
    course_name: string;
    units: number;
    grade_value: GradeValue;
    is_academic: boolean;
    display_order: number;
  }[] = [];

  for (let i = 0; i < input.entries.length; i++) {
    const row = input.entries[i];
    const courseCode = row.courseCode.trim();
    const courseName = row.courseName.trim();
    const units = Number(row.units);

    if (!courseCode) {
      return {
        ok: false,
        error: `Row ${i + 1}: Course code is required.`,
      };
    }
    if (!Number.isFinite(units) || units <= 0 || units > 30) {
      return {
        ok: false,
        error: `Row ${i + 1} (${courseCode}): Units must be between 0.5 and 30.`,
      };
    }
    if (!VALID_GRADE_VALUES.has(row.gradeValue)) {
      return {
        ok: false,
        error: `Row ${i + 1} (${courseCode}): Invalid grade value.`,
      };
    }

    sanitized.push({
      term_id: term.id,
      user_id: profile.id,
      course_code: courseCode,
      course_name: courseName,
      units: Math.round(units * 100) / 100,
      grade_value: row.gradeValue,
      is_academic: Boolean(row.isAcademic),
      display_order: i,
    });
  }

  const { error: deleteError } = await supabase
    .from("grade_entries")
    .delete()
    .eq("term_id", term.id)
    .eq("user_id", profile.id);

  if (deleteError) {
    return {
      ok: false,
      error: deleteError.message || "Failed to update grade entries.",
    };
  }

  if (sanitized.length > 0) {
    const { error: insertError } = await supabase
      .from("grade_entries")
      .insert(sanitized);

    if (insertError) {
      return {
        ok: false,
        error: insertError.message || "Failed to save grade entries.",
      };
    }
  }

  if (input.lockAfterSave) {
    const { error: lockError } = await supabase
      .from("grade_terms")
      .update({
        is_locked: true,
        locked_at: new Date().toISOString(),
      })
      .eq("id", term.id)
      .eq("user_id", profile.id);

    if (lockError) {
      return {
        ok: false,
        error: lockError.message || "Grades saved, but failed to lock semester.",
      };
    }
  }

  updateTag("grades");
  revalidatePath("/grades");
  revalidatePath("/profile");
  return {
    ok: true,
    termId: term.id,
    message: input.lockAfterSave
      ? "Grades saved and locked. This semester is now read-only."
      : "Draft grades saved.",
  };
}

export async function unlockGradeTermAction(
  termId: string
): Promise<GradeActionResult> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("grade_terms")
    .update({
      is_locked: false,
      last_unlocked_at: new Date().toISOString(),
    })
    .eq("id", termId)
    .eq("user_id", profile.id);

  if (error) {
    return {
      ok: false,
      error: error.message || "Failed to unlock semester.",
    };
  }

  updateTag("grades");
  revalidatePath("/grades");
  revalidatePath("/profile");
  return {
    ok: true,
    termId,
    message: "Semester unlocked. You can now edit your grades.",
  };
}

export async function deleteGradeTermAction(
  termId: string
): Promise<GradeActionResult> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: term } = await supabase
    .from("grade_terms")
    .select("id, is_locked")
    .eq("id", termId)
    .eq("user_id", profile.id)
    .single();

  if (!term) {
    return { ok: false, error: "Semester not found." };
  }
  if (term.is_locked) {
    return {
      ok: false,
      error: "Unlock this semester first before deleting it.",
    };
  }

  const { error } = await supabase
    .from("grade_terms")
    .delete()
    .eq("id", termId)
    .eq("user_id", profile.id);

  if (error) {
    return {
      ok: false,
      error: error.message || "Failed to delete semester.",
    };
  }

  updateTag("grades");
  revalidatePath("/grades");
  revalidatePath("/profile");
  return {
    ok: true,
    message: "Semester deleted.",
  };
}
