-- Run this once in your Supabase project's SQL Editor to set the Kitchen
-- System note back to its original text (regardless of what migration
-- 004/005 did or didn't carry over).

insert into app_settings (key, value) values (
  'note_kitchen',
  'All kitchen pieces must be designed as add-ons to the main base module. Variations such as cabinet doors, handles, countertops, shelves, and decorative elements should fit the base seamlessly without requiring modifications. All modules must share consistent dimensions, alignment, and connection points to ensure any combination of pieces can be mixed and matched together cleanly.'
)
on conflict (key) do update set value = excluded.value;
