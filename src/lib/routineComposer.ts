import type { CatalogProduct } from "./data/catalog";
import { labelsToCategories, PRODUCT_STEP_ORDER } from "./productMatching";
import type { RoutineItem, RoutineTimeOfDay } from "./data/routineItems";
import type { DailyRecommendation, Product } from "./types";

export type RoutinePeriod = "am" | "pm";
export type RoutineSource = "shelf" | "recommended" | "manual";

export interface RoutineSlot {
  label: string;
  product: Product | null;
  source: RoutineSource | null;
}

export interface Routine {
  am: RoutineSlot[];
  pm: RoutineSlot[];
}

// Functional categories treated as "strong actives" for AM/PM gating — the
// same set recommendationEngine.ts already avoids outright on
// pause-actives/barrier-recovery days (Retinoids, AHA, BHA, Benzoyl
// Peroxide, Strong Vitamin C). Anything in this set is PM-only; anything
// outside it (niacinamide, hyaluronic acid, ceramides, gentle PHA, ...) is
// treated as safe for AM.
const STRONG_ACTIVE_CATEGORIES = new Set([
  "retinoid",
  "glycolic_acid",
  "salicylic_acid",
  "benzoyl_peroxide",
  "vitamin_c",
]);

// One slot per canonical skincare step (src/lib/productMatching.ts's
// PRODUCT_STEP_ORDER — the same order "Recommended for you" displays in),
// generated rather than hardcoded a second time, so the AM/PM slot sequence
// can never drift out of sync with that order. Sunscreen has no PM slot at
// all (it's AM-only by definition — see isAllowedInPeriod below); every
// other step appears in both. Serum and Treatment are separate slots (not
// merged into one "Serum or Treatment" slot as before) so a Shelf product
// in each can appear at the same time, in the right position, instead of
// competing for a single shared slot.
const AM_SLOTS: { label: string; categories: string[] }[] = PRODUCT_STEP_ORDER.map((category) => ({
  label: category,
  categories: [category],
}));

const PM_SLOTS: { label: string; categories: string[] }[] = PRODUCT_STEP_ORDER.filter(
  (category) => category !== "Sunscreen",
).map((category) => ({ label: category, categories: [category] }));

export function isCustomProduct(product: Product): boolean {
  return product.id.startsWith("custom-");
}

function findCatalogRow(catalog: CatalogProduct[], productId: string): CatalogProduct | undefined {
  return catalog.find((row) => String(row.product_id) === productId);
}

function functionalCategoriesOf(catalogRow: CatalogProduct): Set<string> {
  const categories = new Set<string>();
  for (const { ingredients } of catalogRow.product_ingredients) {
    for (const f of ingredients.ingredient_functions) categories.add(f.functional_category);
  }
  return categories;
}

/**
 * Custom (manually-added) shelf products carry no ingredient-function data
 * — per product owner's explicit MVP safety rule, a custom Treatment is
 * assumed to be a strong active (PM-only) since we can't verify otherwise;
 * every other custom category is assumed AM/PM-safe. Catalog products use
 * their real ingredient functional_category data instead of a guess.
 *
 * Exported for src/routes/shelf.$productId.index.tsx's "Add to routine"
 * picker, which uses this same check to show a non-blocking warning when
 * the user manually picks a period that conflicts with this guidance —
 * manual placement is still allowed either way (see pickForSlot below).
 */
export function isStrongActive(product: Product, catalog: CatalogProduct[]): boolean {
  if (isCustomProduct(product)) return product.category === "Treatment";
  const row = findCatalogRow(catalog, product.id);
  if (!row) return false;
  const categories = functionalCategoriesOf(row);
  for (const c of STRONG_ACTIVE_CATEGORIES) if (categories.has(c)) return true;
  return false;
}

function isAllowedInPeriod(
  product: Product,
  period: RoutinePeriod,
  catalog: CatalogProduct[],
): boolean {
  if (product.category === "Sunscreen") return period === "am";
  if (period === "pm") return true;
  return !isStrongActive(product, catalog);
}

/** Custom products have no ingredient data, so they can never be flagged as
 * containing a schedule-avoided category — only catalog-backed products are checked. */
function containsAvoidedCategory(
  product: Product,
  avoidedCategories: Set<string>,
  catalog: CatalogProduct[],
): boolean {
  if (avoidedCategories.size === 0 || isCustomProduct(product)) return false;
  const row = findCatalogRow(catalog, product.id);
  if (!row) return false;
  const categories = functionalCategoriesOf(row);
  for (const c of categories) if (avoidedCategories.has(c)) return true;
  return false;
}

/** Exact-ingredient exclusion (src/lib/data/ingredientReactions.ts) — a
 * product containing an ingredient the user has reported as irritating is
 * never placed into the routine, regardless of category. Same custom-product
 * caveat as containsAvoidedCategory: no ingredient data to check. */
function containsIrritatingIngredient(
  product: Product,
  irritatingIngredients: Set<string>,
  catalog: CatalogProduct[],
): boolean {
  if (irritatingIngredients.size === 0 || isCustomProduct(product)) return false;
  const row = findCatalogRow(catalog, product.id);
  if (!row) return false;
  return row.product_ingredients.some((pi) =>
    irritatingIngredients.has(pi.ingredients.inci_name.toLowerCase()),
  );
}

