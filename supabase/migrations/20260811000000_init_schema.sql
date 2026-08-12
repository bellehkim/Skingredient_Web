-- Skingredient — initial schema (single demo-user phase, pre-auth)
--
-- Auth note: profiles.id and skin_analyses.user_id are plain UUID columns for
-- now, not FKs to auth.users — there is no auth.users row for the demo
-- identity yet (see src/lib/data/demoUser.ts). When Supabase Auth is
-- introduced later:
--   1. alter table public.profiles add constraint profiles_id_fkey
--      foreign key (id) references auth.users(id) on delete cascade;
--      (skin_analyses needs no equivalent change — it references
--      public.profiles(id), not auth.users, so it's already correct.)
--   2. Swap the demo-uuid literal in the RLS policies below for auth.uid().
--   3. Update src/lib/data/demoUser.ts's getCurrentUserId() to read the
--      real session instead of returning the constant.
-- No other schema or application code needs to change.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key,
  display_name text,
  has_completed_onboarding boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skin_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,

  -- source data: normalized Skingredient metrics (0-100, higher = healthier)
  -- — see src/lib/types.ts SkinAnalysisResult, normalize() in
  -- src/routes/api/skin-analysis.ts. Never updated after insert.
  redness smallint not null check (redness between 0 and 100),
  hydration smallint not null check (hydration between 0 and 100),
  oiliness smallint not null check (oiliness between 0 and 100),
  acne smallint not null check (acne between 0 and 100),
  pores smallint not null check (pores between 0 and 100),
  texture smallint not null check (texture between 0 and 100),
  dark_spots smallint not null check (dark_spots between 0 and 100),

  -- AI-generated once per row by Claude (src/lib/skinDirectionService.ts).
  -- The only column ever updated after insert — exclusively by the
  -- skin-direction retry flow when generation initially failed.
  skin_direction text,
  skin_direction_generated_at timestamptz,

  -- Raw YouCam task output array (score_info-equivalent), captured before
  -- normalize() runs. No headers, no auth, no image — see
  -- src/routes/api/skin-analysis.ts.
  youcam_raw jsonb,

  -- Identifies which normalization mapping + Claude prompt version produced
  -- this row. Semantic version. v1.0.0 = the mapping in
  -- src/routes/api/skin-analysis.ts and the prompt in
  -- src/lib/skinDirectionService.ts as of this migration.
  algorithm_version text not null default 'v1.0.0',

  -- Derived values (overall score/condition, skin type) are deliberately
  -- NOT stored here — see src/lib/overallCondition.ts / skinType.ts. They
  -- are recomputed from the metrics above on every read, so historical rows
  -- automatically benefit from future weighting/threshold improvements.

  analyzed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index skin_analyses_user_id_analyzed_at_idx
  on public.skin_analyses (user_id, analyzed_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Seed the single demo profile (id must match DEMO_USER_ID in
-- src/lib/data/demoUser.ts).
insert into public.profiles (id) values ('00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- Row Level Security. NOTE: with no auth session, auth.uid() is always NULL,
-- so these policies are scoped to the literal demo UUID rather than
-- auth.uid() — a structural guard (nothing can touch rows for any other
-- UUID), not real per-request identity verification. Anyone holding the anon
-- key can act as the demo user; that becomes real security only once real
-- auth replaces this (see the note at the top of this file).
alter table public.profiles enable row level security;
create policy "demo user profile access" on public.profiles
  for all
  using (id = '00000000-0000-0000-0000-000000000001'::uuid)
  with check (id = '00000000-0000-0000-0000-000000000001'::uuid);

alter table public.skin_analyses enable row level security;
create policy "demo user analyses access" on public.skin_analyses
  for all
  using (user_id = '00000000-0000-0000-0000-000000000001'::uuid)
  with check (user_id = '00000000-0000-0000-0000-000000000001'::uuid);
