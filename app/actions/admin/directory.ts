"use server";

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { VisibilityGroupType } from "@/lib/types";
import { revalidateDirectory } from "./revalidate";
import type { ActionResult } from "./types";

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

  revalidateDirectory();
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

  revalidateDirectory();
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

  revalidateDirectory();
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

  revalidateDirectory();
  return { ok: true };
}

export async function updateOrganizationMemberRoleAction(input: {
  groupId: string;
  userId: string;
  roleLabel: string;
}): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: group, error: groupError } = await supabase
    .from("visibility_groups")
    .select("id, type")
    .eq("id", input.groupId)
    .single();

  if (groupError || !group) {
    return { ok: false, error: "Group not found." };
  }

  if (group.type !== "organization") {
    return {
      ok: false,
      error: "Member role labels are only supported for Organizations.",
    };
  }

  const trimmed = input.roleLabel.trim();
  if (trimmed.length > 60) {
    return {
      ok: false,
      error: "Role label must be 60 characters or fewer.",
    };
  }

  const { error } = await supabase
    .from("visibility_group_members")
    .update({ role_label: trimmed || null })
    .eq("group_id", input.groupId)
    .eq("user_id", input.userId);

  if (error) return { ok: false, error: error.message };

  revalidateDirectory();
  return {
    ok: true,
    message: trimmed ? `Updated role to "${trimmed}".` : "Cleared role label.",
  };
}
