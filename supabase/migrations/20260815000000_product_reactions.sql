-- Skingredient — user-reported per-product reactions (Shelf's "How did your
-- skin react?", product-level step). Deliberately separate from
-- ingredient_reactions (supabase/migrations/20260813030000_ingredient_reactions.sql):
-- a product reaction is evidence about one exact product, never converted
-- into an ingredient-level sensitivity. Ingredient Sensitivities stay their
-- own explicit, separately-entered signal.
--
-- One current reaction per product per user, not a log/diary — same
-- unique-plus-upsert pattern as ingredient_reactions. Deliberately minimal:
-- no severity, notes, photos, or medical/allergy fields.
create table public.product_reactions (
  product_reaction_id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id bigint not null references public.products(product_id) on delete cascade,
  reaction_type varchar(20) not null check (reaction_type in ('helpful','neutral','irritating','unknown')),
  -- Only meaningful when reaction_type = 'irritating'. Defaults to true (the
  -- product is excluded from Recommended for You / Routine as soon as the
  -- reaction is saved); set to false only if the user explicitly taps "Keep
  -- it anyway" on the follow-up prompt. Ignored for helpful/neutral/unknown,
  -- which never exclude anything.
  excluded_from_recommendations boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- Same demo-uuid-literal RLS pattern as ingredient_reactions/shelf_items —
-- becomes auth.uid()-scoped once real auth replaces the single demo identity
-- in src/lib/data/demoUser.ts. The `on delete cascade` above means Reset
-- Demo's existing delete-and-reinsert of the profiles row already clears
-- this table with no extra code.
alter table public.product_reactions enable row level security;
create policy "demo user product reactions access" on public.product_reactions
  for all
  using (user_id = '00000000-0000-0000-0000-000000000001'::uuid)
  with check (user_id = '00000000-0000-0000-0000-000000000001'::uuid);
