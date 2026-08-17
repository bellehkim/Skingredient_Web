import { supabase } from "./supabaseClient";
import { isDemoModeActive } from "@/lib/demoMode";
import { CATALOG_PRODUCTS_SNAPSHOT, FULL_INGREDIENTS_SNAPSHOT } from "@/data/catalogSnapshot";

export interface CatalogIngredient {
  inci_name: string;
  /** Set only for curated Ingredient Library entries (same signal
   * src/lib/data/ingredientLibrary.ts / getProductFullIngredients() use) —
   * src/lib/productMatching.ts uses this to decide which ingredients are
   * "key" enough to show as chips on the Product detail page, vs. the
   * full formulation only shown on the Full ingredient list page. */
  common_name: string | null;
  ingredient_functions: { functional_category: string }[];
}

export interface CatalogProduct {
  product_id: number;
  brand: string;
  product_name: string;
  category: string;
  product_ingredients: { ingredients: CatalogIngredient }[];
}

/**
 * Full product catalog (18 hackathon-seed products — see
 * supabase/migrations/20260812010000_product_catalog.sql), each with its key
 * ingredients and their functional categories, in one round trip. Consumed
 * by src/lib/productMatching.ts to turn today's recommendation into a
 * use-today/optional/skip-today product list.
 */
export async function getCatalogProducts(): Promise<CatalogProduct[]> {
  if (isDemoModeActive()) return CATALOG_PRODUCTS_SNAPSHOT;

  const { data, error } = await supabase.from("products").select(`
    product_id,
    brand,
    product_name,
    category,
    product_ingredients (
      ingredients ( inci_name, common_name, ingredient_functions ( functional_category ) )
    )
  `);

  if (error) throw error;
  return data as unknown as CatalogProduct[];
}

export interface FullIngredientEntry {
  inciName: string;
  /** Only set for curated Ingredient Library entries (ingredients.common_name
   * IS NOT NULL) — the same signal src/lib/data/ingredientLibrary.ts uses.
   * A null commonName means "no verified benefit metadata for this exact
   * ingredient" — callers must show the bare inci_name only, never invent a
   * function/benefit for it. */
  commonName: string | null;
  benefits: string[] | null;
  functionalCategories: string[];
}

export interface ProductFullIngredients {
  brand: string;
  productName: string;
  /** In INCI declaration order (inci_position ascending) — highest
   * concentration first, per convention. */
  ingredients: FullIngredientEntry[];
}

interface ProductFullIngredientsRow {
  brand: string;
  product_name: string;
  product_ingredients: {
    inci_position: number | null;
    ingredients: {
      inci_name: string;
      common_name: string | null;
      benefits: string[] | null;
      ingredient_functions: { functional_category: string }[];
    };
  }[];
}

/**
 * Verified complete INCI list for one catalog product (MVP demo scope: only
 * iUNIK Centella Calming Gel Cream currently has a full list seeded — see
 * supabase/migrations/20260817000000_iunik_full_ingredient_list.sql. Other
 * products still only have their 2-3 key catalog_source ingredients, so
 * this simply returns whatever product_ingredients rows exist; it never
 * fabricates a full list where one hasn't been verified and seeded).
 * Powers src/routes/shelf.$productId.ingredients.tsx.
 */
export async function getProductFullIngredients(
  productId: string,
): Promise<ProductFullIngredients | null> {
  if (isDemoModeActive()) {
    const row = FULL_INGREDIENTS_SNAPSHOT[productId];
    if (!row) return null;
    const ingredients = row.product_ingredients
      .slice()
      .sort((a, b) => (a.inci_position ?? 0) - (b.inci_position ?? 0))
      .map(({ ingredients: i }) => ({
        inciName: i.inci_name,
        commonName: i.common_name,
        benefits: i.benefits,
        functionalCategories: i.ingredient_functions.map((f) => f.functional_category),
      }));
    return { brand: row.brand, productName: row.product_name, ingredients };
  }

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      brand,
      product_name,
      product_ingredients (
        inci_position,
        ingredients ( inci_name, common_name, benefits, ingredient_functions ( functional_category ) )
      )
    `,
    )
    .eq("product_id", productId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as ProductFullIngredientsRow;
  const ingredients = row.product_ingredients
    .slice()
    .sort((a, b) => (a.inci_position ?? 0) - (b.inci_position ?? 0))
    .map(({ ingredients: i }) => ({
      inciName: i.inci_name,
      commonName: i.common_name,
      benefits: i.benefits,
      functionalCategories: i.ingredient_functions.map((f) => f.functional_category),
    }));

  return { brand: row.brand, productName: row.product_name, ingredients };
}
