import type { Section } from "./types";

export interface AcademicProgram {
  code: string;
  name: string;
  commonSpecializations?: string[];
}

export interface AcademicCollege {
  code: string;
  name: string;
  programs: AcademicProgram[];
}

export const COLLEGES: readonly AcademicCollege[] = [
  {
    code: "CAFA",
    name: "College of Architecture and Fine Arts",
    programs: [
      {
        code: "BFA-VC",
        name: "Bachelor of Fine Arts Major in Visual Communication",
      },
      {
        code: "BLA",
        name: "Bachelor of Landscape Architecture",
      },
      {
        code: "BSArch",
        name: "Bachelor of Science in Architecture",
      },
    ],
  },
  {
    code: "CAL",
    name: "College of Arts and Letters",
    programs: [
      {
        code: "BAB",
        name: "Bachelor of Arts in Broadcasting",
      },
      {
        code: "BAJ",
        name: "Bachelor of Arts in Journalism",
      },
      {
        code: "BPeA",
        name: "Bachelor of Performing Arts (Theater Track)",
      },
      {
        code: "BSMP",
        name: "Batsilyer ng Sining sa Malikhaing Pagsulat",
      },
    ],
  },
  {
    code: "CBEA",
    name: "College of Business Education and Accountancy",
    programs: [
      {
        code: "BSA",
        name: "Bachelor of Science in Accountancy",
      },
      {
        code: "BSBA-BE",
        name: "Bachelor of Science in Business Administration Major in Business Economics",
      },
      {
        code: "BSBA-FM",
        name: "Bachelor of Science in Business Administration Major in Financial Management",
      },
      {
        code: "BSBA-MM",
        name: "Bachelor of Science in Business Administration Major in Marketing Management",
      },
      {
        code: "BSEntrep",
        name: "Bachelor of Science in Entrepreneurship",
      },
    ],
  },
  {
    code: "CCJE",
    name: "College of Criminal Justice Education",
    programs: [
      {
        code: "BALM",
        name: "Bachelor of Arts in Legal Management",
      },
      {
        code: "BSCrim",
        name: "Bachelor of Science in Criminology",
      },
    ],
  },
  {
    code: "CHTM",
    name: "College of Hospitality and Tourism Management",
    programs: [
      {
        code: "BSHM",
        name: "Bachelor of Science in Hospitality Management",
      },
      {
        code: "BSTM",
        name: "Bachelor of Science in Tourism Management",
      },
    ],
  },
  {
    code: "CICT",
    name: "College of Information and Communications Technology",
    programs: [
      {
        code: "BLIS",
        name: "Bachelor of Library and Information Science",
      },
      {
        code: "BSIS",
        name: "Bachelor of Science in Information System",
      },
      {
        code: "BSIT",
        name: "Bachelor of Science in Information Technology",
        commonSpecializations: ["DBA", "WMD", "BA"],
      },
    ],
  },
  {
    code: "CIT",
    name: "College of Industrial Technology",
    programs: [
      {
        code: "BIT-Auto",
        name: "Bachelor of Industrial Technology with specialization in Automotive",
      },
      {
        code: "BIT-Comp",
        name: "Bachelor of Industrial Technology with specialization in Computer",
      },
      {
        code: "BIT-Draft",
        name: "Bachelor of Industrial Technology with specialization in Drafting",
      },
      {
        code: "BIT-Elec",
        name: "Bachelor of Industrial Technology with specialization in Electrical",
      },
      {
        code: "BIT-ECT",
        name: "Bachelor of Industrial Technology with specialization in Electronics & Communication Technology",
      },
      {
        code: "BIT-ET",
        name: "Bachelor of Industrial Technology with specialization in Electronics Technology",
      },
      {
        code: "BIT-FPT",
        name: "Bachelor of Industrial Technology with specialization in Food Processing Technology",
      },
      {
        code: "BIT-HVACR",
        name: "Bachelor of Industrial Technology with specialization in Heating, Ventilation, Air Conditioning and Refrigeration Technology (HVACR)",
      },
      {
        code: "BIT-Mech",
        name: "Bachelor of Industrial Technology with specialization in Mechanical",
      },
      {
        code: "BIT-Mecha",
        name: "Bachelor of Industrial Technology with specialization in Mechatronics Technology",
      },
      {
        code: "BIT-Weld",
        name: "Bachelor of Industrial Technology with specialization in Welding Technology",
      },
    ],
  },
  {
    code: "CLaw",
    name: "College of Law",
    programs: [
      {
        code: "LLB",
        name: "Bachelor of Laws",
      },
      {
        code: "JD",
        name: "Juris Doctor",
      },
    ],
  },
  {
    code: "CN",
    name: "College of Nursing",
    programs: [
      {
        code: "BSN",
        name: "Bachelor of Science in Nursing",
      },
    ],
  },
  {
    code: "COE",
    name: "College of Engineering",
    programs: [
      {
        code: "BSCE",
        name: "Bachelor of Science in Civil Engineering",
      },
      {
        code: "BSCpE",
        name: "Bachelor of Science in Computer Engineering",
      },
      {
        code: "BSEE",
        name: "Bachelor of Science in Electrical Engineering",
      },
      {
        code: "BSECE",
        name: "Bachelor of Science in Electronics Engineering",
      },
      {
        code: "BSIE",
        name: "Bachelor of Science in Industrial Engineering",
      },
      {
        code: "BSMfgE",
        name: "Bachelor of Science in Manufacturing Engineering",
      },
      {
        code: "BSME",
        name: "Bachelor of Science in Mechanical Engineering",
      },
      {
        code: "BSMecE",
        name: "Bachelor of Science in Mechatronics Engineering",
      },
    ],
  },
  {
    code: "CPTED",
    name: "College of Professional Teacher Education",
    programs: [
      {
        code: "BECEd",
        name: "Bachelor of Early Childhood Education",
      },
      {
        code: "BEEd",
        name: "Bachelor of Elementary Education",
      },
      {
        code: "BPEd",
        name: "Bachelor of Physical Education",
      },
      {
        code: "BSEd-Eng",
        name: "Bachelor of Secondary Education Major in English minor in Mandarin",
      },
      {
        code: "BSEd-Fil",
        name: "Bachelor of Secondary Education Major in Filipino",
      },
      {
        code: "BSEd-Math",
        name: "Bachelor of Secondary Education Major in Mathematics",
      },
      {
        code: "BSEd-Sci",
        name: "Bachelor of Secondary Education Major in Sciences",
      },
      {
        code: "BSEd-SS",
        name: "Bachelor of Secondary Education Major in Social Studies",
      },
      {
        code: "BSEd-ValEd",
        name: "Bachelor of Secondary Education Major in Values Education",
      },
      {
        code: "BTLEd-HE",
        name: "Bachelor of Technology and Livelihood Education Major in Home Economics",
      },
      {
        code: "BTLEd-IA",
        name: "Bachelor of Technology and Livelihood Education Major in Industrial Arts",
      },
      {
        code: "BTLEd-ICT",
        name: "Bachelor of Technology and Livelihood Education Major in Information and Communication Technology",
      },
    ],
  },
  {
    code: "CS",
    name: "College of Science",
    programs: [
      {
        code: "BSBio",
        name: "Bachelor of Science in Biology",
      },
      {
        code: "BSES",
        name: "Bachelor of Science in Environmental Science",
      },
      {
        code: "BSFT",
        name: "Bachelor of Science in Food Technology",
      },
      {
        code: "BSMath-AS",
        name: "Bachelor of Science in Math with Specialization in Applied Statistics",
      },
      {
        code: "BSMath-BA",
        name: "Bachelor of Science in Math with Specialization in Business Applications",
      },
      {
        code: "BSMath-CS",
        name: "Bachelor of Science in Math with Specialization in Computer Science",
      },
    ],
  },
  {
    code: "CSER",
    name: "College of Sports, Exercise and Recreation",
    programs: [
      {
        code: "BSESS-FSC",
        name: "Bachelor of Science in Exercise and Sports Sciences with specialization in Fitness and Sports Coaching",
      },
      {
        code: "BSESS-FSM",
        name: "Bachelor of Science in Exercise and Sports Sciences with specialization in Fitness and Sports Management",
      },
      {
        code: "CPE",
        name: "Certificate of Physical Education",
      },
    ],
  },
  {
    code: "CSSP",
    name: "College of Social Sciences and Philosophy",
    programs: [
      {
        code: "BPA",
        name: "Bachelor of Public Administration",
      },
      {
        code: "BSPsych",
        name: "Bachelor of Science in Psychology",
      },
      {
        code: "BSSW",
        name: "Bachelor of Science in Social Work",
      },
    ],
  },
] as const;

