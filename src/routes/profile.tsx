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

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Skingredient" }] }),
  component: Profile,
});

const menu: { icon: typeof User; label: string; to?: string }[] = [
  { icon: User, label: "Personal info" },
  { icon: Sparkles, label: "Skin profile", to: "/onboarding" },
  { icon: AlertTriangle, label: "Ingredient sensitivities" },
  { icon: ClipboardList, label: "Ingredient reaction history" },
  { icon: BellRing, label: "Reminders" },
  { icon: Lock, label: "Privacy" },
  { icon: HelpCircle, label: "Help center" },
  { icon: ShieldAlert, label: "Medical disclaimer" },
];

function Profile() {
  const { user } = useAppStore();
  const [resetting, setResetting] = useState(false);
  // Portaled to document.body below so it floats in the true viewport
  // corner — AppShell's desktop card wrapper is `lg:overflow-hidden`, which
  // would otherwise clip a `fixed` element rendered inside it. Mounted-only
  // guard avoids touching `document` during SSR.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Hackathon dev/demo tool only — see src/lib/data/demoUser.ts. Wipes the
  // fixed demo user's Supabase rows (cascades to scans/shelf/custom
  // products) and the one localStorage key this app writes, then hard-
  // reloads to /welcome so AppStoreProvider's mount-only fetches re-run
  // against the now-empty tables instead of leaving stale in-memory state.
  const handleResetDemo = async () => {
    const confirmed = window.confirm(
      "Reset all demo data? This will clear scans, Shelf items, and personal products.",
    );
    if (!confirmed) return;

    setResetting(true);
    try {
      await resetDemoUser();
      localStorage.removeItem("skingredient");
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
                    SKIN PROFILE
                  </p>
                  <p className="mt-1 text-[15px] font-semibold text-ink">{user.skinType}</p>
                  <p className="text-[13px] text-ink-muted">{user.skinNote}</p>
                </div>
                <Link
                  to="/onboarding"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-light px-3 py-1.5 text-[12px] font-semibold text-brand"
                >
                  <RefreshCw size={12} /> Retake
                </Link>
              </div>
            </section>

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
        import.meta.env.DEV &&
        createPortal(
          <button
            onClick={handleResetDemo}
            disabled={resetting}
            className="fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full border border-dashed border-coral/40 bg-coral-light/90 px-3.5 py-2 text-[12px] font-semibold text-coral shadow-lift backdrop-blur disabled:opacity-60 lg:bottom-6 lg:right-6"
          >
            <Trash2 size={13} /> {resetting ? "Resetting…" : "Reset Demo"}
          </button>,
          document.body,
        )}
    </AppShell>
  );
}
