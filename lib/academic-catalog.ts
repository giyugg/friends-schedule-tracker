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

export function sortSections<
  T extends Pick<
    Section,
    "code" | "college_code" | "program_code" | "section_name" | "specialization"
  >,
>(sections: readonly T[]): T[] {
  return [...sections].sort(compareSections);
}
