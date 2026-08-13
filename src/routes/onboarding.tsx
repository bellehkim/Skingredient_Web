import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
    maxSelect: 5,
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
    maxSelect: 5,
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
  const {
    completeOnboarding,
    onboardingStep: step,
    setOnboardingStep: setStep,
    onboardingAnswers,
    setOnboardingAnswers,
  } = useAppStore();
  // Derived rather than read directly: onboardingAnswers starts as [] in the
  // store (it doesn't know STEPS' length), so pad it out to one entry per
  // step on every render instead of mutating the store's shape directly.
  const answers = STEPS.map((_, i) => onboardingAnswers[i] ?? []);

  const cur = STEPS[step];
  const atMax = cur.maxSelect !== undefined && answers[step].length >= cur.maxSelect;
  const toggle = (v: string) => {
    const a = [...answers];
    const selected = a[step].includes(v);
    if (cur.multi === false) {
      a[step] = [v];
    } else if (selected) {
      a[step] = a[step].filter((x) => x !== v);
    } else if (cur.maxSelect === undefined || a[step].length < cur.maxSelect) {
      a[step] = [...a[step], v];
    } else {
      return; // at the cap — ignore new selections until one is deselected
    }
    setOnboardingAnswers(a);
  };
  const progress = ((step + 1) / STEPS.length) * 100;
  // Step back in-place rather than navigating to /onboarding for step > 0 —
  // that would remount the component. (No longer resets progress either way
  // since step/answers now live in the app store, not local state — but
  // in-place stepping is still snappier than a round-trip through history.)
  const goBack = () => {
    if (step === 0) navigate({ to: "/welcome" });
    else setStep(step - 1);
  };

  return (
    <AppShell hideNav title={`Step ${step + 1} of ${STEPS.length}`} onBack={goBack}>
      <MobileHeader title={`Step ${step + 1} of ${STEPS.length}`} onBack={goBack} />
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
            const disabled = !on && atMax;
            let optionClass = "border-hairline bg-white text-ink";
            if (on) optionClass = "border-brand bg-brand text-white";
            else if (disabled) optionClass = "cursor-not-allowed border-hairline bg-white text-ink-muted opacity-50";
            return (
              <button
                key={o}
                onClick={() => toggle(o)}
                disabled={disabled}
                className={`rounded-full border px-4 py-2 text-[13px] font-medium ${optionClass}`}
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
            if (answers[step].length === 0) return;
            if (step < STEPS.length - 1) setStep(step + 1);
            else {
              completeOnboarding();
              navigate({ to: "/scan/check-in", search: { onboarding: true } });
            }
          }}
          disabled={answers[step].length === 0}
          className="mx-auto block w-full max-w-[400px] rounded-2xl bg-brand py-4 text-[15px] font-semibold text-white shadow-lift disabled:cursor-not-allowed disabled:opacity-40"
        >
          {step < STEPS.length - 1 ? "Continue" : "Finish"}
        </button>
      </div>
    </AppShell>
  );
}
