"use client";

import { Clock, MapPin, User, Users, X } from "lucide-react";
import {
  DAYS,
  formatMemberNames,
  formatTime12h,
  getEntryColorClasses,
} from "@/lib/schedule-utils";
import type { ScheduleEntry, SectionWithMembers } from "@/lib/types";

interface ClassDetailModalProps {
  entry: ScheduleEntry | null;
  section: SectionWithMembers | null;
  onClose: () => void;
}

export function ClassDetailModal({
  entry,
  section,
  onClose,
}: ClassDetailModalProps) {
  if (!entry || !section) return null;

  const colors = getEntryColorClasses(entry);
  const dayLabel =
    DAYS.find((d) => d.value === entry.day_of_week)?.label ?? "Day";

  const modalityLabel =
    entry.modality === "ftf"
      ? "Face-to-Face"
      : entry.modality === "hybrid"
        ? "FTF / Online (Hybrid)"
        : "Online Class";

  const categoryLabel =
    entry.category === "major"
      ? "Major"
      : entry.category === "minor"
        ? "Minor / GenEd"
        : entry.category === "internship"
          ? "Internship"
          : "Other";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`px-5 py-4 border-b ${colors.cardClass}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md ${colors.badgeClass}`}
                >
                  {categoryLabel}
                </span>
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md ${colors.badgeClass}`}
                >
                  {modalityLabel}
                </span>
              </div>
              <h3 className="text-xl font-bold tracking-tight">
                {entry.course_code}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-3.5 text-sm">
          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">
                {dayLabel}
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                {formatTime12h(entry.start_time)} –{" "}
                {formatTime12h(entry.end_time)}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Instructor
              </div>
              <div className="font-medium text-slate-900 dark:text-slate-100">
                {entry.instructor?.trim() || "N/A"}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Room / Modality
              </div>
              <div className="font-medium text-slate-900 dark:text-slate-100">
                {entry.location?.trim() || modalityLabel}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Users className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {section.code}
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                {formatMemberNames(section.members)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