const COLLEGE_BY_CODE = new Map<string, AcademicCollege>(
  COLLEGES.map((college) => [college.code.toUpperCase(), college])
);

const PROGRAM_BY_CODE = new Map<
  string,
  { college: AcademicCollege; program: AcademicProgram }
>();

for (const college of COLLEGES) {
  for (const program of college.programs) {
    PROGRAM_BY_CODE.set(program.code.toUpperCase(), { college, program });
  }
}

export function getCollegeByCode(
  code: string | null | undefined
): AcademicCollege | null {
  if (!code) return null;
  return COLLEGE_BY_CODE.get(code.trim().toUpperCase()) ?? null;
}

export function getProgramEntryByCode(
  code: string | null | undefined
): { college: AcademicCollege; program: AcademicProgram } | null {
  if (!code) return null;
  return PROGRAM_BY_CODE.get(code.trim().toUpperCase()) ?? null;
}

export function getProgramsByCollege(
  collegeCode: string | null | undefined
): readonly AcademicProgram[] {
  return getCollegeByCode(collegeCode)?.programs ?? [];
}

export function normalizeSectionName(sectionName: string): string {
  return sectionName.trim().replace(/\s+/g, " ").toUpperCase();
}

export function normalizeSpecialization(
  specialization: string | null | undefined
): string | null {
  if (!specialization) return null;
  const normalized = specialization.trim().replace(/\s+/g, " ").toUpperCase();
  return normalized.length > 0 ? normalized : null;
}

