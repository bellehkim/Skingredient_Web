import { describe, expect, it } from "vitest";
import { getTodaysRecommendations } from "./productRecommendations";
import type { CatalogProduct } from "./data/catalog";
import type { DailyRecommendation } from "./types";

function product(
  id: number,
  category: string,
  functionalCategories: string[],
  brand = "Brand",
): CatalogProduct {
  return {
    product_id: id,
    brand,
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

function recommendation(overrides: Partial<DailyRecommendation> = {}): DailyRecommendation {
  return {
    direction: "blemish-control",
    displayName: "Blemish Control",
    explanation: "",
    prioritizedIngredients: [],
    avoidedIngredients: [],
    riskLevel: "moderate",
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

    const result = getTodaysRecommendations(
      catalog,
      recommendation({ prioritizedIngredients: ["Salicylic Acid", "Niacinamide"] }),
    );

    const categories = result.map((p) => p.category);
    expect(new Set(categories).size).toBe(categories.length);

    const treatmentPicks = result.filter((p) => p.category === "Treatment");
    expect(treatmentPicks).toHaveLength(1);
    expect(treatmentPicks[0].id).toBe("1");
  });

  it("never invents a category with no valid match", () => {
    const catalog: CatalogProduct[] = [product(1, "Cleanser", ["salicylic_acid"])];
    const result = getTodaysRecommendations(
      catalog,
      recommendation({ prioritizedIngredients: ["Salicylic Acid"] }),
    );
    expect(result.map((p) => p.category)).toEqual(["Cleanser"]);
  });

  it("allows one product per category for all 6 supported categories", () => {
    const catalog: CatalogProduct[] = [
      product(1, "Cleanser", ["salicylic_acid"]),
      product(2, "Serum", ["niacinamide"]),
      product(3, "Moisturizer", ["niacinamide"]),
      product(4, "Sunscreen", ["niacinamide"]),
      product(5, "Treatment", ["salicylic_acid"]),
      product(6, "Toner/Essence", ["niacinamide"]),
    ];
    const result = getTodaysRecommendations(
      catalog,
      recommendation({ prioritizedIngredients: ["Salicylic Acid", "Niacinamide"] }),
    );
    expect(result).toHaveLength(6);
    expect(new Set(result.map((p) => p.category)).size).toBe(6);
  });

  it("caps at 6 even if the catalog has more matching category strings", () => {
    const catalog: CatalogProduct[] = [
      product(1, "Cleanser", ["salicylic_acid"]),
      product(2, "Serum", ["niacinamide"]),
      product(3, "Moisturizer", ["niacinamide"]),
      product(4, "Sunscreen", ["niacinamide"]),
      product(5, "Treatment", ["salicylic_acid"]),
      product(6, "Toner/Essence", ["niacinamide"]),
      product(7, "SeventhCategory", ["niacinamide"]),
    ];
    const result = getTodaysRecommendations(
      catalog,
      recommendation({ prioritizedIngredients: ["Salicylic Acid", "Niacinamide"] }),
    );
    expect(result.length).toBeLessThanOrEqual(6);
  });

  it("returns nothing when nothing is prioritized — consistency over filling the section", () => {
    const catalog: CatalogProduct[] = [product(1, "Cleanser", ["salicylic_acid"])];
    const result = getTodaysRecommendations(
      catalog,
      recommendation({ prioritizedIngredients: [] }),
    );
    expect(result).toEqual([]);
  });
});

