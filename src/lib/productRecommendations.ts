import type { CatalogProduct } from "./data/catalog";
import { CATEGORY_COLORS, categoryForLabel, labelsToCategories } from "./productMatching";
import { STRONG_ACTIVES } from "./scheduleAdjustments";
import type { DailyRecommendation, Product } from "./types";

// One recommendation per supported product category (Cleanser, Moisturizer,
// Sunscreen, Serum, Treatment, Toner/Essence) when a valid match exists for
// each — selectDiverseTopMatches below never invents a category, so this is
// a ceiling, not a target count.
const MAX_RECOMMENDATIONS = 6;

// Same vocabulary scheduleAdjustments.ts uses for "don't stack strong actives
// before an event" — reused here (not a second list) so "strong active"
// means the same thing everywhere. Converted from labels to
// functional_category once, at module load.
const STRONG_ACTIVE_CATEGORIES = new Set(
  Array.from(STRONG_ACTIVES)
    .map((label) => categoryForLabel(label))
    .filter((c): c is string => Boolean(c)),
);

// Display-only skincare-step order for the final "Recommended for you" list
// — applied strictly after selection/scoring/tie-breaking below have
// already picked the winning product per category, so it can never affect
// which product wins a category. A category simply isn't in the array if
// nothing matched it, so sorting against this order never inserts a
// placeholder.
const CATEGORY_DISPLAY_ORDER = [
  "Cleanser",
  "Toner/Essence",
  "Serum",
  "Moisturizer",
  "Treatment",
  "Sunscreen",
];

// Maintenance mode (recommendationEngine.ts's healthy fallback) prioritizes
// gentle barrier/hydration ingredients only — it deliberately never lists
// "Sunscreen"/UV filters as a visible PRIORITIZE chip (that's not an
// ingredient concern), but daily UV protection is still a real maintenance
// recommendation, so it's added to the target categories here directly
// rather than through the prioritized-label bridge.
const MAINTENANCE_UV_FILTER_CATEGORY = "uv_filter";

// Deliberately doesn't repeat the matched ingredient(s) in this sentence —
// the card's separate "Contains: ..." line (keyIngredients) already states
// them. matchedLabels still decides which branch applies (unchanged
// priority: a real prioritized-ingredient match beats the maintenance-mode
// UV note), just no longer interpolated into the text.
function buildReason(matchedLabels: string[], matchedUvFilter: boolean): string {
  if (matchedLabels.length > 0) {
    return "Recommended to support today's plan.";
  }
  if (matchedUvFilter) {
    return "Recommended for daily UV protection as part of your maintenance routine.";
  }
  return "Recommended to support today's plan.";
}

type RankedMatch = {
  product: CatalogProduct;
  matchedCategories: Set<string>;
  matchedIngredientNames: string[];
};

/**
 * Caps the ranked list at one product per product.category (Cleanser,
 * Serum, Moisturizer, Treatment, Sunscreen, Toner/Essence), keeping the
 * best-ranked entry per category and otherwise preserving rank order. A
 * category simply doesn't appear if nothing ranked matched it — this never
 * invents a category to hit a count.
 *
 * Diversity tie-breaks: relevance (matchedCategories.size) is always the
 * primary and only real ranking signal — a lower-scoring product can never
 * win a category over a higher-scoring one. But `ranked` is a stable sort,
 * so among several candidates tied at a category's top score, the winner
 * used to always be whichever happened to come first in catalog/seed order
 * — which, for this catalog, systematically favored the same handful of
 * brands (see productRecommendations investigation). Now, only within that
 * same-score tie, preference goes in this order:
 *
 *   1. a brand not already selected AND no overlap with a strong active
 *      (STRONG_ACTIVE_CATEGORIES) already used by an earlier pick
 *   2. a brand not already selected (active overlap allowed)
 *   3. no strong-active overlap (brand repeat allowed)
 *   4. the original catalog-order winner, unchanged
 *
 * Supportive ingredients (Niacinamide, Ceramides, Panthenol, Glycerin,
 * Hyaluronic Acid, etc.) are never restricted this way — only categories in
 * STRONG_ACTIVE_CATEGORIES count as "already used". No brand, country,
 * region, or specific active is ever named in code — this only tracks
 * whichever brand strings and functional_category values appear in the
 * catalog data.
 */
