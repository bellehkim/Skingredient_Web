import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Package, ScanFace, ChartNoAxesCombined, UserRound } from "lucide-react";

const tabs = [
  { to: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { to: "/shelf", label: "My shelf", icon: Package, match: (p: string) => p.startsWith("/shelf") },
  { to: "/scan", label: "Scan", icon: ScanFace, match: (p: string) => p.startsWith("/scan") },
  // /results is where a scan's output lives, not the capture flow itself —
  // grouped with Insights (Trend/History), the other places "your results"
  // live, rather than Scan (see src/routes/results.tsx).
  {
    to: "/insights",
    label: "Insights",
    icon: ChartNoAxesCombined,
    match: (p: string) => p.startsWith("/insights") || p === "/results",
  },
  {
    to: "/profile",
    label: "Profile",
    icon: UserRound,
    match: (p: string) => p.startsWith("/profile"),
  },
] as const;

export function BottomNavigation() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      className="sticky bottom-0 z-30 border-t border-hairline bg-white/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-[430px] items-center justify-between px-3 py-2">
        {tabs.map((t) => {
          const active = t.match(pathname);
          const Icon = t.icon;
          return (
            <li key={t.to} className="flex-1">
              <Link
                to={t.to}
                aria-label={t.label}
                className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors ${
                  active ? "text-[#9d86fc]" : "text-ink-muted"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