describe("getTodaysRecommendations — brand-diversity tie-break", () => {
  it("never promotes a lower-scoring product over a higher-scoring one for brand diversity", () => {
    const catalog: CatalogProduct[] = [
      // BrandA already "won" the Cleanser category. In Moisturizer, BrandA's
      // product matches on two categories (strictly better) while BrandB's
      // only matches one — BrandA must still win despite already being used.
      product(1, "Cleanser", ["salicylic_acid"], "BrandA"),
      product(2, "Moisturizer", ["niacinamide", "ceramide"], "BrandA"),
      product(3, "Moisturizer", ["niacinamide"], "BrandB"),
    ];
    const result = getTodaysRecommendations(
      catalog,
      recommendation({
        prioritizedIngredients: ["Salicylic Acid", "Niacinamide", "Ceramides"],
      }),
    );
    const moisturizerPick = result.find((p) => p.category === "Moisturizer");
    expect(moisturizerPick?.id).toBe("2");
    expect(moisturizerPick?.brand).toBe("BrandA");
  });

  it("prefers a new brand only when candidates are tied at the same score", () => {
    const catalog: CatalogProduct[] = [
      product(1, "Cleanser", ["salicylic_acid"], "BrandA"),
      // Both Moisturizer candidates tie at a single matched category —
      // BrandB should win the tie since BrandA already won Cleanser.
      product(2, "Moisturizer", ["niacinamide"], "BrandA"),
      product(3, "Moisturizer", ["niacinamide"], "BrandB"),
    ];
    const result = getTodaysRecommendations(
      catalog,
      recommendation({ prioritizedIngredients: ["Salicylic Acid", "Niacinamide"] }),
    );
    const moisturizerPick = result.find((p) => p.category === "Moisturizer");
    expect(moisturizerPick?.id).toBe("3");
    expect(moisturizerPick?.brand).toBe("BrandB");
  });

  it("falls back to the original stable/catalog order when every tied brand is already used", () => {
    const catalog: CatalogProduct[] = [
      product(1, "Cleanser", ["salicylic_acid"], "BrandA"),
      // Both Moisturizer candidates are BrandA — no new brand available, so
      // the first one in catalog order wins, same as before this change.
      product(2, "Moisturizer", ["niacinamide"], "BrandA"),
      product(3, "Moisturizer", ["niacinamide"], "BrandA"),
    ];
    const result = getTodaysRecommendations(
      catalog,
      recommendation({ prioritizedIngredients: ["Salicylic Acid", "Niacinamide"] }),
    );
    const moisturizerPick = result.find((p) => p.category === "Moisturizer");
    expect(moisturizerPick?.id).toBe("2");
  });

  it("still returns at most one product per category alongside the brand tie-break", () => {
    const catalog: CatalogProduct[] = [
      product(1, "Cleanser", ["salicylic_acid"], "BrandA"),
      product(2, "Moisturizer", ["niacinamide"], "BrandA"),
      product(3, "Moisturizer", ["niacinamide"], "BrandB"),
      product(4, "Sunscreen", ["niacinamide"], "BrandC"),
    ];
    const result = getTodaysRecommendations(
      catalog,
      recommendation({ prioritizedIngredients: ["Salicylic Acid", "Niacinamide"] }),
    );
    const categories = result.map((p) => p.category);
    expect(new Set(categories).size).toBe(categories.length);
    expect(categories).toEqual(
      expect.arrayContaining(["Cleanser", "Moisturizer", "Sunscreen"]),
    );
  });
});

describe("getTodaysRecommendations — strong-active diversity tie-break", () => {
  it("never promotes a lower-scoring product just to avoid a duplicate strong active", () => {
    const catalog: CatalogProduct[] = [
      // Treatment locks in salicylic_acid first.
      product(1, "Treatment", ["salicylic_acid"], "BrandX"),
      // Moisturizer: BrandY duplicates salicylic_acid but matches 2
      // categories (strictly better); BrandZ avoids the duplicate but only
      // matches 1. BrandY must still win — relevance beats active diversity.
      product(2, "Moisturizer", ["salicylic_acid", "niacinamide"], "BrandY"),
      product(3, "Moisturizer", ["niacinamide"], "BrandZ"),
    ];
    const result = getTodaysRecommendations(
      catalog,
      recommendation({ prioritizedIngredients: ["Salicylic Acid", "Niacinamide"] }),
    );
    const moisturizerPick = result.find((p) => p.category === "Moisturizer");
    expect(moisturizerPick?.id).toBe("2");
  });

  it("prefers a candidate that avoids a duplicate strong active only among same-score ties", () => {
    const catalog: CatalogProduct[] = [
      // Treatment locks in salicylic_acid, using up "SameBrand" too, so the
      // brand tie-break can't distinguish the Cleanser candidates below —
      // isolates the strong-active tie-break specifically.
      product(1, "Treatment", ["salicylic_acid"], "SameBrand"),
      // Both Cleanser candidates are SameBrand and tie at 1 matched
      // category: one duplicates today's strong active, the other doesn't.
      product(2, "Cleanser", ["salicylic_acid"], "SameBrand"),
      product(3, "Cleanser", ["glycerin"], "SameBrand"),
    ];
    const result = getTodaysRecommendations(
      catalog,
      recommendation({ prioritizedIngredients: ["Salicylic Acid", "Glycerin"] }),
    );
    const cleanserPick = result.find((p) => p.category === "Cleanser");
    expect(cleanserPick?.id).toBe("3");
  });

  it("lets supportive ingredients like Niacinamide repeat across categories unrestricted", () => {
    const catalog: CatalogProduct[] = [
      product(1, "Serum", ["niacinamide"], "BrandA"),
      product(2, "Moisturizer", ["niacinamide"], "BrandB"),
    ];
    const result = getTodaysRecommendations(
      catalog,
      recommendation({ prioritizedIngredients: ["Niacinamide"] }),
    );
    expect(result.map((p) => p.id).sort()).toEqual(["1", "2"]);
  });
});

