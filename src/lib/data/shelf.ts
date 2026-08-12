import { supabase } from "./supabaseClient";
import { getCurrentUserId } from "./demoUser";

/** Product IDs the current user has explicitly saved — not the catalog itself. */
export async function getShelfProductIds(): Promise<string[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("shelf_items")
    .select("product_id")
    .eq("user_id", userId);

  if (error) throw error;
  return (data as { product_id: number }[]).map((row) => String(row.product_id));
}

/** Records the user↔product relationship only — never copies product fields. */
export async function saveToShelf(productId: string): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("shelf_items")
    .upsert(
      { user_id: userId, product_id: Number(productId) },
      { onConflict: "user_id,product_id" },
    );

  if (error) throw error;
}

/** Deletes the shelf relationship only — the global product row is untouched. */
export async function removeFromShelf(productId: string): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("shelf_items")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", Number(productId));

  if (error) throw error;
}
