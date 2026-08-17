import { supabase } from "./supabaseClient";
import { getCurrentUserId } from "./demoUser";
import { isDemoModeActive } from "@/lib/demoMode";
import { ALL_INGREDIENTS_SNAPSHOT } from "@/data/catalogSnapshot";
import { deleteLocalRows, getLocalRows, upsertLocalRow } from "./localStore";

export type Reaction = "helpful" | "neutral" | "irritating" | "unknown";

interface ReactionRow {
  reaction_type: Reaction;
  ingredients: {
    inci_name: string;
    ingredient_functions: { functional_category: string }[];
  } | null;
}

export interface IngredientReactionsData {
  /** All current reactions, keyed by lowercased inci_name — the exact same key
   * shape src/lib/appStore.tsx's ingredientHistory already used when it was
   * localStorage-only, so no existing consumer (src/routes/ingredients.$ingredientId.tsx,
   * src/routes/shelf.$productId.tsx) needs to change. */
  history: Record<string, Reaction>;
  /** Exact inci_name (lowercased) of every ingredient reported "irritating" —
   * used for exact-identity product/routine exclusion. Never fuzzy-matched. */
  irritatingIngredients: Set<string>;
  /** Original-case inci_name of every ingredient reported "irritating" — for
   * display (e.g. AI Skin Strategy context). */
  irritatingIngredientNames: string[];
  /** functional_category of every ingredient reported "irritating", via the
   * existing ingredient_functions bridge — used only as a conservative,
   * broader UI-level signal (e.g. "Avoid Today" category labels), never to
   * treat a whole ingredient family as unsafe. */
  irritatingCategories: Set<string>;
}

/** Default/loading state — src/lib/appStore.tsx uses this until the real
 * Supabase read resolves. */
export const EMPTY_INGREDIENT_REACTIONS: IngredientReactionsData = {
  history: {},
  irritatingIngredients: new Set(),
  irritatingIngredientNames: [],
  irritatingCategories: new Set(),
};

/**
 * All of the demo user's current ingredient reactions, plus derived
 * exact-ingredient and functional-category sets for personalization. One
 * round trip; see IngredientReactionsData field docs for how each shape is
 * used downstream.
 */
interface LocalReactionRow {
  user_id: string;
  ingredient_id: number;
  reaction_type: Reaction;
}

function reactionRowsFromLocal(rows: LocalReactionRow[]): ReactionRow[] {
  return rows.map((row) => {
    const ingredient = ALL_INGREDIENTS_SNAPSHOT.find((i) => i.ingredient_id === row.ingredient_id);
    return {
      reaction_type: row.reaction_type,
      ingredients: ingredient
        ? { inci_name: ingredient.inci_name, ingredient_functions: ingredient.ingredient_functions }
        : null,
    };
  });
}

export async function getIngredientReactions(): Promise<IngredientReactionsData> {
  const userId = await getCurrentUserId();

  const rows = isDemoModeActive()
    ? reactionRowsFromLocal(getLocalRows<LocalReactionRow>("ingredient_reactions", { user_id: userId }))
    : await (async () => {
        const { data, error } = await supabase
          .from("ingredient_reactions")
          .select(
            "reaction_type, ingredients ( inci_name, ingredient_functions ( functional_category ) )",
          )
          .eq("user_id", userId);
        if (error) throw error;
        return data as unknown as ReactionRow[];
      })();

  const history: Record<string, Reaction> = {};
  const irritatingIngredients = new Set<string>();
  const irritatingIngredientNames: string[] = [];
  const irritatingCategories = new Set<string>();

  for (const row of rows) {
    if (!row.ingredients) continue;
    const name = row.ingredients.inci_name.toLowerCase();
    history[name] = row.reaction_type;
    if (row.reaction_type === "irritating") {
      irritatingIngredients.add(name);
      irritatingIngredientNames.push(row.ingredients.inci_name);
      for (const f of row.ingredients.ingredient_functions) {
        irritatingCategories.add(f.functional_category);
      }
    }
  }

  return { history, irritatingIngredients, irritatingIngredientNames, irritatingCategories };
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

  if (isDemoModeActive()) {
    const ingredient = ALL_INGREDIENTS_SNAPSHOT.find((i) => i.inci_name === inciName);
    if (!ingredient) throw new Error(`Unknown ingredient: ${inciName}`);
    upsertLocalRow<LocalReactionRow>(
      "ingredient_reactions",
      { user_id: userId, ingredient_id: ingredient.ingredient_id },
      { reaction_type: reactionType },
    );
    return;
  }

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

/**
 * Removes an ingredient sensitivity entirely (src/routes/profile.sensitivities.tsx)
 * — a real delete, not just overwriting reaction_type, since "remove" means
 * this ingredient no longer has any reported reaction at all.
 */
export async function removeIngredientReaction(inciName: string): Promise<void> {
  const userId = await getCurrentUserId();

  if (isDemoModeActive()) {
    const ingredient = ALL_INGREDIENTS_SNAPSHOT.find((i) => i.inci_name === inciName);
    if (!ingredient) throw new Error(`Unknown ingredient: ${inciName}`);
    deleteLocalRows<LocalReactionRow>("ingredient_reactions", {
      user_id: userId,
      ingredient_id: ingredient.ingredient_id,
    });
    return;
  }

  const { data: ingredient, error: lookupError } = await supabase
    .from("ingredients")
    .select("ingredient_id")
    .eq("inci_name", inciName)
    .single();
  if (lookupError) throw lookupError;

  const { error } = await supabase
    .from("ingredient_reactions")
    .delete()
    .eq("user_id", userId)
    .eq("ingredient_id", (ingredient as { ingredient_id: number }).ingredient_id);
  if (error) throw error;
}
