-- ============================================================================
-- Migration 006: Structured College, Program, Section & Specialization
-- Paste into Supabase Dashboard -> SQL Editor and click Run.
-- Safe to run on an existing database (idempotent, preserves all data).
-- ============================================================================

alter table public.sections
  add column if not exists college_code text,
  add column if not exists program_code text,
  add column if not exists section_name text,
  add column if not exists specialization text;

create index if not exists sections_college_program_idx
  on public.sections (semester_id, college_code, program_code);

-- Auto-backfill existing rows whose `code` starts with a known program code
-- (e.g. "BSIS 2B-G2" -> CICT / BSIS / 2B-G2, "BSIT 3A-G1 DBA" -> CICT / BSIT / 3A-G1 / DBA).
-- Unrecognized legacy codes remain untouched (college_code = null) and are flagged in Admin.
with catalog(match_code, program_code, college_code) as (
  values
    -- CAFA
    ('BFA-VC', 'BFA-VC', 'CAFA'),
    ('BLA', 'BLA', 'CAFA'),
    ('BSARCH', 'BSArch', 'CAFA'),
    ('BSARC', 'BSArch', 'CAFA'),
    -- CAL
    ('BAB', 'BAB', 'CAL'),
    ('BAJ', 'BAJ', 'CAL'),
    ('BPEA', 'BPeA', 'CAL'),
    ('BSMP', 'BSMP', 'CAL'),
    -- CBEA
    ('BSA', 'BSA', 'CBEA'),
    ('BSBA-BE', 'BSBA-BE', 'CBEA'),
    ('BSBA-FM', 'BSBA-FM', 'CBEA'),
    ('BSBA-MM', 'BSBA-MM', 'CBEA'),
    ('BSENTREP', 'BSEntrep', 'CBEA'),
    -- CCJE
    ('BALM', 'BALM', 'CCJE'),
    ('BSCRIM', 'BSCrim', 'CCJE'),
    -- CHTM
    ('BSHM', 'BSHM', 'CHTM'),
    ('BSTM', 'BSTM', 'CHTM'),
    -- CICT
    ('BLIS', 'BLIS', 'CICT'),
    ('BSIS', 'BSIS', 'CICT'),
    ('BSIT', 'BSIT', 'CICT'),
    -- CIT
    ('BIT-AUTO', 'BIT-Auto', 'CIT'),
    ('BIT-COMP', 'BIT-Comp', 'CIT'),
    ('BIT-DRAFT', 'BIT-Draft', 'CIT'),
    ('BIT-ELEC', 'BIT-Elec', 'CIT'),
    ('BIT-ECT', 'BIT-ECT', 'CIT'),
    ('BIT-ET', 'BIT-ET', 'CIT'),
    ('BIT-FPT', 'BIT-FPT', 'CIT'),
    ('BIT-HVACR', 'BIT-HVACR', 'CIT'),
    ('BIT-MECH', 'BIT-Mech', 'CIT'),
    ('BIT-MECHA', 'BIT-Mecha', 'CIT'),
    ('BIT-WELD', 'BIT-Weld', 'CIT'),
    -- CLaw
    ('LLB', 'LLB', 'CLaw'),
    ('JD', 'JD', 'CLaw'),
    -- CN
    ('BSN', 'BSN', 'CN'),
    -- COE
    ('BSCE', 'BSCE', 'COE'),
    ('BSCPE', 'BSCpE', 'COE'),
    ('BSEE', 'BSEE', 'COE'),
    ('BSECE', 'BSECE', 'COE'),
    ('BSIE', 'BSIE', 'COE'),
    ('BSMFGE', 'BSMfgE', 'COE'),
    ('BSME', 'BSME', 'COE'),
    ('BSMECE', 'BSMecE', 'COE'),
    -- CPTED
    ('BECED', 'BECEd', 'CPTED'),
    ('BEED', 'BEEd', 'CPTED'),
    ('BPED', 'BPEd', 'CPTED'),
    ('BSED-ENG', 'BSEd-Eng', 'CPTED'),
    ('BSED-FIL', 'BSEd-Fil', 'CPTED'),
    ('BSED-MATH', 'BSEd-Math', 'CPTED'),
    ('BSED-SCI', 'BSEd-Sci', 'CPTED'),
    ('BSED-SS', 'BSEd-SS', 'CPTED'),
    ('BSED-VALED', 'BSEd-ValEd', 'CPTED'),
    ('BTLED-HE', 'BTLEd-HE', 'CPTED'),
    ('BTLED-IA', 'BTLEd-IA', 'CPTED'),
    ('BTLED-ICT', 'BTLEd-ICT', 'CPTED'),
    -- CS
    ('BSBIO', 'BSBio', 'CS'),
    ('BSES', 'BSES', 'CS'),
    ('BSFT', 'BSFT', 'CS'),
    ('BSMATH-AS', 'BSMath-AS', 'CS'),
    ('BSMATH-BA', 'BSMath-BA', 'CS'),
    ('BSMATH-CS', 'BSMath-CS', 'CS'),
    -- CSER
    ('BSESS-FSC', 'BSESS-FSC', 'CSER'),
    ('BSESS-FSM', 'BSESS-FSM', 'CSER'),
    ('CPE', 'CPE', 'CSER'),
    -- CSSP
    ('BPA', 'BPA', 'CSSP'),
    ('BSPSYCH', 'BSPsych', 'CSSP'),
    ('BSSW', 'BSSW', 'CSSP')
),
parsed as (
  select
    s.id,
    c.college_code,
    c.program_code,
    nullif(
      upper(split_part(regexp_replace(trim(s.code), '\s+', ' ', 'g'), ' ', 2)),
      ''
    ) as parsed_section_name,
    nullif(
      upper(
        trim(
          substring(
            regexp_replace(trim(s.code), '\s+', ' ', 'g')
            from '^\S+\s+\S+\s+(.*)$'
          )
        )
      ),
      ''
    ) as parsed_specialization
  from public.sections s
  join catalog c
    on upper(split_part(regexp_replace(trim(s.code), '\s+', ' ', 'g'), ' ', 1)) = c.match_code
  where s.college_code is null
    and s.program_code is null
)
update public.sections s
set
  college_code = p.college_code,
  program_code = p.program_code,
  section_name = coalesce(s.section_name, p.parsed_section_name),
  specialization = coalesce(s.specialization, p.parsed_specialization)
from parsed p
where s.id = p.id
  and p.parsed_section_name is not null;
