import { supabase } from "./supabaseClient";
import { getCurrentUserId } from "./demoUser";
import type { DailyRecommendation, SkinAnalysisResult } from "@/lib/types";
import type { YouCamTaskResultItem } from "@/routes/api/skin-analysis";
import { isDemoModeActive } from "@/lib/demoMode";
import { getLocalRows, insertLocalRow, upsertLocalRow } from "./localStore";

const ALGORITHM_VERSION = "v1.0.0";

interface LocalSkinAnalysisRow extends SkinAnalysisRow {
  user_id: string;
}

interface SkinAnalysisRow {
  id: string;
  user_id: string;
  redness: number;
  hydration: number;
  oiliness: number;
  acne: number;
  pores: number;
  texture: number;
  dark_spots: number;
  skin_direction: string | null;
  skin_direction_generated_at: string | null;
  skin_strategy: string | null;
  skin_strategy_generated_at: string | null;
  recommendation_snapshot: DailyRecommendation | null;
  youcam_raw: YouCamTaskResultItem[] | null;
  algorithm_version: string;
  analyzed_at: string;
  created_at: string;
}

function rowToResult(row: SkinAnalysisRow): SkinAnalysisResult {
  return {
    redness: row.redness,
    hydration: row.hydration,
    oiliness: row.oiliness,
    acne: row.acne,
    pores: row.pores,
    texture: row.texture,
    ageSpots: row.dark_spots,
    skinDirection: row.skin_direction,
    skinDirectionGeneratedAt: row.skin_direction_generated_at,
    skinStrategy: row.skin_strategy,
    skinStrategyGeneratedAt: row.skin_strategy_generated_at,
    recommendationSnapshot: row.recommendation_snapshot,
    analyzedAt: row.analyzed_at,
    id: row.id,
    createdAt: row.created_at,
    algorithmVersion: row.algorithm_version,
  };
}

/**
 * Inserts one new, immutable skin_analyses row. Called exactly once per
 * completed scan (src/routes/scan.index.tsx), after YouCam + Claude have
 * already produced `result` — never calls either API itself. Returns the
 * inserted row (with its generated id/created_at/algorithm_version), which
 * becomes the app's source of truth for this analysis going forward.
 */
export async function createAnalysis(
  result: SkinAnalysisResult,
  youcamRaw?: YouCamTaskResultItem[],
  recommendationSnapshot?: DailyRecommendation,
): Promise<SkinAnalysisResult> {
  const userId = await getCurrentUserId();

  if (isDemoModeActive()) {
    const now = new Date().toISOString();
    const row: LocalSkinAnalysisRow = {
      id: result.id ?? `demo-scan-${Date.now()}`,
      user_id: userId,
      redness: result.redness,
      hydration: result.hydration,
      oiliness: result.oiliness,
      acne: result.acne,
      pores: result.pores,
      texture: result.texture,
      dark_spots: result.ageSpots,
      skin_direction: result.skinDirection ?? null,
      skin_direction_generated_at: result.skinDirection ? now : null,
      skin_strategy: result.skinStrategy ?? null,
      skin_strategy_generated_at: result.skinStrategy ? now : null,
      recommendation_snapshot: recommendationSnapshot ?? null,
      youcam_raw: youcamRaw ?? null,
      algorithm_version: ALGORITHM_VERSION,
      analyzed_at: result.analyzedAt,
      created_at: now,
    };
    return rowToResult(insertLocalRow("skin_analyses", row));
  }

  const { data, error } = await supabase
    .from("skin_analyses")
    .insert({
      user_id: userId,
      redness: result.redness,
      hydration: result.hydration,
      oiliness: result.oiliness,
      acne: result.acne,
      pores: result.pores,
      texture: result.texture,
      dark_spots: result.ageSpots,
      skin_direction: result.skinDirection ?? null,
      skin_direction_generated_at: result.skinDirection ? new Date().toISOString() : null,
      skin_strategy: result.skinStrategy ?? null,
      skin_strategy_generated_at: result.skinStrategy ? new Date().toISOString() : null,
      recommendation_snapshot: recommendationSnapshot ?? null,
      youcam_raw: youcamRaw ?? null,
      algorithm_version: ALGORITHM_VERSION,
      analyzed_at: result.analyzedAt,
    })
    .select()
    .single();

  if (error) throw error;
  return rowToResult(data as SkinAnalysisRow);
}

/**
 * A third narrow exception to "analyses are immutable": patches only
 * recommendation_snapshot, for when today's Daily Check-in changes but
 * today's analysis already has a persisted skin_strategy — the "Today's
 * Plan" ingredients can legitimately shift with new check-in context even
 * though the AI Skin Strategy paragraph deliberately does not regenerate
 * (see src/lib/skinStrategyFlow.ts). Never touches skin_strategy.
 */
