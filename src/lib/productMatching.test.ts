import { describe, expect, it } from "vitest";
import { buildProductsFromCatalog } from "./productMatching";
import type { CatalogProduct } from "./data/catalog";
import type { DailyRecommendation } from "./types";

function catalogRow(id: number, inciName: string, functionalCategory: string): CatalogProduct {
  return {
    product_id: id,
    brand: "Brand",
    product_name: `Product ${id}`,
    category: "Serum",
    product_ingredients: [
      {
        ingredients: {
          inci_name: inciName,
          ingredient_functions: [{ functional_category: functionalCategory }],
        },
      },
    ],
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
