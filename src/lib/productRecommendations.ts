import type { CatalogProduct } from "./data/catalog";
import { CATEGORY_COLORS, categoryForLabel, labelsToCategories } from "./productMatching";
import type { DailyRecommendation, Product } from "./types";

const MAX_RECOMMENDATIONS = 5;

// Maintenance mode (recommendationEngine.ts's healthy fallback) prioritizes
// gentle barrier/hydration ingredients only — it deliberately never lists
// "Sunscreen"/UV filters as a visible PRIORITIZE chip (that's not an
// ingredient concern), but daily UV protection is still a real maintenance
// recommendation, so it's added to the target categories here directly
// rather than through the prioritized-label bridge.
const MAINTENANCE_UV_FILTER_CATEGORY = "uv_filter";

function buildReason(matchedLabels: string[], matchedUvFilter: boolean): string {
  if (matchedLabels.length > 0) {
    const joined =
      matchedLabels.length === 1
        ? matchedLabels[0]
        : `${matchedLabels.slice(0, -1).join(", ")} and ${matchedLabels[matchedLabels.length - 1]}`;
    return `Recommended to support today's plan — contains ${joined}.`;
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
 * best-ranked (first) entry per category and otherwise preserving rank
 * order. A category simply doesn't appear if nothing ranked matched it —
 * this never invents a category to hit a count.
 */
function selectDiverseTopMatches(ranked: RankedMatch[], max: number): RankedMatch[] {
  const seenCategories = new Set<string>();
  const diverse: RankedMatch[] = [];

  for (const match of ranked) {
    if (seenCategories.has(match.product.category)) continue;
    seenCategories.add(match.product.category);
    diverse.push(match);
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
