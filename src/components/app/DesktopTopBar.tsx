import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export interface Crumb {
  label: string;
  to?: string;
}

export function DesktopTopBar({
  title,
  breadcrumb,
  back,
  actions,
}: {
  title?: string;
  breadcrumb?: Crumb[];
  back?: string;
  actions?: ReactNode;
}) {
  if (!title && !breadcrumb && !actions) return null;

  return (
    <header className="hidden items-center gap-4 border-b border-hairline px-10 py-5 lg:flex">
      <div className="min-w-0 flex-1">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-1 flex items-center gap-1 text-[12px] font-medium text-ink-muted">
            {breadcrumb.map((c, idx) => (
              <span key={c.label} className="flex items-center gap-1">
                {idx > 0 && <ChevronRight size={12} />}
                {c.to ? (
                  <Link to={c.to} className="hover:text-ink">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-ink">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        {title && (
          <div className="flex items-center gap-2.5">
            {back && (
              <Link
                to={back}
                aria-label="Back"
                className="grid h-8 w-8 place-items-center rounded-full text-ink hover:bg-surface-muted"
              >
                <ChevronLeft size={18} />
              </Link>
            )}
            <h1 className="truncate text-[20px] font-bold text-ink">{title}</h1>
          </div>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}