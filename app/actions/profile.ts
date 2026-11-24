"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface ProfileActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

function revalidateProfilePaths() {
  updateTag("profile");
  updateTag("profiles");
  updateTag("shell");
  updateTag("profile-requests");
  revalidatePath("/");
  revalidatePath("/daily");
  revalidatePath("/weekly");
  revalidatePath("/free-time");
  revalidatePath("/grades");
  revalidatePath("/profile");
  revalidatePath("/groups", "layout");
  revalidatePath("/admin");
}

export async function requestDisplayNameChangeAction(
  rawDisplayName: string
): Promise<ProfileActionResult> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const requestedName = rawDisplayName.trim().replace(/\s+/g, " ");
  if (requestedName.length < 2) {
    return {
      ok: false,
      error: "Display name must be at least 2 characters long.",
    };
  }
  if (requestedName.length > 80) {
    return {
      ok: false,
      error: "Display name must be 80 characters or fewer.",
    };
  }
  if (requestedName === profile.display_name.trim()) {
    return {
      ok: false,
      error: "Please enter a different display name from your current one.",
    };
  }

  // Admins update their own display name directly without requiring approval
  if (profile.role === "admin") {
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: requestedName })
      .eq("id", profile.id);

    if (error) {
      return {
        ok: false,
        error: error.message || "Failed to update display name.",
      };
    }

    revalidateProfilePaths();
    return {
      ok: true,
      message: `Display name updated to "${requestedName}".`,
    };
  }

  // Regular members submit a pending request for admin approval
  const { error } = await supabase.from("profile_change_requests").insert({
    user_id: profile.id,
    current_display_name: profile.display_name,
    requested_display_name: requestedName,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error:
          "You already have a pending display name request. Cancel it first to submit a new one.",
      };
    }
    if (error.code === "42P01" || error.code === "PGRST205") {
      return {
        ok: false,
        error:
          "Profile change requests are not enabled yet. Please ask an admin to run migration 005_profile_change_requests.sql.",
      };
    }
    return {
      ok: false,
      error: error.message || "Failed to submit display name request.",
    };
  }

  updateTag("profile-requests");
  revalidatePath("/profile");
  revalidatePath("/admin");
  return {
    ok: true,
    message: `Submitted request to change your display name to "${requestedName}".`,
  };
}

export async function cancelDisplayNameChangeRequestAction(
  requestId: string
): Promise<ProfileActionResult> {
  const profile = await requireProfile();
  const supabase = await createClient();

  if (!requestId) {
    return { ok: false, error: "Invalid request." };
  }

  const { data, error } = await supabase
    .from("profile_change_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId)
    .eq("user_id", profile.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      error: error.message || "Failed to cancel request.",
    };
  }

  if (!data) {
    return {
      ok: false,
      error: "This request is no longer pending.",
    };
  }

  updateTag("profile-requests");
  revalidatePath("/profile");
  revalidatePath("/admin");
  return {
    ok: true,
    message: "Display name change request cancelled.",
  };
}
