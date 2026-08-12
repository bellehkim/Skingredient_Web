import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Before real credentials are configured, fall back to a syntactically valid
// placeholder so createClient() doesn't throw at module load (it validates
// the URL immediately) and the rest of the app keeps working. Calls made
// with the placeholder simply fail at request time — every data-layer
// function already catches and logs, so this degrades gracefully rather
// than crashing on import.
const isConfigured = Boolean(url && anonKey);

// Browser-only client, anon key only — never the service-role key. RLS (see
// the migration) is what actually restricts access; this client has no
// elevated privileges of its own. Consumed only by src/lib/data/*, never
// imported into server routes (src/routes/api/*) — those stay YouCam/Claude
// proxies with no Supabase awareness.
export const supabase = createClient(
  isConfigured ? url : "https://placeholder.supabase.co",
  isConfigured ? anonKey : "placeholder-anon-key",
);