/** Exact-product exclusion (src/lib/data/productReactions.ts) — a product
 * the user directly reported as irritating (and hasn't overridden via "Keep
 * it anyway") is never placed into the routine, regardless of category.
 * Independent of containsIrritatingIngredient: never triggered by a shared
 * ingredient with some other product. */
function hasReportedReaction(product: Product, reactedProductIds: Set<string>): boolean {
  return reactedProductIds.has(product.id);
}

function pickForSlot(
  categories: string[],
  period: RoutinePeriod,
  manualProducts: Product[],
  shelfProducts: Product[],
  recommendedPool: Product[],
  avoidedCategories: Set<string>,
  irritatingIngredients: Set<string>,
  reactedProductIds: Set<string>,
  catalog: CatalogProduct[],
): { product: Product; source: RoutineSource } | null {
  // Manual placement (src/lib/data/routineItems.ts) is an explicit user
  // choice for this exact product + period, so it wins the slot outright —
  // only the category has to match. It deliberately bypasses every
  // eligibility check below (AM/PM strong-active timing, schedule-avoided
  // category, irritating ingredient, reported reaction): those are all
  // *automatic-composition* guardrails for guessing a good default, not
  // restrictions on what the user is allowed to explicitly place. The "Add
  // to routine" UI surfaces the relevant ones as a non-blocking warning (or,
  // for a reported reaction, an explicit "Add anyway" confirmation) at
  // add-time instead — once added, the routine honors it.
  const manualMatch = manualProducts.find((product) => categories.includes(product.category));
  if (manualMatch) return { product: manualMatch, source: "manual" };

  const eligible = (product: Product) =>
    categories.includes(product.category) &&
    isAllowedInPeriod(product, period, catalog) &&
    !containsAvoidedCategory(product, avoidedCategories, catalog) &&
    !containsIrritatingIngredient(product, irritatingIngredients, catalog) &&
    !hasReportedReaction(product, reactedProductIds);

  const shelfMatch = shelfProducts.find(eligible);
  if (shelfMatch) return { product: shelfMatch, source: "shelf" };

  const recommendedMatch = recommendedPool.find(eligible);
  if (recommendedMatch) return { product: recommendedMatch, source: "recommended" };

  return null;
}

function buildPeriod(
  slots: { label: string; categories: string[] }[],
  period: RoutinePeriod,
  manualProducts: Product[],
  shelfProducts: Product[],
  recommendedPool: Product[],
  avoidedCategories: Set<string>,
  irritatingIngredients: Set<string>,
  reactedProductIds: Set<string>,
  catalog: CatalogProduct[],
): RoutineSlot[] {
  return slots.map(({ label, categories }) => {
    const picked = pickForSlot(
      categories,
      period,
      manualProducts,
      shelfProducts,
      recommendedPool,
      avoidedCategories,
      irritatingIngredients,
      reactedProductIds,
      catalog,
    );
    return { label, product: picked?.product ?? null, source: picked?.source ?? null };
  });
}

/**
 * Deterministic AM/PM slot filler — no scoring beyond "first eligible match
 * in list order" (recommendedProducts is expected pre-ordered best-first,
 * e.g. use-today before optional). Shelf products are always tried before
 * catalog recommendations for the same slot. A slot with no eligible
 * product is left empty rather than filled with a mismatch. This is a
 * simple composer, not a routine engine: no timing/frequency rules, no
 * ingredient-interaction checks beyond the fixed strong-active set above.
 */
/** Resolves manual routine placements (product ids) back to real Product
 * objects via shelfProducts — a routine_items row can only ever reference a
 * product that's genuinely on the shelf (catalog or custom), so this is
 * always where it's looked up, never the full catalog or recommendedPool. */
function manualProductsForPeriod(
  routineItems: RoutineItem[],
  period: RoutineTimeOfDay,
  shelfProducts: Product[],
): Product[] {
  const ids = new Set(
    routineItems.filter((item) => item.timeOfDay === period).map((item) => item.productId),
  );
  if (ids.size === 0) return [];
  return shelfProducts.filter((p) => ids.has(p.id));
}

export function composeRoutine(
  catalog: CatalogProduct[],
  shelfProducts: Product[],
  recommendedProducts: Product[],
  recommendation: DailyRecommendation,
  irritatingIngredients: Set<string> = new Set(),
  reactedProductIds: Set<string> = new Set(),
  routineItems: RoutineItem[] = [],
): Routine {
  const avoidedCategories = labelsToCategories(recommendation.avoidedIngredients);

  const recommendedPool = recommendedProducts
    .filter((p) => p.status !== "skip-today" && p.status !== "reaction-reported")
    .slice()
    .sort((a, b) => (a.status === "use-today" ? 0 : 1) - (b.status === "use-today" ? 0 : 1));

  return {
    am: buildPeriod(
      AM_SLOTS,
      "am",
      manualProductsForPeriod(routineItems, "am", shelfProducts),
      shelfProducts,
      recommendedPool,
      avoidedCategories,
      irritatingIngredients,
      reactedProductIds,
      catalog,
    ),
    pm: buildPeriod(
      PM_SLOTS,
      "pm",
      manualProductsForPeriod(routineItems, "pm", shelfProducts),
      shelfProducts,
      recommendedPool,
      avoidedCategories,
      irritatingIngredients,
      reactedProductIds,
      catalog,
    ),
  };
}
