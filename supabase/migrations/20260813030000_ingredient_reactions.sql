-- Skingredient — user-reported per-ingredient reactions (Shelf's "How did
-- your skin react?").
--
-- One current reaction per ingredient per user, not a log/diary — the
-- unique constraint plus an upsert (src/lib/data/ingredientReactions.ts) is
-- exactly why: reporting again overwrites the prior state instead of
-- accumulating rows. Deliberately minimal per the MVP scope: no severity,
-- notes, photos, product attribution, duration, or medical/allergy fields.
create table public.ingredient_reactions (
  reaction_id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  ingredient_id bigint not null references public.ingredients(ingredient_id) on delete cascade,
  reaction_type varchar(20) not null check (reaction_type in ('helpful','neutral','irritating','unknown')),
  created_at timestamptz not null default now(),
  unique (user_id, ingredient_id)
);

-- Same demo-uuid-literal RLS pattern as shelf_items/custom_products — becomes
-- auth.uid()-scoped once real auth replaces the single demo identity in
-- src/lib/data/demoUser.ts. The `on delete cascade` above means Reset Demo's
-- existing delete-and-reinsert of the profiles row (src/lib/data/demoUser.ts)
-- already clears this table with no extra code.
alter table public.ingredient_reactions enable row level security;
create policy "demo user ingredient reactions access" on public.ingredient_reactions
  for all
  using (user_id = '00000000-0000-0000-0000-000000000001'::uuid)
  with check (user_id = '00000000-0000-0000-0000-000000000001'::uuid);
