import { supabase } from "./supabaseClient";
import { getCurrentUserId } from "./demoUser";

export type RoutineTimeOfDay = "am" | "pm";

export interface RoutineItem {
  /** Matches Product.id exactly — "5" for a catalog product, "custom-5" for
   * a custom one (src/lib/data/customProducts.ts's id convention). */
  productId: string;
  timeOfDay: RoutineTimeOfDay;
}

interface RoutineItemRow {
  product_id: number | null;
  custom_product_id: number | null;
  time_of_day: RoutineTimeOfDay;
}

function rowToItem(row: RoutineItemRow): RoutineItem {
  return {
    productId: row.product_id !== null ? String(row.product_id) : `custom-${row.custom_product_id}`,
    timeOfDay: row.time_of_day,
  };
}

/** Splits the app's single Product.id string back into the two nullable FK
 * columns routine_items actually stores — mirrors the same "custom-" prefix
 * convention removeCustomProduct() already strips. */
function idColumns(productId: string): { product_id: number | null; custom_product_id: number | null } {
  if (productId.startsWith("custom-")) {
    return { product_id: null, custom_product_id: Number(productId.slice("custom-".length)) };
  }
  return { product_id: Number(productId), custom_product_id: null };
}

/** Every manually-added routine placement for the current user — read-only,
 * consumed by src/lib/routineComposer.ts as the highest-priority source. */
export async function getRoutineItems(): Promise<RoutineItem[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("routine_items")
    .select("product_id, custom_product_id, time_of_day")
    .eq("user_id", userId);

  if (error) throw error;
  return (data as RoutineItemRow[]).map(rowToItem);
}

/**
 * Adds one row per requested time of day ("Both" from the UI is just
 * ["am", "pm"], not a third stored value). Idempotent: re-adding a period
 * the product is already in is a harmless no-op via the table's unique
 * constraints, never a duplicate row.
 */
export async function addRoutineItems(
  productId: string,
  timesOfDay: RoutineTimeOfDay[],
): Promise<void> {
  const userId = await getCurrentUserId();
  const ids = idColumns(productId);
  const rows = timesOfDay.map((timeOfDay) => ({ user_id: userId, ...ids, time_of_day: timeOfDay }));
  const onConflict =
    ids.custom_product_id !== null
      ? "user_id,custom_product_id,time_of_day"
      : "user_id,product_id,time_of_day";

  const { error } = await supabase.from("routine_items").upsert(rows, { onConflict });
  if (error) throw error;
}

/** Removes one exact placement (e.g. just "am") — never touches the other
 * time of day, and never touches shelf_items/custom_products (Routine and
 * My Shelf are separate concepts; this only ever deletes a routine_items row). */
export async function removeRoutineItem(
  productId: string,
  timeOfDay: RoutineTimeOfDay,
): Promise<void> {
  const userId = await getCurrentUserId();
  const ids = idColumns(productId);
  let query = supabase
    .from("routine_items")
    .delete()
    .eq("user_id", userId)
    .eq("time_of_day", timeOfDay);
  query =
    ids.custom_product_id !== null
      ? query.eq("custom_product_id", ids.custom_product_id)
      : query.eq("product_id", ids.product_id);

  const { error } = await query;
  if (error) throw error;
}
