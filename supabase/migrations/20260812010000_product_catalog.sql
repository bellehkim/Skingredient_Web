-- Skingredient — product/ingredient catalog (hackathon MVP seed)
--
-- Schema follows Skingredient_MVP_Implementation_Guide.md Section 2 exactly.
-- Data below is a small hand-authored seed (NOT the 97-product/117-ingredient
-- Phase 1+2 catalog described in the guide — those CSVs were never delivered
-- into this repo). 18 products / 21 ingredients, enough to exercise every
-- direction in src/lib/recommendationEngine.ts end-to-end.
--
-- Axis 2 (product_ingredients.role_tier + its confidence/source columns) and
-- ingredients.evidence_* are deliberately left NULL for every row, per the
-- guide's Section 3/7 — deferred scope, not missing work.

create table public.products (
  product_id bigserial primary key,
  brand varchar(100) not null,
  product_name varchar(200) not null,
  category varchar(20) not null check (category in ('Cleanser','Moisturizer','Sunscreen','Serum','Treatment','Toner/Essence')),
  product_url text,
  catalog_source varchar(40) not null default 'phase_1_locked_catalog',
  unique (brand, product_name)
);

create table public.ingredients (
  ingredient_id bigserial primary key,
  inci_name varchar(200) not null unique,
  evidence_level varchar(15) check (evidence_level in ('Strong','Moderate','Limited','Insufficient')),
  evidence_confidence decimal(3,2),
  evidence_source varchar(40)
);

create table public.ingredient_functions (
  ingredient_function_id bigserial primary key,
  ingredient_id bigint not null references public.ingredients(ingredient_id) on delete cascade,
  functional_category varchar(50) not null,
  is_primary_function boolean not null default true,
  classification_confidence decimal(3,2) not null default 0.85,
  classification_source varchar(40) not null default 'llm_extraction',
  unique (ingredient_id, functional_category)
);

create unique index ingredient_functions_one_primary_idx
  on public.ingredient_functions (ingredient_id) where is_primary_function;

create table public.product_ingredients (
  product_ingredient_id bigserial primary key,
  product_id bigint not null references public.products(product_id) on delete cascade,
  ingredient_id bigint not null references public.ingredients(ingredient_id) on delete cascade,
  inci_position integer,
  disclosed_concentration decimal(6,3),
  concentration_unit varchar(10),
  ingredient_source_type varchar(25) check (ingredient_source_type in ('full_inci_list','active_panel','marketing_claim','retailer_listing')),
  role_tier varchar(20) check (role_tier in ('Core Active','Secondary Active','Supportive','Base/Vehicle')),
  classification_confidence decimal(3,2),
  classification_source varchar(40),
  extracted_at date,
  unique (product_id, ingredient_id),
  unique (product_id, inci_position)
);

-- Catalog data is non-user, read-only reference data — safe for the anon key
-- to read (same reasoning as VITE_SUPABASE_ANON_KEY elsewhere in this repo).
-- No write policy: seeding happens only via migration, never from the client.
alter table public.products enable row level security;
create policy "public read products" on public.products for select using (true);

alter table public.ingredients enable row level security;
create policy "public read ingredients" on public.ingredients for select using (true);

alter table public.ingredient_functions enable row level security;
create policy "public read ingredient_functions" on public.ingredient_functions for select using (true);

alter table public.product_ingredients enable row level security;
create policy "public read product_ingredients" on public.product_ingredients for select using (true);

-- ---------------------------------------------------------------------------
-- Seed: ingredients
-- functional_category is free-form per the guide (Section 2 note) — here it's
-- kept 1:1 with the ingredient's role so app code can map recommendation
-- ingredient labels (src/lib/recommendationEngine.ts) straight to a category
-- via src/lib/productMatching.ts, with no lookup table needed for the MVP.
-- ---------------------------------------------------------------------------
insert into public.ingredients (inci_name) values
  ('Ceramide NP'),
  ('Panthenol'),
  ('Glycerin'),
  ('Beta-Glucan'),
  ('Squalane'),
  ('Salicylic Acid'),
  ('Azelaic Acid'),
  ('Niacinamide'),
  ('Sodium Hyaluronate'),
  ('Gluconolactone'),
  ('Retinol'),
  ('Adapalene'),
  ('Glycolic Acid'),
  ('Benzoyl Peroxide'),
  ('Ascorbic Acid'),
  ('Fragrance (Parfum)'),
  ('Alcohol Denat.'),
  ('Centella Asiatica Extract'),
  ('Allantoin'),
  ('Zinc PCA'),
  ('Titanium Dioxide');

