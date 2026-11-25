"use server";

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidateSemesters } from "./revalidate";
import type { ActionResult } from "./types";

export async function createSemesterAction(input: {
  name: string;
  setActive: boolean;
  cloneFromSemesterId?: string;
}): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Semester name is required." };

  if (input.setActive) {
    await supabase
      .from("semesters")
      .update({ is_active: false })
      .eq("is_active", true);
  }

  const { data: created, error } = await supabase
    .from("semesters")
    .insert({ name, is_active: input.setActive, is_archived: false })
    .select("*")
    .single();

  if (error || !created) {
    return {
      ok: false,
      error: error?.message ?? "Failed to create semester.",
    };
  }

  // Optionally clone sections and member rosters from a previous semester
  if (input.cloneFromSemesterId) {
    const { data: oldSections } = await supabase
      .from("sections")
      .select(
        "id, code, college_code, program_code, section_name, specialization"
      )
      .eq("semester_id", input.cloneFromSemesterId);

    if (oldSections && oldSections.length > 0) {
      const oldIds = oldSections.map((s) => s.id);
      const [{ data: newSections }, { data: oldMembers }] = await Promise.all([
        supabase
          .from("sections")
          .insert(
            oldSections.map((sec) => ({
              semester_id: created.id,
              code: sec.code,
              college_code: sec.college_code ?? null,
              program_code: sec.program_code ?? null,
              section_name: sec.section_name ?? null,
              specialization: sec.specialization ?? null,
            }))
          )
          .select("id, code"),
        supabase
          .from("section_members")
          .select("section_id, user_id")
          .in("section_id", oldIds),
      ]);

      if (newSections && oldMembers && oldMembers.length > 0) {
        const oldCodeById = new Map(oldSections.map((s) => [s.id, s.code]));
        const newIdByCode = new Map(newSections.map((s) => [s.code, s.id]));

        const membersToCopy = oldMembers.flatMap((m) => {
          const code = oldCodeById.get(m.section_id);
          const newSectionId = code ? newIdByCode.get(code) : undefined;
          return newSectionId
            ? [{ section_id: newSectionId, user_id: m.user_id }]
            : [];
        });

        if (membersToCopy.length > 0) {
          await supabase.from("section_members").insert(membersToCopy);
        }
      }
    }
  }

  revalidateSemesters();
  return { ok: true, message: `Created semester "${name}".` };
}

export async function setActiveSemesterAction(
  semesterId: string
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  await supabase
    .from("semesters")
    .update({ is_active: false })
    .eq("is_active", true);

  const { error } = await supabase
    .from("semesters")
    .update({ is_active: true, is_archived: false })
    .eq("id", semesterId);

  if (error) return { ok: false, error: error.message };

  revalidateSemesters();
  return { ok: true, message: "Active semester updated." };
}

export async function toggleArchiveSemesterAction(
  semesterId: string,
  archive: boolean
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("semesters")
    .update({
      is_archived: archive,
      ...(archive ? { is_active: false } : {}),
    })
    .eq("id", semesterId);

  if (error) return { ok: false, error: error.message };

  revalidateSemesters();
  return {
    ok: true,
    message: archive ? "Semester archived." : "Semester restored.",
  };
}

export async function deleteSemesterAction(
  semesterId: string
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("semesters")
    .delete()
    .eq("id", semesterId);

  if (error) return { ok: false, error: error.message };

  revalidateSemesters();
  return { ok: true, message: "Semester deleted." };
}