function selectDiverseTopMatches(ranked: RankedMatch[], max: number): RankedMatch[] {
  const seenCategories = new Set<string>();
  const selectedBrands = new Set<string>();
  const usedStrongActiveCategories = new Set<string>();
  const diverse: RankedMatch[] = [];

  const overlapsUsedStrongActive = (m: RankedMatch) =>
    Array.from(m.matchedCategories).some(
      (c) => STRONG_ACTIVE_CATEGORIES.has(c) && usedStrongActiveCategories.has(c),
    );

  for (const match of ranked) {
    const category = match.product.category;
    if (seenCategories.has(category)) continue;
    seenCategories.add(category);

    // `match` is already this category's top-scoring candidate (ranked is
    // sorted by score descending, so the first time a category is seen is
    // necessarily its best score). Gather every candidate tied at that same
    // score, in their existing relative order.
    const topScore = match.matchedCategories.size;
    const tiedAtTopScore = ranked.filter(
      (m) => m.product.category === category && m.matchedCategories.size === topScore,
    );

    const winner =
      tiedAtTopScore.find(
        (m) => !selectedBrands.has(m.product.brand) && !overlapsUsedStrongActive(m),
      ) ??
      tiedAtTopScore.find((m) => !selectedBrands.has(m.product.brand)) ??
      tiedAtTopScore.find((m) => !overlapsUsedStrongActive(m)) ??
      tiedAtTopScore[0];

    selectedBrands.add(winner.product.brand);
    for (const c of winner.matchedCategories) {
      if (STRONG_ACTIVE_CATEGORIES.has(c)) usedStrongActiveCategories.add(c);
    }
    diverse.push(winner);
    if (diverse.length >= max) break;
  }

  return diverse;
}

/**
 * Turns today's already-computed `recommendation` (src/lib/recommendationEngine.ts
 * — the single source of truth also used by Today's Plan, Shelf status, and
 * Routine) into matching catalog products. Target categories come from
 * `recommendation.prioritizedIngredients` via the same exact label→
 * functional_category bridge Shelf/Routine already use — never an
 * independently-derived concern list, so this can't disagree with Today's
 * Plan. Simple match-count sort only — no ranking engine. Products with zero
 * matching ingredients are dropped entirely; if there's nothing prioritized,
 * this returns nothing rather than inventing a fallback pick.
 */
export function getTodaysRecommendations(
  catalog: CatalogProduct[],
  recommendation: DailyRecommendation,
  irritatingIngredients: Set<string> = new Set(),
  reactedProductIds: Set<string> = new Set(),
): Product[] {
  const targetCategories = labelsToCategories(recommendation.prioritizedIngredients);
  if (recommendation.direction === "maintenance") {
    targetCategories.add(MAINTENANCE_UV_FILTER_CATEGORY);
  }
  if (targetCategories.size === 0) return [];

  // Exact-ingredient exclusion (src/lib/data/ingredientReactions.ts) and
  // exact-product exclusion (src/lib/data/productReactions.ts) — a product
  // containing an irritating ingredient, or that the user directly reported
  // as irritating, is dropped entirely from "Recommended for you", never
  // just deprioritized.
  const eligibleCatalog = catalog.filter((product) => {
    if (reactedProductIds.has(String(product.product_id))) return false;
    if (irritatingIngredients.size === 0) return true;
    return !product.product_ingredients.some((pi) =>
      irritatingIngredients.has(pi.ingredients.inci_name.toLowerCase()),
    );
  });

  const ranked = eligibleCatalog
    .map((product) => {
      const matchedCategories = new Set<string>();
      const matchedIngredientNames: string[] = [];

      for (const { ingredients } of product.product_ingredients) {
        const categories = ingredients.ingredient_functions.map((f) => f.functional_category);
        const hitCategories = categories.filter((c) => targetCategories.has(c));
        if (hitCategories.length > 0) {
          hitCategories.forEach((c) => matchedCategories.add(c));
          matchedIngredientNames.push(ingredients.inci_name);
        }
      }

      return { product, matchedCategories, matchedIngredientNames };
    })
    .filter((m) => m.matchedCategories.size > 0)
    .sort((a, b) => b.matchedCategories.size - a.matchedCategories.size);

  const matched = selectDiverseTopMatches(ranked, MAX_RECOMMENDATIONS);

  // Selection is fully decided above — this only reorders the already-final
  // list for display, into the fixed skincare-step order. A category not in
  // CATEGORY_DISPLAY_ORDER (shouldn't happen for the real catalog, but not
  // assumed) sorts after every named step rather than throwing.
  matched.sort((a, b) => {
    const aIndex = CATEGORY_DISPLAY_ORDER.indexOf(a.product.category);
    const bIndex = CATEGORY_DISPLAY_ORDER.indexOf(b.product.category);
    const aRank = aIndex === -1 ? CATEGORY_DISPLAY_ORDER.length : aIndex;
    const bRank = bIndex === -1 ? CATEGORY_DISPLAY_ORDER.length : bIndex;
    return aRank - bRank;
  });

  return matched.map(({ product, matchedCategories, matchedIngredientNames }) => {
    const matchedLabels = recommendation.prioritizedIngredients.filter((label) => {
      const category = categoryForLabel(label);
      return category ? matchedCategories.has(category) : false;
    });
    const matchedUvFilter = matchedCategories.has(MAINTENANCE_UV_FILTER_CATEGORY);

    return {
      id: String(product.product_id),
      brand: product.brand,
      name: product.product_name,
      category: product.category,
      status: "use-today",
      keyIngredients: matchedIngredientNames.slice(0, 3),
      reason: buildReason(matchedLabels, matchedUvFilter),
      imageColor: CATEGORY_COLORS[product.category] ?? "#F3F0FF",
    };
  });
}
