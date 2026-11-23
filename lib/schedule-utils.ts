import type {
  ColorKey,
  DayOfWeek,
  FreeWindow,
  ScheduleCategory,
  ScheduleEntry,
  ScheduleModality,
} from "./types";

export const DAYS: { value: DayOfWeek; label: string; short: string }[] = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

export const START_HOUR = 7; // 7:00 AM
export const END_HOUR = 20; // 8:00 PM
export const SLOT_MINUTES = 30;
export const TOTAL_SLOTS = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES; // 26 slots

// Lunch time visual highlight: 12:00 PM - 1:00 PM (slots 10 and 11)
// Visual-only; does not restrict classes or affect free-time calculations.
export const BREAK_SLOT_INDICES = new Set([10, 11]);

export interface TimeSlot {
  index: number;
  start: string; // "07:00"
  end: string;   // "07:30"
  label: string; // "7:00 AM - 7:30 AM"
  shortLabel: string; // "7:00 AM"
  isBreak: boolean;
}

export function slotIndexToTime(index: number): string {
  const totalMinutes = START_HOUR * 60 + index * SLOT_MINUTES;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function normalizeTime(time: string): string {
  return time.slice(0, 5); // "07:30:00" -> "07:30"
}

export function timeToMinutes(time: string): number {
  const [h, m] = normalizeTime(time).split(":").map(Number);
  return h * 60 + m;
}

export function timeToSlotIndex(time: string): number {
  const mins = timeToMinutes(time);
  return Math.round((mins - START_HOUR * 60) / SLOT_MINUTES);
}

export function formatTime12h(time: string): string {
  const [h, m] = normalizeTime(time).split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export const TIME_SLOTS: TimeSlot[] = Array.from(
  { length: TOTAL_SLOTS },
  (_, index) => {
    const start = slotIndexToTime(index);
    const end = slotIndexToTime(index + 1);
    return {
      index,
      start,
      end,
      label: `${formatTime12h(start)} - ${formatTime12h(end)}`,
      shortLabel: formatTime12h(start),
      isBreak: BREAK_SLOT_INDICES.has(index),
    };
  }
);

export const TIME_OPTIONS: { value: string; label: string }[] = Array.from(
  { length: TOTAL_SLOTS + 1 },
  (_, index) => {
    const value = slotIndexToTime(index);
    return { value, label: formatTime12h(value) };
  }
);

export const COLOR_PRESETS: Record<
  ColorKey,
  {
    name: string;
    description: string;
    cardClass: string;
    badgeClass: string;
    swatchClass: string;
  }
> = {
  coral: {
    name: "Coral (Major FTF / Internship)",
    description: "Face-to-face major, lab, or internship",
    cardClass:
      "bg-[#F19C99] border-[#DF7A76] text-[#3B1211] dark:bg-[#6E2C2A] dark:border-[#B55855] dark:text-[#FDE8E8]",
    badgeClass:
      "bg-[#DF7A76]/30 text-[#3B1211] dark:bg-[#B55855]/40 dark:text-[#FDE8E8]",
    swatchClass: "bg-[#F19C99] border-[#DF7A76]",
  },
  blush: {
    name: "Blush (Major Online / Hybrid)",
    description: "Online or hybrid major subject",
    cardClass:
      "bg-[#F7D6D6] border-[#E5B3B3] text-[#4A1919] dark:bg-[#4C2629] dark:border-[#8A4A4F] dark:text-[#FCE7E7]",
    badgeClass:
      "bg-[#E5B3B3]/40 text-[#4A1919] dark:bg-[#8A4A4F]/40 dark:text-[#FCE7E7]",
    swatchClass: "bg-[#F7D6D6] border-[#E5B3B3]",
  },
  amber: {
    name: "Amber (Minor FTF)",
    description: "Face-to-face minor / GenEd subject",
    cardClass:
      "bg-[#F9D96B] border-[#E0B83C] text-[#3F2E05] dark:bg-[#634B14] dark:border-[#B88F2A] dark:text-[#FEF3C7]",
    badgeClass:
      "bg-[#E0B83C]/35 text-[#3F2E05] dark:bg-[#B88F2A]/40 dark:text-[#FEF3C7]",
    swatchClass: "bg-[#F9D96B] border-[#E0B83C]",
  },
  cream: {
    name: "Cream (Minor Online / Hybrid)",
    description: "Online or hybrid minor / GenEd subject",
    cardClass:
      "bg-[#FFF3CC] border-[#E6D39A] text-[#45360B] dark:bg-[#473D1E] dark:border-[#8A7638] dark:text-[#FEF9E7]",
    badgeClass:
      "bg-[#E6D39A]/45 text-[#45360B] dark:bg-[#8A7638]/40 dark:text-[#FEF9E7]",
    swatchClass: "bg-[#FFF3CC] border-[#E6D39A]",
  },
  sage: {
    name: "Sage (Custom)",
    description: "Optional soft green override",
    cardClass:
      "bg-[#D9EAD3] border-[#A8CE9C] text-[#1D3B1A] dark:bg-[#23412B] dark:border-[#4B8559] dark:text-[#E6F5E3]",
    badgeClass:
      "bg-[#A8CE9C]/40 text-[#1D3B1A] dark:bg-[#4B8559]/40 dark:text-[#E6F5E3]",
    swatchClass: "bg-[#D9EAD3] border-[#A8CE9C]",
  },
  sky: {
    name: "Sky (Custom)",
    description: "Optional soft blue override",
    cardClass:
      "bg-[#D4E9FA] border-[#9BC7EE] text-[#102E4A] dark:bg-[#1E3B57] dark:border-[#4A80B3] dark:text-[#E5F2FD]",
    badgeClass:
      "bg-[#9BC7EE]/40 text-[#102E4A] dark:bg-[#4A80B3]/40 dark:text-[#E5F2FD]",
    swatchClass: "bg-[#D4E9FA] border-[#9BC7EE]",
  },
  lavender: {
    name: "Lavender (Custom)",
    description: "Optional soft purple override",
    cardClass:
      "bg-[#E5DCF8] border-[#BCA9EA] text-[#2D1A54] dark:bg-[#37285C] dark:border-[#7358B5] dark:text-[#F1EBFC]",
    badgeClass:
      "bg-[#BCA9EA]/40 text-[#2D1A54] dark:bg-[#7358B5]/40 dark:text-[#F1EBFC]",
    swatchClass: "bg-[#E5DCF8] border-[#BCA9EA]",
  },
};

export function resolveColorKey(
  category: ScheduleCategory,
  modality: ScheduleModality,
  colorOverride?: ColorKey | null
): ColorKey {
  if (colorOverride && colorOverride in COLOR_PRESETS) {
    return colorOverride;
  }
  if (category === "internship") return "coral";
  if (category === "major") {
    return modality === "ftf" ? "coral" : "blush";
  }
  if (category === "minor") {
    return modality === "ftf" ? "amber" : "cream";
  }
  return modality === "ftf" ? "sky" : "lavender";
}

export function getEntryColorClasses(entry: Pick<ScheduleEntry, "category" | "modality" | "color_override">) {
  const key = resolveColorKey(entry.category, entry.modality, entry.color_override);
  return COLOR_PRESETS[key];
}

export function formatMemberNames(
  members: { display_name: string }[]
): string {
  if (members.length === 0) return "Unassigned";
  if (members.length === 1) return members[0].display_name;
  if (members.length === 2) {
    return `${members[0].display_name} & ${members[1].display_name}`;
  }
  return `${members
    .slice(0, -1)
    .map((m) => m.display_name)
    .join(", ")} & ${members[members.length - 1].display_name}`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h} hr${h > 1 ? "s" : ""}`;
  return `${h}h ${m}m`;
}

export function formatCompactDuration(minutes: number): string {
  const safe = Math.max(1, Math.round(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function minutesToHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function getManilaNow(date = new Date()): {
  dayOfWeek: number; // 0=Sun, 1=Mon..6=Sat
  minutesFromMidnight: number;
  timeLabel: string;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const weekdayStr = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "8") % 24;
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");

  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    dayOfWeek: dayMap[weekdayStr] ?? 1,
    minutesFromMidnight: hour * 60 + minute,
    timeLabel: formatTime12h(
      `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
    ),
  };
}