export function composeSectionCode(
  programCode: string,
  sectionName: string,
  specialization?: string | null
): string {
  const canonicalProgram =
    getProgramEntryByCode(programCode)?.program.code ?? programCode.trim();
  const normalizedSection = normalizeSectionName(sectionName);
  const normalizedSpec = normalizeSpecialization(specialization);

  return [canonicalProgram, normalizedSection, normalizedSpec]
    .filter((part): part is string => Boolean(part))
    .join(" ");
}

export interface SectionAcademicInfo {
  college: AcademicCollege | null;
  program: AcademicProgram | null;
  sectionName: string | null;
  specialization: string | null;
  isAssigned: boolean;
}

export function getSectionAcademicInfo(
  section: Pick<
    Section,
    "college_code" | "program_code" | "section_name" | "specialization"
  >
): SectionAcademicInfo {
  const programEntry = getProgramEntryByCode(section.program_code);
  const college =
    getCollegeByCode(section.college_code) ?? programEntry?.college ?? null;
  const program = programEntry?.program ?? null;

  return {
    college,
    program,
    sectionName: section.section_name ?? null,
    specialization: section.specialization ?? null,
    isAssigned: Boolean(college && program),
  };
}

export function formatSectionTooltip(
  section: Pick<
    Section,
    "code" | "college_code" | "program_code" | "section_name" | "specialization"
  >
): string {
  const info = getSectionAcademicInfo(section);
  if (!info.college || !info.program) {
    return section.code;
  }
  const specSuffix = info.specialization ? ` (${info.specialization})` : "";
  return `${info.college.code} · ${info.program.name}${specSuffix}`;
}

const NATURAL_COLLATOR = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

export function compareSections<
  T extends Pick<
    Section,
    "code" | "college_code" | "program_code" | "section_name" | "specialization"
  >,
>(a: T, b: T): number {
  const infoA = getSectionAcademicInfo(a);
  const infoB = getSectionAcademicInfo(b);

  // Assigned sections always come before unassigned legacy sections
  const assignedA = infoA.college ? 0 : 1;
  const assignedB = infoB.college ? 0 : 1;
  if (assignedA !== assignedB) return assignedA - assignedB;

  if (infoA.college && infoB.college) {
    const collegeCmp = NATURAL_COLLATOR.compare(
      infoA.college.code,
      infoB.college.code
    );
    if (collegeCmp !== 0) return collegeCmp;
  }

  if (infoA.program && infoB.program) {
    const progCmp = NATURAL_COLLATOR.compare(
      infoA.program.code,
      infoB.program.code
    );
    if (progCmp !== 0) return progCmp;
  }

  const secA = infoA.sectionName ?? a.code;
  const secB = infoB.sectionName ?? b.code;
  const secCmp = NATURAL_COLLATOR.compare(secA, secB);
  if (secCmp !== 0) return secCmp;

  // Sections without a specialization come before specialized ones
  const specA = infoA.specialization ?? "";
  const specB = infoB.specialization ?? "";
  if (specA !== specB) {
    if (!specA) return -1;
    if (!specB) return 1;
    const specCmp = NATURAL_COLLATOR.compare(specA, specB);
    if (specCmp !== 0) return specCmp;
  }

  return NATURAL_COLLATOR.compare(a.code, b.code);
}

export interface CollegeTheme {
  badgeClass: string;
  accentBarClass: string;
  dotClass: string;
  borderHoverClass: string;
  avatarClass: string;
  softSurfaceClass: string;
}

