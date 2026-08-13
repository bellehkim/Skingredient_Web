import { supabase } from "./supabaseClient";

export interface IngredientLibraryEntry {
  id: string;
  /** Raw ingredients.inci_name — used to match against Product.keyIngredients
   * (which always come from inci_name, not the friendlier display name). */
  inciName: string;
  /** Friendly display name shown in the UI. */
  name: string;
  description: string;
  benefits: string[];
  bestFor: string[];
  caution: string;
}

interface IngredientLibraryRow {
  ingredient_id: number;
  inci_name: string;
  common_name: string;
  short_description: string;
  benefits: string[];
  best_for: string[];
  caution: string;
}

function rowToEntry(row: IngredientLibraryRow): IngredientLibraryEntry {
  return {
    id: String(row.ingredient_id),
    inciName: row.inci_name,
    name: row.common_name,
    description: row.short_description,
    benefits: row.benefits ?? [],
    bestFor: row.best_for ?? [],
    caution: row.caution,
  };
}

/**
 * The curated Ingredient Library — rows in public.ingredients with
 * common_name populated. Ingredients seeded only for the product catalog
 * (e.g. Fragrance (Parfum), Titanium Dioxide) have no common_name and are
 * excluded, no separate flag column needed.
 */
export async function getIngredientLibrary(): Promise<IngredientLibraryEntry[]> {
  const { data, error } = await supabase
    .from("ingredients")
    .select("ingredient_id, inci_name, common_name, short_description, benefits, best_for, caution")
    .not("common_name", "is", null)
    .order("ingredient_id", { ascending: true });

  if (error) throw error;
  return (data as IngredientLibraryRow[]).map(rowToEntry);
}
