import { Link } from "@tanstack/react-router";
import { ChevronLeft, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function MobileHeader({
  title,
  back,
  onBack,
  rightIcon: RightIcon,
  onRight,
  rightSlot,
}: {
  title: string;
  /** Omit on top-level pages reachable directly from the nav (Home, My Shelf,
   * Scan, Insights, Ingredients, Routine, Profile) — those are peers, not
   * drill-down sub-pages, so they shouldn't show a back arrow at all. */
  back?: string;
  /** When set, the back control calls this (typically browser history.back())
   * instead of navigating to a fixed `back` path — for pages reachable from
   * more than one place, where no single hardcoded destination is correct. */
  onBack?: () => void;
  rightIcon?: LucideIcon;
  onRight?: () => void;
  rightSlot?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between px-5 pt-5 pb-2 lg:hidden">
      <div className="grid h-9 w-9 place-items-center">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-surface-muted"
          >
            <ChevronLeft size={22} />
          </button>
        ) : (
          back && (
            <Link
              to={back}
              aria-label="Back"
              className="grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-surface-muted"
            >
              <ChevronLeft size={22} />
            </Link>
          )
        )}
      </div>
      <h1 className="text-[16px] font-semibold text-ink">{title}</h1>
      <div className="grid h-9 w-9 place-items-center">
        {rightSlot ??
          (RightIcon ? (
            <button
              aria-label="More"
              onClick={onRight}
              className="grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-surface-muted"
            >
              <RightIcon size={20} />
            </button>
          ) : null)}
      </div>
    </header>
  );
}