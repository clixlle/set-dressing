-- Run this once in your Supabase project's SQL Editor.
-- Lets the admin add custom categories under the new "Architecture" sort
-- section too (crown molding, doors, windows, etc.), not just Furniture,
-- Decor, Kitchen System, Room, and Style.

alter table custom_types drop constraint if exists custom_types_group_name_check;
alter table custom_types add constraint custom_types_group_name_check
  check (group_name in ('Furniture', 'Decor', 'Kitchen', 'Architecture', 'Room', 'Style'));
