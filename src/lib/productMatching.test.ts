import { describe, expect, it } from "vitest";
import { buildProductsFromCatalog, sortProductsByRoutineStep } from "./productMatching";
import type { CatalogProduct } from "./data/catalog";
import type { DailyRecommendation } from "./types";

function catalogRow(
  id: number,
  inciName: string,
  functionalCategory: string,
  commonName: string | null = null,
): CatalogProduct {
  return {
    product_id: id,
    brand: "Brand",
    product_name: `Product ${id}`,
    category: "Serum",
    product_ingredients: [
      {
        ingredients: {
          inci_name: inciName,
          common_name: commonName,
          ingredient_functions: [{ functional_category: functionalCategory }],
        },
      },
    ],
  };
}

function multiIngredientRow(
  id: number,
  ingredients: { inciName: string; functionalCategory: string; commonName: string | null }[],
): CatalogProduct {
  return {
    product_id: id,
    brand: "Brand",
    product_name: `Product ${id}`,
    category: "Serum",
    product_ingredients: ingredients.map((i) => ({
      ingredients: {
        inci_name: i.inciName,
        common_name: i.commonName,
        ingredient_functions: [{ functional_category: i.functionalCategory }],
      },
    })),
  };
}

function recommendation(overrides: Partial<DailyRecommendation> = {}): DailyRecommendation {
  return {
    direction: "hydration-support",
    displayName: "Hydration Support",
    explanation: "",
    prioritizedIngredients: [],
    avoidedIngredients: [],
    riskLevel: "low",
    ...overrides,
  };
}

describe("buildProductsFromCatalog — exact-ingredient reactions", () => {
  it("marks a product skip-today when it contains an exact reported-irritating ingredient", () => {
    const catalog = [catalogRow(1, "Retinol", "retinoid")];
    const [product] = buildProductsFromCatalog(catalog, recommendation(), new Set(["retinol"]));
    expect(product.status).toBe("skip-today");
    expect(product.reason).toContain("Retinol");
  });

  it("does not flag a different ingredient in the same broader family", () => {
    // Reporting "Retinol" as irritating must not treat every retinoid the
    // same — only the exact ingredient identity is excluded here.
    const catalog = [catalogRow(1, "Retinaldehyde", "retinoid")];
    const [product] = buildProductsFromCatalog(catalog, recommendation(), new Set(["retinol"]));
    expect(product.status).not.toBe("skip-today");
  });

  it("exact-ingredient exclusion takes priority over a prioritized category match", () => {
    const catalog = [catalogRow(1, "Niacinamide", "niacinamide")];
    const rec = recommendation({ prioritizedIngredients: ["Niacinamide"] });
    const [product] = buildProductsFromCatalog(catalog, rec, new Set(["niacinamide"]));
    expect(product.status).toBe("skip-today");
  });
});

describe("buildProductsFromCatalog — product-level reactions", () => {
  it("marks a product 'reaction-reported', not 'skip-today', when the user directly reported it as irritating", () => {
    const catalog = [catalogRow(1, "Niacinamide", "niacinamide")];
    const [product] = buildProductsFromCatalog(
      catalog,
      recommendation(),
      new Set(),
      new Set(["1"]),
    );
    expect(product.status).toBe("reaction-reported");
  });

  it("reaction-reported takes priority over an exact ingredient match", () => {
    const catalog = [catalogRow(1, "Retinol", "retinoid")];
    const [product] = buildProductsFromCatalog(
      catalog,
      recommendation(),
      new Set(["retinol"]),
      new Set(["1"]),
    );
    expect(product.status).toBe("reaction-reported");
  });

  it("does not flag a different product that happens to share an ingredient", () => {
    const catalog = [
      catalogRow(1, "Niacinamide", "niacinamide"),
      catalogRow(2, "Niacinamide", "niacinamide"),
    ];
    const products = buildProductsFromCatalog(catalog, recommendation(), new Set(), new Set(["1"]));
    expect(products[0].status).toBe("reaction-reported");
    expect(products[1].status).not.toBe("reaction-reported");
  });
});

