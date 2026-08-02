import type { ProductStatus } from "@/lib/types";

const map: Record<ProductStatus, { label: string; cls: string }> = {
  "use-today": { label: "USE TODAY", cls: "bg-sage-light text-sage" },
  optional: { label: "OPTIONAL", cls: "bg-sun-light text-[#a1770b]" },
  "skip-today": { label: "SKIP TODAY", cls: "bg-coral-light text-coral" },
};

export function StatusBadge({ status }: { status: ProductStatus }) {
  const s = map[status];
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold tracking-wider ${s.cls}`}>
      {s.label}
    </span>
  );
}