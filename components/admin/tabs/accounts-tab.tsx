"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  KeyRound,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
  UserPlus,
} from "lucide-react";
import {
  createFriendAccountAction,
  deleteFriendAccountAction,
  resetFriendPasswordAction,
  updateFriendProfileAction,
} from "@/app/actions/admin/accounts";
import type { ActionResult } from "@/app/actions/admin/types";
import type { Profile, SectionWithMembers, UserRole } from "@/lib/types";

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "COF-";
  for (let i = 0; i < 8; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

interface AccountsTabProps {
  currentAdminId: string;
  profiles: Profile[];
  sections: SectionWithMembers[];
  hasServiceRoleKey: boolean;
  isPending: boolean;
  runAction: (fn: () => Promise<ActionResult>) => void;
}

export function AccountsTab({
  currentAdminId,
  profiles,
  sections,
  hasServiceRoleKey,
  isPending,
  runAction,
}: AccountsTabProps) {
  const [newAccName, setNewAccName] = useState("");
  const [newAccEmail, setNewAccEmail] = useState("");
  const [newAccPass, setNewAccPass] = useState(() => generateTempPassword());
  const [newAccRole, setNewAccRole] = useState<UserRole>("member");
  const [newAccSectionId, setNewAccSectionId] = useState("");
  const [copiedPass, setCopiedPass] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetTempPass, setResetTempPass] = useState("");
  const [editProfileId, setEditProfileId] = useState<string | null>(null);
  const [editProfileName, setEditProfileName] = useState("");
  const [editProfileRole, setEditProfileRole] = useState<UserRole>("member");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 h-fit">
        <h2 className="font-bold text-base flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-rose-500" />
          Create Friend Account
        </h2>

        {!hasServiceRoleKey && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-200">
            Add <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> to{" "}
            <code className="font-mono">.env.local</code> to create and reset
            accounts directly from here.
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runAction(async () => {
              const res = await createFriendAccountAction({
                displayName: newAccName,
                email: newAccEmail,
                initialPassword: newAccPass,
                role: newAccRole,
                sectionId: newAccSectionId || undefined,
              });
              if (res.ok) {
                setNewAccName("");
                setNewAccEmail("");
                setNewAccPass(generateTempPassword());
                setNewAccRole("member");
              }
              return res;
            });
          }}
          className="space-y-3.5"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Display Name
            </label>
            <input
              type="text"
              required
              value={newAccName}
              onChange={(e) => setNewAccName(e.target.value)}
              placeholder="e.g., Giyu, Mark, Zeke"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={newAccEmail}
              onChange={(e) => setNewAccEmail(e.target.value)}
              placeholder="friend@ms.bulsu.edu.ph"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Initial Password (forced change on first login)
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                required
                minLength={8}
                value={newAccPass}
                onChange={(e) => setNewAccPass(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-mono"
              />
              <button
                type="button"
                title="Generate new password"
                onClick={() => setNewAccPass(generateTempPassword())}
                className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="Copy password"
                onClick={() => {
                  navigator.clipboard.writeText(newAccPass);
                  setCopiedPass(true);
                  setTimeout(() => setCopiedPass(false), 1500);
                }}
                className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {copiedPass ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Assign Section
              </label>
              <select
                value={newAccSectionId}
                onChange={(e) => setNewAccSectionId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="">None yet</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Role
              </label>
              <select
                value={newAccRole}
                onChange={(e) => setNewAccRole(e.target.value as UserRole)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="member">Friend (View-only)</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || !hasServiceRoleKey}
            className="w-full rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold py-2.5 text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Create Account
          </button>
        </form>
      </div>

      {/* Existing Accounts */}
      <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
        <h2 className="font-bold text-base">
          All Accounts ({profiles.length})
        </h2>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {profiles.map((p) => {
            const isMe = p.id === currentAdminId;
            const isEditing = editProfileId === p.id;
            const isResetting = resetUserId === p.id;

            return (
              <div key={p.id} className="py-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">
                        {p.display_name}
                      </span>
                      {p.role === "admin" && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold uppercase">
                          Admin
                        </span>
                      )}
                      {p.must_change_password && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                          Pending Password Change
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {p.email}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      title="Edit profile"
                      onClick={() => {
                        setEditProfileId(isEditing ? null : p.id);
                        setEditProfileName(p.display_name);
                        setEditProfileRole(p.role);
                      }}
                      className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Reset temporary password"
                      disabled={!hasServiceRoleKey}
                      onClick={() => {
                        setResetUserId(isResetting ? null : p.id);
                        setResetTempPass(generateTempPassword());
                      }}
                      className="h-8 w-8 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-600 flex items-center justify-center text-slate-500 disabled:opacity-40 cursor-pointer"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                    </button>
                    {!isMe && (
                      <button
                        type="button"
                        title="Delete account"
                        disabled={!hasServiceRoleKey || isPending}
                        onClick={() => {
                          if (
                            confirm(
                              `Permanently delete ${p.display_name} (${p.email})?`
                            )
                          ) {
                            runAction(() => deleteFriendAccountAction(p.id));
                          }
                        }}
                        className="h-8 w-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 flex items-center justify-center text-slate-500 disabled:opacity-40 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={editProfileName}
                      onChange={(e) => setEditProfileName(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2.5 py-1 text-xs"
                    />
                    <select
                      value={editProfileRole}
                      disabled={isMe}
                      onChange={(e) =>
                        setEditProfileRole(e.target.value as UserRole)
                      }
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-xs"
                    >
                      <option value="member">Friend</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        runAction(async () => {
                          const res = await updateFriendProfileAction({
                            userId: p.id,
                            displayName: editProfileName,
                            role: editProfileRole,
                          });
                          if (res.ok) setEditProfileId(null);
                          return res;
                        })
                      }
                      className="px-3 py-1 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                )}

                {isResetting && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={resetTempPass}
                      onChange={(e) => setResetTempPass(e.target.value)}
                      placeholder="New temporary password"
                      className="flex-1 rounded-lg border border-amber-300 dark:border-amber-800 bg-transparent px-2.5 py-1 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        runAction(async () => {
                          const res = await resetFriendPasswordAction({
                            userId: p.id,
                            temporaryPassword: resetTempPass,
                          });
                          if (res.ok) setResetUserId(null);
                          return res;
                        })
                      }
                      className="px-3 py-1 rounded-lg bg-amber-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      Set Temp Password
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
