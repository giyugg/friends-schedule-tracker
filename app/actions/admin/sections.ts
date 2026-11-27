"use server";

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  composeSectionCode,
  getCollegeByCode,
  getProgramEntryByCode,
  normalizeSectionName,
  normalizeSpecialization,
} from "@/lib/academic-catalog";
import { revalidateSections } from "./revalidate";
import type { ActionResult } from "./types";

function validateStructuredSection(input: {
  collegeCode: string;
  programCode: string;
  sectionName: string;
  specialization?: string;
}):
  | {
      ok: true;
      collegeCode: string;
      programCode: string;
      sectionName: string;
      specialization: string | null;
      code: string;
    }
  | { ok: false; error: string } {
  const college = getCollegeByCode(input.collegeCode);
  if (!college) {
    return { ok: false, error: "Please select a valid college." };
  }

  const programEntry = getProgramEntryByCode(input.programCode);
  if (!programEntry || programEntry.college.code !== college.code) {
    return {
      ok: false,
      error: "Please select a valid program under the chosen college.",
    };
  }

  const sectionName = normalizeSectionName(input.sectionName);
  if (!sectionName) {
    return { ok: false, error: "Section (e.g., 2B-G2) is required." };
  }
  if (sectionName.length > 30) {
    return { ok: false, error: "Section must be 30 characters or fewer." };
  }

  const specialization = normalizeSpecialization(input.specialization);
  if (specialization && specialization.length > 30) {
    return {
      ok: false,
      error: "Specialization / track must be 30 characters or fewer.",
    };
  }

  const code = composeSectionCode(
    programEntry.program.code,
    sectionName,
    specialization
  );

  return {
    ok: true,
    collegeCode: college.code,
    programCode: programEntry.program.code,
    sectionName,
    specialization,
    code,
  };
}

export async function createSectionAction(input: {
  semesterId: string;
  collegeCode: string;
  programCode: string;
  sectionName: string;
  specialization?: string;
}): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const parsed = validateStructuredSection(input);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const { error } = await supabase.from("sections").insert({
    semester_id: input.semesterId,
    code: parsed.code,
    college_code: parsed.collegeCode,
    program_code: parsed.programCode,
    section_name: parsed.sectionName,
    specialization: parsed.specialization,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: `Section "${parsed.code}" already exists in this semester.`,
      };
    }
    if (error.code === "42703" || error.code === "PGRST204") {
      return {
        ok: false,
        error:
          "Database migration required: run supabase/migrations/006_section_college_program.sql in Supabase SQL Editor first.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidateSections();
  return { ok: true, message: `Added section "${parsed.code}".` };
}

export async function updateSectionAction(input: {
  id: string;
  collegeCode: string;
  programCode: string;
  sectionName: string;
  specialization?: string;
}): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const parsed = validateStructuredSection(input);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const { error } = await supabase
    .from("sections")
    .update({
      code: parsed.code,
      college_code: parsed.collegeCode,
      program_code: parsed.programCode,
      section_name: parsed.sectionName,
      specialization: parsed.specialization,
    })
    .eq("id", input.id);

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: `Section "${parsed.code}" already exists in this semester.`,
      };
    }
    if (error.code === "42703" || error.code === "PGRST204") {
      return {
        ok: false,
        error:
          "Database migration required: run supabase/migrations/006_section_college_program.sql in Supabase SQL Editor first.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidateSections();
  return { ok: true, message: `Updated section "${parsed.code}".` };
}

export async function deleteSectionAction(
  sectionId: string
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("sections")
    .delete()
    .eq("id", sectionId);

  if (error) return { ok: false, error: error.message };

  revalidateSections();
  return { ok: true, message: "Section deleted." };
}

export async function toggleSectionMemberAction(input: {
  sectionId: string;
  userId: string;
  assign: boolean;
}): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const [
    { data: targetSection, error: sectionError },
    { data: targetProfile },
  ] = await Promise.all([
    supabase
      .from("sections")
      .select("id, code, semester_id")
      .eq("id", input.sectionId)
      .single(),
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", input.userId)
      .maybeSingle(),
  ]);

  if (sectionError || !targetSection) {
    return {
      ok: false,
      error: sectionError?.message ?? "Target section not found.",
    };
  }

  const friendName = targetProfile?.display_name ?? "Friend";

  if (input.assign) {
    // Enforce 1 section per friend per semester: check sibling sections in the same semester
    const { data: semesterSections, error: semSectionsError } = await supabase
      .from("sections")
      .select("id, code")
      .eq("semester_id", targetSection.semester_id);

    if (semSectionsError) {
      return { ok: false, error: semSectionsError.message };
    }

    const siblingSections = (semesterSections ?? []).filter(
      (sec) => sec.id !== input.sectionId
    );
    const siblingIds = siblingSections.map((sec) => sec.id);

    let movedFromCodes: string[] = [];

    if (siblingIds.length > 0) {
      const { data: existingRows, error: existingError } = await supabase
        .from("section_members")
        .select("section_id")
        .eq("user_id", input.userId)
        .in("section_id", siblingIds);

      if (existingError) {
        return { ok: false, error: existingError.message };
      }

      const previousIds = (existingRows ?? []).map((row) => row.section_id);
      if (previousIds.length > 0) {
        const codeById = new Map(siblingSections.map((s) => [s.id, s.code]));
        movedFromCodes = previousIds
          .map((id) => codeById.get(id))
          .filter((code): code is string => Boolean(code));

        const { error: deletePrevError } = await supabase
          .from("section_members")
          .delete()
          .eq("user_id", input.userId)
          .in("section_id", previousIds);

        if (deletePrevError) {
          return { ok: false, error: deletePrevError.message };
        }
      }
    }

    const { error } = await supabase.from("section_members").upsert({
      section_id: input.sectionId,
      user_id: input.userId,
    });
    if (error) return { ok: false, error: error.message };

    revalidateSections();

    if (movedFromCodes.length > 0) {
      return {
        ok: true,
        message: `Moved ${friendName} from ${movedFromCodes.join(", ")} to ${targetSection.code}.`,
      };
    }
    return {
      ok: true,
      message: `Added ${friendName} to ${targetSection.code}.`,
    };
  } else {
    const { error } = await supabase
      .from("section_members")
      .delete()
      .eq("section_id", input.sectionId)
      .eq("user_id", input.userId);
    if (error) return { ok: false, error: error.message };

    revalidateSections();
    return {
      ok: true,
      message: `Removed ${friendName} from ${targetSection.code}.`,
    };
  }
}
