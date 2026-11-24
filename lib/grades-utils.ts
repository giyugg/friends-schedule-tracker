import type {
  GradeEntry,
  GradeSemesterType,
  GradeTermWithEntries,
  GradeValue,
} from "./types";

export interface TransmutationRow {
  grade: GradeValue;
  description: string;
  numericValue: number | null;
  minPercent?: number;
  maxPercent?: number;
  category: "passing" | "conditional" | "failing" | "special";
}

export const TRANSMUTATION_TABLE: TransmutationRow[] = [
  {
    grade: "1.00",
    description: "96.50 - 100.00",
    numericValue: 1.0,
    minPercent: 96.5,
    maxPercent: 100.0,
    category: "passing",
  },
  {
    grade: "1.25",
    description: "93.50 - 96.49",
    numericValue: 1.25,
    minPercent: 93.5,
    maxPercent: 96.49,
    category: "passing",
  },
  {
    grade: "1.50",
    description: "90.50 - 93.49",
    numericValue: 1.5,
    minPercent: 90.5,
    maxPercent: 93.49,
    category: "passing",
  },
  {
    grade: "1.75",
    description: "87.50 - 90.49",
    numericValue: 1.75,
    minPercent: 87.5,
    maxPercent: 90.49,
    category: "passing",
  },
  {
    grade: "2.00",
    description: "84.50 - 87.49",
    numericValue: 2.0,
    minPercent: 84.5,
    maxPercent: 87.49,
    category: "passing",
  },
  {
    grade: "2.25",
    description: "81.50 - 84.49",
    numericValue: 2.25,
    minPercent: 81.5,
    maxPercent: 84.49,
    category: "passing",
  },
  {
    grade: "2.50",
    description: "78.50 - 81.49",
    numericValue: 2.5,
    minPercent: 78.5,
    maxPercent: 81.49,
    category: "passing",
  },
  {
    grade: "2.75",
    description: "75.50 - 78.49",
    numericValue: 2.75,
    minPercent: 75.5,
    maxPercent: 78.49,
    category: "passing",
  },
  {
    grade: "3.00",
    description: "75.00 - 75.49",
    numericValue: 3.0,
    minPercent: 75.0,
    maxPercent: 75.49,
    category: "passing",
  },
  {
    grade: "4.00",
    description: "Conditional Passed",
    numericValue: 4.0,
    category: "conditional",
  },
  {
    grade: "5.00",
    description: "Failed",
    numericValue: 5.0,
    category: "failing",
  },
  {
    grade: "FDA",
    description: "Failure Due to Absences",
    numericValue: null,
    category: "failing",
  },
  {
    grade: "INC",
    description: "Incomplete",
    numericValue: null,
    category: "special",
  },
  {
    grade: "OG",
    description: "On Going",
    numericValue: null,
    category: "special",
  },
  {
    grade: "DRP",
    description: "Dropped",
    numericValue: null,
    category: "special",
  },
  {
    grade: "UD",
    description: "Unofficially Dropped",
    numericValue: null,
    category: "failing",
  },
];

export const VALID_GRADE_VALUES: Set<GradeValue> = new Set(
  TRANSMUTATION_TABLE.map((row) => row.grade)
);

const TRANSMUTATION_MAP = new Map<GradeValue, TransmutationRow>(
  TRANSMUTATION_TABLE.map((row) => [row.grade, row])
);

/** Marks that automatically disqualify a student from Gold Gear & Latin Honors */
export const DISQUALIFYING_MARKS = new Set<GradeValue>([
  "4.00",
  "5.00",
  "FDA",
  "INC",
  "UD",
]);

/** Marks that do not count in numerical GWA and surface a pending/dropped warning */
export const WARNING_MARKS = new Set<GradeValue>(["OG", "DRP"]);

export function getGradeInfo(grade: GradeValue): TransmutationRow {
  return (
    TRANSMUTATION_MAP.get(grade) ?? {
      grade,
      description: grade,
      numericValue: null,
      category: "special",
    }
  );
}

export function getNumericGrade(grade: GradeValue): number | null {
  return TRANSMUTATION_MAP.get(grade)?.numericValue ?? null;
}

export function percentageToGrade(percent: number): GradeValue | null {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) return null;
  if (percent >= 96.5) return "1.00";
  if (percent >= 93.5) return "1.25";
  if (percent >= 90.5) return "1.50";
  if (percent >= 87.5) return "1.75";
  if (percent >= 84.5) return "2.00";
  if (percent >= 81.5) return "2.25";
  if (percent >= 78.5) return "2.50";
  if (percent >= 75.5) return "2.75";
  if (percent >= 75.0) return "3.00";
  return "5.00";
}

export function roundGwa2(gwa: number): number {
  return Math.round(gwa * 100) / 100;
}

