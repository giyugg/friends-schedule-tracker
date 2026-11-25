-- ============================================================================
-- Friends College Schedule Tracker — Supabase Schema & RLS Policies
-- Paste this entire file into your Supabase Dashboard -> SQL Editor and Run.
-- ============================================================================

-- 1. Tables
-- ----------------------------------------------------------------------------

create table if not exists public.semesters (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enforce at most one active semester at a time
create unique index if not exists semesters_single_active_idx
  on public.semesters (is_active)
  where is_active = true;

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid not null references public.semesters(id) on delete cascade,
  code text not null,
  college_code text,
  program_code text,
  section_name text,
  specialization text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (semester_id, code)
);

create index if not exists sections_semester_order_idx
  on public.sections (semester_id, display_order, code);

create index if not exists sections_college_program_idx
  on public.sections (semester_id, college_code, program_code);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  must_change_password boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.section_members (
  section_id uuid not null references public.sections(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (section_id, user_id)
);

create index if not exists section_members_user_idx
  on public.section_members (user_id);

create table if not exists public.schedule_entries (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 1 and 6),
  start_time time not null,
  end_time time not null,
  course_code text not null,
  instructor text,
  location text,
  category text not null default 'major'
    check (category in ('major', 'minor', 'internship', 'other')),
  modality text not null default 'online'
    check (modality in ('ftf', 'online', 'hybrid')),
  color_override text
    check (
      color_override is null
      or color_override in ('coral', 'blush', 'amber', 'cream', 'sage', 'sky', 'lavender')
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedule_time_range_chk check (
    end_time > start_time
    and start_time >= time '07:00:00'
    and end_time <= time '20:00:00'
  )
);

create index if not exists schedule_entries_section_day_idx
  on public.schedule_entries (section_id, day_of_week, start_time);

-- 2. Helper Functions & Triggers
-- ----------------------------------------------------------------------------

-- Check whether the current authenticated user is an admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- Automatically create a profile whenever a user is created in auth.users.
-- Auto-promotes 2025009221@ms.bulsu.edu.ph to admin!
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_bootstrap_admin boolean;
  meta_name text;
  meta_role text;
  meta_must_change boolean;
begin
  is_bootstrap_admin := lower(coalesce(new.email, '')) = '2025009221@ms.bulsu.edu.ph';

  meta_name := nullif(trim(coalesce(new.raw_user_meta_data->>'display_name', '')), '');
  if meta_name is null then
    meta_name := split_part(coalesce(new.email, 'Friend'), '@', 1);
  end if;

  if is_bootstrap_admin then
    meta_role := 'admin';
    meta_must_change := false;
  else
    meta_role := case
      when (new.raw_user_meta_data->>'role') = 'admin' then 'admin'
      else 'member'
    end;
    meta_must_change := coalesce(
      (new.raw_user_meta_data->>'must_change_password')::boolean,
      true
    );
  end if;

  insert into public.profiles (id, email, display_name, role, must_change_password)
  values (new.id, lower(new.email), meta_name, meta_role, meta_must_change)
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(nullif(public.profiles.display_name, ''), excluded.display_name),
        role = case
          when lower(excluded.email) = '2025009221@ms.bulsu.edu.ph' then 'admin'
          else public.profiles.role
        end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent non-admin users from escalating their own role
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role then
    if auth.uid() is not null and not public.is_admin() then
      raise exception 'Only admins can change user roles.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_escalation on public.profiles;
create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- Keep updated_at current on schedule_entries
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists schedule_entries_set_updated_at on public.schedule_entries;
create trigger schedule_entries_set_updated_at
  before update on public.schedule_entries
  for each row execute function public.set_updated_at();

-- 3. Row Level Security (RLS)
-- ----------------------------------------------------------------------------

alter table public.semesters enable row level security;
alter table public.sections enable row level security;
alter table public.profiles enable row level security;
alter table public.section_members enable row level security;
alter table public.schedule_entries enable row level security;

-- semesters
drop policy if exists "Authenticated users can view semesters" on public.semesters;
create policy "Authenticated users can view semesters"
  on public.semesters for select
  to authenticated
  using (true);

drop policy if exists "Admins can manage semesters" on public.semesters;
create policy "Admins can manage semesters"
  on public.semesters for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- sections
drop policy if exists "Authenticated users can view sections" on public.sections;
create policy "Authenticated users can view sections"
  on public.sections for select
  to authenticated
  using (true);

drop policy if exists "Admins can manage sections" on public.sections;
create policy "Admins can manage sections"
  on public.sections for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- profiles
drop policy if exists "Authenticated users can view profiles" on public.profiles;
create policy "Authenticated users can view profiles"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Users can update own profile or admins can update any" on public.profiles;
create policy "Users can update own profile or admins can update any"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "Admins can insert profiles" on public.profiles;
create policy "Admins can insert profiles"
  on public.profiles for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles"
  on public.profiles for delete
  to authenticated
  using (public.is_admin());

-- section_members
drop policy if exists "Authenticated users can view section members" on public.section_members;
create policy "Authenticated users can view section members"
  on public.section_members for select
  to authenticated
  using (true);

drop policy if exists "Admins can manage section members" on public.section_members;
create policy "Admins can manage section members"
  on public.section_members for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- schedule_entries
drop policy if exists "Authenticated users can view schedules" on public.schedule_entries;
create policy "Authenticated users can view schedules"
  on public.schedule_entries for select
  to authenticated
  using (true);

drop policy if exists "Admins can manage schedules" on public.schedule_entries;
create policy "Admins can manage schedules"
  on public.schedule_entries for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- 4. Directory Groups (Circles of Friends & Organizations)
-- ----------------------------------------------------------------------------

create table if not exists public.visibility_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type text not null default 'circle'
    check (type in ('circle', 'organization')),
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.visibility_group_members (
  group_id uuid not null references public.visibility_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_label text,
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index if not exists visibility_group_members_user_idx
  on public.visibility_group_members (user_id);

create or replace function public.can_view_user(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or auth.uid() = target_user_id
    or exists (
      select 1
      from public.section_members sm1
      join public.section_members sm2 on sm1.section_id = sm2.section_id
      where sm1.user_id = auth.uid()
        and sm2.user_id = target_user_id
    )
    or exists (
      select 1
      from public.visibility_group_members gm1
      join public.visibility_group_members gm2 on gm1.group_id = gm2.group_id
      where gm1.user_id = auth.uid()
        and gm2.user_id = target_user_id
    );
$$;

create or replace function public.can_view_section(target_section_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.section_members sm
      where sm.section_id = target_section_id
        and public.can_view_user(sm.user_id)
    );
$$;

create or replace function public.is_group_member(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.visibility_group_members
    where group_id = target_group_id
      and user_id = auth.uid()
  );
$$;

alter table public.visibility_groups enable row level security;
alter table public.visibility_group_members enable row level security;

drop policy if exists "Users can view their groups" on public.visibility_groups;
create policy "Users can view their groups"
  on public.visibility_groups for select
  to authenticated
  using (
    public.is_admin()
    or public.is_group_member(id)
  );

drop policy if exists "Admins can manage visibility groups" on public.visibility_groups;
create policy "Admins can manage visibility groups"
  on public.visibility_groups for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Users can view members of their groups" on public.visibility_group_members;
create policy "Users can view members of their groups"
  on public.visibility_group_members for select
  to authenticated
  using (
    public.is_admin()
    or public.is_group_member(group_id)
  );

drop policy if exists "Admins can manage group members" on public.visibility_group_members;
create policy "Admins can manage group members"
  on public.visibility_group_members for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Authenticated users can view profiles" on public.profiles;
drop policy if exists "Users can view visible profiles" on public.profiles;
create policy "Users can view visible profiles"
  on public.profiles for select
  to authenticated
  using (public.can_view_user(id));

drop policy if exists "Authenticated users can view section members" on public.section_members;
drop policy if exists "Users can view visible section members" on public.section_members;
create policy "Users can view visible section members"
  on public.section_members for select
  to authenticated
  using (public.can_view_user(user_id));

drop policy if exists "Authenticated users can view sections" on public.sections;
drop policy if exists "Users can view visible sections" on public.sections;
create policy "Users can view visible sections"
  on public.sections for select
  to authenticated
  using (public.can_view_section(id));

drop policy if exists "Authenticated users can view schedules" on public.schedule_entries;
drop policy if exists "Users can view visible schedules" on public.schedule_entries;
create policy "Users can view visible schedules"
  on public.schedule_entries for select
  to authenticated
  using (public.can_view_section(section_id));


-- 5. Private Grades, Lock Immutability & Academic Honors
-- ----------------------------------------------------------------------------

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

drop trigger if exists grade_terms_set_updated_at on public.grade_terms;
create trigger grade_terms_set_updated_at
  before update on public.grade_terms
  for each row execute function public.set_updated_at();

drop trigger if exists grade_entries_set_updated_at on public.grade_entries;
create trigger grade_entries_set_updated_at
  before update on public.grade_entries
  for each row execute function public.set_updated_at();

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


-- 6. Profile Change Requests & Admin Approval
-- ----------------------------------------------------------------------------

create table if not exists public.profile_change_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  current_display_name text not null,
  requested_display_name text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  review_note text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profile_change_requests_one_pending_idx
  on public.profile_change_requests (user_id)
  where status = 'pending';

create index if not exists profile_change_requests_status_created_idx
  on public.profile_change_requests (status, created_at desc);

create index if not exists profile_change_requests_user_created_idx
  on public.profile_change_requests (user_id, created_at desc);

drop trigger if exists profile_change_requests_set_updated_at on public.profile_change_requests;
create trigger profile_change_requests_set_updated_at
  before update on public.profile_change_requests
  for each row execute function public.set_updated_at();

create or replace function public.prevent_direct_display_name_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.display_name is distinct from new.display_name then
    if auth.uid() is not null and not public.is_admin() then
      raise exception 'Display name changes require admin approval.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_direct_name_change on public.profiles;
create trigger profiles_prevent_direct_name_change
  before update on public.profiles
  for each row execute function public.prevent_direct_display_name_change();

alter table public.profile_change_requests enable row level security;

drop policy if exists "Users can view own profile requests or admins can view all" on public.profile_change_requests;
create policy "Users can view own profile requests or admins can view all"
  on public.profile_change_requests for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can create own pending profile requests" on public.profile_change_requests;
create policy "Users can create own pending profile requests"
  on public.profile_change_requests for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and status = 'pending'
  );

drop policy if exists "Users can cancel own pending profile requests" on public.profile_change_requests;
create policy "Users can cancel own pending profile requests"
  on public.profile_change_requests for update
  to authenticated
  using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id and status = 'cancelled');

drop policy if exists "Admins can review profile requests" on public.profile_change_requests;
create policy "Admins can review profile requests"
  on public.profile_change_requests for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete profile requests" on public.profile_change_requests;
create policy "Admins can delete profile requests"
  on public.profile_change_requests for delete
  to authenticated
  using (public.is_admin());
