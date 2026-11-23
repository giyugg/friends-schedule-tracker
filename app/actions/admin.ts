"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { timeToMinutes } from "@/lib/schedule-utils";
import type {
  ColorKey,
  DayOfWeek,
  ScheduleCategory,
  ScheduleModality,
  UserRole,
  VisibilityGroupType,
} from "@/lib/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/daily");
  revalidatePath("/weekly");
  revalidatePath("/free-time");
  revalidatePath("/admin");
}

// ============================================================================
// SEMESTERS
// ============================================================================

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
      .select("id, code, display_order")
      .eq("semester_id", input.cloneFromSemesterId);

    if (oldSections && oldSections.length > 0) {
      const oldIds = oldSections.map((s) => s.id);
      const { data: oldMembers } = await supabase
        .from("section_members")
        .select("section_id, user_id")
        .in("section_id", oldIds);

      for (const sec of oldSections) {
        const { data: newSec } = await supabase
          .from("sections")
          .insert({
            semester_id: created.id,
            code: sec.code,
            display_order: sec.display_order,
          })
          .select("id")
          .single();

        if (newSec && oldMembers) {
          const membersToCopy = oldMembers
            .filter((m) => m.section_id === sec.id)
            .map((m) => ({ section_id: newSec.id, user_id: m.user_id }));
          if (membersToCopy.length > 0) {
            await supabase.from("section_members").insert(membersToCopy);
          }
        }
      }
    }
  }

  revalidateAll();
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

  revalidateAll();
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

  revalidateAll();
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

  revalidateAll();
  return { ok: true, message: "Semester deleted." };
}

// ============================================================================
// SECTIONS & ROSTERS
// ============================================================================

export async function createSectionAction(input: {
  semesterId: string;
  code: string;
  displayOrder: number;
}): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const code = input.code.trim();
  if (!code) return { ok: false, error: "Section code is required." };

  const { error } = await supabase.from("sections").insert({
    semester_id: input.semesterId,
    code,
    display_order: Number.isFinite(input.displayOrder) ? input.displayOrder : 0,
  });

  if (error) return { ok: false, error: error.message };

  revalidateAll();
  return { ok: true, message: `Added section "${code}".` };
}

export async function updateSectionAction(input: {
  id: string;
  code: string;
  displayOrder: number;
}): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const code = input.code.trim();
  if (!code) return { ok: false, error: "Section code is required." };

  const { error } = await supabase
    .from("sections")
    .update({
      code,
      display_order: Number.isFinite(input.displayOrder)
        ? input.displayOrder
        : 0,
    })
    .eq("id", input.id);

  if (error) return { ok: false, error: error.message };

  revalidateAll();
  return { ok: true, message: `Updated section "${code}".` };
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

  revalidateAll();
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

  revalidateAll();
  return { ok: true };
}

// ============================================================================
// SCHEDULE ENTRIES
// ============================================================================

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
  if (!courseCode) return { ok: false, error: "Course code / title is required." };

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

  revalidateAll();
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

  revalidateAll();
  return { ok: true, message: "Class removed." };
}

// ============================================================================
// FRIEND ACCOUNTS (Supabase Admin API — bypasses email rate limit)
// ============================================================================

export async function createFriendAccountAction(input: {
  displayName: string;
  email: string;
  initialPassword: string;
  role: UserRole;
  sectionId?: string;
}): Promise<ActionResult> {
  await requireAdmin();

  const displayName = input.displayName.trim();
  const email = input.email.trim().toLowerCase();
  const initialPassword = input.initialPassword;

  if (!displayName) return { ok: false, error: "Display name is required." };
  if (!email) return { ok: false, error: "Email is required." };
  if (initialPassword.length < 8) {
    return {
      ok: false,
      error: "Initial password must be at least 8 characters.",
    };
  }

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Admin client unavailable.",
    };
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password: initialPassword,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
      role: input.role,
      must_change_password: true,
    },
  });

  if (error || !data.user) {
    return {
      ok: false,
      error: error?.message ?? "Failed to create account.",
    };
  }

  // Ensure profile reflects chosen display_name, role, and forced password change
  await adminClient.from("profiles").upsert({
    id: data.user.id,
    email,
    display_name: displayName,
    role: input.role,
    must_change_password: true,
  });

  if (input.sectionId) {
    await adminClient.from("section_members").upsert({
      section_id: input.sectionId,
      user_id: data.user.id,
    });
  }

  revalidateAll();
  return {
    ok: true,
    message: `Created account for ${displayName} (${email}). They will be prompted to set a new password on first login.`,
  };
}