export async function updateRecommendationSnapshot(
  analysisId: string,
  recommendationSnapshot: DailyRecommendation,
): Promise<SkinAnalysisResult> {
  const userId = await getCurrentUserId();

  if (isDemoModeActive()) {
    const row = upsertLocalRow<LocalSkinAnalysisRow>(
      "skin_analyses",
      { id: analysisId, user_id: userId },
      { recommendation_snapshot: recommendationSnapshot },
    );
    return rowToResult(row);
  }

  const { data, error } = await supabase
    .from("skin_analyses")
    .update({ recommendation_snapshot: recommendationSnapshot })
    .eq("id", analysisId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return rowToResult(data as SkinAnalysisRow);
}

/** Most recent analysis for the current user, or null if they have none yet. */
export async function getLatestAnalysis(): Promise<SkinAnalysisResult | null> {
  const userId = await getCurrentUserId();

  if (isDemoModeActive()) {
    const rows = getLocalRows<LocalSkinAnalysisRow>("skin_analyses", { user_id: userId });
    const [latest] = rows.slice().sort((a, b) => b.analyzed_at.localeCompare(a.analyzed_at));
    return latest ? rowToResult(latest) : null;
  }

  const { data, error } = await supabase
    .from("skin_analyses")
    .select()
    .eq("user_id", userId)
    .order("analyzed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToResult(data as SkinAnalysisRow) : null;
}

/** Most recent analyses for the current user, newest first. Powers the
 * History tab (src/routes/insights.tsx). */
export async function getAnalysisHistory(limit = 30): Promise<SkinAnalysisResult[]> {
  const userId = await getCurrentUserId();

  if (isDemoModeActive()) {
    return getLocalRows<LocalSkinAnalysisRow>("skin_analyses", { user_id: userId })
      .slice()
      .sort((a, b) => b.analyzed_at.localeCompare(a.analyzed_at))
      .slice(0, limit)
      .map(rowToResult);
  }

  const { data, error } = await supabase
    .from("skin_analyses")
    .select()
    .eq("user_id", userId)
    .order("analyzed_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as SkinAnalysisRow[]).map(rowToResult);
}

/** A single past analysis by id, for the History detail view — or null if it
 * doesn't exist (or belongs to a different user). Pure read; never
 * regenerates YouCam/Claude output. */
export async function getAnalysisById(id: string): Promise<SkinAnalysisResult | null> {
  const userId = await getCurrentUserId();

  if (isDemoModeActive()) {
    const [row] = getLocalRows<LocalSkinAnalysisRow>("skin_analyses", { id, user_id: userId });
    return row ? rowToResult(row) : null;
  }

  const { data, error } = await supabase
    .from("skin_analyses")
    .select()
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToResult(data as SkinAnalysisRow) : null;
}

/**
 * One of two narrow exceptions to "analyses are immutable" (see
 * updateSkinStrategy below for the other): patches skin_direction (+ its
 * generated_at) on an existing row after the manual retry flow
 * (src/routes/index.tsx) succeeds. Never inserts a new row, never touches
 * any other column. Returns the updated row so callers can refresh app state
 * from the persisted value rather than the pre-update object.
 */
export async function updateSkinDirection(
  analysisId: string,
  skinDirection: string,
): Promise<SkinAnalysisResult> {
  const userId = await getCurrentUserId();

  if (isDemoModeActive()) {
    const now = new Date().toISOString();
    const row = upsertLocalRow<LocalSkinAnalysisRow>(
      "skin_analyses",
      { id: analysisId, user_id: userId },
      { skin_direction: skinDirection, skin_direction_generated_at: now },
    );
    return rowToResult(row);
  }

  const { data, error } = await supabase
    .from("skin_analyses")
    .update({
      skin_direction: skinDirection,
      skin_direction_generated_at: new Date().toISOString(),
    })
    .eq("id", analysisId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return rowToResult(data as SkinAnalysisRow);
}

/**
 * The other narrow exception to "analyses are immutable": patches
 * skin_strategy (+ its generated_at) and recommendation_snapshot on an
 * existing row once today's Daily Check-in makes AI Skin Strategy
 * generation possible — either right after a scan when a check-in already
 * exists, or right after a check-in when today's scan already exists (see
 * src/lib/skinStrategyFlow.ts, the only caller — it's also the one place
 * that enforces "never regenerate an existing non-null skin_strategy").
 * Never inserts a new row, never touches any other column.
 */
export async function updateSkinStrategy(
  analysisId: string,
  skinStrategy: string,
  recommendationSnapshot: DailyRecommendation,
): Promise<SkinAnalysisResult> {
  const userId = await getCurrentUserId();

  if (isDemoModeActive()) {
    const now = new Date().toISOString();
    const row = upsertLocalRow<LocalSkinAnalysisRow>(
      "skin_analyses",
      { id: analysisId, user_id: userId },
      {
        skin_strategy: skinStrategy,
        skin_strategy_generated_at: now,
        recommendation_snapshot: recommendationSnapshot,
      },
    );
    return rowToResult(row);
  }

  const { data, error } = await supabase
    .from("skin_analyses")
    .update({
      skin_strategy: skinStrategy,
      skin_strategy_generated_at: new Date().toISOString(),
      recommendation_snapshot: recommendationSnapshot,
    })
    .eq("id", analysisId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return rowToResult(data as SkinAnalysisRow);
}
