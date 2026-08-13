import { Link } from "@tanstack/react-router";

export function IngredientChip({
  label,
  tone = "neutral",
  ingredientId,
}: {
  label: string;
  tone?: "neutral" | "sage" | "coral" | "aqua" | "sun" | "brand";
  /** Ingredient Library id — if provided, the chip links to its detail page.
   * Omit (or leave unmatched) for ingredients not in the curated library;
   * the chip stays plain, non-clickable text. */
  ingredientId?: string;
}) {
  const cls = {
    neutral: "bg-surface-muted text-ink",
    sage: "bg-sage-light text-sage",
    coral: "bg-coral-light text-coral",
    aqua: "bg-aqua-light text-aqua",
    sun: "bg-sun-light text-[#a1770b]",
    brand: "bg-brand-light text-brand",
  }[tone];

  const className = `inline-flex items-center rounded-full px-3 py-1 text-[12px] font-medium ${cls}`;

  if (ingredientId) {
    return (
      <Link to="/ingredients/$ingredientId" params={{ ingredientId }} className={className}>
        {label}
      </Link>
    );
  }

  return <span className={className}>{label}</span>;
}
