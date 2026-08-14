import { supabase } from "./supabaseClient";

// Single-user demo phase — no Supabase Auth yet. Every data-layer function
// calls getCurrentUserId() rather than importing DEMO_USER_ID directly, so
// swapping in real auth later means changing only this file:
//
//   export async function getCurrentUserId(): Promise<string> {
//     const { data } = await supabaseClient.auth.getUser();
//     if (!data.user) throw new Error("Not signed in");
//     return data.user.id;
//   }
//
// No call site elsewhere in the app needs to change. Must match the seed row
// in supabase/migrations/20260811000000_init_schema.sql.
export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function getCurrentUserId(): Promise<string> {
  return DEMO_USER_ID;
}

/**
 * Hackathon dev/demo tool only (src/routes/profile.tsx, DEV-gated) — wipes
 * every table scoped to the fixed demo identity and puts it back to a
 * brand-new-user state. Deletes the profiles row and relies on the existing
 * `on delete cascade` FKs (skin_analyses, shelf_items, custom_products,
 * ingredient_reactions, product_reactions, daily_checkins all reference
 * profiles.id) to clear
 * everything owned by this user in one statement, then re-seeds the same
 * row — same fixed UUID, never a new
 * identity — exactly like the migration's initial seed. Never touches
 * products/ingredients/ingredient_functions/product_ingredients: nothing
 * here references those tables, so they're untouched by construction.
 * Callers are responsible for clearing localStorage and reloading.
 */
export async function resetDemoUser(): Promise<void> {
  const { error: deleteError } = await supabase.from("profiles").delete().eq("id", DEMO_USER_ID);
  if (deleteError) throw deleteError;

  const { error: insertError } = await supabase.from("profiles").insert({ id: DEMO_USER_ID });
  if (insertError) throw insertError;
}
