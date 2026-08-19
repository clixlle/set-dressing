-- Run this once in your Supabase project's SQL Editor (Project → SQL Editor → New query).
--
-- This app uses two fixed accounts (no public sign-up) — Admin and Modeler.
-- Create them by hand BEFORE anyone uses the app:
--   Supabase Dashboard → Authentication → Users → Add user
--     1) Email: realview@set-dressing.internal   Password: (your admin password)
--     2) Email: 3dmodel@set-dressing.internal     Password: (your modeler password)
--   Check "Auto Confirm User" for both.

create table if not exists items (
  id text primary key,
  name text not null,
  type text,
  type_group text,
  room text,
  style text,
  status text not null default 'not-started',
  photo text,
  description text default '',
  sort_order integer,
  thumbnail text,
  created_at bigint,
  updated_at bigint
);

-- Realtime: lets every connected account see changes made by anyone else, live.
alter publication supabase_realtime add table items;

-- Row Level Security: nobody can read or write without being signed in as
-- one of the two accounts above.
alter table items enable row level security;

-- Anyone signed in (either account) can read.
create policy "Signed-in users can read items"
  on items for select
  to authenticated
  using (true);

-- Only the admin account can add or delete items.
create policy "Admin can insert items"
  on items for insert
  to authenticated
  with check (auth.jwt() ->> 'email' = 'realview@set-dressing.internal');

create policy "Admin can delete items"
  on items for delete
  to authenticated
  using (auth.jwt() ->> 'email' = 'realview@set-dressing.internal');

-- Both accounts can trigger an update (the trigger below decides what a
-- modeler is actually allowed to change within that update).
create policy "Signed-in users can update items"
  on items for update
  to authenticated
  using (true)
  with check (true);

-- Enforce, at the database level, that the modeler account can only ever
-- change "status" (and its own updated_at timestamp) on an update — even a
-- direct API call as that account attempting to change anything else fails.
create or replace function enforce_modeler_status_only()
returns trigger as $$
begin
  if auth.jwt() ->> 'email' = '3dmodel@set-dressing.internal' then
    if NEW.name is distinct from OLD.name
       or NEW.type is distinct from OLD.type
       or NEW.type_group is distinct from OLD.type_group
       or NEW.room is distinct from OLD.room
       or NEW.style is distinct from OLD.style
       or NEW.photo is distinct from OLD.photo
       or NEW.description is distinct from OLD.description
       or NEW.sort_order is distinct from OLD.sort_order
       or NEW.created_at is distinct from OLD.created_at
    then
      raise exception 'Modelers can only change status';
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists restrict_modeler_updates on items;
create trigger restrict_modeler_updates
  before update on items
  for each row execute function enforce_modeler_status_only();


-- Admin-added categories (e.g. "Cabinet Base" under Kitchen System).
create table if not exists custom_types (
  id text primary key,
  name text not null,
  group_name text not null check (group_name in ('Furniture', 'Decor', 'Kitchen', 'Room', 'Style')),
  default_room text,
  created_at bigint
);

alter table custom_types enable row level security;
alter publication supabase_realtime add table custom_types;

create policy "Signed-in users can read custom types"
  on custom_types for select to authenticated using (true);

create policy "Admin can insert custom types"
  on custom_types for insert to authenticated
  with check (auth.jwt() ->> 'email' = 'realview@set-dressing.internal');

create policy "Admin can delete custom types"
  on custom_types for delete to authenticated
  using (auth.jwt() ->> 'email' = 'realview@set-dressing.internal');

-- Editable app-wide settings (currently just the Kitchen System note).
create table if not exists app_settings (
  key text primary key,
  value text
);

insert into app_settings (key, value) values (
  'note_kitchen',
  'All kitchen pieces must be designed as add-ons to the main base module. Variations such as cabinet doors, handles, countertops, shelves, and decorative elements should fit the base seamlessly without requiring modifications. All modules must share consistent dimensions, alignment, and connection points to ensure any combination of pieces can be mixed and matched together cleanly.'
) on conflict (key) do nothing;

alter table app_settings enable row level security;
alter publication supabase_realtime add table app_settings;

create policy "Signed-in users can read settings"
  on app_settings for select to authenticated using (true);

create policy "Admin can insert settings"
  on app_settings for insert to authenticated
  with check (auth.jwt() ->> 'email' = 'realview@set-dressing.internal');

create policy "Admin can update settings"
  on app_settings for update to authenticated
  using (auth.jwt() ->> 'email' = 'realview@set-dressing.internal')
  with check (auth.jwt() ->> 'email' = 'realview@set-dressing.internal');
