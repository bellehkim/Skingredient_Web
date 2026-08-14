import type { CatalogProduct } from "./data/catalog";
import { CONCERN_INGREDIENT_CATEGORIES, concernPhrase, deriveSkinConcerns } from "./skinConcerns";
import { CATEGORY_COLORS } from "./productMatching";
import type { Product, SkinAnalysisResult } from "./types";

const MAX_RECOMMENDATIONS = 5;

function buildReason(matchedConcerns: string[]): string {
  const phrases = matchedConcerns.map(concernPhrase);
  const joined =
    phrases.length <= 1
      ? phrases[0]
      : `${phrases.slice(0, -1).join(", ")} and ${phrases[phrases.length - 1]}`;
  return `Recommended because your skin currently shows ${joined}.`;
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
 * Skin concern → ingredient category → matching catalog products, per
 * Skingredient_MVP_Implementation_Guide.md Section 6. Simple match-count
 * sort only — no ranking engine. Products with zero matching ingredients
 * are dropped entirely.
 */
export function getTodaysRecommendations(
  catalog: CatalogProduct[],
  analysis: SkinAnalysisResult,
  irritatingIngredients: Set<string> = new Set(),
): Product[] {
  const concerns = deriveSkinConcerns(analysis);
  const targetCategories = new Set(concerns.flatMap((c) => CONCERN_INGREDIENT_CATEGORIES[c] ?? []));
  if (targetCategories.size === 0) return [];

  // Exact-ingredient exclusion (src/lib/data/ingredientReactions.ts) — a
  // product containing an ingredient the user has reported as irritating is
  // dropped entirely from "Recommended for you", never just deprioritized.
  const eligibleCatalog =
    irritatingIngredients.size === 0
      ? catalog
      : catalog.filter(
          (product) =>
            !product.product_ingredients.some((pi) =>
              irritatingIngredients.has(pi.ingredients.inci_name.toLowerCase()),
            ),
        );

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
    const matchedConcerns = concerns.filter((c) =>
      (CONCERN_INGREDIENT_CATEGORIES[c] ?? []).some((cat) => matchedCategories.has(cat)),
    );

    return {
      id: String(product.product_id),
      brand: product.brand,
      name: product.product_name,
      category: product.category,
      status: "use-today",
      keyIngredients: matchedIngredientNames.slice(0, 3),
      reason: buildReason(matchedConcerns),
      imageColor: CATEGORY_COLORS[product.category] ?? "#F3F0FF",
    };
  });
}
