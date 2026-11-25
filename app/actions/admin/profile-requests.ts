"use server";

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidateProfileRequests } from "./revalidate";
import type { ActionResult } from "./types";

export async function reviewProfileChangeRequestAction(input: {
  requestId: string;
  decision: "approved" | "rejected";
  reviewNote?: string;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  if (!input.requestId) {
    return { ok: false, error: "Invalid request ID." };
  }

  if (input.decision !== "approved" && input.decision !== "rejected") {
    return { ok: false, error: "Invalid review decision." };
  }

  const { data: request, error: fetchError } = await supabase
    .from("profile_change_requests")
    .select("*")
    .eq("id", input.requestId)
    .single();

  if (fetchError || !request) {
    return { ok: false, error: "Profile change request not found." };
  }

  if (request.status !== "pending") {
    return {
      ok: false,
      error: `This request was already ${request.status}.`,
    };
  }

  const reviewNote = input.reviewNote?.trim() || null;
  if (reviewNote && reviewNote.length > 200) {
    return {
      ok: false,
      error: "Review note must be 200 characters or fewer.",
    };
  }

  if (input.decision === "approved") {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ display_name: request.requested_display_name })
      .eq("id", request.user_id);

    if (profileError) {
      return {
        ok: false,
        error: profileError.message || "Failed to update user display name.",
      };
    }
  }

  const { error: updateError } = await supabase
    .from("profile_change_requests")
    .update({
      status: input.decision,
      review_note: reviewNote,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.requestId)
    .eq("status", "pending");

  if (updateError) {
    return {
      ok: false,
      error: updateError.message || "Failed to update request status.",
    };
  }

  revalidateProfileRequests();
  return {
    ok: true,
    message:
      input.decision === "approved"
        ? `Approved display name change to "${request.requested_display_name}".`
        : `Rejected display name request for "${request.current_display_name}".`,
  };
}