export function formatGwa(gwa: number | null, decimals = 4): string {
  if (gwa === null || !Number.isFinite(gwa)) return "—";
  return gwa.toFixed(decimals);
}

export function formatSemesterLabel(type: GradeSemesterType): string {
  if (type === "1st") return "1st Semester";
  if (type === "2nd") return "2nd Semester";
  return "Midyear";
}

export function formatYearLevel(level: number): string {
  if (level === 1) return "1st Year";
  if (level === 2) return "2nd Year";
  if (level === 3) return "3rd Year";
  return `${level}th Year`;
}

export function parseAcademicYear(
  ay: string
): { start: number; end: number } | null {
  const match = /^(\d{4})-(\d{4})$/.exec(ay.trim());
  if (!match) return null;
  return { start: Number(match[1]), end: Number(match[2]) };
}

const SEMESTER_ORDER: Record<GradeSemesterType, number> = {
  "1st": 1,
  "2nd": 2,
  midyear: 3,
};

export function sortGradeTerms(
  terms: GradeTermWithEntries[]
): GradeTermWithEntries[] {
  return [...terms].sort((a, b) => {
    const ayA = parseAcademicYear(a.academic_year)?.start ?? 0;
    const ayB = parseAcademicYear(b.academic_year)?.start ?? 0;
    if (ayA !== ayB) return ayA - ayB;
    return SEMESTER_ORDER[a.semester_type] - SEMESTER_ORDER[b.semester_type];
  });
}

export interface GradeStats {
  rawGwa: number | null;
  roundedGwa: number | null;
  academicUnits: number;
  gradedAcademicUnits: number;
  nonAcademicUnits: number;
  totalUnits: number;
  subjectCount: number;
  lowestNumericGrade: number | null;
  lowestGradeCourse: string | null;
  disqualifyingEntries: GradeEntry[];
  warningEntries: GradeEntry[];
}

export function computeEntriesStats(entries: GradeEntry[]): GradeStats {
  let weightedSum = 0;
  let gradedAcademicUnits = 0;
  let academicUnits = 0;
  let nonAcademicUnits = 0;
  let lowestNumericGrade: number | null = null;
  let lowestGradeCourse: string | null = null;
  const disqualifyingEntries: GradeEntry[] = [];
  const warningEntries: GradeEntry[] = [];

  for (const entry of entries) {
    const units = Number(entry.units) || 0;
    if (entry.is_academic) {
      academicUnits += units;
    } else {
      nonAcademicUnits += units;
    }

    const numeric = getNumericGrade(entry.grade_value);

    // Track lowest grade across all enrolled subjects
    if (numeric !== null) {
      if (lowestNumericGrade === null || numeric > lowestNumericGrade) {
        lowestNumericGrade = numeric;
        lowestGradeCourse = entry.course_code;
      }
      if (entry.is_academic && units > 0) {
        weightedSum += numeric * units;
        gradedAcademicUnits += units;
      }
    }

    if (DISQUALIFYING_MARKS.has(entry.grade_value)) {
      disqualifyingEntries.push(entry);
    } else if (WARNING_MARKS.has(entry.grade_value)) {
      warningEntries.push(entry);
    }
  }

  const rawGwa =
    gradedAcademicUnits > 0 ? weightedSum / gradedAcademicUnits : null;

  return {
    rawGwa,
    roundedGwa: rawGwa !== null ? roundGwa2(rawGwa) : null,
    academicUnits,
    gradedAcademicUnits,
    nonAcademicUnits,
    totalUnits: academicUnits + nonAcademicUnits,
    subjectCount: entries.length,
    lowestNumericGrade,
    lowestGradeCourse,
    disqualifyingEntries,
    warningEntries,
  };
}

export function computeTermStats(term: GradeTermWithEntries): GradeStats {
  return computeEntriesStats(term.entries);
}

// ============================================================================
// 1. Gold Gear Awards Evaluator
// ============================================================================

export type GoldGearAwardStatus =
  | "presidents_list"
  | "deans_list"
  | "ineligible"
  | "incomplete_history";

export interface GoldGearChecklistItem {
  label: string;
  passed: boolean;
  detail: string;
}

export interface GoldGearPairEvaluation {
  prevTerm: GradeTermWithEntries; // 2nd sem of preceding AY
  currTerm: GradeTermWithEntries; // 1st sem of current AY
  status: GoldGearAwardStatus;
  awardLabel: string;
  combinedRawGwa: number | null;
  combinedRoundedGwa: number | null;
  prevAcademicUnits: number;
  currAcademicUnits: number;
  lowestNumericGrade: number | null;
  checklist: GoldGearChecklistItem[];
  warnings: string[];
}

