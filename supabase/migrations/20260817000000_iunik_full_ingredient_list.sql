-- Verified full INCI ingredient list for iUNIK Centella Calming Gel Cream
-- (MVP demo scope: this one catalog product only — see
-- src/routes/shelf.$productId.ingredients.tsx). Cross-checked against two
-- independent public INCI databases (INCIDecoder, whatsinmyjar.com); both
-- returned an identical 34-ingredient list, in INCI declaration order
-- (highest concentration first).
--
-- IMPORTANT: this replaces the product's existing 3 product_ingredients rows
-- (Centella Asiatica Extract, Panthenol, Beta-Glucan) — the verified real
-- formulation contains neither Panthenol nor Beta-Glucan. Building an
-- honest "verified ingredient list" page next to a catalog that still
-- claimed fake ingredients for this product would defeat the point, so the
-- wrong rows are corrected here rather than left in place.
--
-- New ingredient rows below are inserted WITHOUT common_name/benefits/etc —
-- they are catalog-only entries (same pattern as Fragrance (Parfum) /
-- Titanium Dioxide in the original seed), not new Ingredient Library
-- entries. No ingredient_functions rows are added for them either: none of
-- them are relevant to today's-plan matching, and adding functional
-- categories for solvents/emulsifiers/fragrance components is out of scope
-- for this MVP demo feature.

insert into public.ingredients (inci_name) values
  ('Centella Asiatica Leaf Water'),
  ('Melaleuca Alternifolia (Tea Tree) Leaf Water'),
  ('Butylene Glycol'),
  ('Water'),
  ('Methyl Trimethicone'),
  ('Acrylates/C10-30 Alkyl Acrylate Crosspolymer'),
  ('Arginine'),
  ('1,2-Hexanediol'),
  ('Caprylyl Glycol'),
  ('Dimethicone'),
  ('Dimethicone/Vinyl Dimethicone Crosspolymer'),
  ('Melaleuca Alternifolia (Tea Tree) Leaf Extract'),
  ('Ethylhexylglycerin'),
  ('Adenosine'),
  ('Dipotassium Glycyrrhizate'),
  ('Citrus Aurantium Bergamia (Bergamot) Fruit Oil'),
  ('Pentylene Glycol'),
  ('Aspalathus Linearis Extract'),
  ('Glycyrrhiza Glabra (Licorice) Root Extract'),
  ('Triticum Vulgare (Wheat) Germ Extract'),
  ('Brassica Oleracea Italica (Broccoli) Extract'),
  ('Brassica Oleracea Capitata (Cabbage) Leaf Extract'),
  ('Medicago Sativa (Alfalfa) Extract'),
  ('Raphanus Sativus (Radish) Seed Extract'),
  ('Brassica Campestris Extract'),
  ('Yucca Schidigera Root Extract'),
  ('Commiphora Myrrha Resin Extract'),
  ('Perilla Frutescens Leaf Extract'),
  ('Limonene'),
  ('Linalool')
on conflict (inci_name) do nothing;

delete from public.product_ingredients
where product_id = (
  select product_id from public.products
  where brand = 'iUNIK' and product_name = 'Centella Calming Gel Cream'
);

insert into public.product_ingredients (product_id, ingredient_id, inci_position)
select
  (select product_id from public.products
    where brand = 'iUNIK' and product_name = 'Centella Calming Gel Cream'),
  i.ingredient_id,
  ordered.pos
from (values
  (1, 'Centella Asiatica Leaf Water'),
  (2, 'Melaleuca Alternifolia (Tea Tree) Leaf Water'),
  (3, 'Butylene Glycol'),
  (4, 'Water'),
  (5, 'Niacinamide'),
  (6, 'Methyl Trimethicone'),
  (7, 'Acrylates/C10-30 Alkyl Acrylate Crosspolymer'),
  (8, 'Arginine'),
  (9, '1,2-Hexanediol'),
  (10, 'Caprylyl Glycol'),
  (11, 'Dimethicone'),
  (12, 'Dimethicone/Vinyl Dimethicone Crosspolymer'),
  (13, 'Centella Asiatica Extract'),
  (14, 'Allantoin'),
  (15, 'Melaleuca Alternifolia (Tea Tree) Leaf Extract'),
  (16, 'Ethylhexylglycerin'),
  (17, 'Adenosine'),
  (18, 'Dipotassium Glycyrrhizate'),
  (19, 'Citrus Aurantium Bergamia (Bergamot) Fruit Oil'),
  (20, 'Pentylene Glycol'),
  (21, 'Sodium Hyaluronate'),
  (22, 'Aspalathus Linearis Extract'),
  (23, 'Glycyrrhiza Glabra (Licorice) Root Extract'),
  (24, 'Triticum Vulgare (Wheat) Germ Extract'),
  (25, 'Brassica Oleracea Italica (Broccoli) Extract'),
  (26, 'Brassica Oleracea Capitata (Cabbage) Leaf Extract'),
  (27, 'Medicago Sativa (Alfalfa) Extract'),
  (28, 'Raphanus Sativus (Radish) Seed Extract'),
  (29, 'Brassica Campestris Extract'),
  (30, 'Yucca Schidigera Root Extract'),
  (31, 'Commiphora Myrrha Resin Extract'),
  (32, 'Perilla Frutescens Leaf Extract'),
  (33, 'Limonene'),
  (34, 'Linalool')
) as ordered(pos, inci_name)
join public.ingredients i on i.inci_name = ordered.inci_name;
