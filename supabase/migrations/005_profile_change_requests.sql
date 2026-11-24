-- ============================================================================
-- Migration 005: Profile Change Requests & Admin Approval
-- Paste into Supabase Dashboard -> SQL Editor and click Run.
-- Safe to run on an existing database (idempotent, preserves all data).
-- ============================================================================

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

-- Enforce at most one pending request per user at a time
create unique index if not exists profile_change_requests_one_pending_idx
  on public.profile_change_requests (user_id)
  where status = 'pending';

create index if not exists profile_change_requests_status_created_idx
  on public.profile_change_requests (status, created_at desc);

create index if not exists profile_change_requests_user_created_idx
  on public.profile_change_requests (user_id, created_at desc);

-- Keep updated_at current
drop trigger if exists profile_change_requests_set_updated_at on public.profile_change_requests;
create trigger profile_change_requests_set_updated_at
  before update on public.profile_change_requests
  for each row execute function public.set_updated_at();

-- Prevent non-admin users from bypassing approval by updating display_name directly
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

-- Row Level Security (RLS)
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
