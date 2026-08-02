import { Link } from "@tanstack/react-router";
import { ChevronLeft, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function MobileHeader({
  title,
  back = "/",
  rightIcon: RightIcon,
  onRight,
  rightSlot,
}: {
  title: string;
  back?: string;
  rightIcon?: LucideIcon;
  onRight?: () => void;
  rightSlot?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between px-5 pt-5 pb-2 lg:hidden">
      <Link
        to={back}
        aria-label="Back"
        className="grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-surface-muted"
      >
        <ChevronLeft size={22} />
      </Link>
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