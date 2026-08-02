import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageContainer } from "@/components/app/AppShell";
import { MobileHeader } from "@/components/app/MobileHeader";
import { mockRoutine } from "@/data/mockData";
import { Sun, Moon, Lightbulb } from "lucide-react";

export const Route = createFileRoute("/routine")({
  head: () => ({ meta: [{ title: "Routine Planner — Skingredient" }] }),
  component: Routine,
});

const week = [
  { d: "MON", n: 12 },
  { d: "TUE", n: 13, active: true },
  { d: "WED", n: 14 },
  { d: "THU", n: 15 },
  { d: "FRI", n: 16 },
  { d: "SAT", n: 17 },
  { d: "SUN", n: 18 },
];

function Routine() {
  return (
    <AppShell title="Routine Planner" back="/">
      <MobileHeader title="Routine Planner" back="/" />
      <PageContainer width="wide">
        <div className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-7 lg:gap-3 lg:overflow-visible">
          {week.map((d) => (
            <div
              key={d.d}
              className={`flex w-[46px] shrink-0 flex-col items-center rounded-2xl border py-2 text-center lg:w-auto lg:py-3 ${
                d.active ? "border-[#9d86fc] bg-[#9d86fc] text-white" : "border-hairline bg-white text-ink"
              }`}
            >
              <span className="text-[10px] font-semibold tracking-wider">{d.d}</span>
              <span className="text-[16px] font-bold">{d.n}</span>
            </div>
          ))}
        </div>

        <section
          className="relative mt-4 overflow-hidden rounded-3xl p-5 text-white shadow-soft"
          style={{ background: "linear-gradient(135deg, #7257E8 0%, #A89AF4 60%, #CDEEFF 100%)" }}
        >
          <div className="absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
          <p className="text-[11px] font-bold tracking-[0.16em] text-white/90">BARRIER RECOVERY DAY 🌿</p>
          <h2 className="mt-1 text-[24px] font-bold">{mockRoutine.day}</h2>
          <p className="mt-1 text-[13px] text-white/90">Focus: Calm, Hydrate, Protect</p>
        </section>

        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
          <RoutineSection title="Morning" Icon={Sun} tint="text-sun" items={mockRoutine.morning} />
          <RoutineSection title="Evening" Icon={Moon} tint="text-brand" items={mockRoutine.evening} />
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-sun-light p-4">
          <Lightbulb size={18} className="mt-0.5 shrink-0 text-[#a1770b]" />
          <p className="text-[13px] text-ink">
            Avoid strong actives and focus on hydration for a healthier barrier.
          </p>
        </div>

        <button className="mt-5 w-full rounded-2xl bg-[#9d86fc] py-3.5 text-[14px] font-semibold text-white lg:w-auto lg:px-8">
          Adjust today's routine
        </button>
      </PageContainer>
    </AppShell>
  );
}

function RoutineSection({
  title,
  Icon,
  tint,
  items,
}: {
  title: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  tint: string;
  items: string[];
}) {
  return (
    <section className="mt-4">
      <div className={`flex items-center gap-1.5 text-[13px] font-semibold ${tint}`}>
        <Icon size={16} /> {title}
      </div>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-4 lg:overflow-visible">
        {items.map((step, i) => (
          <div key={i} className="flex w-[80px] shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-hairline bg-white p-2 shadow-soft lg:w-auto lg:p-3">
            <div className="grid h-14 w-14 place-items-center rounded-xl bg-surface-muted">
              <svg width="28" height="40" viewBox="0 0 52 72"><rect x="14" y="4" width="24" height="8" rx="2" fill="#ffffff" stroke="#c9d3e0"/><rect x="8" y="14" width="36" height="52" rx="8" fill="#ffffff" stroke="#c9d3e0"/></svg>
            </div>
            <p className="text-[11px] font-medium text-ink">{step}</p>
          </div>
        ))}
      </div>
    </section>
  );
}