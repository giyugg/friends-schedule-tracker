-- ============================================================================
-- Migration 003: Organization Member Role Labels
-- Paste into Supabase Dashboard -> SQL Editor and click Run.
-- Safe to run on an existing database (idempotent, preserves all data).
-- ============================================================================

alter table public.visibility_group_members
  add column if not exists role_label text;