insert into public.ingredient_functions (ingredient_id, functional_category) values
  ((select ingredient_id from public.ingredients where inci_name = 'Ceramide NP'), 'ceramide'),
  ((select ingredient_id from public.ingredients where inci_name = 'Panthenol'), 'panthenol'),
  ((select ingredient_id from public.ingredients where inci_name = 'Glycerin'), 'glycerin'),
  ((select ingredient_id from public.ingredients where inci_name = 'Beta-Glucan'), 'beta_glucan'),
  ((select ingredient_id from public.ingredients where inci_name = 'Squalane'), 'squalane'),
  ((select ingredient_id from public.ingredients where inci_name = 'Salicylic Acid'), 'salicylic_acid'),
  ((select ingredient_id from public.ingredients where inci_name = 'Azelaic Acid'), 'azelaic_acid'),
  ((select ingredient_id from public.ingredients where inci_name = 'Niacinamide'), 'niacinamide'),
  ((select ingredient_id from public.ingredients where inci_name = 'Sodium Hyaluronate'), 'hyaluronic_acid'),
  ((select ingredient_id from public.ingredients where inci_name = 'Gluconolactone'), 'pha'),
  ((select ingredient_id from public.ingredients where inci_name = 'Retinol'), 'retinoid'),
  ((select ingredient_id from public.ingredients where inci_name = 'Adapalene'), 'retinoid'),
  ((select ingredient_id from public.ingredients where inci_name = 'Glycolic Acid'), 'glycolic_acid'),
  ((select ingredient_id from public.ingredients where inci_name = 'Benzoyl Peroxide'), 'benzoyl_peroxide'),
  ((select ingredient_id from public.ingredients where inci_name = 'Ascorbic Acid'), 'vitamin_c'),
  ((select ingredient_id from public.ingredients where inci_name = 'Fragrance (Parfum)'), 'fragrance'),
  ((select ingredient_id from public.ingredients where inci_name = 'Alcohol Denat.'), 'alcohol_denat'),
  ((select ingredient_id from public.ingredients where inci_name = 'Centella Asiatica Extract'), 'centella'),
  ((select ingredient_id from public.ingredients where inci_name = 'Allantoin'), 'allantoin'),
  ((select ingredient_id from public.ingredients where inci_name = 'Zinc PCA'), 'zinc_pca'),
  ((select ingredient_id from public.ingredients where inci_name = 'Titanium Dioxide'), 'uv_filter');

-- ---------------------------------------------------------------------------
-- Seed: products (3 per category x 6 categories = 18)
-- ---------------------------------------------------------------------------
insert into public.products (brand, product_name, category, catalog_source) values
  ('CeraVe', 'Hydrating Facial Cleanser', 'Cleanser', 'hackathon_mvp_seed'),
  ('La Roche-Posay', 'Toleriane Purifying Foaming Cleanser', 'Cleanser', 'hackathon_mvp_seed'),
  ('The Ordinary', 'Salicylic Acid 2% Cleanser', 'Cleanser', 'hackathon_mvp_seed'),

  ('CeraVe', 'Moisturizing Cream', 'Moisturizer', 'hackathon_mvp_seed'),
  ('iUNIK', 'Centella Calming Gel Cream', 'Moisturizer', 'hackathon_mvp_seed'),
  ('Dr. Jart+', 'Cicapair Cream', 'Moisturizer', 'hackathon_mvp_seed'),

  ('EltaMD', 'UV Clear SPF 46', 'Sunscreen', 'hackathon_mvp_seed'),
  ('La Roche-Posay', 'Anthelios Melt-in Milk SPF 60', 'Sunscreen', 'hackathon_mvp_seed'),
  ('Biore', 'UV Aqua Rich Watery Essence SPF 50', 'Sunscreen', 'hackathon_mvp_seed'),

  ('The Ordinary', 'Niacinamide 10% + Zinc 1%', 'Serum', 'hackathon_mvp_seed'),
  ('The Ordinary', 'Hyaluronic Acid 2% + B5', 'Serum', 'hackathon_mvp_seed'),
  ('SkinCeuticals', 'C E Ferulic', 'Serum', 'hackathon_mvp_seed'),

  ('Differin', 'Adapalene Gel 0.1%', 'Treatment', 'hackathon_mvp_seed'),
  ('The Ordinary', 'AHA 30% + BHA 2% Peeling Solution', 'Treatment', 'hackathon_mvp_seed'),
  ('La Roche-Posay', 'Effaclar Duo Benzoyl Peroxide Treatment', 'Treatment', 'hackathon_mvp_seed'),

  ('Paula''s Choice', 'Skin Perfecting 2% BHA Liquid', 'Toner/Essence', 'hackathon_mvp_seed'),
  ('Pyunkang Yul', 'Essence Toner', 'Toner/Essence', 'hackathon_mvp_seed'),
  ('SkinFix', 'Barrier+ Nutrient Toning Essence', 'Toner/Essence', 'hackathon_mvp_seed');

