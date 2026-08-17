import { supabase } from "./supabaseClient";
import { getCurrentUserId } from "./demoUser";
import { CATEGORY_COLORS } from "../productMatching";
import type { Product } from "../types";
import { isDemoModeActive } from "@/lib/demoMode";
import { deleteLocalRows, getLocalRows, insertLocalRow } from "./localStore";

interface CustomProductRow {
  custom_product_id: number;
  brand: string;
  product_name: string;
  category: string;
}

// Custom products carry no ingredient data and aren't matched against a
// recommendation, so they always render as "optional" — never
// use-today/skip-today, which would imply a match that doesn't exist.
function rowToProduct(row: CustomProductRow): Product {
  return {
    id: `custom-${row.custom_product_id}`,
    brand: row.brand,
    name: row.product_name,
    category: row.category,
    status: "optional",
    keyIngredients: [],
    reason: "Added by you.",
    imageColor: CATEGORY_COLORS[row.category] ?? "#F3F0FF",
  };
}

export async function getCustomProducts(): Promise<Product[]> {
  const userId = await getCurrentUserId();

  if (isDemoModeActive()) {
    return getLocalRows<CustomProductRow & { user_id: string }>("custom_products", {
      user_id: userId,
    }).map(rowToProduct);
  }

  const { data, error } = await supabase
    .from("custom_products")
    .select("custom_product_id, brand, product_name, category")
    .eq("user_id", userId);

  if (error) throw error;
  return (data as CustomProductRow[]).map(rowToProduct);
}

export async function addCustomProduct(input: {
  brand: string;
  name: string;
  category: string;
}): Promise<Product> {
  const userId = await getCurrentUserId();

  if (isDemoModeActive()) {
    const existing = getLocalRows<CustomProductRow>("custom_products");
    const nextId = existing.reduce((max, row) => Math.max(max, row.custom_product_id), 0) + 1;
    const row = insertLocalRow("custom_products", {
      user_id: userId,
      custom_product_id: nextId,
      brand: input.brand,
      product_name: input.name,
      category: input.category,
    });
    return rowToProduct(row);
  }

  const { data, error } = await supabase
    .from("custom_products")
    .insert({
      user_id: userId,
      brand: input.brand,
      product_name: input.name,
      category: input.category,
    })
    .select("custom_product_id, brand, product_name, category")
    .single();

  if (error) throw error;
  return rowToProduct(data as CustomProductRow);
}

/** id is the bare custom_products.custom_product_id — callers strip the
 * "custom-" UI prefix before calling. */
export async function removeCustomProduct(customProductId: string): Promise<void> {
  const userId = await getCurrentUserId();

  if (isDemoModeActive()) {
    deleteLocalRows("custom_products", {
      user_id: userId,
      custom_product_id: Number(customProductId),
    });
    return;
  }

  const { error } = await supabase
    .from("custom_products")
    .delete()
    .eq("user_id", userId)
    .eq("custom_product_id", Number(customProductId));

  if (error) throw error;
}
