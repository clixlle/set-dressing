-- Run this once in your Supabase project's SQL Editor.
--
-- This removes a NEW trigger that got added alongside our existing one while
-- setting up Realtime — it duplicated protection we already had, but had a
-- bug: it compared the entire row (minus only "status") to decide if a
-- change was "status-only," and our app always updates "updated_at"
-- alongside "status" together. Since that trigger didn't exclude
-- "updated_at" too, it would reject every legitimate modeler status change.
--
-- Our original trigger (enforce_modeler_status_only / restrict_modeler_updates,
-- from migrations 003 and 009) already does this correctly and stays in place
-- untouched — this just removes the newer, conflicting one.

drop trigger if exists items_enforce_role_update_trg on public.items;
drop function if exists public.items_enforce_role_update();
drop function if exists public.items_can_update_only_status();

-- The duplicate read/update policies that got created alongside it aren't
-- harmful (Postgres just OR's redundant permissive policies together), but
-- removing them keeps things from getting confusing later.
drop policy if exists "items: authenticated can select all" on public.items;
drop policy if exists "custom_types: authenticated can select all" on public.custom_types;
drop policy if exists "app_settings: authenticated can select all" on public.app_settings;
drop policy if exists "items: authenticated can update rows" on public.items;