-- ---------------------------------------------------------------------------
-- Seed: product_ingredients (key ingredients only, per guide Section 3)
-- ---------------------------------------------------------------------------
insert into public.product_ingredients (product_id, ingredient_id, ingredient_source_type) values
  ((select product_id from public.products where product_name = 'Hydrating Facial Cleanser'), (select ingredient_id from public.ingredients where inci_name = 'Ceramide NP'), 'marketing_claim'),
  ((select product_id from public.products where product_name = 'Hydrating Facial Cleanser'), (select ingredient_id from public.ingredients where inci_name = 'Glycerin'), 'marketing_claim'),
  ((select product_id from public.products where product_name = 'Hydrating Facial Cleanser'), (select ingredient_id from public.ingredients where inci_name = 'Panthenol'), 'marketing_claim'),

  ((select product_id from public.products where product_name = 'Toleriane Purifying Foaming Cleanser'), (select ingredient_id from public.ingredients where inci_name = 'Glycerin'), 'marketing_claim'),
  ((select product_id from public.products where product_name = 'Toleriane Purifying Foaming Cleanser'), (select ingredient_id from public.ingredients where inci_name = 'Niacinamide'), 'marketing_claim'),

  ((select product_id from public.products where product_name = 'Salicylic Acid 2% Cleanser'), (select ingredient_id from public.ingredients where inci_name = 'Salicylic Acid'), 'active_panel'),
  ((select product_id from public.products where product_name = 'Salicylic Acid 2% Cleanser'), (select ingredient_id from public.ingredients where inci_name = 'Glycerin'), 'marketing_claim'),

  ((select product_id from public.products where product_name = 'Moisturizing Cream'), (select ingredient_id from public.ingredients where inci_name = 'Ceramide NP'), 'marketing_claim'),
  ((select product_id from public.products where product_name = 'Moisturizing Cream'), (select ingredient_id from public.ingredients where inci_name = 'Glycerin'), 'marketing_claim'),
  ((select product_id from public.products where product_name = 'Moisturizing Cream'), (select ingredient_id from public.ingredients where inci_name = 'Squalane'), 'marketing_claim'),

  ((select product_id from public.products where product_name = 'Centella Calming Gel Cream'), (select ingredient_id from public.ingredients where inci_name = 'Centella Asiatica Extract'), 'marketing_claim'),
  ((select product_id from public.products where product_name = 'Centella Calming Gel Cream'), (select ingredient_id from public.ingredients where inci_name = 'Panthenol'), 'marketing_claim'),
  ((select product_id from public.products where product_name = 'Centella Calming Gel Cream'), (select ingredient_id from public.ingredients where inci_name = 'Beta-Glucan'), 'marketing_claim'),

  ((select product_id from public.products where product_name = 'Cicapair Cream'), (select ingredient_id from public.ingredients where inci_name = 'Centella Asiatica Extract'), 'marketing_claim'),
  ((select product_id from public.products where product_name = 'Cicapair Cream'), (select ingredient_id from public.ingredients where inci_name = 'Niacinamide'), 'marketing_claim'),
  ((select product_id from public.products where product_name = 'Cicapair Cream'), (select ingredient_id from public.ingredients where inci_name = 'Allantoin'), 'marketing_claim'),

  ((select product_id from public.products where product_name = 'UV Clear SPF 46'), (select ingredient_id from public.ingredients where inci_name = 'Niacinamide'), 'marketing_claim'),
  ((select product_id from public.products where product_name = 'UV Clear SPF 46'), (select ingredient_id from public.ingredients where inci_name = 'Titanium Dioxide'), 'active_panel'),

  ((select product_id from public.products where product_name = 'Anthelios Melt-in Milk SPF 60'), (select ingredient_id from public.ingredients where inci_name = 'Titanium Dioxide'), 'active_panel'),
  ((select product_id from public.products where product_name = 'Anthelios Melt-in Milk SPF 60'), (select ingredient_id from public.ingredients where inci_name = 'Glycerin'), 'marketing_claim'),
  ((select product_id from public.products where product_name = 'Anthelios Melt-in Milk SPF 60'), (select ingredient_id from public.ingredients where inci_name = 'Fragrance (Parfum)'), 'marketing_claim'),

  ((select product_id from public.products where product_name = 'UV Aqua Rich Watery Essence SPF 50'), (select ingredient_id from public.ingredients where inci_name = 'Titanium Dioxide'), 'active_panel'),
  ((select product_id from public.products where product_name = 'UV Aqua Rich Watery Essence SPF 50'), (select ingredient_id from public.ingredients where inci_name = 'Sodium Hyaluronate'), 'marketing_claim'),

  ((select product_id from public.products where product_name = 'Niacinamide 10% + Zinc 1%'), (select ingredient_id from public.ingredients where inci_name = 'Niacinamide'), 'active_panel'),
  ((select product_id from public.products where product_name = 'Niacinamide 10% + Zinc 1%'), (select ingredient_id from public.ingredients where inci_name = 'Zinc PCA'), 'active_panel'),

  ((select product_id from public.products where product_name = 'Hyaluronic Acid 2% + B5'), (select ingredient_id from public.ingredients where inci_name = 'Sodium Hyaluronate'), 'active_panel'),
  ((select product_id from public.products where product_name = 'Hyaluronic Acid 2% + B5'), (select ingredient_id from public.ingredients where inci_name = 'Panthenol'), 'active_panel'),

  ((select product_id from public.products where product_name = 'C E Ferulic'), (select ingredient_id from public.ingredients where inci_name = 'Ascorbic Acid'), 'active_panel'),
  ((select product_id from public.products where product_name = 'C E Ferulic'), (select ingredient_id from public.ingredients where inci_name = 'Alcohol Denat.'), 'marketing_claim'),

  ((select product_id from public.products where product_name = 'Adapalene Gel 0.1%'), (select ingredient_id from public.ingredients where inci_name = 'Adapalene'), 'active_panel'),

  ((select product_id from public.products where product_name = 'AHA 30% + BHA 2% Peeling Solution'), (select ingredient_id from public.ingredients where inci_name = 'Glycolic Acid'), 'active_panel'),
  ((select product_id from public.products where product_name = 'AHA 30% + BHA 2% Peeling Solution'), (select ingredient_id from public.ingredients where inci_name = 'Salicylic Acid'), 'active_panel'),

  ((select product_id from public.products where product_name = 'Effaclar Duo Benzoyl Peroxide Treatment'), (select ingredient_id from public.ingredients where inci_name = 'Benzoyl Peroxide'), 'active_panel'),
  ((select product_id from public.products where product_name = 'Effaclar Duo Benzoyl Peroxide Treatment'), (select ingredient_id from public.ingredients where inci_name = 'Zinc PCA'), 'marketing_claim'),

  ((select product_id from public.products where product_name = 'Skin Perfecting 2% BHA Liquid'), (select ingredient_id from public.ingredients where inci_name = 'Salicylic Acid'), 'active_panel'),

  ((select product_id from public.products where product_name = 'Essence Toner'), (select ingredient_id from public.ingredients where inci_name = 'Beta-Glucan'), 'marketing_claim'),
  ((select product_id from public.products where product_name = 'Essence Toner'), (select ingredient_id from public.ingredients where inci_name = 'Panthenol'), 'marketing_claim'),

  ((select product_id from public.products where product_name = 'Barrier+ Nutrient Toning Essence'), (select ingredient_id from public.ingredients where inci_name = 'Ceramide NP'), 'marketing_claim'),
  ((select product_id from public.products where product_name = 'Barrier+ Nutrient Toning Essence'), (select ingredient_id from public.ingredients where inci_name = 'Glycerin'), 'marketing_claim'),
  ((select product_id from public.products where product_name = 'Barrier+ Nutrient Toning Essence'), (select ingredient_id from public.ingredients where inci_name = 'Squalane'), 'marketing_claim');
