import "server-only";

import { revalidatePath, updateTag } from "next/cache";

function revalidateScheduleViews() {
  revalidatePath("/");
  revalidatePath("/daily");
  revalidatePath("/weekly");
  revalidatePath("/free-time");
  revalidatePath("/profile");
  revalidatePath("/groups", "layout");
  revalidatePath("/admin");
}

export function revalidateSemesters() {
  updateTag("shell");
  updateTag("semesters");
  updateTag("sections");
  updateTag("schedules");
  revalidateScheduleViews();
  revalidatePath("/grades");
}

export function revalidateSections() {
  updateTag("sections");
  updateTag("schedules");
  revalidateScheduleViews();
}

export function revalidateSchedules() {
  updateTag("schedules");
  revalidateScheduleViews();
}

export function revalidateAccounts() {
  updateTag("shell");
  updateTag("profiles");
  updateTag("profile");
  updateTag("sections");
  updateTag("groups");
  updateTag("profile-requests");
  revalidateScheduleViews();
}

export function revalidateDirectory() {
  updateTag("shell");
  updateTag("groups");
  updateTag("profiles");
  updateTag("sections");
  updateTag("schedules");
  revalidateScheduleViews();
}

export function revalidateProfileRequests() {
  updateTag("shell");
  updateTag("profile-requests");
  updateTag("profiles");
  updateTag("profile");
  revalidateScheduleViews();
}
