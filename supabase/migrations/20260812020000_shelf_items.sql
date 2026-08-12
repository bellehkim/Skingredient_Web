-- Skingredient — user↔product shelf relationship.
--
-- Deliberately a thin join table: user_id + product_id only. Shelf never
-- copies product data — product details are always read live via the FK to
-- public.products, so catalog edits/corrections are reflected immediately
-- and the global catalog can never be mutated by a shelf save/remove.
create table public.shelf_items (
  shelf_item_id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id bigint not null references public.products(product_id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- Same demo-uuid-literal RLS pattern as skin_analyses (see
-- 20260811000000_init_schema.sql) — becomes auth.uid()-scoped once real auth
-- replaces the single demo identity in src/lib/data/demoUser.ts.
alter table public.shelf_items enable row level security;
create policy "demo user shelf access" on public.shelf_items
  for all
  using (user_id = '00000000-0000-0000-0000-000000000001'::uuid)
  with check (user_id = '00000000-0000-0000-0000-000000000001'::uuid);
