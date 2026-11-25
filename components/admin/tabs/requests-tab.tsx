"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  XCircle,
} from "lucide-react";
import { reviewProfileChangeRequestAction } from "@/app/actions/admin/profile-requests";
import type { ActionResult } from "@/app/actions/admin/types";
import type { ProfileChangeRequestWithUser } from "@/lib/types";

interface RequestsTabProps {
  profileRequests: ProfileChangeRequestWithUser[];
  requestsMigrationRequired: boolean;
  isPending: boolean;
  runAction: (fn: () => Promise<ActionResult>) => void;
}

export function RequestsTab({
  profileRequests,
  requestsMigrationRequired,
  isPending,
  runAction,
}: RequestsTabProps) {
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const pendingProfileRequests = useMemo(
    () => profileRequests.filter((r) => r.status === "pending"),
    [profileRequests]
  );
  const resolvedProfileRequests = useMemo(
    () => profileRequests.filter((r) => r.status !== "pending"),
    [profileRequests]
  );

  if (requestsMigrationRequired) {
    return (
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/70 bg-amber-50/70 dark:bg-amber-950/30 p-6 space-y-2">
        <div className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-200">
          <Database className="h-4 w-4" />
          Database Migration Required
        </div>
        <p className="text-xs text-amber-800/90 dark:text-amber-300/90">
          Run{" "}
          <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 font-mono">
            supabase/migrations/005_profile_change_requests.sql
          </code>{" "}
          in your Supabase SQL Editor to enable the Profile Requests approval
          queue.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Queue */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Pending Approvals ({pendingProfileRequests.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review display name change requests submitted by members.
            </p>
          </div>
        </div>

        {pendingProfileRequests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No pending profile change requests right now.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingProfileRequests.map((req) => {
              const noteValue = reviewNotes[req.id] ?? "";
              return (
                <div
                  key={req.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-4 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        <span className="text-slate-500 dark:text-slate-400 line-through">
                          {req.current_display_name}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <span className="text-slate-900 dark:text-white">
                          {req.requested_display_name}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {req.user_email} · Submitted{" "}
                        {new Intl.DateTimeFormat("en-PH", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(req.created_at))}
                      </div>
                    </div>

                    <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                      Pending
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={noteValue}
                      onChange={(e) =>
                        setReviewNotes((prev) => ({
                          ...prev,
                          [req.id]: e.target.value,
                        }))
                      }
                      maxLength={200}
                      placeholder="Optional note (e.g., reason if rejecting)"
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-rose-400"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          runAction(async () => {
                            const res = await reviewProfileChangeRequestAction({
                              requestId: req.id,
                              decision: "approved",
                              reviewNote: noteValue,
                            });
                            if (res.ok) {
                              setReviewNotes((prev) => {
                                const next = { ...prev };
                                delete next[req.id];
                                return next;
                              });
                            }
                            return res;
                          })
                        }
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50 transition cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve
                      </button>

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          runAction(async () => {
                            const res = await reviewProfileChangeRequestAction({
                              requestId: req.id,
                              decision: "rejected",
                              reviewNote: noteValue,
                            });
                            if (res.ok) {
                              setReviewNotes((prev) => {
                                const next = { ...prev };
                                delete next[req.id];
                                return next;
                              });
                            }
                            return res;
                          })
                        }
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/80 text-xs font-semibold disabled:opacity-50 transition cursor-pointer"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Request History */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Recent History ({resolvedProfileRequests.length})
        </h2>

        {resolvedProfileRequests.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No resolved requests yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {resolvedProfileRequests.map((req) => (
              <div
                key={req.id}
                className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                    <span className="text-slate-500 dark:text-slate-400">
                      {req.current_display_name}
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold">
                      {req.requested_display_name}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {req.user_email}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {req.reviewed_at
                      ? `Reviewed ${new Intl.DateTimeFormat("en-PH", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(req.reviewed_at))}`
                      : `Updated ${new Intl.DateTimeFormat("en-PH", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(req.updated_at))}`}
                    {req.reviewer_display_name &&
                      ` by ${req.reviewer_display_name}`}
                    {req.review_note && ` · Note: "${req.review_note}"`}
                  </div>
                </div>

                <span
                  className={`self-start sm:self-auto px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                    req.status === "approved"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : req.status === "rejected"
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
