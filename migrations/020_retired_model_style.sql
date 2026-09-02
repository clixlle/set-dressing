-- Run this once in your Supabase project's SQL Editor.
--
-- Sets style = 'Retired' on every item already in Retired Models, fully
-- separating them from any other style grouping. Pure field update — the
-- photo, description, status, and sort order on every row are untouched.

update items
set style = 'Retired'
where type = 'Retired Model';
