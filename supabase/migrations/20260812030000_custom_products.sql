-- Skingredient — manually-added personal products (My Shelf "Add Product").
--
-- Deliberately separate from public.products: these are not part of the
-- curated recommendation catalog (no ingredients, not matched against
-- recommendation categories) and are entirely user-owned, so unlike the
-- read-only catalog tables this one allows insert/delete from the client,
-- scoped by RLS — same shape as public.skin_analyses.
create table public.custom_products (
  custom_product_id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  brand varchar(100) not null,
  product_name varchar(200) not null,
  category varchar(20) not null check (category in ('Cleanser','Moisturizer','Sunscreen','Serum','Treatment','Toner/Essence')),
  created_at timestamptz not null default now()
);

alter table public.custom_products enable row level security;
create policy "demo user custom products access" on public.custom_products
  for all
  using (user_id = '00000000-0000-0000-0000-000000000001'::uuid)
  with check (user_id = '00000000-0000-0000-0000-000000000001'::uuid);
