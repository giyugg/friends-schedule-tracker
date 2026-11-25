"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers,
  Loader2,
  Mail,
  Pencil,
  Shield,
  X,
  XCircle,
} from "lucide-react";
import {
  cancelDisplayNameChangeRequestAction,
  requestDisplayNameChangeAction,
} from "@/app/actions/profile";
import { getSectionAcademicInfo } from "@/lib/academic-catalog";
import type {
  Profile,
  ProfileChangeRequest,
  SectionWithMembers,
} from "@/lib/types";
import { formatDate, formatDateTime, getInitials } from "./profile-helpers";

interface ProfileHeroCardProps {
  profile: Profile;
  userSection: SectionWithMembers | null;
  changeRequests: ProfileChangeRequest[];
  requestsMigrationRequired: boolean;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
  onFeedback: (
    feedback: { type: "success" | "error"; text: string } | null
  ) => void;
}

export function ProfileHeroCard({
  profile,
  userSection,
  changeRequests,
  requestsMigrationRequired,
  isPending,
  startTransition,
  onFeedback,
}: ProfileHeroCardProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.display_name);

  const pendingRequest = useMemo(
    () => changeRequests.find((r) => r.status === "pending") ?? null,
    [changeRequests]
  );
  const latestResolvedRequest = useMemo(
    () =>
      changeRequests.find(
        (r) => r.status === "approved" || r.status === "rejected"
      ) ?? null,
    [changeRequests]
  );

  const academic = useMemo(
    () => (userSection ? getSectionAcademicInfo(userSection) : null),
    [userSection]
  );

  const handleOpenEdit = () => {
    onFeedback(null);
    setNameInput(profile.display_name);
    setEditingName(true);
  };

  const handleSubmitNameChange = (e: React.FormEvent) => {
    e.preventDefault();
    onFeedback(null);
    startTransition(async () => {
      const res = await requestDisplayNameChangeAction(nameInput);
      if (!res.ok) {
        onFeedback({
          type: "error",
          text: res.error ?? "Unable to submit display name change.",
        });
        return;
      }
      setEditingName(false);
      onFeedback({
        type: "success",
        text: res.message ?? "Display name change submitted.",
      });
    });
  };

  const handleCancelRequest = (requestId: string) => {
    onFeedback(null);
    startTransition(async () => {
      const res = await cancelDisplayNameChangeRequestAction(requestId);
      if (!res.ok) {
        onFeedback({
          type: "error",
          text: res.error ?? "Failed to cancel request.",
        });
        return;
      }
      onFeedback({
        type: "success",
        text: res.message ?? "Request cancelled.",
      });
    });
  };

  return (
    <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 sm:p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-16 w-16 shrink-0 rounded-2xl bg-[#F19C99]/35 dark:bg-[#6E2C2A] border border-[#DF7A76]/50 flex items-center justify-center text-xl font-bold text-[#9E2A26] dark:text-[#FDE8E8] tracking-tight">
            {getInitials(profile.display_name)}
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
                {profile.display_name}
              </h2>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  profile.role === "admin"
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {profile.role === "admin" && <Shield className="h-3 w-3" />}
                {profile.role === "admin" ? "Admin" : "Member"}
              </span>
              {academic?.college && (
                <span
                  title={academic.college.name}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-900"
                >
                  <GraduationCap className="h-3 w-3" />
                  {academic.college.code}
                </span>
              )}
              {userSection && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300">
                  <Layers className="h-3 w-3" />
                  {userSection.code}
                </span>
              )}
            </div>
            {(academic?.college || academic?.program) && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {academic.college && (
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {academic.college.name}
                  </span>
                )}
                {academic.college && academic.program && (
                  <span className="text-slate-400 dark:text-slate-500">
                    {" "}
                    —{" "}
                  </span>
                )}
                {academic.program && (
                  <span>
                    {academic.program.name}
                    {academic.specialization && (
                      <span className="text-slate-400 dark:text-slate-500">
                        {" "}
                        · {academic.specialization}
                      </span>
                    )}
                  </span>
                )}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5 truncate">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{profile.email}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                Member since {formatDate(profile.created_at)}
              </span>
            </div>
          </div>
        </div>

        {!editingName && (
          <button
            type="button"
            onClick={handleOpenEdit}
            disabled={
              Boolean(pendingRequest) ||
              (requestsMigrationRequired && profile.role !== "admin")
            }
            title={
              pendingRequest
                ? "Cancel your pending request first to submit a new one"
                : "Edit display name"
            }
            className="inline-flex items-center justify-center gap-1.5 self-start sm:self-auto px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
            {profile.role === "admin"
              ? "Edit Display Name"
              : "Request Name Change"}
          </button>
        )}
      </div>

      {/* Inline Display Name Form */}
      {editingName && (
        <form
          onSubmit={handleSubmitNameChange}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 p-4 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="profile-display-name"
              className="text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              New Display Name
            </label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {profile.role === "admin"
                ? "Admin changes apply immediately"
                : "Requires admin approval before taking effect"}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="profile-display-name"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              minLength={2}
              maxLength={80}
              required
              placeholder="Enter your display name"
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-rose-400"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition cursor-pointer"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {profile.role === "admin" ? "Save Name" : "Submit for Approval"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingName(false);
                  setNameInput(profile.display_name);
                }}
                disabled={isPending}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Pending Name Change Banner */}
      {pendingRequest && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200 dark:border-amber-900/70 bg-amber-50/70 dark:bg-amber-950/30 px-4 py-3">
          <div className="space-y-0.5 text-xs">
            <div className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              Display Name Change Pending Approval
            </div>
            <div className="text-amber-800/90 dark:text-amber-300/90 flex flex-wrap items-center gap-1.5">
              <span className="line-through opacity-75">
                {pendingRequest.current_display_name}
              </span>
              <ArrowRight className="h-3 w-3 shrink-0" />
              <span className="font-semibold">
                {pendingRequest.requested_display_name}
              </span>
              <span className="opacity-70">
                · Submitted {formatDateTime(pendingRequest.created_at)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleCancelRequest(pendingRequest.id)}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-1 self-start sm:self-auto px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-xs font-semibold text-amber-800 dark:text-amber-200 hover:bg-amber-100/70 dark:hover:bg-amber-950/60 disabled:opacity-50 transition cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            Cancel Request
          </button>
        </div>
      )}

      {/* Most Recent Reviewed Request Status (when no pending request) */}
      {!pendingRequest && latestResolvedRequest && (
        <div
          className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs ${
            latestResolvedRequest.status === "approved"
              ? "border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/25 text-emerald-800 dark:text-emerald-200"
              : "border-rose-200/80 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/25 text-rose-800 dark:text-rose-200"
          }`}
        >
          {latestResolvedRequest.status === "approved" ? (
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
          )}
          <div className="space-y-0.5">
            <div>
              <span className="font-semibold">
                Last name request{" "}
                {latestResolvedRequest.status === "approved"
                  ? "approved"
                  : "rejected"}
              </span>{" "}
              ({latestResolvedRequest.current_display_name} →{" "}
              {latestResolvedRequest.requested_display_name}) on{" "}
              {formatDateTime(
                latestResolvedRequest.reviewed_at ??
                  latestResolvedRequest.updated_at
              )}
            </div>
            {latestResolvedRequest.review_note && (
              <div className="opacity-90">
                Admin note: &ldquo;{latestResolvedRequest.review_note}&rdquo;
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
