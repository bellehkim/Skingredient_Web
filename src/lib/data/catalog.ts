import { supabase } from "./supabaseClient";

export interface CatalogIngredient {
  inci_name: string;
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
  const { data, error } = await supabase.from("products").select(`
    product_id,
    brand,
    product_name,
    category,
    product_ingredients (
      ingredients ( inci_name, ingredient_functions ( functional_category ) )
    )
  `);

  if (error) throw error;
  return data as unknown as CatalogProduct[];
}
