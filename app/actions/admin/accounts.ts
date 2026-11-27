"use server";

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/types";
import { revalidateAccounts } from "./revalidate";
import type { ActionResult } from "./types";

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

  revalidateAccounts();
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

  revalidateAccounts();
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
  semesterId?: string;
  sectionId?: string | null;
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

  if (input.semesterId && input.sectionId !== undefined) {
    const targetSectionId = input.sectionId?.trim() || null;
    const { data: semesterSections, error: sectionsError } = await supabase
      .from("sections")
      .select("id")
      .eq("semester_id", input.semesterId);

    if (sectionsError) return { ok: false, error: sectionsError.message };

    const semesterSectionIds = (semesterSections ?? []).map((s) => s.id);
    if (targetSectionId && !semesterSectionIds.includes(targetSectionId)) {
      return {
        ok: false,
        error: "Selected section does not belong to the active semester.",
      };
    }

    const idsToRemove = targetSectionId
      ? semesterSectionIds.filter((id) => id !== targetSectionId)
      : semesterSectionIds;

    if (idsToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from("section_members")
        .delete()
        .eq("user_id", input.userId)
        .in("section_id", idsToRemove);

      if (deleteError) return { ok: false, error: deleteError.message };
    }

    if (targetSectionId) {
      const { error: upsertError } = await supabase
        .from("section_members")
        .upsert({
          section_id: targetSectionId,
          user_id: input.userId,
        });

      if (upsertError) return { ok: false, error: upsertError.message };
    }
  }

  revalidateAccounts();
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

  revalidateAccounts();
  return { ok: true, message: "Account deleted." };
}
