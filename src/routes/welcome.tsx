import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { AppShell, PageContainer } from "@/components/app/AppShell";
import { setDemoModeActive } from "@/lib/demoMode";

const welcomeSearchSchema = z.object({
  // Presentation entry point for Demo Mode (src/lib/demoMode.ts) — activates
  // the same session-level flag /scan?demo=true does, but without jumping
  // straight to Scan: the whole point is to start the presentation from the
  // real first-user screen and walk the normal
  // Welcome -> Onboarding -> Check-in -> Scan flow untouched. /scan?demo=true
  // still works on its own for quick dev testing.
  demo: z.boolean().optional(),
});

export const Route = createFileRoute("/welcome")({
  head: () => ({ meta: [{ title: "Welcome — Skingredient" }] }),
  validateSearch: welcomeSearchSchema,
  component: Welcome,
});

function Welcome() {
  const { demo } = Route.useSearch();
  // Activates the flag and stays right here — no redirect. Demo Mode is
  // meant to be invisible: the presenter clicks through Get started ->
  // Onboarding -> Check-in -> Scan exactly like a real first-time user.
  useEffect(() => {
    if (import.meta.env.DEV && demo === true) setDemoModeActive(true);
  }, [demo]);

  return (
    <AppShell hideNav>
      <div className="relative min-h-screen overflow-hidden">
        {/* Decorative gradient bubbles */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full opacity-60 blur-2xl"
            style={{ background: "radial-gradient(circle, #EEEAFE 0%, transparent 70%)" }} />
          <div className="absolute -right-24 top-40 h-72 w-72 rounded-full opacity-60 blur-2xl"
            style={{ background: "radial-gradient(circle, #CDEEFF 0%, transparent 70%)" }} />
          <div className="absolute bottom-40 left-10 h-40 w-40 rounded-full opacity-60 blur-2xl"
            style={{ background: "radial-gradient(circle, #E8F8F1 0%, transparent 70%)" }} />
        </div>

        <PageContainer width="narrow" className="relative flex min-h-screen flex-col">
          <div className="mt-6 inline-flex items-center gap-2">
            <span className="text-[15px] font-semibold text-ink">Skingredient</span>
          </div>

          <div className="relative mt-16 flex-1">
            {/* Bottles illustration */}
            <div className="relative mx-auto h-64 w-64">
              <div className="absolute inset-0 rounded-full"
                style={{ background: "radial-gradient(circle, #EDE6FF 0%, #E8F0FF 60%, transparent 80%)" }} />
              <div className="absolute left-8 top-6 h-40 w-16 rounded-3xl shadow-lift"
                style={{ background: "linear-gradient(180deg, #C9BEFB 0%, #7257E8 100%)" }} />
              <div className="absolute right-6 top-2 h-48 w-20 rounded-3xl shadow-lift"
                style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #E4DBFB 100%)" }} />
              <div className="absolute left-24 top-24 h-28 w-14 rounded-2xl shadow-lift"
                style={{ background: "linear-gradient(180deg, #F7E7ED 0%, #E5D5FA 100%)" }} />
            </div>

            <h1 className="mt-8 text-[30px] font-bold leading-[1.15] text-ink">
              Smarter skincare starts with the <span className="text-brand">right ingredients.</span>
            </h1>
            <ul className="mt-5 space-y-2 text-[14px] text-ink-muted">
              <li>• AI-powered skin analysis</li>
              <li>• Personalized ingredient guidance</li>
              <li>• Smarter product choices</li>
            </ul>
          </div>

          <div className="sticky bottom-0 mt-8 flex flex-col items-center gap-3 py-6">
            <Link
              to="/onboarding"
              className="w-full rounded-2xl bg-brand py-4 text-center text-[15px] font-semibold text-white shadow-lift"
            >
              Get started
            </Link>
            <Link to="/" className="text-[14px] font-medium text-brand">
              I already have an account
            </Link>
          </div>
        </PageContainer>
      </div>
    </AppShell>
  );
}