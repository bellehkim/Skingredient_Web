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
