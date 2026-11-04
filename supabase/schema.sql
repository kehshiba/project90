-- The 90-Day Cut — private cloud snapshot
-- Run this once in the Supabase SQL editor.
--
-- Security model:
--   * One row per user, keyed by the authenticated user's id.
--   * Row Level Security is the only thing standing between the public anon key
--     and the data, so every policy checks auth.uid().
--   * The anon role gets no table privileges at all. Only authenticated users
--     can reach the table, and then only their own row.

create table if not exists public.challenge_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  constraint challenge_state_data_is_object check (jsonb_typeof(data) = 'object')
);

alter table public.challenge_state enable row level security;

-- Remove the broad default grants Supabase gives to the public API roles.
revoke all on table public.challenge_state from anon;
revoke all on table public.challenge_state from authenticated;
grant select, insert, update, delete on table public.challenge_state to authenticated;

-- Re-running this file replaces the policies cleanly.
drop policy if exists "Owner can read their snapshot" on public.challenge_state;
drop policy if exists "Owner can create their snapshot" on public.challenge_state;
drop policy if exists "Owner can update their snapshot" on public.challenge_state;
drop policy if exists "Owner can delete their snapshot" on public.challenge_state;

create policy "Owner can read their snapshot"
  on public.challenge_state
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Owner can create their snapshot"
  on public.challenge_state
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Owner can update their snapshot"
  on public.challenge_state
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Owner can delete their snapshot"
  on public.challenge_state
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