export interface GoldGearEvaluation {
  latestPair: GoldGearPairEvaluation | null;
  allPairs: GoldGearPairEvaluation[];
  hint: string;
}

export function evaluateGoldGear(
  terms: GradeTermWithEntries[]
): GoldGearEvaluation {
  const sorted = sortGradeTerms(terms);
  const pairs: GoldGearPairEvaluation[] = [];

  for (const currTerm of sorted) {
    if (currTerm.semester_type !== "1st") continue;
    const currAy = parseAcademicYear(currTerm.academic_year);
    if (!currAy) continue;

    const prevAyStr = `${currAy.start - 1}-${currAy.start}`;
    const prevTerm = sorted.find(
      (t) => t.academic_year === prevAyStr && t.semester_type === "2nd"
    );
    if (!prevTerm) continue;

    const prevStats = computeTermStats(prevTerm);
    const currStats = computeTermStats(currTerm);
    const combinedStats = computeEntriesStats([
      ...prevTerm.entries,
      ...currTerm.entries,
    ]);

    const yearLevelOk = currTerm.year_level >= 2;
    const unitsOk =
      prevStats.academicUnits >= 15 && currStats.academicUnits >= 15;
    const noDisqualifyingMarks = combinedStats.disqualifyingEntries.length === 0;
    const minGradeOk =
      noDisqualifyingMarks &&
      combinedStats.lowestNumericGrade !== null &&
      combinedStats.lowestNumericGrade <= 2.0;

    const gwa = combinedStats.roundedGwa;
    const isPresidents = gwa !== null && gwa >= 1.0 && gwa <= 1.2;
    const isDeans = gwa !== null && gwa >= 1.21 && gwa <= 1.75;

    let status: GoldGearAwardStatus = "ineligible";
    let awardLabel = "Not Eligible";

    if (yearLevelOk && unitsOk && minGradeOk && isPresidents) {
      status = "presidents_list";
      awardLabel = "President's List Award";
    } else if (yearLevelOk && unitsOk && minGradeOk && isDeans) {
      status = "deans_list";
      awardLabel = "Dean's List Award";
    }

    const checklist: GoldGearChecklistItem[] = [
      {
        label: "2nd Year to Senior Year",
        passed: yearLevelOk,
        detail: `${formatYearLevel(currTerm.year_level)} in ${currTerm.academic_year} 1st Sem`,
      },
      {
        label: "Min. 15 academic units per semester",
        passed: unitsOk,
        detail: `${prevStats.academicUnits} units (${prevTerm.academic_year} 2nd) & ${currStats.academicUnits} units (${currTerm.academic_year} 1st)`,
      },
      {
        label: "No grade lower than 2.00 in any subject",
        passed: minGradeOk,
        detail: !noDisqualifyingMarks
          ? `Has disqualifying mark(s): ${combinedStats.disqualifyingEntries
              .map((e) => `${e.course_code} (${e.grade_value})`)
              .join(", ")}`
          : combinedStats.lowestNumericGrade !== null
            ? `Lowest grade: ${combinedStats.lowestNumericGrade.toFixed(2)}${
                combinedStats.lowestGradeCourse
                  ? ` (${combinedStats.lowestGradeCourse})`
                  : ""
              }`
            : "No numeric grades recorded",
      },
      {
        label: "Combined GWA within 1.00–1.75",
        passed: isPresidents || isDeans,
        detail:
          gwa !== null
            ? `${formatGwa(combinedStats.rawGwa, 4)} (rounded ${gwa.toFixed(2)})`
            : "No graded academic subjects yet",
      },
    ];

    const warnings: string[] = [];
    if (combinedStats.warningEntries.length > 0) {
      warnings.push(
        `Contains ${combinedStats.warningEntries
          .map((e) => `${e.course_code} (${e.grade_value})`)
          .join(", ")} — excluded from GWA calculation.`
      );
    }
    if (!unitsOk) {
      warnings.push(
        "If your regular curriculum prescribes fewer than 15 academic units, verify eligibility with your college."
      );
    }

    pairs.push({
      prevTerm,
      currTerm,
      status,
      awardLabel,
      combinedRawGwa: combinedStats.rawGwa,
      combinedRoundedGwa: combinedStats.roundedGwa,
      prevAcademicUnits: prevStats.academicUnits,
      currAcademicUnits: currStats.academicUnits,
      lowestNumericGrade: combinedStats.lowestNumericGrade,
      checklist,
      warnings,
    });
  }

  const latestPair = pairs.length > 0 ? pairs[pairs.length - 1] : null;
  const hint = latestPair
    ? `Evaluated on ${latestPair.prevTerm.academic_year} 2nd Sem + ${latestPair.currTerm.academic_year} 1st Sem.`
    : "Add a consecutive pair (2nd Semester of the preceding AY + 1st Semester of the current AY) to evaluate Gold Gear Awards.";

  return {
    latestPair,
    allPairs: pairs,
    hint,
  };
}