const UNASSIGNED_COLLEGE_THEME: CollegeTheme = {
  badgeClass:
    "bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900",
  accentBarClass: "bg-gradient-to-r from-amber-400 to-orange-400",
  dotClass: "bg-amber-500",
  borderHoverClass:
    "hover:border-amber-300/80 dark:hover:border-amber-800/80",
  avatarClass:
    "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/80",
  softSurfaceClass:
    "bg-amber-50/50 dark:bg-amber-950/25 border-amber-200/60 dark:border-amber-900/50",
};

const COLLEGE_THEMES: Record<string, CollegeTheme> = {
  CICT: {
    badgeClass:
      "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-900",
    accentBarClass: "bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400",
    dotClass: "bg-indigo-500",
    borderHoverClass:
      "hover:border-indigo-300/80 dark:hover:border-indigo-800/80",
    avatarClass:
      "bg-indigo-100/90 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-200 border border-indigo-200/80 dark:border-indigo-800/80",
    softSurfaceClass:
      "bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200/60 dark:border-indigo-900/50",
  },
  COE: {
    badgeClass:
      "bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900",
    accentBarClass: "bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400",
    dotClass: "bg-amber-500",
    borderHoverClass:
      "hover:border-amber-300/80 dark:hover:border-amber-800/80",
    avatarClass:
      "bg-amber-100/90 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/80",
    softSurfaceClass:
      "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/50",
  },
  CAFA: {
    badgeClass:
      "bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900",
    accentBarClass: "bg-gradient-to-r from-[#DF7A76] via-rose-500 to-pink-400",
    dotClass: "bg-rose-500",
    borderHoverClass:
      "hover:border-rose-300/80 dark:hover:border-rose-800/80",
    avatarClass:
      "bg-rose-100/90 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-200/80 dark:border-rose-800/80",
    softSurfaceClass:
      "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/50",
  },
  CBEA: {
    badgeClass:
      "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900",
    accentBarClass: "bg-gradient-to-r from-emerald-500 via-teal-500 to-green-400",
    dotClass: "bg-emerald-500",
    borderHoverClass:
      "hover:border-emerald-300/80 dark:hover:border-emerald-800/80",
    avatarClass:
      "bg-emerald-100/90 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800/80",
    softSurfaceClass:
      "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/50",
  },
  CS: {
    badgeClass:
      "bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-900",
    accentBarClass: "bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-400",
    dotClass: "bg-teal-500",
    borderHoverClass:
      "hover:border-teal-300/80 dark:hover:border-teal-800/80",
    avatarClass:
      "bg-teal-100/90 dark:bg-teal-950 text-teal-800 dark:text-teal-200 border border-teal-200/80 dark:border-teal-800/80",
    softSurfaceClass:
      "bg-teal-50/40 dark:bg-teal-950/20 border-teal-200/60 dark:border-teal-900/50",
  },
  CN: {
    badgeClass:
      "bg-pink-50 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 border border-pink-200/80 dark:border-pink-900",
    accentBarClass: "bg-gradient-to-r from-pink-500 via-fuchsia-500 to-rose-400",
    dotClass: "bg-pink-500",
    borderHoverClass:
      "hover:border-pink-300/80 dark:hover:border-pink-800/80",
    avatarClass:
      "bg-pink-100/90 dark:bg-pink-950 text-pink-800 dark:text-pink-200 border border-pink-200/80 dark:border-pink-800/80",
    softSurfaceClass:
      "bg-pink-50/40 dark:bg-pink-950/20 border-pink-200/60 dark:border-pink-900/50",
  },
  CPTED: {
    badgeClass:
      "bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-900",
    accentBarClass: "bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-400",
    dotClass: "bg-sky-500",
    borderHoverClass:
      "hover:border-sky-300/80 dark:hover:border-sky-800/80",
    avatarClass:
      "bg-sky-100/90 dark:bg-sky-950 text-sky-800 dark:text-sky-200 border border-sky-200/80 dark:border-sky-800/80",
    softSurfaceClass:
      "bg-sky-50/40 dark:bg-sky-950/20 border-sky-200/60 dark:border-sky-900/50",
  },
  CAL: {
    badgeClass:
      "bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-900",
    accentBarClass: "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-violet-400",
    dotClass: "bg-purple-500",
    borderHoverClass:
      "hover:border-purple-300/80 dark:hover:border-purple-800/80",
    avatarClass:
      "bg-purple-100/90 dark:bg-purple-950 text-purple-800 dark:text-purple-200 border border-purple-200/80 dark:border-purple-800/80",
    softSurfaceClass:
      "bg-purple-50/40 dark:bg-purple-950/20 border-purple-200/60 dark:border-purple-900/50",
  },
  CIT: {
    badgeClass:
      "bg-orange-50 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border border-orange-200/80 dark:border-orange-900",
    accentBarClass: "bg-gradient-to-r from-orange-500 via-amber-500 to-red-400",
    dotClass: "bg-orange-500",
    borderHoverClass:
      "hover:border-orange-300/80 dark:hover:border-orange-800/80",
    avatarClass:
      "bg-orange-100/90 dark:bg-orange-950 text-orange-800 dark:text-orange-200 border border-orange-200/80 dark:border-orange-800/80",
    softSurfaceClass:
      "bg-orange-50/40 dark:bg-orange-950/20 border-orange-200/60 dark:border-orange-900/50",
  },
  CCJE: {
    badgeClass:
      "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300/80 dark:border-slate-700",
    accentBarClass: "bg-gradient-to-r from-slate-600 via-slate-500 to-zinc-400",
    dotClass: "bg-slate-500",
    borderHoverClass:
      "hover:border-slate-400/80 dark:hover:border-slate-600",
    avatarClass:
      "bg-slate-200/90 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300/80 dark:border-slate-700",
    softSurfaceClass:
      "bg-slate-50/70 dark:bg-slate-900/50 border-slate-200/70 dark:border-slate-800",
  },
  CHTM: {
    badgeClass:
      "bg-yellow-50 dark:bg-yellow-950/80 text-yellow-800 dark:text-yellow-300 border border-yellow-200/80 dark:border-yellow-900",
    accentBarClass: "bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400",
    dotClass: "bg-yellow-500",
    borderHoverClass:
      "hover:border-yellow-300/80 dark:hover:border-yellow-800/80",
    avatarClass:
      "bg-yellow-100/90 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200 border border-yellow-200/80 dark:border-yellow-800/80",
    softSurfaceClass:
      "bg-yellow-50/40 dark:bg-yellow-950/20 border-yellow-200/60 dark:border-yellow-900/50",
  },
  CLAW: {
    badgeClass:
      "bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200/80 dark:border-red-900",
    accentBarClass: "bg-gradient-to-r from-red-600 via-rose-500 to-amber-500",
    dotClass: "bg-red-500",
    borderHoverClass:
      "hover:border-red-300/80 dark:hover:border-red-800/80",
    avatarClass:
      "bg-red-100/90 dark:bg-red-950 text-red-800 dark:text-red-200 border border-red-200/80 dark:border-red-800/80",
    softSurfaceClass:
      "bg-red-50/40 dark:bg-red-950/20 border-red-200/60 dark:border-red-900/50",
  },
  CSER: {
    badgeClass:
      "bg-lime-50 dark:bg-lime-950/80 text-lime-700 dark:text-lime-300 border border-lime-200/80 dark:border-lime-900",
    accentBarClass: "bg-gradient-to-r from-lime-500 via-green-500 to-emerald-400",
    dotClass: "bg-lime-500",
    borderHoverClass:
      "hover:border-lime-300/80 dark:hover:border-lime-800/80",
    avatarClass:
      "bg-lime-100/90 dark:bg-lime-950 text-lime-800 dark:text-lime-200 border border-lime-200/80 dark:border-lime-800/80",
    softSurfaceClass:
      "bg-lime-50/40 dark:bg-lime-950/20 border-lime-200/60 dark:border-lime-900/50",
  },
  CSSP: {
    badgeClass:
      "bg-violet-50 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 border border-violet-200/80 dark:border-violet-900",
    accentBarClass: "bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-400",
    dotClass: "bg-violet-500",
    borderHoverClass:
      "hover:border-violet-300/80 dark:hover:border-violet-800/80",
    avatarClass:
      "bg-violet-100/90 dark:bg-violet-950 text-violet-800 dark:text-violet-200 border border-violet-200/80 dark:border-violet-800/80",
    softSurfaceClass:
      "bg-violet-50/40 dark:bg-violet-950/20 border-violet-200/60 dark:border-violet-900/50",
  },
};

export function getCollegeTheme(
  collegeCode: string | null | undefined
): CollegeTheme {
  if (!collegeCode) return UNASSIGNED_COLLEGE_THEME;
  return (
    COLLEGE_THEMES[collegeCode.trim().toUpperCase()] ?? UNASSIGNED_COLLEGE_THEME
  );
}

export function sortSections<
  T extends Pick<
    Section,
    "code" | "college_code" | "program_code" | "section_name" | "specialization"
  >,
>(sections: readonly T[]): T[] {
  return [...sections].sort(compareSections);
}
