import type { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { SidebarNavigation } from "./SidebarNavigation";
import { DesktopTopBar, type Crumb } from "./DesktopTopBar";

export function AppShell({
  children,
  hideNav = false,
  title,
  breadcrumb,
  back,
  onBack,
  actions,
}: {
  children: ReactNode;
  hideNav?: boolean;
  /** Desktop top-bar page title */
  title?: string;
  breadcrumb?: Crumb[];
  back?: string;
  /** See MobileHeader's onBack — same escape hatch for pages with more than
   * one entry point, where no single hardcoded `back` destination is correct. */
  onBack?: () => void;
  actions?: ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-surface-muted">
      <div
        className={`mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-white shadow-soft md:max-w-[720px] lg:my-6 lg:min-h-[calc(100vh-48px)] lg:max-w-[1280px] lg:flex-row lg:overflow-hidden lg:rounded-[28px] lg:border lg:border-hairline`}
      >
        {!hideNav && <SidebarNavigation />}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Not gated on hideNav: pages that hide the sidebar/bottom nav (e.g. a
              full-bleed flow with a fixed-bottom CTA) can still opt into a desktop
              back button by passing `back`/`title` — DesktopTopBar itself renders
              nothing when none of title/breadcrumb/actions are given. */}
          <DesktopTopBar
            title={title}
            breadcrumb={breadcrumb}
            back={back}
            onBack={onBack}
            actions={actions}
          />
          <main className={`flex-1 ${hideNav ? "" : "pb-24 lg:pb-12"}`}>{children}</main>
          {!hideNav && (
            <div className="lg:hidden">
              <BottomNavigation />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const WIDTHS = {
  default: "lg:max-w-[1000px]",
  wide: "lg:max-w-none",
  narrow: "lg:mx-auto lg:max-w-[760px]",
} as const;

export function PageContainer({
  children,
  className = "",
  width = "default",
}: {
  children: ReactNode;
  className?: string;
  width?: keyof typeof WIDTHS;
}) {
  return (
    <div className={`px-5 pt-6 md:px-8 lg:px-10 lg:pt-8 ${WIDTHS[width]} ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[17px] font-semibold text-ink">{title}</h2>
      {action}
    </div>
  );
}