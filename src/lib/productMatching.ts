import type { CatalogProduct } from "./data/catalog";
import type { DailyRecommendation, Product, ProductStatus } from "./types";

// Skin concern → ingredient category, per Skingredient_MVP_Implementation_Guide.md
// Section 6. Deliberately a flat static map, not a rule engine — every label
// here matches a string produced by src/lib/recommendationEngine.ts, and every
// category matches a functional_category seeded in the product_catalog
// migration. Labels with no fixed ingredient identity (e.g. "Heavy occlusives",
// "Lightweight hydrators") are left unmapped and simply don't affect matching.
const INGREDIENT_LABEL_TO_CATEGORY: Record<string, string> = {
  ceramides: "ceramide",
  panthenol: "panthenol",
  glycerin: "glycerin",
  "beta-glucan": "beta_glucan",
  squalane: "squalane",
  "salicylic acid": "salicylic_acid",
  "azelaic acid": "azelaic_acid",
  niacinamide: "niacinamide",
  "hyaluronic acid": "hyaluronic_acid",
  "gentle pha": "pha",
  retinoids: "retinoid",
  aha: "glycolic_acid",
  bha: "salicylic_acid",
  "benzoyl peroxide": "benzoyl_peroxide",
  "strong vitamin c": "vitamin_c",
  fragrance: "fragrance",
  alcohol: "alcohol_denat",
};

// Same 6 categories as the products.category CHECK constraint (see
// supabase/migrations/20260812010000_product_catalog.sql) — reused by the
// manual "Add Product" form (src/routes/shelf.add.tsx) so custom products
// stay on the same category vocabulary as the catalog.
export const PRODUCT_CATEGORIES = [
  "Cleanser",
  "Moisturizer",
  "Sunscreen",
  "Serum",
  "Treatment",
  "Toner/Essence",
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Cleanser: "#EAF6FF",
  Moisturizer: "#E8F8F1",
  Sunscreen: "#FFF7E0",
  Serum: "#F3F0FF",
  Treatment: "#FFF0F1",
  "Toner/Essence": "#E9F5F2",
};

/** Exported for reuse by src/lib/routineComposer.ts — same label→category
 * lookup, so "avoid this today" means the same thing in both places. */
export function labelsToCategories(labels: string[]): Set<string> {
  const categories = labels
    .map((label) => INGREDIENT_LABEL_TO_CATEGORY[label.toLowerCase()])
    .filter((c): c is string => Boolean(c));
  return new Set(categories);
}

/** Single-label version of labelsToCategories — exported for
 * src/lib/recommendationEngine.ts, which needs to test one prioritized/
 * avoided label at a time against a reported-irritating category. */
export function categoryForLabel(label: string): string | undefined {
  return INGREDIENT_LABEL_TO_CATEGORY[label.toLowerCase()];
}

/** Exported for reuse by src/lib/recommendationEngine.ts, which needs to
 * turn a reported-irritating functional_category back into the same
 * English label vocabulary "Avoid Today" already uses. */
export function categoryDisplayName(category: string): string {
  const [label] = Object.entries(INGREDIENT_LABEL_TO_CATEGORY).find(([, c]) => c === category) ?? [
    category,
  ];
  return label.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Turns the static catalog + today's recommendation into the Product[] shape
 * the UI (My Shelf) expects. A product is "skip-today" if any key ingredient
 * matches an avoided category, else "use-today" if any matches a prioritized
 * category, else "optional". No ranking, no scoring — first match wins.
 */
export function buildProductsFromCatalog(
  catalog: CatalogProduct[],
  recommendation: DailyRecommendation,
): Product[] {
  const prioritized = labelsToCategories(recommendation.prioritizedIngredients);
  const avoided = labelsToCategories(recommendation.avoidedIngredients);

  return catalog.map((row) => {
    const keyIngredients = row.product_ingredients.map((pi) => pi.ingredients.inci_name);
    const categories = row.product_ingredients.flatMap((pi) =>
      pi.ingredients.ingredient_functions.map((f) => f.functional_category),
    );

    const matchedAvoid = categories.find((c) => avoided.has(c));
    const matchedPriority = categories.find((c) => prioritized.has(c));

    let status: ProductStatus = "optional";
    let reason = "No strong match for today's plan — safe to keep using.";
    if (matchedAvoid) {
      status = "skip-today";
      reason = `Contains ${categoryDisplayName(matchedAvoid)} — pause while your skin recovers.`;
    } else if (matchedPriority) {
      status = "use-today";
      reason = `Contains ${categoryDisplayName(matchedPriority)} to support ${recommendation.displayName.toLowerCase()}.`;
    }

    return {
      id: String(row.product_id),
      brand: row.brand,
      name: row.product_name,
      category: row.category,
      status,
      keyIngredients,
      reason,
      imageColor: CATEGORY_COLORS[row.category] ?? "#F3F0FF",
    };
  });
}
