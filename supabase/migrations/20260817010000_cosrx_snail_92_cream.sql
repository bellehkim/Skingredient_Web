-- Adds COSRX Advanced Snail 92 All In One Cream as a new catalog product,
-- with its verified complete INCI list (MVP demo scope: this product plus
-- iUNIK Centella Calming Gel Cream are the only two with a full ingredient
-- list seeded — see 20260817000000_iunik_full_ingredient_list.sql for the
-- pattern this follows). Never touches iUNIK, Dr. Jart+, or any other
-- existing product/ingredient row.
--
-- Verified INCI list cross-checked against the official COSRX product page
-- (cosrx.com/products/advanced-snail-92-all-in-one-cream) and INCIDecoder —
-- both returned an identical 22-ingredient list, in INCI declaration order.

insert into public.products (brand, product_name, category, catalog_source)
values ('COSRX', 'Advanced Snail 92 All In One Cream', 'Moisturizer', 'hackathon_mvp_seed')
on conflict (brand, product_name) do nothing;

-- Snail Secretion Filtrate gets real Ingredient Library metadata (like
-- Niacinamide/Panthenol/etc already have) — it's this product's single
-- headline active (92% of the formulation) and its hydrating/soothing/
-- repair-support function is well-established, uncontroversial cosmetic
-- science, not a fabricated claim. Every other new ingredient below is
-- inserted name-only (no common_name), same as the iUNIK migration's
-- pattern for ingredients without curated metadata — they still appear in
-- the full ingredient list, they just show their plain name with no
-- function subtitle, and they are NOT added to ingredient_functions, so
-- they never affect recommendation matching (only ingredients that already
-- had a functional_category — Sodium Hyaluronate, Allantoin, Panthenol —
-- carry that over, unchanged, by virtue of being the same existing rows).
insert into public.ingredients (inci_name, common_name, short_description, benefits, best_for, caution) values
  (
    'Snail Secretion Filtrate',
    'Snail Secretion Filtrate',
    'A mucin-derived filtrate rich in glycoproteins and hyaluronic acid, used to hydrate, soothe, and support skin repair.',
    array['Hydration', 'Soothing', 'Skin repair support'],
    array['Dry skin', 'Damaged or compromised barrier', 'Dull skin'],
    'Generally well tolerated; rare sensitivity reports exist for snail-derived ingredients.'
  )
on conflict (inci_name) do nothing;

insert into public.ingredients (inci_name) values
  ('Betaine'),
  ('Caprylic/Capric Triglyceride'),
  ('Butylene Glycol'),
  ('Cetearyl Olivate'),
  ('Sorbitan Olivate'),
  ('Cetearyl Alcohol'),
  ('Carbomer'),
  ('Ethyl Hexanediol'),
  ('Phenoxyethanol'),
  ('Arginine'),
  ('Dimethicone'),
  ('Sodium Polyacrylate'),
  ('Palmitic Acid'),
  ('Xanthan Gum'),
  ('Stearic Acid'),
  ('Adenosine'),
  ('Water'),
  ('Myristic Acid')
on conflict (inci_name) do nothing;

insert into public.product_ingredients (product_id, ingredient_id, inci_position)
select
  (select product_id from public.products
    where brand = 'COSRX' and product_name = 'Advanced Snail 92 All In One Cream'),
  i.ingredient_id,
  ordered.pos
from (values
  (1, 'Snail Secretion Filtrate'),
  (2, 'Betaine'),
  (3, 'Caprylic/Capric Triglyceride'),
  (4, 'Butylene Glycol'),
  (5, 'Cetearyl Olivate'),
  (6, 'Sorbitan Olivate'),
  (7, 'Cetearyl Alcohol'),
  (8, 'Carbomer'),
  (9, 'Ethyl Hexanediol'),
  (10, 'Phenoxyethanol'),
  (11, 'Arginine'),
  (12, 'Dimethicone'),
  (13, 'Sodium Polyacrylate'),
  (14, 'Sodium Hyaluronate'),
  (15, 'Allantoin'),
  (16, 'Palmitic Acid'),
  (17, 'Panthenol'),
  (18, 'Xanthan Gum'),
  (19, 'Stearic Acid'),
  (20, 'Adenosine'),
  (21, 'Water'),
  (22, 'Myristic Acid')
) as ordered(pos, inci_name)
join public.ingredients i on i.inci_name = ordered.inci_name
on conflict (product_id, ingredient_id) do nothing;
