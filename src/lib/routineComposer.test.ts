import { describe, expect, it } from "vitest";
import { composeRoutine } from "./routineComposer";
import type { CatalogProduct } from "./data/catalog";
import type { DailyRecommendation, Product, ProductStatus } from "./types";

function catalogRow(id: number, category: string, functionalCategories: string[]): CatalogProduct {
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

function product(id: string, category: string, status: ProductStatus = "optional"): Product {
  return {
    id,
    brand: "Brand",
    name: `${category} ${id}`,
    category,
    status,
    keyIngredients: [],
    reason: "",
    imageColor: "#fff",
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

describe("composeRoutine", () => {
  it("puts sunscreen in AM only", () => {
    const catalog = [catalogRow(1, "Sunscreen", ["spf"])];
    const shelf = [product("1", "Sunscreen")];
    const routine = composeRoutine(catalog, shelf, [], recommendation());

    expect(routine.am.find((s) => s.label === "Sunscreen")?.product?.id).toBe("1");
    expect(routine.pm.some((s) => s.product?.category === "Sunscreen")).toBe(false);
  });

  it("keeps a catalog retinoid out of AM but allows it in PM", () => {
    const catalog = [catalogRow(1, "Treatment", ["retinoid"])];
    const shelf = [product("1", "Treatment")];
    const routine = composeRoutine(catalog, shelf, [], recommendation());

    const amSlot = routine.am.find((s) => s.label === "Serum or Treatment");
    const pmSlot = routine.pm.find((s) => s.label === "Serum or Treatment");
    expect(amSlot?.product).toBeNull();
    expect(pmSlot?.product?.id).toBe("1");
  });

  it("prefers a Shelf product over a recommended catalog product for the same slot", () => {
    const catalog = [
      catalogRow(1, "Cleanser", ["surfactant"]),
      catalogRow(2, "Cleanser", ["surfactant"]),
    ];
    const shelf = [product("1", "Cleanser")];
    const recommended = [product("2", "Cleanser", "use-today")];
    const routine = composeRoutine(catalog, shelf, recommended, recommendation());

    const amCleanser = routine.am.find((s) => s.label === "Cleanser");
    expect(amCleanser?.product?.id).toBe("1");
    expect(amCleanser?.source).toBe("shelf");
  });

  it("leaves a slot empty rather than inventing a product", () => {
    const routine = composeRoutine([], [], [], recommendation());
    expect(routine.am.every((s) => s.product === null)).toBe(true);
    expect(routine.pm.every((s) => s.product === null)).toBe(true);
  });

  it("excludes products containing a schedule-avoided category", () => {
    const catalog = [catalogRow(1, "Treatment", ["retinoid"])];
    const shelf = [product("1", "Treatment")];
    const routine = composeRoutine(
      catalog,
      shelf,
      [],
      recommendation({ avoidedIngredients: ["Retinoids"] }),
    );

    expect(routine.pm.find((s) => s.label === "Serum or Treatment")?.product).toBeNull();
  });

  it("treats a custom Treatment as PM-only per the manual-product safety rule", () => {
    const shelf = [product("custom-1", "Treatment")];
    const routine = composeRoutine([], shelf, [], recommendation());

    expect(routine.am.find((s) => s.label === "Serum or Treatment")?.product).toBeNull();
    expect(routine.pm.find((s) => s.label === "Serum or Treatment")?.product?.id).toBe("custom-1");
  });

  it("allows a custom Sunscreen only in AM and a custom Serum in both", () => {
    const shelf = [product("custom-1", "Sunscreen"), product("custom-2", "Serum")];
    const routine = composeRoutine([], shelf, [], recommendation());

    expect(routine.am.find((s) => s.label === "Sunscreen")?.product?.id).toBe("custom-1");
    expect(routine.pm.some((s) => s.product?.id === "custom-1")).toBe(false);
    expect(routine.am.find((s) => s.label === "Serum or Treatment")?.product?.id).toBe("custom-2");
    expect(routine.pm.find((s) => s.label === "Serum or Treatment")?.product?.id).toBe("custom-2");
  });
});
