import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronRight,
  User,
  Sparkles,
  AlertTriangle,
  ClipboardList,
  BellRing,
  Lock,
  HelpCircle,
  ShieldAlert,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { AppShell, PageContainer } from "@/components/app/AppShell";
import { useAppStore } from "@/lib/appStore";
import { resetDemoUser } from "@/lib/data/demoUser";
import { deriveSkinType } from "@/lib/skinType";
import { isDemoModeActive } from "@/lib/demoMode";
import { clearLocalTables } from "@/lib/data/localStore";

// Hidden for the MVP — these goals are static/hardcoded, not persisted or
// user-editable, so showing them alongside real Skin Type data would be
// misleading. Kept (not deleted) — component code and styling below are
// untouched — for when goals are backed by real, editable user data.
const SHOW_SKIN_GOALS = false;

// Deliberately profile.index.tsx, not profile.tsx: a literal profile.tsx
// file makes TanStack Router treat it as the *parent layout* for
// profile.reactions.tsx/profile.sensitivities.tsx (they'd nest under it via
// getParentRoute), which silently never renders those child pages unless
// the parent also renders an <Outlet/> — same convention shelf.index.tsx
// already uses for exactly this reason (no shelf.tsx layout file either).
export const Route = createFileRoute("/profile/")({
  head: () => ({ meta: [{ title: "Profile — Skingredient" }] }),
  component: Profile,
});

const menu: { icon: typeof User; label: string; to?: string }[] = [
  { icon: User, label: "Personal info" },
  // No `to` yet — this used to link straight to /onboarding regardless of
  // whether the user had already completed it, always dumping a returning
  // user back into the initial survey. Left as an inert placeholder (same
  // convention as the other not-yet-implemented rows below) until there's a
  // real "view your completed skin profile" destination to link to.
  { icon: Sparkles, label: "Skin profile" },
  { icon: AlertTriangle, label: "Ingredient sensitivities", to: "/profile/sensitivities" },
  { icon: ClipboardList, label: "Product reaction history", to: "/profile/reactions" },
  { icon: BellRing, label: "Reminders" },
  { icon: Lock, label: "Privacy" },
  { icon: HelpCircle, label: "Help center" },
  { icon: ShieldAlert, label: "Medical disclaimer" },
];

function Profile() {
  const { user, analysis } = useAppStore();
  // `analysis` is null until a real scan has been saved/loaded — no more
  // mockAnalysis fallback (src/lib/appStore.tsx). Skin Type is always
  // derived from it, live, via the same deriveSkinType() Results uses —
  // never a separate onboarding-answer value.
  const skinType = analysis?.id ? deriveSkinType(analysis) : null;
  const [resetting, setResetting] = useState(false);
  // Portaled to document.body below so it floats in the true viewport
  // corner — AppShell's desktop card wrapper is `lg:overflow-hidden`, which
  // would otherwise clip a `fixed` element rendered inside it. Mounted-only
  // guard avoids touching `document` during SSR.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Hackathon dev/demo tool only — see src/lib/data/demoUser.ts. In Demo
  // Mode (either the DEV-only presentation toggle or a deployed public demo
  // build — see src/lib/demoMode.ts), everything this user has done lives in
  // localStorage, never Supabase, so Reset just wipes that (clearLocalTables,
  // src/lib/data/localStore.ts). Outside Demo Mode, it wipes the fixed demo
  // user's actual Supabase rows instead (cascades to scans/shelf/custom
  // products). Either way, hard-reloads to /welcome so AppStoreProvider's
  // mount-only fetches re-run against the now-empty state.
  const handleResetDemo = async () => {
    const confirmed = window.confirm(
      "Reset all demo data? This will clear scans, shelf items, and personal products.",
    );
    if (!confirmed) return;

    setResetting(true);
    try {
      if (isDemoModeActive()) {
        clearLocalTables();
      } else {
        await resetDemoUser();
      }
      window.location.href = "/welcome";
    } catch (err) {
      console.error("Failed to reset demo data", err);
      window.alert("Reset failed — check the console for details.");
      setResetting(false);
    }
  };

  return (
    <AppShell title="Profile">
      <PageContainer width="wide">
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-light text-[22px] font-bold text-brand">
                {user.name[0]}
              </div>
              <div className="flex-1">
                <h1 className="text-[22px] font-bold text-ink">{user.name}</h1>
                <Link to="/profile" className="text-[13px] font-medium text-brand">
                  View profile
                </Link>
              </div>
            </div>

            <section className="mt-6 rounded-3xl border border-hairline bg-white p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold tracking-[0.14em] text-ink-muted">
                    SKIN TYPE
                  </p>
                  <p className="mt-1 text-[15px] font-semibold text-ink">
                    {skinType ?? "Not analyzed yet"}
                  </p>
                  <p className="text-[13px] text-ink-muted">
                    {skinType
                      ? "Based on your latest skin analysis"
                      : "Complete a skin scan to determine your skin type."}
                  </p>
                </div>
                <Link
                  to="/scan/check-in"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-light px-3 py-1.5 text-[12px] font-semibold text-brand"
                >
                  <RefreshCw size={12} /> Retake scan
                </Link>
              </div>
            </section>

            {SHOW_SKIN_GOALS && (
              <section className="mt-3 rounded-3xl border border-hairline bg-white p-4 shadow-soft">
                <p className="text-[11px] font-bold tracking-[0.14em] text-ink-muted">SKIN GOALS</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {user.goals.map((g) => (
                    <span
                      key={g}
                      className="rounded-full bg-brand-light px-3 py-1 text-[12px] font-medium text-brand"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          <ul className="mt-4 divide-y divide-hairline overflow-hidden rounded-3xl border border-hairline bg-white shadow-soft lg:mt-0">
            {menu.map((m) => {
              const inner = (
                <>
                  <m.icon size={18} className="text-ink-muted" />
                  <span className="flex-1 text-[14px] text-ink">{m.label}</span>
                  <ChevronRight size={16} className="text-ink-muted" />
                </>
              );
              return (
                <li key={m.label}>
                  {m.to ? (
                    <Link to={m.to} className="flex items-center gap-3 px-4 py-3.5 text-left">
                      {inner}
                    </Link>
                  ) : (
                    <button className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </PageContainer>

      {mounted &&
        (import.meta.env.DEV || isDemoModeActive()) &&
        createPortal(
          <button
            onClick={handleResetDemo}
            disabled={resetting}
            className="fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full border border-dashed border-coral/40 bg-coral-light/90 px-3.5 py-2 text-[12px] font-semibold text-coral shadow-lift backdrop-blur disabled:opacity-60 lg:bottom-6 lg:right-6"
          >
            <Trash2 size={13} /> {resetting ? "Resetting…" : "Reset demo"}
          </button>,
          document.body,
        )}
    </AppShell>
  );
}
