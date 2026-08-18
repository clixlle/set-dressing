-- Run this once in your Supabase project's SQL Editor. Only needed if you
-- already ran migrations/004_custom_types_and_settings.sql before — it
-- migrates your existing Kitchen System note to the new, generalized format
-- that lets the note-per-section feature work for any sort category.

insert into app_settings (key, value)
select 'note_kitchen', value from app_settings where key = 'kitchen_banner'
on conflict (key) do update set value = excluded.value;
