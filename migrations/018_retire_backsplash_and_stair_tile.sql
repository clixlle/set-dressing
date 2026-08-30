-- Run this once in your Supabase project's SQL Editor.
--
-- "Backsplash Tile" and "Stair Tile" are retired in favor of one generic
-- "Tile" type (Square Tile, Rectangle Tile) usable anywhere. Same safety
-- rule as always: only removes rows that are still "Not Started" AND have
-- no photo. Anything you've touched or photographed stays exactly as it is
-- — it'll just be an orphaned item under a type that no longer generates
-- new entries, which is harmless.

delete from items
where status = 'not-started'
  and photo is null
  and type in ('Backsplash Tile', 'Stair Tile');
