-- Run this once in your Supabase project's SQL Editor.
--
-- Standing Mirror was mistakenly filed under "Furniture" while Wall Mirror
-- and Table Mirror are "Decor" — meaning all three could never actually
-- show up together under the "Mirrors" umbrella within a single tab. This
-- moves existing Standing Mirror rows to Decor so they're consistent.
-- Pure field update — no photos, descriptions, or statuses are touched.

update items
set type_group = 'Decor'
where type = 'Standing Mirror';