export async function resetFriendPasswordAction(input: {
  userId: string;
  temporaryPassword: string;
}): Promise<ActionResult> {
  await requireAdmin();

  if (input.temporaryPassword.length < 8) {
    return {
      ok: false,
      error: "Temporary password must be at least 8 characters.",
    };
  }

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Admin client unavailable.",
    };
  }

  const { error } = await adminClient.auth.admin.updateUserById(input.userId, {
    password: input.temporaryPassword,
  });

  if (error) return { ok: false, error: error.message };

  await adminClient
    .from("profiles")
    .update({ must_change_password: true })
    .eq("id", input.userId);

  revalidateAll();
  return {
    ok: true,
    message:
      "Temporary password set. User will be forced to change it on next login.",
  };
}

export async function updateFriendProfileAction(input: {
  userId: string;
  displayName: string;
  role: UserRole;
}): Promise<ActionResult> {
  const adminProfile = await requireAdmin();
  const displayName = input.displayName.trim();
  if (!displayName) return { ok: false, error: "Display name is required." };

  if (input.userId === adminProfile.id && input.role !== "admin") {
    return { ok: false, error: "You cannot remove your own admin role." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, role: input.role })
    .eq("id", input.userId);

  if (error) return { ok: false, error: error.message };

  revalidateAll();
  return { ok: true, message: "Profile updated." };
}

export async function deleteFriendAccountAction(
  userId: string
): Promise<ActionResult> {
  const adminProfile = await requireAdmin();
  if (userId === adminProfile.id) {
    return { ok: false, error: "You cannot delete your own admin account." };
  }

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Admin client unavailable.",
    };
  }

  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: error.message };

  revalidateAll();
  return { ok: true, message: "Account deleted." };
}


// ============================================================================
// DIRECTORY GROUPS (Circles of Friends & Organizations)
// ============================================================================

export async function createVisibilityGroupAction(input: {
  name: string;
  type: VisibilityGroupType;
  description: string;
}): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Group name is required." };

  const { error } = await supabase.from("visibility_groups").insert({
    name,
    type: input.type,
    description: input.description.trim() || null,
  });

  if (error) return { ok: false, error: error.message };

  revalidateAll();
  return {
    ok: true,
    message: `Created ${input.type === "organization" ? "organization" : "circle"} "${name}".`,
  };
}

export async function updateVisibilityGroupAction(input: {
  id: string;
  name: string;
  type: VisibilityGroupType;
  description: string;
}): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Group name is required." };

  const { error } = await supabase
    .from("visibility_groups")
    .update({
      name,
      type: input.type,
      description: input.description.trim() || null,
    })
    .eq("id", input.id);

  if (error) return { ok: false, error: error.message };

  revalidateAll();
  return { ok: true, message: `Updated "${name}".` };
}

export async function deleteVisibilityGroupAction(
  groupId: string
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("visibility_groups")
    .delete()
    .eq("id", groupId);

  if (error) return { ok: false, error: error.message };

  revalidateAll();
  return { ok: true, message: "Group deleted." };
}

export async function toggleVisibilityGroupMemberAction(input: {
  groupId: string;
  userId: string;
  assign: boolean;
}): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  if (input.assign) {
    const { error } = await supabase.from("visibility_group_members").upsert({
      group_id: input.groupId,
      user_id: input.userId,
    });
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("visibility_group_members")
      .delete()
      .eq("group_id", input.groupId)
      .eq("user_id", input.userId);
    if (error) return { ok: false, error: error.message };
  }

  revalidateAll();
  return { ok: true };
}
