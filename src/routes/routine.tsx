import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageContainer } from "@/components/app/AppShell";
import { MobileHeader } from "@/components/app/MobileHeader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useAppStore } from "@/lib/appStore";
import type { RoutineSlot } from "@/lib/routineComposer";
import { Sun, Moon, Lightbulb } from "lucide-react";

const PLANNED_FEATURES = [
  "Swap products based on your preferences",
  "Prioritize products you already own on your Shelf",
  "Personalize your AI-generated routine while keeping the same skincare goals",
];

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
  const { routine, recommendation } = useAppStore();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const [showCustomizeInfo, setShowCustomizeInfo] = useState(false);

  return (
    <AppShell title="Routine Planner">
      <MobileHeader title="Routine Planner" />
      <PageContainer width="wide">
        <div className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-7 lg:gap-3 lg:overflow-visible">
          {week.map((d) => (
            <div
              key={d.d}
              className={`flex w-[46px] shrink-0 flex-col items-center rounded-2xl border py-2 text-center lg:w-auto lg:py-3 ${
                d.active
                  ? "border-[#9d86fc] bg-[#9d86fc] text-white"
                  : "border-hairline bg-white text-ink"
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
          <p className="text-[11px] font-bold tracking-[0.16em] text-white/90">
            {recommendation.displayName.toUpperCase()}
          </p>
          <h2 className="mt-1 text-[24px] font-bold">{today}</h2>
          <p className="mt-1 text-[13px] text-white/90">{recommendation.explanation}</p>
        </section>

        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
          <RoutineSection title="Morning" Icon={Sun} tint="text-sun" slots={routine.am} />
          <RoutineSection title="Evening" Icon={Moon} tint="text-brand" slots={routine.pm} />
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-sun-light p-4">
          <Lightbulb size={18} className="mt-0.5 shrink-0 text-[#a1770b]" />
          <p className="text-[13px] text-ink">{recommendation.explanation}</p>
        </div>

        <button
          onClick={() => setShowCustomizeInfo(true)}
          className="mt-5 w-full rounded-2xl bg-[#9d86fc] py-3.5 text-[14px] font-semibold text-white lg:w-auto lg:px-8"
        >
          Adjust today's routine
        </button>
      </PageContainer>

      <Dialog open={showCustomizeInfo} onOpenChange={setShowCustomizeInfo}>
        <DialogContent className="max-w-[380px] rounded-3xl border border-hairline bg-white p-6 shadow-lift">
          <DialogHeader>
            <DialogTitle className="text-[17px] font-bold text-ink">
              Routine Customization
            </DialogTitle>
          </DialogHeader>
          <p className="text-[13.5px] text-ink-muted">Routine customization is coming soon.</p>
          <p className="text-[13.5px] font-semibold text-ink">You'll be able to:</p>
          <ul className="space-y-1.5">
            {PLANNED_FEATURES.map((feature) => (
              <li key={feature} className="flex gap-2 text-[13.5px] text-ink-muted">
                <span className="text-brand">•</span>
                {feature}
              </li>
            ))}
          </ul>
          <DialogFooter>
            <DialogClose asChild>
              <button className="w-full rounded-2xl bg-brand py-3 text-[14px] font-semibold text-white sm:w-auto sm:px-8">
                Close
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function RoutineSection({
  title,
  Icon,
  tint,
  slots,
}: {
  title: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  tint: string;
  slots: RoutineSlot[];
}) {
  const filled = slots.filter(
    (slot): slot is RoutineSlot & { product: NonNullable<RoutineSlot["product"]> } =>
      slot.product !== null,
  );

  return (
    <section className="mt-4">
      <div className={`flex items-center gap-1.5 text-[13px] font-semibold ${tint}`}>
        <Icon size={16} /> {title}
      </div>
      {filled.length === 0 ? (
        <p className="mt-2 text-[12.5px] text-ink-muted">No matching products yet.</p>
      ) : (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-4 lg:overflow-visible">
          {filled.map((slot) => (
            <div
              key={slot.label}
              className="flex w-[92px] shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-hairline bg-white p-2 shadow-soft lg:w-auto lg:p-3"
            >
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-surface-muted">
                <svg width="28" height="40" viewBox="0 0 52 72">
                  <rect x="14" y="4" width="24" height="8" rx="2" fill="#ffffff" stroke="#c9d3e0" />
                  <rect
                    x="8"
                    y="14"
                    width="36"
                    height="52"
                    rx="8"
                    fill="#ffffff"
                    stroke="#c9d3e0"
                  />
                </svg>
              </div>
              <p className="line-clamp-2 text-center text-[11px] font-medium text-ink">
                {slot.product.name}
              </p>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                  slot.source === "shelf"
                    ? "bg-brand/10 text-brand"
                    : "bg-surface-muted text-ink-muted"
                }`}
              >
                {slot.source === "shelf" ? "On your Shelf" : "Recommended"}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