export function getDefaultDayOfWeek(): DayOfWeek {
  const { dayOfWeek } = getManilaNow();
  if (dayOfWeek >= 1 && dayOfWeek <= 6) {
    return dayOfWeek as DayOfWeek;
  }
  return 1; // Sunday -> default to Monday
}

export function computeCommonFreeSlots(
  entries: ScheduleEntry[],
  selectedSectionIds: string[],
  dayOfWeek: DayOfWeek
): FreeWindow[] {
  if (selectedSectionIds.length === 0) return [];

  const sectionSet = new Set(selectedSectionIds);
  const busySlots = new Array<boolean>(TOTAL_SLOTS).fill(false);

  for (const entry of entries) {
    if (entry.day_of_week !== dayOfWeek) continue;
    if (!sectionSet.has(entry.section_id)) continue;

    const startIdx = Math.max(0, timeToSlotIndex(entry.start_time));
    const endIdx = Math.min(TOTAL_SLOTS, timeToSlotIndex(entry.end_time));
    for (let i = startIdx; i < endIdx; i++) {
      busySlots[i] = true;
    }
  }

  const windows: FreeWindow[] = [];
  let runStart: number | null = null;

  for (let i = 0; i <= TOTAL_SLOTS; i++) {
    const isFree = i < TOTAL_SLOTS && !busySlots[i];
    if (isFree && runStart === null) {
      runStart = i;
    } else if (!isFree && runStart !== null) {
      windows.push({
        startSlot: runStart,
        endSlot: i,
        startTime: slotIndexToTime(runStart),
        endTime: slotIndexToTime(i),
        durationMinutes: (i - runStart) * SLOT_MINUTES,
      });
      runStart = null;
    }
  }

  return windows;
}

