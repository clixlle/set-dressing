-- Run this once in your Supabase project's SQL Editor.
-- Lets the admin also add custom Rooms and Styles (not just Furniture/Decor/
-- Kitchen System categories) from the "+ New category" option in the app.

alter table custom_types drop constraint if exists custom_types_group_name_check;
alter table custom_types add constraint custom_types_group_name_check
  check (group_name in ('Furniture', 'Decor', 'Kitchen', 'Room', 'Style'));
