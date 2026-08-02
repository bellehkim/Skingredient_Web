import { createFileRoute, Link } from "@tanstack/react-router";
import { ScanLine, Search, Camera, PenLine } from "lucide-react";
import { AppShell, PageContainer } from "@/components/app/AppShell";
import { MobileHeader } from "@/components/app/MobileHeader";

export const Route = createFileRoute("/shelf/add")({
  head: () => ({ meta: [{ title: "Add product — Skingredient" }] }),
  component: AddProduct,
});

const options = [
  { icon: ScanLine, title: "Scan product", sub: "Scan the barcode on the packaging" },
  { icon: Search, title: "Search product database", sub: "Find products by name or brand" },
  { icon: Camera, title: "Upload ingredient photo", sub: "We'll extract the ingredient list" },
  { icon: PenLine, title: "Add manually", sub: "Type in details yourself" },
];

function AddProduct() {
  return (
    <AppShell
      title="Add product"
      back="/shelf"
      breadcrumb={[{ label: "My Shelf", to: "/shelf" }, { label: "Add product" }]}
    >
      <MobileHeader title="Add product" back="/shelf" />
      <PageContainer width="narrow">
        <p className="text-[14px] text-ink-muted">Choose how you'd like to add a product to your shelf.</p>
        <div className="mt-5 space-y-3">
          {options.map((o) => (
            <button
              key={o.title}
              className="flex w-full items-center gap-3 rounded-2xl border border-hairline bg-white p-4 text-left shadow-soft"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-light text-brand">
                <o.icon size={20} />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-semibold text-ink">{o.title}</p>
                <p className="text-[12.5px] text-ink-muted">{o.sub}</p>
              </div>
            </button>
          ))}
        </div>
        <p className="mt-6 text-center text-[11px] text-ink-muted">
          Please verify any auto-extracted ingredients. Image recognition may contain errors.
        </p>
      </PageContainer>
    </AppShell>
  );
}