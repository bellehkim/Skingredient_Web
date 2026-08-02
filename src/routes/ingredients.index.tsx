import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, ChevronRight } from "lucide-react";
import { AppShell, PageContainer } from "@/components/app/AppShell";
import { MobileHeader } from "@/components/app/MobileHeader";
import { mockIngredients } from "@/data/mockData";

export const Route = createFileRoute("/ingredients/")({
  head: () => ({ meta: [{ title: "Ingredient Explorer — Skingredient" }] }),
  component: Explorer,
});

function Explorer() {
  const featured = mockIngredients.filter((i) => i.category === "prioritize").slice(0, 3);
  const more = mockIngredients.filter((i) => i.category !== "prioritize");

  return (
    <AppShell title="Ingredient Explorer" back="/">
      <MobileHeader title="Ingredient Explorer" back="/" />
      <PageContainer width="wide">
        <div className="flex items-center gap-2 rounded-2xl bg-surface-muted px-4 py-3">
          <Search size={16} className="text-ink-muted" />
          <input placeholder="Search ingredients" className="w-full bg-transparent text-[14px] outline-none placeholder:text-ink-muted" />
        </div>

        <h2 className="mt-6 text-[16px] font-semibold text-ink">Recommended for you</h2>
        <div className="mt-3 grid grid-cols-3 gap-2 lg:gap-4">
          {featured.map((i, idx) => (
            <Link
              key={i.id}
              to="/ingredients/$ingredientId"
              params={{ ingredientId: i.id }}
              className="rounded-2xl p-3 text-center shadow-soft lg:p-5"
              style={{
                background: ["linear-gradient(160deg,#EAF6FF,#F6FAFF)","linear-gradient(160deg,#E8F8F1,#F4FBF7)","linear-gradient(160deg,#EEEAFE,#F8F6FF)"][idx],
              }}
            >
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/70">
                <div className="h-8 w-8 rounded-full" style={{ background: ["#7BB8F0","#7BCB62","#A89AF4"][idx] }} />
              </div>
              <p className="mt-2 text-[12.5px] font-semibold text-ink">{i.name}</p>
              <p className="mt-0.5 text-[10.5px] leading-tight text-ink-muted">
                {(i.primaryBenefits ?? i.supports).slice(0, 2).join(" · ")}
              </p>
            </Link>
          ))}
        </div>

        <h2 className="mt-6 text-[16px] font-semibold text-ink">Learn more</h2>
        <ul className="mt-3 grid gap-2 lg:grid-cols-2 xl:grid-cols-3">
          {more.map((i) => (
            <li key={i.id}>
              <Link
                to="/ingredients/$ingredientId"
                params={{ ingredientId: i.id }}
                className="flex items-center gap-3 rounded-2xl border border-hairline bg-white p-3 shadow-soft"
              >
                <div className="h-10 w-10 rounded-full bg-surface-muted" />
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-semibold text-ink">{i.name}</p>
                  <p className="mt-0.5 truncate text-[12px] font-medium text-ink-muted">
                    {(i.primaryBenefits ?? i.supports).join(" · ")}
                  </p>
                </div>
                <ChevronRight size={16} className="text-ink-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </PageContainer>
    </AppShell>
  );
}