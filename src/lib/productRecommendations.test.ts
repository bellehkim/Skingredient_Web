import { describe, expect, it } from "vitest";
import { getTodaysRecommendations } from "./productRecommendations";
import type { CatalogProduct } from "./data/catalog";
import type { SkinAnalysisResult } from "./types";

function product(id: number, category: string, functionalCategories: string[]): CatalogProduct {
  return {
    product_id: id,
    brand: "Brand",
    product_name: `${category} ${id}`,
    category,
    product_ingredients: functionalCategories.map((fc) => ({
      ingredients: {
        inci_name: `Ingredient ${fc}`,
        ingredient_functions: [{ functional_category: fc }],
      },
    })),
  };
}

function analysis(overrides: Partial<SkinAnalysisResult>): SkinAnalysisResult {
  return {
    redness: 80,
    hydration: 80,
    oiliness: 80,
    acne: 80,
    pores: 80,
    texture: 80,
    ageSpots: 80,
    analyzedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("getTodaysRecommendations — category diversity", () => {
  it("returns at most one product per category, keeping the best-ranked match", () => {
    const catalog: CatalogProduct[] = [
      // Two Treatment products both match acne (salicylic_acid); the first
      // also matches niacinamide, so it should rank higher and win the slot.
      product(1, "Treatment", ["salicylic_acid", "niacinamide"]),
      product(2, "Treatment", ["salicylic_acid"]),
      product(3, "Cleanser", ["salicylic_acid"]),
      product(4, "Serum", ["niacinamide"]),
      product(5, "Moisturizer", ["niacinamide"]),
      product(6, "Sunscreen", ["niacinamide"]),
    ];

    const result = getTodaysRecommendations(catalog, analysis({ acne: 20, oiliness: 20 }));

    const categories = result.map((p) => p.category);
    expect(new Set(categories).size).toBe(categories.length);

    const treatmentPicks = result.filter((p) => p.category === "Treatment");
    expect(treatmentPicks).toHaveLength(1);
    expect(treatmentPicks[0].id).toBe("1");
  });

  it("never invents a category with no valid match", () => {
    const catalog: CatalogProduct[] = [product(1, "Cleanser", ["salicylic_acid"])];
    const result = getTodaysRecommendations(catalog, analysis({ acne: 20 }));
    expect(result.map((p) => p.category)).toEqual(["Cleanser"]);
  });

  it("caps at 5 categories even if the catalog has more matching categories", () => {
    const catalog: CatalogProduct[] = [
      product(1, "Cleanser", ["salicylic_acid"]),
      product(2, "Serum", ["niacinamide"]),
      product(3, "Moisturizer", ["niacinamide"]),
      product(4, "Sunscreen", ["niacinamide"]),
      product(5, "Treatment", ["salicylic_acid"]),
      product(6, "Toner/Essence", ["niacinamide"]),
    ];
    const result = getTodaysRecommendations(catalog, analysis({ acne: 20, oiliness: 20 }));
    expect(result.length).toBeLessThanOrEqual(5);
  });
});

describe("getTodaysRecommendations — reported ingredient reactions", () => {
  it("drops a product entirely if it contains an exact reported-irritating ingredient", () => {
    const catalog: CatalogProduct[] = [
      product(1, "Treatment", ["salicylic_acid"]),
      product(2, "Cleanser", ["salicylic_acid"]),
    ];
    const result = getTodaysRecommendations(
      catalog,
      analysis({ acne: 20 }),
      new Set(["ingredient salicylic_acid"]),
    );
    expect(result.map((p) => p.id)).not.toContain("1");
    expect(result.map((p) => p.id)).not.toContain("2");
  });
});
