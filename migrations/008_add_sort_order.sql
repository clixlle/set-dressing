-- Run this once in your Supabase project's SQL Editor.
-- Adds a column to store custom drag-to-reorder positions.

alter table items add column if not exists sort_order integer;
