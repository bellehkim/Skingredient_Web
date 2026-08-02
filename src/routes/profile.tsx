import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, User, Sparkles, AlertTriangle, ClipboardList, BellRing, Lock, HelpCircle, ShieldAlert, RefreshCw } from "lucide-react";
import { AppShell, PageContainer } from "@/components/app/AppShell";
import { useAppStore } from "@/lib/appStore";

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
            <Link to="/profile" className="text-[13px] font-medium text-brand">View profile</Link>
          </div>
        </div>

        <section className="mt-6 rounded-3xl border border-hairline bg-white p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-[0.14em] text-ink-muted">SKIN PROFILE</p>
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
              <span key={g} className="rounded-full bg-brand-light px-3 py-1 text-[12px] font-medium text-brand">{g}</span>
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
    </AppShell>
  );
}