describe("getTodaysRecommendations — display order", () => {
  it("returns final recommendations in fixed skincare-step order regardless of catalog/selection order", () => {
    // Catalog order deliberately scrambled relative to the display order —
    // Sunscreen and Treatment come first, Cleanser last — so this only
    // passes if a real reordering step runs after selection.
    const catalog: CatalogProduct[] = [
      product(1, "Sunscreen", ["niacinamide"], "BrandA"),
      product(2, "Treatment", ["salicylic_acid"], "BrandB"),
      product(3, "Moisturizer", ["ceramide"], "BrandC"),
      product(4, "Serum", ["hyaluronic_acid"], "BrandD"),
      product(5, "Toner/Essence", ["glycerin"], "BrandE"),
      product(6, "Cleanser", ["panthenol"], "BrandF"),
    ];
    const result = getTodaysRecommendations(
      catalog,
      recommendation({
        prioritizedIngredients: [
          "Niacinamide",
          "Salicylic Acid",
          "Ceramides",
          "Hyaluronic Acid",
          "Glycerin",
          "Panthenol",
        ],
      }),
    );
    expect(result.map((p) => p.category)).toEqual([
      "Cleanser",
      "Toner/Essence",
      "Serum",
      "Moisturizer",
      "Treatment",
      "Sunscreen",
    ]);
  });

  it("skips missing categories in the display order without inserting placeholders", () => {
    const catalog: CatalogProduct[] = [
      product(1, "Sunscreen", ["niacinamide"], "BrandA"),
      product(2, "Cleanser", ["panthenol"], "BrandB"),
    ];
    const result = getTodaysRecommendations(
      catalog,
      recommendation({ prioritizedIngredients: ["Niacinamide", "Panthenol"] }),
    );
    expect(result.map((p) => p.category)).toEqual(["Cleanser", "Sunscreen"]);
  });

  it("display order does not change which product wins a category", () => {
    // Same tie-break setup as the brand-diversity test above: BrandA must
    // still win Moisturizer on relevance even though display order now
    // places Moisturizer before Sunscreen/Treatment in the catalog here.
    const catalog: CatalogProduct[] = [
      product(1, "Cleanser", ["salicylic_acid"], "BrandA"),
      product(2, "Moisturizer", ["niacinamide", "ceramide"], "BrandA"),
      product(3, "Moisturizer", ["niacinamide"], "BrandB"),
    ];
    const result = getTodaysRecommendations(
      catalog,
      recommendation({
        prioritizedIngredients: ["Salicylic Acid", "Niacinamide", "Ceramides"],
      }),
    );
    const moisturizerPick = result.find((p) => p.category === "Moisturizer");
    expect(moisturizerPick?.id).toBe("2");
    expect(moisturizerPick?.brand).toBe("BrandA");
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
      recommendation({ prioritizedIngredients: ["Salicylic Acid"] }),
      new Set(["ingredient salicylic_acid"]),
    );
    expect(result.map((p) => p.id)).not.toContain("1");
    expect(result.map((p) => p.id)).not.toContain("2");
  });
});

describe("getTodaysRecommendations — product-level reactions", () => {
  it("drops an exact reacted product entirely, even without a matching irritating ingredient", () => {
    const catalog: CatalogProduct[] = [
      product(1, "Treatment", ["salicylic_acid"]),
      product(2, "Cleanser", ["salicylic_acid"]),
    ];
    const result = getTodaysRecommendations(
      catalog,
      recommendation({ prioritizedIngredients: ["Salicylic Acid"] }),
      new Set(),
      new Set(["1"]),
    );
    expect(result.map((p) => p.id)).not.toContain("1");
    expect(result.map((p) => p.id)).toContain("2");
  });
});

describe("getTodaysRecommendations — maintenance mode", () => {
  it("includes Sunscreen (uv_filter) even though it's not a visible PRIORITIZE chip", () => {
    const catalog: CatalogProduct[] = [
      product(1, "Sunscreen", ["uv_filter"]),
      product(2, "Moisturizer", ["glycerin"]),
    ];
    const result = getTodaysRecommendations(
      catalog,
      recommendation({
        direction: "maintenance",
        displayName: "Healthy Maintenance",
        prioritizedIngredients: ["Glycerin"],
        riskLevel: "low",
      }),
    );
    const categories = result.map((p) => p.category);
    expect(categories).toContain("Sunscreen");
    expect(categories).toContain("Moisturizer");
  });

  it("does not add Sunscreen for non-maintenance directions", () => {
    const catalog: CatalogProduct[] = [product(1, "Sunscreen", ["uv_filter"])];
    const result = getTodaysRecommendations(
      catalog,
      recommendation({ direction: "oil-balance", prioritizedIngredients: ["Niacinamide"] }),
    );
    expect(result).toEqual([]);
  });
});
