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
        common_name: null,
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

    const amSlot = routine.am.find((s) => s.label === "Treatment");
    const pmSlot = routine.pm.find((s) => s.label === "Treatment");
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

  it("places a recommended Sunscreen into the AM slot when Shelf has none — unaffected by whether productRecommendations.ts matched it via a PRIORITIZE ingredient or the baseline uv_filter category", () => {
    const catalog = [catalogRow(1, "Sunscreen", ["uv_filter"])];
    const recommended = [product("1", "Sunscreen", "use-today")];
    const routine = composeRoutine(catalog, [], recommended, recommendation());

    const amSunscreen = routine.am.find((s) => s.label === "Sunscreen");
    expect(amSunscreen?.product?.id).toBe("1");
    expect(amSunscreen?.source).toBe("recommended");
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

    expect(routine.pm.find((s) => s.label === "Treatment")?.product).toBeNull();
  });

  it("treats a custom Treatment as PM-only per the manual-product safety rule", () => {
    const shelf = [product("custom-1", "Treatment")];
    const routine = composeRoutine([], shelf, [], recommendation());

    expect(routine.am.find((s) => s.label === "Treatment")?.product).toBeNull();
    expect(routine.pm.find((s) => s.label === "Treatment")?.product?.id).toBe("custom-1");
  });

  it("allows a custom Sunscreen only in AM and a custom Serum in both", () => {
    const shelf = [product("custom-1", "Sunscreen"), product("custom-2", "Serum")];
    const routine = composeRoutine([], shelf, [], recommendation());

    expect(routine.am.find((s) => s.label === "Sunscreen")?.product?.id).toBe("custom-1");
    expect(routine.pm.some((s) => s.product?.id === "custom-1")).toBe(false);
    expect(routine.am.find((s) => s.label === "Serum")?.product?.id).toBe("custom-2");
    expect(routine.pm.find((s) => s.label === "Serum")?.product?.id).toBe("custom-2");
  });

  it("never places a product containing an exact reported-irritating ingredient into the routine", () => {
    const catalog = [catalogRow(1, "Treatment", ["retinoid"])];
    const shelf = [product("1", "Treatment")];
    const routine = composeRoutine(
      catalog,
      shelf,
      [],
      recommendation(),
      new Set(["ingredient retinoid"]),
    );

    expect(routine.pm.find((s) => s.label === "Treatment")?.product).toBeNull();
  });

  it("never places a product the user directly reported as irritating, independent of ingredients", () => {
    const catalog = [catalogRow(1, "Treatment", ["niacinamide"])];
    const shelf = [product("1", "Treatment")];
    const routine = composeRoutine(catalog, shelf, [], recommendation(), new Set(), new Set(["1"]));

    expect(routine.am.find((s) => s.label === "Treatment")?.product).toBeNull();
    expect(routine.pm.find((s) => s.label === "Treatment")?.product).toBeNull();
  });

  it("does not exclude an unrelated product that merely shares a category with a reacted product", () => {
    const catalog = [
      catalogRow(1, "Treatment", ["niacinamide"]),
      catalogRow(2, "Treatment", ["niacinamide"]),
    ];
    const shelf = [product("2", "Treatment")];
    const routine = composeRoutine(catalog, shelf, [], recommendation(), new Set(), new Set(["1"]));

    expect(routine.pm.find((s) => s.label === "Treatment")?.product?.id).toBe("2");
  });
});

describe("composeRoutine — manual routine placements", () => {
  it("gives a manually-added product top priority over an otherwise-eligible Shelf product in the same slot", () => {
    const catalog = [
      catalogRow(1, "Cleanser", ["surfactant"]),
      catalogRow(2, "Cleanser", ["surfactant"]),
    ];
    const shelf = [product("1", "Cleanser"), product("2", "Cleanser")];
    const routine = composeRoutine(
      catalog,
      shelf,
      [],
      recommendation(),
      new Set(),
      new Set(),
      [{ productId: "2", timeOfDay: "am" }],
    );

    const amCleanser = routine.am.find((s) => s.label === "Cleanser");
    expect(amCleanser?.product?.id).toBe("2");
    expect(amCleanser?.source).toBe("manual");
  });

  it("places the same manually-added product in both AM and PM when added to both", () => {
    const catalog = [catalogRow(1, "Moisturizer", ["ceramide"])];
    const shelf = [product("1", "Moisturizer")];
    const routine = composeRoutine(catalog, shelf, [], recommendation(), new Set(), new Set(), [
      { productId: "1", timeOfDay: "am" },
      { productId: "1", timeOfDay: "pm" },
    ]);

    expect(routine.am.find((s) => s.label === "Moisturizer")?.product?.id).toBe("1");
    expect(routine.pm.find((s) => s.label === "Moisturizer")?.product?.id).toBe("1");
  });

  it("bypasses the AM strong-active restriction for an explicit manual placement", () => {
    const catalog = [catalogRow(1, "Treatment", ["retinoid"])];
    const shelf = [product("1", "Treatment")];
    const routine = composeRoutine(catalog, shelf, [], recommendation(), new Set(), new Set(), [
      { productId: "1", timeOfDay: "am" },
    ]);

    const amSlot = routine.am.find((s) => s.label === "Treatment");
    expect(amSlot?.product?.id).toBe("1");
    expect(amSlot?.source).toBe("manual");
  });

  it("bypasses the reported-reaction exclusion for an explicit manual placement", () => {
    const catalog = [catalogRow(1, "Treatment", ["niacinamide"])];
    const shelf = [product("1", "Treatment")];
    const routine = composeRoutine(
      catalog,
      shelf,
      [],
      recommendation(),
      new Set(),
      new Set(["1"]),
      [{ productId: "1", timeOfDay: "pm" }],
    );

    expect(routine.pm.find((s) => s.label === "Treatment")?.product?.id).toBe("1");
  });

  it("does not duplicate a manually-placed product into a slot it doesn't belong to", () => {
    const catalog = [catalogRow(1, "Cleanser", ["surfactant"])];
    const shelf = [product("1", "Cleanser")];
    const routine = composeRoutine(catalog, shelf, [], recommendation(), new Set(), new Set(), [
      { productId: "1", timeOfDay: "am" },
    ]);

    expect(routine.am.find((s) => s.label === "Moisturizer")?.product).toBeNull();
  });
});

