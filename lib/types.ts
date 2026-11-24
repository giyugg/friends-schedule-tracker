export type UserRole = "admin" | "member";

export type ScheduleCategory = "major" | "minor" | "internship" | "other";

export type ScheduleModality = "ftf" | "online" | "hybrid";

export type ColorKey =
  | "coral"
  | "blush"
  | "amber"
  | "cream"
  | "sage"
  | "sky"
  | "lavender";

export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6;

export interface Semester {
  id: string;
  name: string;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  must_change_password: boolean;
  created_at: string;
}

export interface Section {
  id: string;
  semester_id: string;
  code: string;
  college_code: string | null;
  program_code: string | null;
  section_name: string | null;
  specialization: string | null;
  created_at: string;
}

export interface SectionMember {
  section_id: string;
  user_id: string;
}

export interface SectionWithMembers extends Section {
  members: Pick<Profile, "id" | "display_name" | "email">[];
}

export interface ScheduleEntry {
  id: string;
  section_id: string;
  day_of_week: DayOfWeek;
  start_time: string; // "HH:MM:SS" or "HH:MM"
  end_time: string;   // "HH:MM:SS" or "HH:MM"
  course_code: string;
  instructor: string | null;
  location: string | null;
  category: ScheduleCategory;
  modality: ScheduleModality;
  color_override: ColorKey | null;
  created_at: string;
  updated_at: string;
}

export interface FreeWindow {
  startSlot: number;
  endSlot: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export type VisibilityGroupType = "circle" | "organization";

export interface VisibilityGroup {
  id: string;
  name: string;
  type: VisibilityGroupType;
  description: string | null;
  created_at: string;
}

export interface VisibilityGroupWithMembers extends VisibilityGroup {
  memberIds: string[];
  memberRoles: Record<string, string | null>;
}

export type GradeSemesterType = "1st" | "2nd" | "midyear";

export type GradeValue =
  | "1.00"
  | "1.25"
  | "1.50"
  | "1.75"
  | "2.00"
  | "2.25"
  | "2.50"
  | "2.75"
  | "3.00"
  | "4.00"
  | "5.00"
  | "FDA"
  | "INC"
  | "OG"
  | "DRP"
  | "UD";

export interface GradeTerm {
  id: string;
  user_id: string;
  academic_year: string;
  semester_type: GradeSemesterType;
  year_level: number;
  is_locked: boolean;
  locked_at: string | null;
  last_unlocked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GradeEntry {
  id: string;
  term_id: string;
  user_id: string;
  course_code: string;
  course_name: string;
  units: number;
  grade_value: GradeValue;
  is_academic: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface GradeTermWithEntries extends GradeTerm {
  entries: GradeEntry[];
}

export type ProfileChangeRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

export interface ProfileChangeRequest {
  id: string;
  user_id: string;
  current_display_name: string;
  requested_display_name: string;
  status: ProfileChangeRequestStatus;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileChangeRequestWithUser extends ProfileChangeRequest {
  user_email: string;
  user_display_name: string;
  reviewer_display_name: string | null;
}

export const ADMIN_TAB_IDS = [
  "schedules",
  "sections",
  "directory",
  "accounts",
  "requests",
  "semesters",
] as const;

export type AdminTab = (typeof ADMIN_TAB_IDS)[number];

export const ADMIN_TAB_LABELS: Record<AdminTab, string> = {
  schedules: "Schedules",
  sections: "Sections & Rosters",
  directory: "Directory",
  accounts: "Friend Accounts",
  requests: "Profile Requests",
  semesters: "Semesters",
};

export function isAdminTab(
  value: string | null | undefined
): value is AdminTab {
  return (
    typeof value === "string" &&
    (ADMIN_TAB_IDS as readonly string[]).includes(value)
  );
}
