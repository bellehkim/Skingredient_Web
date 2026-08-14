-- Skingredient — Daily Check-in (src/routes/scan.check-in.tsx), persisted so
-- it's a durable, date-scoped source of truth rather than localStorage. One
-- row per user per calendar day: submitting again on the same day updates
-- that day's row (see the unique constraint + upsert in
-- src/lib/data/checkins.ts), rather than accumulating a log. Deliberately
-- minimal per the MVP scope — no extra fields.
create table public.daily_checkins (
  check_in_id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  check_in_date date not null,
  symptoms text[] not null default '{}',
  schedule_option varchar(20) not null check (
    schedule_option in ('important-event', 'outdoor-day', 'travel', 'cosmetic-treatment', 'none')
  ),
  event_timing varchar(20) not null check (
    event_timing in ('tomorrow', 'three-days', 'week', 'none')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, check_in_date)
);

-- Same demo-uuid-literal RLS pattern as ingredient_reactions/shelf_items —
-- becomes auth.uid()-scoped once real auth replaces the single demo identity
-- in src/lib/data/demoUser.ts. The `on delete cascade` above means Reset
-- Demo's existing delete-and-reinsert of the profiles row already clears
-- this table with no extra code.
alter table public.daily_checkins enable row level security;
create policy "demo user daily checkins access" on public.daily_checkins
  for all
  using (user_id = '00000000-0000-0000-0000-000000000001'::uuid)
  with check (user_id = '00000000-0000-0000-0000-000000000001'::uuid);
