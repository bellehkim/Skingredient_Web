import { defineMcp } from "@lovable.dev/mcp-js";
import searchIngredients from "./tools/search-ingredients";
import getIngredient from "./tools/get-ingredient";
import listProducts from "./tools/list-products";
import getRecommendation from "./tools/get-recommendation";

export default defineMcp({
  name: "skingredient-mcp",
  title: "Skingredient",
  version: "0.1.0",
  instructions:
    "Tools for the Skingredient skincare intelligence app. Use `search_ingredients` and `get_ingredient` to look up the ingredient dictionary, `list_products` to browse sample products, and `get_recommendation` to run the deterministic daily-recommendation engine against a skin analysis.",
  tools: [searchIngredients, getIngredient, listProducts, getRecommendation],
});