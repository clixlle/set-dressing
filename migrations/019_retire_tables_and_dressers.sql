-- Run this once in your Supabase project's SQL Editor.
--
-- Moves every existing Console Table, Table, Coffee Table, and Dresser into
-- a new "Retired Models" section, and creates a fresh empty replacement for
-- each one (same name with " NEW" added, in the original category, ready to
-- model from scratch).
--
-- SAFETY: this only ever UPDATEs the type on existing rows and INSERTs new
-- ones — nothing is deleted. Every photo, description, status, and sort
-- order on the originals carries over untouched into Retired Models.
--
-- Ids are captured BEFORE anything changes, so the brand-new "NEW" items
-- (which share the same original type name) can never accidentally get
-- swept into the retirement step below.

do $$
declare
  original_ids text[];
begin
  select array_agg(id) into original_ids
  from items
  where type in ('Console Table', 'Table', 'Coffee Table', 'Dresser');

  if original_ids is null then
    raise notice 'No matching items found — nothing to do.';
    return;
  end if;

  -- Create a fresh, empty replacement for each original, using its current
  -- type/room/style, before the original gets retired.
  insert into items (id, name, type, type_group, room, style, status, photo, thumbnail, description, sort_order, created_at, updated_at)
  select
    'item_' || substr(md5(random()::text || clock_timestamp()::text || id), 1, 12),
    name || ' NEW',
    type,
    type_group,
    room,
    style,
    'not-started',
    null,
    null,
    '',
    null,
    (extract(epoch from clock_timestamp()) * 1000)::bigint,
    (extract(epoch from clock_timestamp()) * 1000)::bigint
  from items
  where id = any(original_ids);

  -- Move the originals into Retired Models.
  update items
  set type = 'Retired Model', type_group = 'Retired'
  where id = any(original_ids);

  raise notice 'Retired % item(s) and created % replacement(s).', array_length(original_ids, 1), array_length(original_ids, 1);
end $$;
