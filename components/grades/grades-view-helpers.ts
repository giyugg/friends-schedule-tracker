import { getGradeInfo } from "@/lib/grades-utils";
import type { GradeEntry, GradeValue } from "@/lib/types";

export interface DraftRow {
  localId: string;
  courseCode: string;
  courseName: string;
  units: string;
  gradeValue: GradeValue;
  isAcademic: boolean;
}

export function makeDraftRows(entries: GradeEntry[]): DraftRow[] {
  return entries.map((e) => ({
    localId: e.id,
    courseCode: e.course_code,
    courseName: e.course_name,
    units: String(e.units),
    gradeValue: e.grade_value,
    isAcademic: e.is_academic,
  }));
}

export function makeEmptyRow(): DraftRow {
  return {
    localId: `new-${Math.random().toString(36).slice(2, 10)}`,
    courseCode: "",
    courseName: "",
    units: "3",
    gradeValue: "1.00",
    isAcademic: true,
  };
}

export function formatDateShort(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function gradeBadgeClasses(grade: GradeValue): string {
  const info = getGradeInfo(grade);
  if (info.category === "failing") {
    return "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900";
  }
  if (info.category === "conditional") {
    return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900";
  }
  if (info.category === "special") {
    return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  }
  if (info.numericValue !== null && info.numericValue <= 1.5) {
    return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900";
  }
  if (info.numericValue !== null && info.numericValue <= 2.0) {
    return "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-900";
  }
  return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700";
}
