-- Skingredient — persists the "Today's Plan" (src/lib/recommendationEngine.ts
-- output) actually shown at scan time, so History
-- (src/routes/history.$analysisId.tsx) can display the real historical plan.
--
-- generateRecommendation() takes today's live symptoms/scheduleTomorrow/
-- ingredientHistory as input, not just the analysis scores — recomputing it
-- for a past record would silently mix in today's context and show a plan
-- that was never actually given for that scan. Storing the computed
-- DailyRecommendation object as-is (same jsonb-snapshot pattern as
-- youcam_raw) avoids that entirely.
alter table public.skin_analyses
  add column if not exists recommendation_snapshot jsonb;