describe("composeRoutine — canonical skincare-step order", () => {
  it("AM slots are always in Cleanser, Toner/Essence, Serum, Moisturizer, Treatment, Sunscreen order", () => {
    const routine = composeRoutine([], [], [], recommendation());
    expect(routine.am.map((s) => s.label)).toEqual([
      "Cleanser",
      "Toner/Essence",
      "Serum",
      "Moisturizer",
      "Treatment",
      "Sunscreen",
    ]);
  });

  it("PM slots are always in Cleanser, Toner/Essence, Serum, Moisturizer, Treatment order (no Sunscreen)", () => {
    const routine = composeRoutine([], [], [], recommendation());
    expect(routine.pm.map((s) => s.label)).toEqual([
      "Cleanser",
      "Toner/Essence",
      "Serum",
      "Moisturizer",
      "Treatment",
    ]);
  });

  it("manually adding a Toner/Essence product slots it in between Cleanser and Serum, not appended at the end", () => {
    const catalog = [
      catalogRow(1, "Cleanser", ["surfactant"]),
      catalogRow(2, "Serum", ["niacinamide"]),
      catalogRow(3, "Moisturizer", ["ceramide"]),
      catalogRow(4, "Sunscreen", ["uv_filter"]),
      catalogRow(5, "Toner/Essence", ["glycerin"]),
    ];
    const shelf = [
      product("1", "Cleanser"),
      product("2", "Serum"),
      product("3", "Moisturizer"),
      product("4", "Sunscreen"),
      product("5", "Toner/Essence"),
    ];
    const routine = composeRoutine(catalog, shelf, [], recommendation(), new Set(), new Set(), [
      { productId: "5", timeOfDay: "am" },
    ]);

    const filledLabelsInOrder = routine.am.filter((s) => s.product).map((s) => s.label);
    expect(filledLabelsInOrder).toEqual([
      "Cleanser",
      "Toner/Essence",
      "Serum",
      "Moisturizer",
      "Sunscreen",
    ]);
  });

  it("manually adding a Treatment product to PM slots it in after Moisturizer, the last PM step", () => {
    const catalog = [
      catalogRow(1, "Cleanser", ["surfactant"]),
      catalogRow(2, "Toner/Essence", ["glycerin"]),
      catalogRow(3, "Serum", ["niacinamide"]),
      catalogRow(4, "Moisturizer", ["ceramide"]),
      catalogRow(5, "Treatment", ["retinoid"]),
    ];
    const shelf = [
      product("1", "Cleanser"),
      product("2", "Toner/Essence"),
      product("3", "Serum"),
      product("4", "Moisturizer"),
      product("5", "Treatment"),
    ];
    const routine = composeRoutine(catalog, shelf, [], recommendation(), new Set(), new Set(), [
      { productId: "5", timeOfDay: "pm" },
    ]);

    const filledLabelsInOrder = routine.pm.filter((s) => s.product).map((s) => s.label);
    expect(filledLabelsInOrder).toEqual([
      "Cleanser",
      "Toner/Essence",
      "Serum",
      "Moisturizer",
      "Treatment",
    ]);
  });

  it("manually adding a Sunscreen to AM places it last, after every other filled step", () => {
    const catalog = [
      catalogRow(1, "Cleanser", ["surfactant"]),
      catalogRow(2, "Sunscreen", ["uv_filter"]),
    ];
    const shelf = [product("1", "Cleanser"), product("2", "Sunscreen")];
    const routine = composeRoutine(catalog, shelf, [], recommendation(), new Set(), new Set(), [
      { productId: "2", timeOfDay: "am" },
    ]);

    const filledLabelsInOrder = routine.am.filter((s) => s.product).map((s) => s.label);
    expect(filledLabelsInOrder).toEqual(["Cleanser", "Sunscreen"]);
    expect(filledLabelsInOrder[filledLabelsInOrder.length - 1]).toBe("Sunscreen");
  });

  it("sorting into canonical order never changes which product was selected or its source", () => {
    const catalog = [
      catalogRow(1, "Cleanser", ["surfactant"]),
      catalogRow(2, "Serum", ["niacinamide"]),
    ];
    const shelf = [product("1", "Cleanser")];
    const recommended = [product("2", "Serum", "use-today")];
    const routine = composeRoutine(catalog, shelf, recommended, recommendation());

    expect(routine.am.find((s) => s.label === "Cleanser")?.source).toBe("shelf");
    expect(routine.am.find((s) => s.label === "Serum")?.source).toBe("recommended");
  });
});
