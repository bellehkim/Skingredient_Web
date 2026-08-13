import { supabase } from "./supabaseClient";
import { getCurrentUserId } from "./demoUser";

export type Reaction = "helpful" | "neutral" | "irritating" | "unknown";

interface ReactionRow {
  reaction_type: Reaction;
  ingredients: { inci_name: string } | null;
}

/**
 * All of the demo user's current ingredient reactions, keyed by lowercased
 * inci_name — the exact same key shape src/lib/appStore.tsx's ingredientHistory
 * already used when it was localStorage-only, so no existing consumer
 * (src/routes/ingredients.$ingredientId.tsx, src/routes/shelf.$productId.tsx)
 * needs to change.
 */
export async function getIngredientReactions(): Promise<Record<string, Reaction>> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("ingredient_reactions")
    .select("reaction_type, ingredients ( inci_name )")
    .eq("user_id", userId);

  if (error) throw error;

  const result: Record<string, Reaction> = {};
  for (const row of data as unknown as ReactionRow[]) {
    if (row.ingredients) result[row.ingredients.inci_name.toLowerCase()] = row.reaction_type;
  }
  return result;
}

/**
 * Upserts one reaction for one exact ingredient, resolved by inci_name
 * (unique per supabase/migrations/20260812010000_product_catalog.sql) —
 * never fuzzy. One current reaction per ingredient per user (see the
 * unique(user_id, ingredient_id) constraint): reporting again overwrites
 * the prior value rather than accumulating a history.
 */
export async function upsertIngredientReaction(
  inciName: string,
  reactionType: Reaction,
): Promise<void> {
  const userId = await getCurrentUserId();

  const { data: ingredient, error: lookupError } = await supabase
    .from("ingredients")
    .select("ingredient_id")
    .eq("inci_name", inciName)
    .single();
  if (lookupError) throw lookupError;

  const { error } = await supabase.from("ingredient_reactions").upsert(
    {
      user_id: userId,
      ingredient_id: (ingredient as { ingredient_id: number }).ingredient_id,
      reaction_type: reactionType,
    },
    { onConflict: "user_id,ingredient_id" },
  );
  if (error) throw error;
}
