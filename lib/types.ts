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
  display_order: number;
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
}
