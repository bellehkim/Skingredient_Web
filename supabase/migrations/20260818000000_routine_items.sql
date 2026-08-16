-- Manually-added Routine items (src/routes/shelf.$productId.index.tsx's
-- "Add to routine") — separate from the automatic AM/PM composition
-- routineComposer.ts already does. A Shelf product (catalog or custom) can
-- be manually pinned to Morning, Evening, or both; "Both" is represented as
-- two rows, one per time_of_day, not a third enum value.
--
-- Exactly one of product_id / custom_product_id is set per row (the same
-- polymorphic-owner pattern used nowhere else yet in this schema, but the
-- cleanest fit here since shelf products are genuinely one of two distinct
-- tables — see src/lib/data/routineItems.ts for how the app resolves this
-- back to the app's single Product.id string, "5" vs "custom-5").
--
-- Adding to Routine never touches shelf_items/custom_products (My Shelf and
-- Routine are deliberately separate concepts); removing a routine_items row
-- never removes the underlying shelf product either.
create table public.routine_items (
  routine_item_id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id bigint references public.products(product_id) on delete cascade,
  custom_product_id bigint references public.custom_products(custom_product_id) on delete cascade,
  time_of_day varchar(2) not null check (time_of_day in ('am', 'pm')),
  created_at timestamptz not null default now(),
  check ((product_id is not null) <> (custom_product_id is not null)),
  unique (user_id, product_id, time_of_day),
  unique (user_id, custom_product_id, time_of_day)
);

-- Cleared automatically on Reset Demo: resetDemoUser() (src/lib/data/demoUser.ts)
-- deletes and re-inserts the profiles row, and this table cascades from
-- profiles.id — no extra reset code needed, same as every other per-user table.
alter table public.routine_items enable row level security;
create policy "demo user routine items access" on public.routine_items
  for all
  using (user_id = '00000000-0000-0000-0000-000000000001'::uuid)
  with check (user_id = '00000000-0000-0000-0000-000000000001'::uuid);
