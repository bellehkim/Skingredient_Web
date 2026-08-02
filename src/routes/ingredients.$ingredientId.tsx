import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell, PageContainer } from "@/components/app/AppShell";
import { MobileHeader } from "@/components/app/MobileHeader";
import { mockIngredients } from "@/data/mockData";
import { useAppStore } from "@/lib/appStore";
import { ShieldAlert, AlertTriangle, Info } from "lucide-react";
import type { ProductStatus } from "@/lib/types";

export const Route = createFileRoute("/ingredients/$ingredientId")({
  head: () => ({ meta: [{ title: "Ingredient — Skingredient" }] }),
  component: IngredientDetail,
});

const STATUS_LINE: Record<ProductStatus, { text: string; cls: string }> = {
  "use-today": { text: "✓ Recommended today", cls: "text-sage" },
  optional: { text: "✓ Optional today", cls: "text-[#a1770b]" },
  "skip-today": { text: "⚠ Skip today", cls: "text-coral" },
};

function IngredientDetail() {
  const { ingredientId } = Route.useParams();
  const { products, ingredientHistory } = useAppStore();
  const i = mockIngredients.find((x) => x.id === ingredientId);
  if (!i) throw notFound();

  const nameKey = i.name.toLowerCase();
  const personalSensitivity = ingredientHistory[nameKey] === "irritating";
  const cautionLevel = i.cautionLevel ?? (i.irritationRisk === "high" ? 4 : i.irritationRisk === "medium" ? 2 : 1);
  const primaryBenefits = i.primaryBenefits ?? i.supports;
  const matchedProducts = products.filter((p) =>
    p.keyIngredients.some((k) => {
      const kk = k.toLowerCase();
      return kk === nameKey || i.aliases.some((a) => a.toLowerCase() === kk);
    }),
  );

  return (
    <AppShell
      title={i.name}
      back="/ingredients"
      breadcrumb={[{ label: "Ingredients", to: "/ingredients" }, { label: i.name }]}
    >
      <MobileHeader title={i.name} back="/ingredients" />
      <PageContainer>
        <p className="text-[13px] text-ink-muted">
          {i.aliases.length ? `Also known as ${i.aliases.join(", ")}` : "No common aliases"}
        </p>

        <div className="grid items-start gap-8 lg:grid-cols-[1.35fr_1fr]">
        <div>
        {/* Primary Benefits */}
        <section className="mt-6">
          <p className="text-[11px] font-bold tracking-[0.14em] text-ink-muted">PRIMARY BENEFITS</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {primaryBenefits.map((b) => (
              <span
                key={b}
                className="rounded-full bg-brand-light px-3 py-1.5 text-[12.5px] font-medium text-brand"
              >
                {b}
              </span>
            ))}
          </div>
        </section>

        {/* Use with care */}
        <section className="mt-6">
          <p className="text-[11px] font-bold tracking-[0.14em] text-ink-muted">USE WITH CARE</p>
          <UseWithCare
            level={cautionLevel}
            chips={i.cautionChips ?? i.avoidWhen}
            notes={i.safetyNotes ?? []}
            personalSensitivity={personalSensitivity}
          />
        </section>
        </div>

        {/* Found on My Shelf */}
        <section className="mt-6">
          <p className="text-[11px] font-bold tracking-[0.14em] text-ink-muted">FOUND ON MY SHELF</p>
          {matchedProducts.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {matchedProducts.map((p) => (
                <li key={p.id}>
                  <Link
                    to="/shelf/$productId"
                    params={{ productId: p.id }}
                    className="flex items-center gap-3 rounded-2xl border border-hairline bg-white p-3 shadow-soft"
                  >
                    <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-hairline">
                      {p.imageUrl && (
                        <img
                          src={p.imageUrl}
                          alt={`${p.brand} ${p.name}`}
                          loading="lazy"
                          width={56}
                          height={56}
                          className="h-full w-full object-contain p-1.5"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] text-ink-muted">{p.brand}</p>
                      <p className="truncate text-[14px] font-semibold text-ink">{p.name}</p>
                      <p className={`mt-0.5 text-[12px] font-semibold ${STATUS_LINE[p.status].cls}`}>
                        {STATUS_LINE[p.status].text}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-hairline p-4">
              <p className="text-[13px] text-ink">
                You don't currently own products containing this ingredient.
              </p>
              <Link to="/shelf" className="mt-2 inline-block text-[13px] font-semibold text-brand">
                Find compatible products →
              </Link>
            </div>
          )}
        </section>
        </div>
      </PageContainer>
    </AppShell>
  );
}

function UseWithCare({
  level,
  chips,
  notes,
  personalSensitivity,
}: {
  level: number;
  chips: string[];
  notes: string[];
  personalSensitivity: boolean;
}) {
  if (personalSensitivity) {
    return (
      <div className="mt-3">
        <div className="flex items-center gap-2 text-coral">
          <ShieldAlert size={16} />
          <p className="text-[12.5px] font-bold tracking-[0.06em]">PERSONAL SENSITIVITY</p>
        </div>
        <p className="mt-2 text-[13px] text-ink">
          You've previously reported irritation to this ingredient.
        </p>
      </div>
    );
  }
  if (level <= 1) {
    return (
      <div className="mt-3 flex items-start gap-2 text-ink-muted">
        <Info size={16} className="mt-0.5 shrink-0" />
        <p className="text-[13px] leading-relaxed">
          Generally well tolerated. Individual reactions may depend on the complete formula.
        </p>
      </div>
    );
  }
  if (level === 4) {
    const bg = "#FDECEC";
    const fg = "#B23A3A";
    return (
      <div className="mt-3">
        <div className="flex items-center gap-2 text-coral">
          <ShieldAlert size={18} />
          <p className="text-[12.5px] font-bold tracking-[0.06em]">HIGH CAUTION</p>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {notes.map((n) => (
            <span
              key={n}
              className="rounded-full px-3 py-1.5 text-[12.5px] font-medium"
              style={{ backgroundColor: bg, color: fg }}
            >
              {n}
            </span>
          ))}
        </div>
      </div>
    );
  }
  // Level 2 or 3
  const isModerate = level >= 3;
  const accent = isModerate ? "#C67B1E" : "#a1770b";
  const tagBg = isModerate ? "#FFF3E6" : "#FDF3D7";
  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} style={{ color: accent }} />
        <p className="text-[12.5px] font-bold tracking-[0.06em]" style={{ color: accent }}>
          {isModerate ? "MODERATE CAUTION" : "MILD CAUTION"}
        </p>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <span
            key={c}
            className="rounded-full px-3 py-1.5 text-[12.5px] font-medium"
            style={{ backgroundColor: tagBg, color: accent }}
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}