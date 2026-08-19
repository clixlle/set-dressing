-- Run this once in your Supabase project's SQL Editor.
-- Adds a column for small, compressed thumbnails used in the list view,
-- separate from the full-quality "photo" column used in the detail view.

alter table items add column if not exists thumbnail text;
