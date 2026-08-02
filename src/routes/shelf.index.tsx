import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { AppShell, PageContainer } from "@/components/app/AppShell";
import { useAppStore } from "@/lib/appStore";
import type { ProductStatus } from "@/lib/types";

export const Route = createFileRoute("/shelf/")({
  head: () => ({ meta: [{ title: "My Shelf — Skingredient" }] }),
  component: Shelf,
});

const FILTERS: { label: string; value: "all" | ProductStatus }[] = [
  { label: "All", value: "all" },
  { label: "Use Today", value: "use-today" },
  { label: "Optional", value: "optional" },
  { label: "Skip Today", value: "skip-today" },
];

const STATUS_LINE: Record<ProductStatus, { text: string; cls: string }> = {
  "use-today": { text: "✓ Recommended today", cls: "text-sage" },
  optional: { text: "✓ Optional today", cls: "text-[#a1770b]" },
  "skip-today": { text: "⚠ Skip today", cls: "text-coral" },
};

function Shelf() {
  const { products } = useAppStore();
  const [filter, setFilter] = useState<"all" | ProductStatus>("all");
  const shown = filter === "all" ? products : products.filter((p) => p.status === filter);

  return (
    <AppShell
      title="My Shelf"
      actions={
        <Link
          to="/shelf/add"
          className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-[13.5px] font-semibold text-white"
        >
          <Plus size={16} /> Add product
        </Link>
      }
    >
      <PageContainer width="wide">
        <header className="flex items-center justify-between lg:hidden">
          <h1 className="text-[26px] font-bold text-ink">My Shelf</h1>
          <div className="flex items-center gap-2">
            <button aria-label="Search" className="grid h-10 w-10 place-items-center rounded-full bg-surface-muted">
              <Search size={18} className="text-ink" />
            </button>
            <Link to="/shelf/add" aria-label="Add product" className="grid h-10 w-10 place-items-center rounded-full bg-brand text-white">
              <Plus size={18} />
            </Link>
          </div>
        </header>

        <div className="mt-4 hidden items-center gap-2 rounded-2xl bg-surface-muted px-4 py-3 lg:flex">
          <Search size={16} className="text-ink-muted" />
          <input
            placeholder="Search your shelf"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-ink-muted"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                filter === f.value ? "bg-brand text-white" : "bg-surface-muted text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {shown.map((p) => (
            <Link
              key={p.id}
              to="/shelf/$productId"
              params={{ productId: p.id }}
              className="flex gap-3 rounded-3xl border border-hairline bg-white p-3 shadow-soft"
            >
              <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white ring-1 ring-hairline">
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={`${p.brand} ${p.name}`}
                    loading="lazy"
                    width={96}
                    height={96}
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <BottleIcon />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-ink-muted">{p.brand}</p>
                <h3 className="truncate text-[15.5px] font-semibold text-ink">{p.name}</h3>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {p.keyIngredients.slice(0, 3).map((i) => (
                    <span
                      key={i}
                      className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-ink"
                    >
                      {i}
                    </span>
                  ))}
                </div>
                <p className={`mt-2 text-[12.5px] font-semibold ${STATUS_LINE[p.status].cls}`}>
                  {STATUS_LINE[p.status].text}
                </p>
              </div>
            </Link>
          ))}
          {shown.length === 0 && (
            <div className="rounded-2xl border border-dashed border-hairline p-8 text-center lg:col-span-2">
              <p className="text-[14px] font-medium text-ink">No products in this filter</p>
              <p className="mt-1 text-[12px] text-ink-muted">Try a different filter or add a new product.</p>
            </div>
          )}
        </div>
      </PageContainer>
    </AppShell>
  );
}

function BottleIcon() {
  return (
    <svg width="52" height="72" viewBox="0 0 52 72" fill="none">
      <rect x="14" y="4" width="24" height="8" rx="2" fill="#ffffff" stroke="#c9d3e0" />
      <rect x="8" y="14" width="36" height="52" rx="8" fill="#ffffff" stroke="#c9d3e0" />
      <rect x="12" y="30" width="28" height="14" rx="3" fill="#e8ecf2" />
    </svg>
  );
}