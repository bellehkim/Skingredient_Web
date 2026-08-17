import { supabase } from "./supabaseClient";
import { getCurrentUserId } from "./demoUser";
import type { Reaction } from "./ingredientReactions";
import { isDemoModeActive } from "@/lib/demoMode";
import { CATALOG_PRODUCTS_SNAPSHOT } from "@/data/catalogSnapshot";
import { getLocalRows, updateLocalRows, upsertLocalRow } from "./localStore";

interface LocalProductReactionRow {
  user_id: string;
  product_id: number;
  reaction_type: Reaction;
  excluded_from_recommendations: boolean;
  created_at: string;
}

export interface ProductReactionsData {
  /** All current product reactions, keyed by product id (string, matching
   * Product.id — see src/lib/data/catalog.ts). */
  history: Record<string, Reaction>;
  /** product ids reported "irritating" AND still excluded_from_recommendations
   * (i.e. the user hasn't tapped "Keep it anyway") — the only set consumed
   * by Recommended for You / Routine Composer / Shelf status. */
  excludedProductIds: Set<string>;
}

interface ProductReactionRow {
  product_id: number;
  reaction_type: Reaction;
  excluded_from_recommendations: boolean;
}

/** Default/loading state — src/lib/appStore.tsx uses this until the real
 * Supabase read resolves. */
export const EMPTY_PRODUCT_REACTIONS: ProductReactionsData = {
  history: {},
  excludedProductIds: new Set(),
};

/**
 * All of the demo user's current product reactions, plus the derived
 * exclusion set. Deliberately separate from ingredient_reactions
 * (src/lib/data/ingredientReactions.ts) — a product reaction is evidence
 * about one exact product, never converted into an ingredient-level
 * sensitivity.
 */
export async function getProductReactions(): Promise<ProductReactionsData> {
  const userId = await getCurrentUserId();

  if (isDemoModeActive()) {
    const rows = getLocalRows<LocalProductReactionRow>("product_reactions", { user_id: userId });
    const history: Record<string, Reaction> = {};
    const excludedProductIds = new Set<string>();
    for (const row of rows) {
      const id = String(row.product_id);
      history[id] = row.reaction_type;
      if (row.reaction_type === "irritating" && row.excluded_from_recommendations) {
        excludedProductIds.add(id);
      }
    }
    return { history, excludedProductIds };
  }

  const { data, error } = await supabase
    .from("product_reactions")
    .select("product_id, reaction_type, excluded_from_recommendations")
    .eq("user_id", userId);

  if (error) throw error;

  const history: Record<string, Reaction> = {};
  const excludedProductIds = new Set<string>();

  for (const row of data as ProductReactionRow[]) {
    const id = String(row.product_id);
    history[id] = row.reaction_type;
    if (row.reaction_type === "irritating" && row.excluded_from_recommendations) {
      excludedProductIds.add(id);
    }
  }

  return { history, excludedProductIds };
}

/**
 * Upserts one reaction for one exact product, resolved by product_id — never
 * fuzzy, never written to ingredient_reactions. One current reaction per
 * product per user: reporting again overwrites the prior value. Reporting
 * "irritating" resets excluded_from_recommendations back to the default
 * (true) even if a previous report had been overridden via "Keep it
 * anyway" — a fresh report re-asks the question.
 */
export async function upsertProductReaction(
  productId: string,
  reactionType: Reaction,
): Promise<void> {
  const userId = await getCurrentUserId();

  if (isDemoModeActive()) {
    upsertLocalRow<LocalProductReactionRow>(
      "product_reactions",
      { user_id: userId, product_id: Number(productId) },
      {
        reaction_type: reactionType,
        excluded_from_recommendations: true,
        created_at: new Date().toISOString(),
      },
    );
    return;
  }

  const { error } = await supabase.from("product_reactions").upsert(
    {
      user_id: userId,
      product_id: Number(productId),
      reaction_type: reactionType,
      excluded_from_recommendations: true,
    },
    { onConflict: "user_id,product_id" },
  );
  if (error) throw error;
}

/**
 * The one narrow follow-up mutation: "Keep it anyway" on an already-reported
 * irritating product patches excluded_from_recommendations to false without
 * touching reaction_type. Never inserts a new row — only meaningful after
 * upsertProductReaction has already saved the reaction.
 */
export async function setProductReactionExcluded(
  productId: string,
  excluded: boolean,
): Promise<void> {
  const userId = await getCurrentUserId();

  if (isDemoModeActive()) {
    updateLocalRows<LocalProductReactionRow>(
      "product_reactions",
      { user_id: userId, product_id: Number(productId) },
      { excluded_from_recommendations: excluded },
    );
    return;
  }

  const { error } = await supabase
    .from("product_reactions")
    .update({ excluded_from_recommendations: excluded })
    .eq("user_id", userId)
    .eq("product_id", Number(productId));
  if (error) throw error;
}

export interface ProductReactionHistoryEntry {
  productId: string;
  brand: string;
  productName: string;
  reactionType: Reaction;
  createdAt: string;
  /** Only meaningful when reactionType === "irritating" — whether this
   * product is currently excluded from Recommended for You/Routine. */
  excludedFromRecommendations: boolean;
}

/**
 * Powers the minimal Product Reaction History view (src/routes/profile.reactions.tsx)
 * — brand/name/reaction/date/exclusion state only, newest first. No
 * pagination/filtering: the MVP just needs to visibly prove a reaction was
 * remembered.
 */
export async function getProductReactionHistory(): Promise<ProductReactionHistoryEntry[]> {
  const userId = await getCurrentUserId();

  if (isDemoModeActive()) {
    const rows = getLocalRows<LocalProductReactionRow>("product_reactions", { user_id: userId });
    return rows
      .slice()
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((row) => {
        const product = CATALOG_PRODUCTS_SNAPSHOT.find((p) => p.product_id === row.product_id);
        return product
          ? {
              productId: String(row.product_id),
              brand: product.brand,
              productName: product.product_name,
              reactionType: row.reaction_type,
              createdAt: row.created_at,
              excludedFromRecommendations: row.excluded_from_recommendations,
            }
          : null;
      })
      .filter((entry): entry is ProductReactionHistoryEntry => entry !== null);
  }

  const { data, error } = await supabase
    .from("product_reactions")
    .select(
      "product_id, reaction_type, excluded_from_recommendations, created_at, products ( brand, product_name )",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (
    data as unknown as {
      product_id: number;
      reaction_type: Reaction;
      excluded_from_recommendations: boolean;
      created_at: string;
      products: { brand: string; product_name: string } | null;
    }[]
  )
    .filter((row) => row.products)
    .map((row) => ({
      productId: String(row.product_id),
      brand: row.products!.brand,
      productName: row.products!.product_name,
      reactionType: row.reaction_type,
      createdAt: row.created_at,
      excludedFromRecommendations: row.excluded_from_recommendations,
    }));
}
