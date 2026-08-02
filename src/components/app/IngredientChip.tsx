export function IngredientChip({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "sage" | "coral" | "aqua" | "sun" | "brand";
}) {
  const cls = {
    neutral: "bg-surface-muted text-ink",
    sage: "bg-sage-light text-sage",
    coral: "bg-coral-light text-coral",
    aqua: "bg-aqua-light text-aqua",
    sun: "bg-sun-light text-[#a1770b]",
    brand: "bg-brand-light text-brand",
  }[tone];
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-medium ${cls}`}>
      {label}
    </span>
  );
}