describe("buildProductsFromCatalog — key ingredient display", () => {
  it("only includes ingredients with curated common_name metadata in keyIngredients", () => {
    const catalog = [
      multiIngredientRow(1, [
        { inciName: "Snail Secretion Filtrate", functionalCategory: "", commonName: "Snail Secretion Filtrate" },
        { inciName: "Sodium Hyaluronate", functionalCategory: "hyaluronic_acid", commonName: "Hyaluronic Acid" },
        { inciName: "Allantoin", functionalCategory: "allantoin", commonName: null },
        { inciName: "Xanthan Gum", functionalCategory: "", commonName: null },
        { inciName: "Phenoxyethanol", functionalCategory: "", commonName: null },
      ]),
    ];
    const [product] = buildProductsFromCatalog(catalog, recommendation());
    expect(product.keyIngredients).toEqual(["Snail Secretion Filtrate", "Sodium Hyaluronate"]);
    expect(product.keyIngredients).not.toContain("Allantoin");
    expect(product.keyIngredients).not.toContain("Xanthan Gum");
    expect(product.keyIngredients).not.toContain("Phenoxyethanol");
  });

  it("still detects a reported-irritating ingredient even when it has no curated metadata", () => {
    const catalog = [
      multiIngredientRow(1, [
        { inciName: "Allantoin", functionalCategory: "allantoin", commonName: null },
      ]),
    ];
    const [product] = buildProductsFromCatalog(
      catalog,
      recommendation(),
      new Set(["allantoin"]),
    );
    expect(product.status).toBe("skip-today");
    // Display list is still curated-only — the irritating-ingredient
    // detection above must not depend on it being shown as a chip.
    expect(product.keyIngredients).toEqual([]);
  });

  it("leaves a fully-curated small formulation completely unaffected", () => {
    const catalog = [
      multiIngredientRow(1, [
        { inciName: "Ceramide NP", functionalCategory: "ceramide", commonName: "Ceramides" },
        { inciName: "Glycerin", functionalCategory: "glycerin", commonName: "Glycerin" },
      ]),
    ];
    const [product] = buildProductsFromCatalog(catalog, recommendation());
    expect(product.keyIngredients).toEqual(["Ceramide NP", "Glycerin"]);
  });
});

describe("sortProductsByRoutineStep", () => {
  it("sorts into Cleanser, Toner/Essence, Serum, Moisturizer, Treatment, Sunscreen order", () => {
    const items = [
      { category: "Sunscreen", id: "a" },
      { category: "Cleanser", id: "b" },
      { category: "Treatment", id: "c" },
      { category: "Moisturizer", id: "d" },
      { category: "Toner/Essence", id: "e" },
      { category: "Serum", id: "f" },
    ];
    const sorted = sortProductsByRoutineStep(items, (i) => i.category);
    expect(sorted.map((i) => i.id)).toEqual(["b", "e", "f", "d", "c", "a"]);
  });

  it("preserves the existing relative order of same-category items rather than reshuffling them", () => {
    const items = [
      { category: "Serum", id: "first-serum" },
      { category: "Cleanser", id: "only-cleanser" },
      { category: "Serum", id: "second-serum" },
    ];
    const sorted = sortProductsByRoutineStep(items, (i) => i.category);
    expect(sorted.map((i) => i.id)).toEqual(["only-cleanser", "first-serum", "second-serum"]);
  });

  it("sorts an unrecognized category after every named step, without throwing", () => {
    const items = [
      { category: "Mystery", id: "unknown" },
      { category: "Cleanser", id: "known" },
    ];
    const sorted = sortProductsByRoutineStep(items, (i) => i.category);
    expect(sorted.map((i) => i.id)).toEqual(["known", "unknown"]);
  });

  it("does not mutate the input array", () => {
    const items = [
      { category: "Sunscreen", id: "a" },
      { category: "Cleanser", id: "b" },
    ];
    const original = items.slice();
    sortProductsByRoutineStep(items, (i) => i.category);
    expect(items).toEqual(original);
  });
});
