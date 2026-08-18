-- Run this once in your Supabase project's SQL Editor.
--
-- app_settings was missing an INSERT policy — it only had SELECT and UPDATE.
-- Kitchen System already had a row from the original setup, so editing it
-- worked fine (that's an UPDATE). But creating the very first note for any
-- OTHER section (Furniture, Decor, Room, Style, All Items) requires an
-- INSERT, which the database was silently rejecting with no policy for it.

create policy "Admin can insert settings"
  on app_settings for insert
  to authenticated
  with check (auth.jwt() ->> 'email' = 'realview@set-dressing.internal');