// ============================================================================
// 2. BulSU Latin Honor Basis Evaluator
// ============================================================================

export type LatinHonorStanding =
  | "summa_cum_laude"
  | "magna_cum_laude"
  | "cum_laude"
  | "not_qualified"
  | "no_data";

export interface LatinHonorTierStatus {
  tier: "summa_cum_laude" | "magna_cum_laude" | "cum_laude";
  label: string;
  gwaRange: string;
  minGradeAllowed: number;
  gwaMet: boolean;
  minGradeMet: boolean;
  qualified: boolean;
}

export interface LatinHonorEvaluation {
  standing: LatinHonorStanding;
  standingLabel: string;
  cumulativeStats: GradeStats;
  tiers: LatinHonorTierStatus[];
  warnings: string[];
  disqualificationReason: string | null;
}

export function evaluateLatinHonors(
  terms: GradeTermWithEntries[]
): LatinHonorEvaluation {
  const allEntries = terms.flatMap((t) => t.entries);
  const cumulativeStats = computeEntriesStats(allEntries);
  const gwa = cumulativeStats.roundedGwa;
  const lowest = cumulativeStats.lowestNumericGrade;
  const hasDisqualifyingMark = cumulativeStats.disqualifyingEntries.length > 0;

  const checkMinGrade = (maxAllowed: number) =>
    !hasDisqualifyingMark && lowest !== null && lowest <= maxAllowed;

  const summaGwa = gwa !== null && gwa >= 1.0 && gwa <= 1.2;
  const summaMin = checkMinGrade(2.0);

  const magnaGwa = gwa !== null && gwa >= 1.0 && gwa <= 1.45;
  const magnaMin = checkMinGrade(2.25);

  const cumGwa = gwa !== null && gwa >= 1.0 && gwa <= 1.75;
  const cumMin = checkMinGrade(2.5);

  const tiers: LatinHonorTierStatus[] = [
    {
      tier: "summa_cum_laude",
      label: "Summa Cum Laude",
      gwaRange: "1.00–1.20",
      minGradeAllowed: 2.0,
      gwaMet: summaGwa,
      minGradeMet: summaMin,
      qualified: summaGwa && summaMin,
    },
    {
      tier: "magna_cum_laude",
      label: "Magna Cum Laude",
      gwaRange: "1.21–1.45",
      minGradeAllowed: 2.25,
      gwaMet: magnaGwa,
      minGradeMet: magnaMin,
      qualified: magnaGwa && magnaMin,
    },
    {
      tier: "cum_laude",
      label: "Cum Laude",
      gwaRange: "1.46–1.75",
      minGradeAllowed: 2.5,
      gwaMet: cumGwa,
      minGradeMet: cumMin,
      qualified: cumGwa && cumMin,
    },
  ];

  let standing: LatinHonorStanding = "no_data";
  let standingLabel = "No Grades Yet";
  let disqualificationReason: string | null = null;

  if (gwa !== null) {
    if (tiers[0].qualified) {
      standing = "summa_cum_laude";
      standingLabel = "Summa Cum Laude";
    } else if (tiers[1].qualified) {
      standing = "magna_cum_laude";
      standingLabel = "Magna Cum Laude";
    } else if (tiers[2].qualified) {
      standing = "cum_laude";
      standingLabel = "Cum Laude";
    } else {
      standing = "not_qualified";
      standingLabel = "Not Currently Qualified";
      if (hasDisqualifyingMark) {
        disqualificationReason = `Disqualifying mark(s) recorded: ${cumulativeStats.disqualifyingEntries
          .map((e) => `${e.course_code} (${e.grade_value})`)
          .join(", ")}.`;
      } else if (lowest !== null && lowest > 2.5) {
        disqualificationReason = `Lowest grade is ${lowest.toFixed(2)} (${
          cumulativeStats.lowestGradeCourse ?? "subject"
        }), which is lower than the 2.50 threshold.`;
      } else if (gwa > 1.75) {
        disqualificationReason = `Cumulative GWA (${gwa.toFixed(2)}) is above the 1.75 cutoff.`;
      }
    }
  }

  const warnings: string[] = [];
  if (cumulativeStats.warningEntries.length > 0) {
    warnings.push(
      `Contains ${cumulativeStats.warningEntries
        .map((e) => `${e.course_code} (${e.grade_value})`)
        .join(", ")} — excluded from GWA calculation.`
    );
  }

  return {
    standing,
    standingLabel,
    cumulativeStats,
    tiers,
    warnings,
    disqualificationReason,
  };
}
