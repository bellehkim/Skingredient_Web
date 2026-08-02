import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

export function SafetyNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-coral/20 bg-coral-light p-4">
      <ShieldAlert className="mt-0.5 shrink-0 text-coral" size={20} />
      <p className="text-[13px] leading-relaxed text-ink">{children}</p>
    </div>
  );
}