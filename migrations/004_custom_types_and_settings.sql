-- Run this once in your Supabase project's SQL Editor.
--
-- Adds two things:
--   1. custom_types — lets the Admin account add new categories under
--      Furniture, Decor, or Kitchen System from within the app itself
--      (e.g. "Cabinet Base" under Kitchen System), without a code change.
--   2. app_settings — a small key/value table so the Kitchen System note can
--      be edited by the Admin from the app instead of being fixed in code.

create table if not exists custom_types (
  id text primary key,
  name text not null,
  group_name text not null check (group_name in ('Furniture', 'Decor', 'Kitchen')),
  default_room text,
  created_at bigint
);

alter table custom_types enable row level security;
alter publication supabase_realtime add table custom_types;

create policy "Signed-in users can read custom types"
  on custom_types for select
  to authenticated
  using (true);

create policy "Admin can insert custom types"
  on custom_types for insert
  to authenticated
  with check (auth.jwt() ->> 'email' = 'realview@set-dressing.internal');

create policy "Admin can delete custom types"
  on custom_types for delete
  to authenticated
  using (auth.jwt() ->> 'email' = 'realview@set-dressing.internal');


create table if not exists app_settings (
  key text primary key,
  value text
);

insert into app_settings (key, value) values (
  'kitchen_banner',
  'All kitchen pieces must be designed as add-ons to the main base module. Variations such as cabinet doors, handles, countertops, shelves, and decorative elements should fit the base seamlessly without requiring modifications. All modules must share consistent dimensions, alignment, and connection points to ensure any combination of pieces can be mixed and matched together cleanly.'
) on conflict (key) do nothing;

alter table app_settings enable row level security;
alter publication supabase_realtime add table app_settings;

create policy "Signed-in users can read settings"
  on app_settings for select
  to authenticated
  using (true);

create policy "Admin can update settings"
  on app_settings for update
  to authenticated
  using (auth.jwt() ->> 'email' = 'realview@set-dressing.internal')
  with check (auth.jwt() ->> 'email' = 'realview@set-dressing.internal');
