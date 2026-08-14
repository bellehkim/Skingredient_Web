import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, Plus, Search, X } from "lucide-react";
import { AppShell, PageContainer } from "@/components/app/AppShell";
import { MobileHeader } from "@/components/app/MobileHeader";
import { useAppStore } from "@/lib/appStore";

export const Route = createFileRoute("/profile/sensitivities")({
  head: () => ({ meta: [{ title: "Ingredient sensitivities — Skingredient" }] }),
  component: IngredientSensitivities,
});

/**
 * Ingredient-level sensitivities — deliberately separate from Product
 * Reaction History (src/routes/profile.reactions.tsx). Reuses
 * ingredient_reactions (src/lib/data/ingredientReactions.ts) directly: an
 * "irritating" reaction *is* a sensitivity, so add/remove here are the exact
 * same actions Shelf's old ingredient-level flow used, just exposed as their
 * own explicit list instead of derived from a product page. Adding always
 * selects from the existing curated Ingredient Library — no free-text
 * ingredient creation, no fuzzy matching, no second ingredient database.
 */
function IngredientSensitivities() {
  const {
    ingredientLibrary,
    irritatingIngredientNames,
    recordReaction,
    removeIngredientSensitivity,
  } = useAppStore();
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");

  const sensitiveLower = useMemo(
    () => new Set(irritatingIngredientNames.map((n) => n.toLowerCase())),
    [irritatingIngredientNames],
  );
  const libraryByInciLower = useMemo(
    () => new Map(ingredientLibrary.map((e) => [e.inciName.toLowerCase(), e])),
    [ingredientLibrary],
  );

  const sensitivities = useMemo(
    () =>
      irritatingIngredientNames
        .map((inciName) => {
          const entry = libraryByInciLower.get(inciName.toLowerCase());
          return { inciName, displayName: entry?.name ?? inciName, id: entry?.id };
        })
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [irritatingIngredientNames, libraryByInciLower],
  );

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ingredientLibrary
      .filter((e) => !sensitiveLower.has(e.inciName.toLowerCase()))
      .filter((e) => e.name.toLowerCase().includes(q) || e.inciName.toLowerCase().includes(q))
      .slice(0, 8);
  }, [ingredientLibrary, query, sensitiveLower]);

  return (
    <AppShell title="Ingredient sensitivities" back="/profile">
      <MobileHeader title="Ingredient sensitivities" back="/profile" />
      <PageContainer width="narrow">
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
          Ingredients you add here can be considered when personalizing your recommendations.
        </p>

        {sensitivities.length === 0 && !adding && (
          <div className="mt-8 flex flex-col items-center text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-surface-muted">
              <AlertTriangle size={22} className="text-ink-muted" />
            </div>
            <h2 className="mt-4 text-[15px] font-semibold text-ink">
              No ingredient sensitivities reported yet.
            </h2>
          </div>
        )}

        {sensitivities.length > 0 && (
          <ul className="mt-4 divide-y divide-hairline overflow-hidden rounded-3xl border border-hairline bg-white shadow-soft">
            {sensitivities.map((s) => (
              <li key={s.inciName} className="flex items-center gap-3 px-4 py-3.5">
                {s.id ? (
                  <Link
                    to="/ingredients/$ingredientId"
                    params={{ ingredientId: s.id }}
                    className="min-w-0 flex-1"
                  >
                    <p className="truncate text-[14.5px] font-semibold text-ink">{s.displayName}</p>
                    <p className="truncate text-[12px] text-ink-muted">{s.inciName}</p>
                  </Link>
                ) : (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-semibold text-ink">{s.displayName}</p>
                  </div>
                )}
                <button
                  aria-label={`Remove ${s.displayName}`}
                  onClick={() => removeIngredientSensitivity(s.inciName)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-surface-muted hover:text-coral"
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5">
          {adding ? (
            <div className="rounded-3xl border border-hairline bg-white p-4 shadow-soft">
              <div className="flex items-center gap-2 rounded-2xl bg-surface-muted px-4 py-3">
                <Search size={16} className="text-ink-muted" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search ingredients"
                  className="w-full bg-transparent text-[14px] outline-none placeholder:text-ink-muted"
                />
              </div>
              {query.trim() &&
                (searchResults.length > 0 ? (
                  <div className="mt-3 space-y-1.5">
                    {searchResults.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => {
                          recordReaction(e.inciName, "irritating");
                          setQuery("");
                          setAdding(false);
                        }}
                        className="flex w-full items-center justify-between rounded-2xl border border-hairline px-3.5 py-2.5 text-left"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[13.5px] font-medium text-ink">{e.name}</p>
                          <p className="truncate text-[11.5px] text-ink-muted">{e.inciName}</p>
                        </div>
                        <Plus size={16} className="shrink-0 text-brand" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 px-1 text-[12.5px] text-ink-muted">No matching ingredients.</p>
                ))}
              <button
                onClick={() => {
                  setAdding(false);
                  setQuery("");
                }}
                className="mt-3 text-[13px] font-medium text-ink-muted"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-hairline bg-white py-3.5 text-[14px] font-semibold text-brand"
            >
              <Plus size={16} /> Add ingredient sensitivity
            </button>
          )}
        </div>
      </PageContainer>
    </AppShell>
  );
}
