-- Run this once in your Supabase project's SQL Editor.
--
-- Pure rename: "Mirror" becomes "Wall Mirror" (to sit alongside Standing
-- Mirror and Table Mirror). This updates existing rows in place — every
-- photo, description, status, and sort order stays exactly as it was.
-- Nothing is deleted or recreated.

update items
set type = 'Wall Mirror',
    name = regexp_replace(name, ' Mirror$', ' Wall Mirror')
where type = 'Mirror';

-- Carry over any note that was attached to the old category name.
update app_settings
set key = 'catnote_Wall Mirror'
where key = 'catnote_Mirror';
