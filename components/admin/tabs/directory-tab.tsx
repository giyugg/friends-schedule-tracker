"use client";

import { useState } from "react";
import { Building2, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  createVisibilityGroupAction,
  deleteVisibilityGroupAction,
  toggleVisibilityGroupMemberAction,
  updateOrganizationMemberRoleAction,
  updateVisibilityGroupAction,
} from "@/app/actions/admin/directory";
import type { ActionResult } from "@/app/actions/admin/types";
import type {
  Profile,
  SectionWithMembers,
  VisibilityGroupType,
  VisibilityGroupWithMembers,
} from "@/lib/types";
import { VisibilityPreviewCard } from "./visibility-preview-card";

interface DirectoryTabProps {
  profiles: Profile[];
  sections: SectionWithMembers[];
  visibilityGroups: VisibilityGroupWithMembers[];
  isPending: boolean;
  runAction: (fn: () => Promise<ActionResult>) => void;
}

export function DirectoryTab({
  profiles,
  sections,
  visibilityGroups,
  isPending,
  runAction,
}: DirectoryTabProps) {
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupType, setNewGroupType] =
    useState<VisibilityGroupType>("circle");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupType, setEditGroupType] =
    useState<VisibilityGroupType>("circle");
  const [editGroupDesc, setEditGroupDesc] = useState("");
  const [roleDrafts, setRoleDrafts] = useState<Record<string, string>>({});

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 px-4 py-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
        <strong className="text-slate-900 dark:text-slate-100">
          Visibility Rule:
        </strong>{" "}
        Every member automatically sees <strong>themselves</strong>, their{" "}
        <strong>classmates</strong> (same section), and anyone who shares at
        least one <strong>Circle of Friends</strong> or{" "}
        <strong>Organization</strong> with them. Admins always see everyone.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Create Group + Visibility Preview */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <h2 className="font-bold text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-rose-500" />
              Create Circle / Organization
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                runAction(async () => {
                  const res = await createVisibilityGroupAction({
                    name: newGroupName,
                    type: newGroupType,
                    description: newGroupDesc,
                  });
                  if (res.ok) {
                    setNewGroupName("");
                    setNewGroupDesc("");
                  }
                  return res;
                });
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g., COF, BulSU Dev Org, BSIS Squad"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Group Type
                </label>
                <select
                  value={newGroupType}
                  onChange={(e) =>
                    setNewGroupType(e.target.value as VisibilityGroupType)
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm"
                >
                  <option value="circle">Circle of Friends</option>
                  <option value="organization">Organization</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Short note about this group"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold py-2.5 text-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create Group
              </button>
            </form>
          </div>

          <VisibilityPreviewCard
            profiles={profiles}
            sections={sections}
            visibilityGroups={visibilityGroups}
          />
        </div>

        {/* Right Column: All Circles & Organizations */}
        <div className="lg:col-span-7 space-y-4">
          {visibilityGroups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center space-y-1.5">
              <p className="font-semibold text-sm">
                No Circles or Organizations Yet
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Without a group, non-admin users only see their own classmates.
                Create a Circle of Friends or Organization on the left to let
                members see each other&apos;s schedules.
              </p>
            </div>
          ) : (
            visibilityGroups.map((group) => {
              const memberSet = new Set(group.memberIds);
              const isEditing = editingGroupId === group.id;

              return (
                <div
                  key={group.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    {isEditing ? (
                      <div className="flex flex-wrap items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editGroupName}
                          onChange={(e) => setEditGroupName(e.target.value)}
                          className="flex-1 min-w-[140px] rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2.5 py-1 text-sm font-bold"
                        />
                        <select
                          value={editGroupType}
                          onChange={(e) =>
                            setEditGroupType(
                              e.target.value as VisibilityGroupType
                            )
                          }
                          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-xs"
                        >
                          <option value="circle">Circle</option>
                          <option value="organization">Organization</option>
                        </select>
                        <input
                          type="text"
                          value={editGroupDesc}
                          onChange={(e) => setEditGroupDesc(e.target.value)}
                          placeholder="Description"
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2.5 py-1 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            runAction(async () => {
                              const res = await updateVisibilityGroupAction({
                                id: group.id,
                                name: editGroupName,
                                type: editGroupType,
                                description: editGroupDesc,
                              });
                              if (res.ok) setEditingGroupId(null);
                              return res;
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base">
                            {group.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                              group.type === "organization"
                                ? "bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300"
                                : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                            }`}
                          >
                            {group.type === "organization"
                              ? "Organization"
                              : "Circle"}
                          </span>
                          <span className="text-xs text-slate-400">
                            {group.memberIds.length} member
                            {group.memberIds.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        {group.description && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {group.description}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingGroupId(isEditing ? null : group.id);
                          setEditGroupName(group.name);
                          setEditGroupType(group.type);
                          setEditGroupDesc(group.description ?? "");
                        }}
                        className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete group "${group.name}"?`)) {
                            runAction(() =>
                              deleteVisibilityGroupAction(group.id)
                            );
                          }
                        }}
                        className="h-8 w-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 flex items-center justify-center text-slate-500 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
                      Members in {group.name}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {profiles.map((p) => {
                        const assigned = memberSet.has(p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              runAction(() =>
                                toggleVisibilityGroupMemberAction({
                                  groupId: group.id,
                                  userId: p.id,
                                  assign: !assigned,
                                })
                              )
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                              assigned
                                ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white"
                                : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400"
                            }`}
                          >
                            {p.display_name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {group.type === "organization" &&
                    group.memberIds.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">
                            Organization Roles (Labels Only)
                          </div>
                          <span className="text-[10px] text-slate-400">
                            Informational only · no extra permissions
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {profiles
                            .filter((p) => memberSet.has(p.id))
                            .map((p) => {
                              const draftKey = `${group.id}:${p.id}`;
                              const savedRole = group.memberRoles[p.id] ?? "";
                              const draftValue =
                                roleDrafts[draftKey] !== undefined
                                  ? roleDrafts[draftKey]
                                  : savedRole;
                              const isDirty = draftValue.trim() !== savedRole;

                              const handleSaveRole = () => {
                                if (!isDirty) return;
                                runAction(async () => {
                                  const res =
                                    await updateOrganizationMemberRoleAction({
                                      groupId: group.id,
                                      userId: p.id,
                                      roleLabel: draftValue,
                                    });
                                  if (res.ok) {
                                    setRoleDrafts((prev) => {
                                      const next = { ...prev };
                                      delete next[draftKey];
                                      return next;
                                    });
                                  }
                                  return res;
                                });
                              };

                              return (
                                <div
                                  key={p.id}
                                  className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/80 px-3 py-2"
                                >
                                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 sm:w-44 shrink-0 truncate">
                                    {p.display_name}
                                  </span>
                                  <input
                                    type="text"
                                    maxLength={60}
                                    value={draftValue}
                                    onChange={(e) =>
                                      setRoleDrafts((prev) => ({
                                        ...prev,
                                        [draftKey]: e.target.value,
                                      }))
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleSaveRole();
                                      }
                                    }}
                                    placeholder="e.g., Relations Lead, VP Internal…"
                                    className="flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs outline-none focus:border-sky-400"
                                  />
                                  <button
                                    type="button"
                                    disabled={isPending || !isDirty}
                                    onClick={handleSaveRole}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition shrink-0 ${
                                      isDirty
                                        ? "bg-sky-600 text-white hover:bg-sky-700 cursor-pointer"
                                        : "bg-slate-200/70 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                                    }`}
                                  >
                                    Save
                                  </button>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
