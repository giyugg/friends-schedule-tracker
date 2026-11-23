-- ============================================================================
-- Migration 002: Directory Groups (Circles of Friends & Organizations)
-- Paste into Supabase Dashboard -> SQL Editor and click Run.
-- Safe to run on an existing database (idempotent, preserves all data).
-- ============================================================================

-- 1. Tables
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
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index if not exists visibility_group_members_user_idx
  on public.visibility_group_members (user_id);

-- 2. Visibility Helper Functions (SECURITY DEFINER avoids RLS recursion)
-- ----------------------------------------------------------------------------

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
      -- Classmates (share at least one section)
      select 1
      from public.section_members sm1
      join public.section_members sm2 on sm1.section_id = sm2.section_id
      where sm1.user_id = auth.uid()
        and sm2.user_id = target_user_id
    )
    or exists (
      -- Share at least one Circle of Friends or Organization
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

-- 3. Row Level Security (RLS)
-- ----------------------------------------------------------------------------

alter table public.visibility_groups enable row level security;
alter table public.visibility_group_members enable row level security;

-- visibility_groups: members can see groups they belong to; admins see/manage all
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

-- visibility_group_members: users can see memberships of their groups; admins manage all
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

-- Tighten existing SELECT policies to respect Directory visibility rules
drop policy if exists "Authenticated users can view profiles" on public.profiles;
create policy "Users can view visible profiles"
  on public.profiles for select
  to authenticated
  using (public.can_view_user(id));

drop policy if exists "Authenticated users can view section members" on public.section_members;
create policy "Users can view visible section members"
  on public.section_members for select
  to authenticated
  using (public.can_view_user(user_id));

drop policy if exists "Authenticated users can view sections" on public.sections;
create policy "Users can view visible sections"
  on public.sections for select
  to authenticated
  using (public.can_view_section(id));

drop policy if exists "Authenticated users can view schedules" on public.schedule_entries;
create policy "Users can view visible schedules"
  on public.schedule_entries for select
  to authenticated
  using (public.can_view_section(section_id));
