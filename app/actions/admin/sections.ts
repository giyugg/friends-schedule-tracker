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

  if (input.assign) {
    const { error } = await supabase.from("section_members").upsert({
      section_id: input.sectionId,
      user_id: input.userId,
    });
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("section_members")
      .delete()
      .eq("section_id", input.sectionId)
      .eq("user_id", input.userId);
    if (error) return { ok: false, error: error.message };
  }

  revalidateSections();
  return { ok: true };
}
