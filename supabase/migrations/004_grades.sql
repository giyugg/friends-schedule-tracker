-- ============================================================================
-- Migration 004: Private Grades, Lock Immutability & Academic Honors
-- Paste into Supabase Dashboard -> SQL Editor and click Run.
-- Safe to run on an existing database (idempotent, preserves all data).
-- ============================================================================

create table if not exists public.grade_terms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  academic_year text not null check (academic_year ~ '^[0-9]{4}-[0-9]{4}$'),
  semester_type text not null check (semester_type in ('1st', '2nd', 'midyear')),
  year_level smallint not null check (year_level between 1 and 6),
  is_locked boolean not null default false,
  locked_at timestamptz,
  last_unlocked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, academic_year, semester_type)
);

create index if not exists grade_terms_user_idx
  on public.grade_terms (user_id, academic_year, semester_type);

create table if not exists public.grade_entries (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references public.grade_terms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_code text not null,
  course_name text not null default '',
  units numeric(4,2) not null default 3 check (units > 0 and units <= 30),
  grade_value text not null check (
    grade_value in (
      '1.00', '1.25', '1.50', '1.75', '2.00', '2.25',
      '2.50', '2.75', '3.00', '4.00', '5.00',
      'FDA', 'INC', 'OG', 'DRP', 'UD'
    )
  ),
  is_academic boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists grade_entries_term_idx
  on public.grade_entries (term_id, display_order, created_at);

create index if not exists grade_entries_user_idx
  on public.grade_entries (user_id);

-- Keep updated_at current
drop trigger if exists grade_terms_set_updated_at on public.grade_terms;
create trigger grade_terms_set_updated_at
  before update on public.grade_terms
  for each row execute function public.set_updated_at();

drop trigger if exists grade_entries_set_updated_at on public.grade_entries;
create trigger grade_entries_set_updated_at
  before update on public.grade_entries
  for each row execute function public.set_updated_at();

-- Enforce DB-level immutability when a term is locked
create or replace function public.prevent_locked_grade_entries_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_term_id uuid;
  term_locked boolean;
begin
  target_term_id := coalesce(new.term_id, old.term_id);

  select is_locked into term_locked
  from public.grade_terms
  where id = target_term_id;

  if coalesce(term_locked, false) then
    raise exception 'This semester is locked. Unlock it first to modify grades.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists grade_entries_prevent_locked_mutation on public.grade_entries;
create trigger grade_entries_prevent_locked_mutation
  before insert or update or delete on public.grade_entries
  for each row execute function public.prevent_locked_grade_entries_mutation();

create or replace function public.prevent_locked_grade_term_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.is_locked then
      raise exception 'This semester is locked. Unlock it first before deleting.';
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' then
    if old.is_locked and new.is_locked then
      if old.academic_year is distinct from new.academic_year
         or old.semester_type is distinct from new.semester_type
         or old.year_level is distinct from new.year_level then
        raise exception 'This semester is locked. Unlock it first to edit semester details.';
      end if;
    end if;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists grade_terms_prevent_locked_mutation on public.grade_terms;
create trigger grade_terms_prevent_locked_mutation
  before update or delete on public.grade_terms
  for each row execute function public.prevent_locked_grade_term_mutation();

-- Strict Row Level Security (private to owning user only)
alter table public.grade_terms enable row level security;
alter table public.grade_entries enable row level security;

drop policy if exists "Users can view own grade terms" on public.grade_terms;
create policy "Users can view own grade terms"
  on public.grade_terms for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own grade terms" on public.grade_terms;
create policy "Users can insert own grade terms"
  on public.grade_terms for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own grade terms" on public.grade_terms;
create policy "Users can update own grade terms"
  on public.grade_terms for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own unlocked grade terms" on public.grade_terms;
create policy "Users can delete own unlocked grade terms"
  on public.grade_terms for delete
  to authenticated
  using (auth.uid() = user_id and is_locked = false);

drop policy if exists "Users can view own grade entries" on public.grade_entries;
create policy "Users can view own grade entries"
  on public.grade_entries for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own unlocked grade entries" on public.grade_entries;
create policy "Users can insert own unlocked grade entries"
  on public.grade_entries for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.grade_terms t
      where t.id = term_id
        and t.user_id = auth.uid()
        and t.is_locked = false
    )
  );

drop policy if exists "Users can update own unlocked grade entries" on public.grade_entries;
create policy "Users can update own unlocked grade entries"
  on public.grade_entries for update
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.grade_terms t
      where t.id = term_id
        and t.user_id = auth.uid()
        and t.is_locked = false
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.grade_terms t
      where t.id = term_id
        and t.user_id = auth.uid()
        and t.is_locked = false
    )
  );

drop policy if exists "Users can delete own unlocked grade entries" on public.grade_entries;
create policy "Users can delete own unlocked grade entries"
  on public.grade_entries for delete
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.grade_terms t
      where t.id = term_id
        and t.user_id = auth.uid()
        and t.is_locked = false
    )
  );
