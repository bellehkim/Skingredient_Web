-- Skingredient — "Today's Skin Strategy" (src/lib/skinStrategyService.ts).
--
-- Deliberately separate from skin_direction: skin_direction is one short
-- sentence generated from raw scores only (shown on Home); skin_strategy is
-- a 3-4 sentence paragraph generated from the fuller picture (scores,
-- Overall Condition, Skin Type, derived concerns, tomorrow's schedule,
-- minimal Shelf category context) and shown on Results/History. Different
-- prompts, different consumers — kept as distinct columns rather than
-- overloading skin_direction.
alter table public.skin_analyses
  add column skin_strategy text,
  add column skin_strategy_generated_at timestamptz;
