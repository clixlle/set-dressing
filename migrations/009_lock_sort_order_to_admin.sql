-- Run this once in your Supabase project's SQL Editor.
-- Updates the modeler-restriction trigger to also block changes to the new
-- sort_order column — drag-to-reorder is admin-only, and this makes that
-- true at the database level too, not just in the interface.

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
