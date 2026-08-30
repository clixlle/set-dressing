-- Run this once in your Supabase project's SQL Editor.
--
-- Reduces the 15-style sweep down to 7 curated styles (Modern, Farmhouse,
-- Gothic, Bohemian, Coastal, Industrial, Mid-Century Modern) for the ~56
-- core furniture/decor categories (Beds, Sofas, Chairs, Tables, Lamps, etc).
--
-- SAFETY: this only deletes rows that are BOTH still "Not Started" AND have
-- no photo — anything you've touched, styled, or photographed is left
-- completely alone, even for a style being dropped elsewhere. This does NOT
-- touch any of the smaller specialty categories (Hanging Chair, Candle
-- Holder, Architecture, Kitchen System, etc) — only the original 56-type
-- full-style sweep.

delete from items
where status = 'not-started'
  and photo is null
  and style in ('Cottagecore', 'Vintage', 'Victorian', 'Rustic', 'Minimalist', 'Scandinavian', 'Traditional', 'Art Deco')
  and type in (
    'Bed', 'Sofa', 'Loveseat', 'Accent Chair', 'Recliner', 'Table', 'Console Table', 'Desk',
    'Filing Cabinet', 'Dresser', 'Vanity Table', 'Shelf', 'Wardrobe', 'Nightstand', 'Changing Table',
    'Bench', 'Ottoman', 'Coffee Table', 'Dining Table', 'Dining Chair', 'Bar Cart', 'Bar Stool',
    'Bookcase', 'TV Stand', 'Room Divider', 'Storage Trunk', 'Garden Bench', 'Patio Table', 'Patio Chair',
    'Hammock', 'Ceiling Light', 'Table Lamp', 'Floor Lamp', 'Wall Lamp', 'Chandelier', 'Pendant Light',
    'Outdoor Lantern', 'Vase', 'Book Stack', 'Painting', 'Wall Art', 'Photo Frame', 'Tapestry', 'Wall Mirror',
    'Rug', 'Door Mat', 'Candle', 'Clock', 'Basket', 'Sculpture', 'Garden Statue', 'Decorative Object',
    'Throw Pillow', 'Curtains', 'Coat Rack', 'Umbrella Stand'
  );
