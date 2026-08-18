-- Run this once in your Supabase project's SQL Editor if your database was
-- created before the "description" field was added (i.e. it already has an
-- items table). New installs don't need this — it's already included in
-- supabase-setup.sql.

alter table items add column if not exists description text default '';