export type LiveStatus =
  | {
      state: "in_class";
      currentEntry: ScheduleEntry;
      minutesUntilFree: number;
      freeAtTime: string;
      hasBackToBack: boolean;
    }
  | {
      state: "free";
      nextEntry: ScheduleEntry | null;
      minutesUntilNext: number | null;
    }
  | { state: "done" }
  | { state: "sunday" };

export function getLiveSectionStatus(
  sectionEntries: ScheduleEntry[],
  manilaNow = getManilaNow()
): LiveStatus {
  if (manilaNow.dayOfWeek === 0) {
    return { state: "sunday" };
  }

  const todaysEntries = sectionEntries
    .filter((e) => e.day_of_week === manilaNow.dayOfWeek)
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

  if (todaysEntries.length === 0) {
    return { state: "free", nextEntry: null, minutesUntilNext: null };
  }

  const nowMins = manilaNow.minutesFromMidnight;

  for (let i = 0; i < todaysEntries.length; i++) {
    const entry = todaysEntries[i];
    const start = timeToMinutes(entry.start_time);
    const end = timeToMinutes(entry.end_time);
    if (nowMins >= start && nowMins < end) {
      // Chain any back-to-back or overlapping classes so we report when truly free
      let freeAtMins = end;
      for (let j = i + 1; j < todaysEntries.length; j++) {
        const nextStart = timeToMinutes(todaysEntries[j].start_time);
        const nextEnd = timeToMinutes(todaysEntries[j].end_time);
        if (nextStart <= freeAtMins) {
          if (nextEnd > freeAtMins) {
            freeAtMins = nextEnd;
          }
        } else {
          break;
        }
      }

      return {
        state: "in_class",
        currentEntry: entry,
        minutesUntilFree: Math.max(1, freeAtMins - nowMins),
        freeAtTime: minutesToHHMM(freeAtMins),
        hasBackToBack: freeAtMins > end,
      };
    }
  }

  const nextEntry = todaysEntries.find(
    (entry) => timeToMinutes(entry.start_time) > nowMins
  );

  if (nextEntry) {
    return {
      state: "free",
      nextEntry,
      minutesUntilNext: Math.max(
        1,
        timeToMinutes(nextEntry.start_time) - nowMins
      ),
    };
  }

  return { state: "done" };
}
