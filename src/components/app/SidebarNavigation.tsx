import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Package,
  ScanFace,
  ChartNoAxesCombined,
  FlaskConical,
  CalendarHeart,
  UserRound,
  Bell,
} from "lucide-react";
import { useAppStore } from "@/lib/appStore";

const items = [
  { to: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { to: "/shelf", label: "My Shelf", icon: Package, match: (p: string) => p.startsWith("/shelf") },
  { to: "/scan", label: "Scan", icon: ScanFace, match: (p: string) => p.startsWith("/scan") || p === "/results" },
  { to: "/insights", label: "Insights", icon: ChartNoAxesCombined, match: (p: string) => p.startsWith("/insights") },
  { to: "/ingredients", label: "Ingredients", icon: FlaskConical, match: (p: string) => p.startsWith("/ingredients") },
  { to: "/routine", label: "Routine", icon: CalendarHeart, match: (p: string) => p.startsWith("/routine") },
  { to: "/profile", label: "Profile", icon: UserRound, match: (p: string) => p.startsWith("/profile") },
] as const;

export function SidebarNavigation() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAppStore();

  return (
    <aside className="hidden w-[232px] shrink-0 flex-col border-r border-hairline bg-white lg:flex">
      <div className="flex items-center gap-2.5 px-5 pb-6 pt-7">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-light">
          <FlaskConical size={18} className="text-brand" />
        </span>
        <span className="text-[16.5px] font-bold tracking-tight text-ink">Skingredient</span>
      </div>

      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {items.map((it) => {
            const active = it.match(pathname);
            const Icon = it.icon;
            return (
              <li key={it.to}>
                <Link
                  to={it.to}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] font-semibold transition-colors ${
                    active
                      ? "bg-brand-light text-[#9d86fc]"
                      : "text-ink-muted hover:bg-surface-muted hover:text-ink"
                  }`}
                >
                  <Icon size={19} strokeWidth={active ? 2.4 : 2} />
                  {it.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-3 pb-5">
        <button className="mb-1 flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] font-medium text-ink-muted hover:bg-surface-muted hover:text-ink">
          <span className="relative">
            <Bell size={19} />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-coral" />
          </span>
          Notifications
        </button>
        <Link
          to="/profile"
          className="flex items-center gap-3 rounded-2xl border border-hairline p-2.5 hover:bg-surface-muted"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-light text-[14px] font-bold text-brand">
            {user.name[0]}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-semibold text-ink">{user.name}</span>
            <span className="block truncate text-[11.5px] text-ink-muted">{user.skinType}</span>
          </span>
        </Link>
      </div>
    </aside>
  );
}