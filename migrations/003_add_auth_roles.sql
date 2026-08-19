-- Run this once in your Supabase project's SQL Editor.
--
-- BEFORE running this, create the two accounts by hand:
--   Supabase Dashboard → Authentication → Users → Add user
--     1) Email: realview@set-dressing.internal   Password: (your admin password)
--     2) Email: 3dmodel@set-dressing.internal     Password: (your modeler password)
--   Check "Auto Confirm User" for both (no email verification is being used).
--
-- What this does:
--   - Requires sign-in to use the app at all (no more anonymous access).
--   - Admin (realview@...) can read, add, edit, and delete anything.
--   - Modeler (3dmodel@...) can read everything, but can ONLY change the
--     "status" field — enforced by the database itself via a trigger, not
--     just hidden in the interface. Even a direct API call as the modeler
--     account attempting to change the name, photo, description, etc. will
--     be rejected.

-- Remove the old fully-open policies from the original setup.
drop policy if exists "Anyone can read items" on items;
drop policy if exists "Anyone can insert items" on items;
drop policy if exists "Anyone can update items" on items;
drop policy if exists "Anyone can delete items" on items;

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
-- change "status" (and its own updated_at timestamp) on an update.
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
