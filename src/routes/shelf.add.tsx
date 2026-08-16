import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ScanLine, Search, Camera, PenLine } from "lucide-react";
import { AppShell, PageContainer } from "@/components/app/AppShell";
import { MobileHeader } from "@/components/app/MobileHeader";
import { useAppStore } from "@/lib/appStore";
import { PRODUCT_CATEGORIES } from "@/lib/productMatching";

export const Route = createFileRoute("/shelf/add")({
  head: () => ({ meta: [{ title: "Add product — Skingredient" }] }),
  component: AddProduct,
});

const options = [
  { icon: ScanLine, title: "Scan product", sub: "Scan the barcode on the packaging" },
  { icon: Search, title: "Search product database", sub: "Find products by name or brand" },
  { icon: Camera, title: "Upload ingredient photo", sub: "We'll extract the ingredient list" },
  { icon: PenLine, title: "Add manually", sub: "Type in details yourself" },
];

type View = "menu" | "manual" | "search";

function AddProduct() {
  const [view, setView] = useState<View>("menu");
  const { addCustomProduct, addToShelf, recommendedProducts, products } = useAppStore();
  const navigate = useNavigate();
  const router = useRouter();
  // Reachable from both My Shelf and Home's "Add product" quick action — no
  // single hardcoded back destination is correct for both, so back retraces
  // actual navigation history instead (same pattern as scan.check-in.tsx).
  // But manual/search are just a client-side view toggle, not a route change
  // — history-back from either would skip straight past the choice menu and
  // exit the whole Add product flow, so only the menu itself uses history.
  const goBack = () => {
    if (view === "menu") router.history.back();
    else setView("menu");
  };
  const [brand, setBrand] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(PRODUCT_CATEGORIES[0]);
  const [query, setQuery] = useState("");

  // Only 18 products total (src/lib/data/catalog.ts) — a full client-side
  // filter over the already-loaded catalog, no separate search request.
  const shelfIds = useMemo(() => new Set(products.map((p) => p.id)), [products]);
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? recommendedProducts.filter(
          (p) => p.brand.toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
        )
      : recommendedProducts;
    return [...matches].sort(
      (a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name),
    );
  }, [recommendedProducts, query]);

  if (view === "search") {
    const doneLink = (
      <Link to="/shelf" className="text-[13.5px] font-semibold text-brand">
        Done
      </Link>
    );
    return (
      <AppShell
        title="Add product"
        onBack={goBack}
        breadcrumb={[{ label: "My shelf", to: "/shelf" }, { label: "Search product database" }]}
        actions={doneLink}
      >
        <MobileHeader title="Search products" onBack={goBack} rightSlot={doneLink} />
        <PageContainer width="narrow">
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-hairline bg-white px-3.5 py-2.5">
            <Search size={16} className="text-ink-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by brand or product name"
              className="w-full bg-transparent text-[14px] outline-none placeholder:text-ink-muted"
            />
          </div>

          {searchResults.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {searchResults.map((p) => {
                const onShelf = shelfIds.has(p.id);
                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-hairline bg-white p-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] text-ink-muted">
                        {p.brand} · {p.category}
                      </p>
                      <p className="truncate text-[14.5px] font-semibold text-ink">{p.name}</p>
                    </div>
                    <button
                      onClick={() => !onShelf && addToShelf(p.id)}
                      disabled={onShelf}
                      className={`shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-semibold ${
                        onShelf ? "bg-surface-muted text-ink-muted" : "bg-brand text-white"
                      }`}
                    >
                      {onShelf ? "Added" : "Add"}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-8 text-center">
              <p className="text-[13.5px] text-ink-muted">
                No matches in our catalog for "{query}".
              </p>
              <button
                onClick={() => {
                  setName(query);
                  setView("manual");
                }}
                className="mt-3 text-[13.5px] font-semibold text-brand underline underline-offset-2"
              >
                Add it manually instead
              </button>
            </div>
          )}
        </PageContainer>
      </AppShell>
    );
  }

  if (view === "manual") {
    return (
      <AppShell
        title="Add product"
        onBack={goBack}
        breadcrumb={[{ label: "My shelf", to: "/shelf" }, { label: "Add manually" }]}
      >
        <MobileHeader title="Add manually" onBack={goBack} />
        <PageContainer width="narrow">
          <form
            className="mt-2 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              addCustomProduct({ brand: brand.trim(), name: name.trim(), category });
              navigate({ to: "/shelf" });
            }}
          >
            <div>
              <label className="text-[13px] font-semibold text-ink">Brand</label>
              <input
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. CeraVe"
                className="mt-1.5 w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-[14px] outline-none"
              />
            </div>
            <div>
              <label className="text-[13px] font-semibold text-ink">Product name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Moisturizing Cream"
                className="mt-1.5 w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-[14px] outline-none"
              />
            </div>
            <div>
              <label className="text-[13px] font-semibold text-ink">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-[14px] outline-none"
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="mt-2 block w-full rounded-2xl bg-brand py-3.5 text-center text-[14px] font-semibold text-white shadow-lift"
            >
              Save
            </button>
          </form>
        </PageContainer>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Add product"
      onBack={goBack}
      breadcrumb={[{ label: "My shelf", to: "/shelf" }, { label: "Add product" }]}
    >
      <MobileHeader title="Add product" onBack={goBack} />
      <PageContainer width="narrow">
        <p className="text-[14px] text-ink-muted">
          Choose how you'd like to add a product to your shelf.
        </p>
        <div className="mt-5 space-y-3">
          {options.map((o) => (
            <button
              key={o.title}
              onClick={() => {
                if (o.title === "Add manually") setView("manual");
                if (o.title === "Search product database") setView("search");
              }}
              className="flex w-full items-center gap-3 rounded-2xl border border-hairline bg-white p-4 text-left shadow-soft"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-light text-brand">
                <o.icon size={20} />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-semibold text-ink">{o.title}</p>
                <p className="text-[12.5px] text-ink-muted">{o.sub}</p>
              </div>
            </button>
          ))}
        </div>
        <p className="mt-6 text-center text-[11px] text-ink-muted">
          Please verify any auto-extracted ingredients. Image recognition may contain errors.
        </p>
      </PageContainer>
    </AppShell>
  );
}
