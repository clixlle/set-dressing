-- Run this once in your Supabase project's SQL Editor.
--
-- Two pure field updates on existing rows — nothing is deleted, no photos
-- or statuses are touched.

-- 1) Move Bathroom Fixtures, Kitchen Appliances, and Laundry Appliances
--    from Decor to Furniture.
update items
set type_group = 'Furniture'
where type in (
  'Toilet', 'Bathtub', 'Shower', 'Bathroom Vanity',
  'Kitchen Sink', 'Stove', 'Oven', 'Refrigerator', 'Dishwasher', 'Microwave', 'Range Hood',
  'Washer', 'Dryer'
);

-- 2) Split the old single "Plant" type into proper sub-types so Plants can
--    sit under one umbrella instead of being one flat list. Matches by name.
update items set type = 'Hanging Plant'
  where type = 'Plant' and name in ('Hanging Pothos', 'Hanging Fern', 'Hanging Ivy');

update items set type = 'Succulent & Cactus'
  where type = 'Plant' and name in ('Succulent Trio', 'Aloe Vera', 'Cactus', 'Air Plant Set', 'Succulent Wall Planter');

update items set type = 'Potted Floor Plant'
  where type = 'Plant' and name in ('Monstera', 'Fiddle Leaf Fig', 'Areca Palm', 'Rubber Plant', 'Bird of Paradise', 'Bamboo Stalks');

update items set type = 'Tabletop Plant'
  where type = 'Plant' and name in ('Snake Plant', 'Pothos', 'Peace Lily', 'ZZ Plant', 'Boston Fern', 'Orchid', 'English Ivy', 'Spider Plant', 'Ferns Cluster');

update items set type = 'Herb & Garden Plant'
  where type = 'Plant' and name in ('Eucalyptus Bundle', 'Lavender Pot', 'Rosemary Pot', 'Potted Rose Bush', 'Potted Hydrangea', 'Herb Garden Box', 'Tomato Planter');
