import { supabase } from "./supabaseClient";
import { getCurrentUserId } from "./demoUser";
import type { SkinAnalysisResult } from "@/lib/types";
import type { YouCamTaskResultItem } from "@/routes/api/skin-analysis";

const ALGORITHM_VERSION = "v1.0.0";

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
): Promise<SkinAnalysisResult> {
  const userId = await getCurrentUserId();

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
      youcam_raw: youcamRaw ?? null,
      algorithm_version: ALGORITHM_VERSION,
      analyzed_at: result.analyzedAt,
    })
    .select()
    .single();

  if (error) throw error;
  return rowToResult(data as SkinAnalysisRow);
}

/** Most recent analysis for the current user, or null if they have none yet. */
export async function getLatestAnalysis(): Promise<SkinAnalysisResult | null> {
  const userId = await getCurrentUserId();

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
 * The one narrow exception to "analyses are immutable": patches
 * skin_direction (+ its generated_at) on an existing row after the manual
 * retry flow (src/routes/index.tsx) succeeds. Never inserts a new row, never
 * touches any other column. Returns the updated row so callers can refresh
 * app state from the persisted value rather than the pre-update object.
 */
export async function updateSkinDirection(
  analysisId: string,
  skinDirection: string,
): Promise<SkinAnalysisResult> {
  const userId = await getCurrentUserId();

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
