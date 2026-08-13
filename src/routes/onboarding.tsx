import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageContainer } from "@/components/app/AppShell";
import { MobileHeader } from "@/components/app/MobileHeader";
import { useAppStore } from "@/lib/appStore";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding — Skingredient" }] }),
  component: Onboarding,
});

const STEPS = [
  {
    title: "What are your main skin concerns?",
    subtitle: "Select up to 5.",
    options: [
      "Acne / Breakouts",
      "Acne scars",
      "Dark spots",
      "Redness",
      "Uneven skin tone",
      "Dryness",
      "Dehydration",
      "Excess oil",
      "Large pores",
      "Blackheads",
      "Fine lines",
      "Dull skin",
      "Sensitive skin",
      "Rough texture",
      "Damaged barrier",
    ],
  },
  {
    title: "How sensitive is your skin?",
    subtitle: "Pick the closest match.",
    options: ["Not sensitive", "Slightly sensitive", "Moderately sensitive", "Very sensitive"],
    multi: false,
  },
  {
    title: "Ingredient sensitivities?",
    subtitle: "Select any that apply.",
    options: [
      "Fragrance",
      "Essential oils",
      "Alcohol",
      "Aloe",
      "Lanolin",
      "Propolis",
      "Tea tree",
      "Benzoyl peroxide",
      "Salicylic acid",
      "Retinoids",
      "Vitamin C",
      "None known",
    ],
  },
  {
    title: "What are your skincare goals?",
    subtitle: "Select up to 5.",
    options: [
      "Clear acne",
      "Reduce redness",
      "Repair skin barrier",
      "Hydrate skin",
      "Reduce oiliness",
      "Improve texture",
      "Brighten skin",
      "Build a simple routine",
      "Avoid irritation",
      "Prepare for an event",
    ],
  },
  {
    title: "Do you have an important event coming up?",
    subtitle: "We'll adjust today's plan.",
    options: ["No", "Tomorrow", "Within 3 days", "Within a week"],
    multi: false,
  },
];

function Onboarding() {
  const navigate = useNavigate();
  const { completeOnboarding } = useAppStore();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[][]>(STEPS.map(() => []));

  const cur = STEPS[step];
  const toggle = (v: string) => {
    const a = [...answers];
    a[step] =
      cur.multi === false
        ? [v]
        : a[step].includes(v)
          ? a[step].filter((x) => x !== v)
          : [...a[step], v];
    setAnswers(a);
  };
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <AppShell hideNav>
      <MobileHeader
        title={`Step ${step + 1} of ${STEPS.length}`}
        back={step === 0 ? "/welcome" : "/onboarding"}
      />
      <div className="px-5 lg:mx-auto lg:max-w-[760px] lg:px-10 lg:pt-8">
        <div className="h-1 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <PageContainer width="narrow" className="pb-32">
        <h2 className="text-[22px] font-bold text-ink lg:text-[26px]">{cur.title}</h2>
        <p className="mt-1 text-[13px] text-ink-muted">{cur.subtitle}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {cur.options.map((o) => {
            const on = answers[step].includes(o);
            return (
              <button
                key={o}
                onClick={() => toggle(o)}
                className={`rounded-full border px-4 py-2 text-[13px] font-medium ${
                  on ? "border-brand bg-brand text-white" : "border-hairline bg-white text-ink"
                }`}
              >
                {o}
              </button>
            );
          })}
        </div>
        <p className="mt-6 text-[11px] text-ink-muted">
          Skingredient does not diagnose medical conditions.
        </p>
      </PageContainer>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-white px-5 py-4">
        <button
          onClick={() => {
            if (step < STEPS.length - 1) setStep(step + 1);
            else {
              completeOnboarding();
              navigate({ to: "/" });
            }
          }}
          className="mx-auto block w-full max-w-[400px] rounded-2xl bg-brand py-4 text-[15px] font-semibold text-white shadow-lift"
        >
          {step < STEPS.length - 1 ? "Continue" : "Finish"}
        </button>
      </div>
    </AppShell>
  );
}
