import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { products } from "../data";

export default defineTool({
  name: "list_products",
  title: "List sample products",
  description:
    "List Skingredient's sample product catalog with brand, category, key ingredients, and benefit tags. Optionally filter by category or key-ingredient keyword.",
  inputSchema: {
    category: z.string().trim().optional().describe("Filter by category (e.g. 'Moisturizer', 'Exfoliant')."),
    ingredient: z.string().trim().optional().describe("Filter to products containing this key ingredient."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ category, ingredient }) => {
    const cat = category?.toLowerCase();
    const ing = ingredient?.toLowerCase();
    const matches = products.filter((p) => {
      if (cat && p.category.toLowerCase() !== cat) return false;
      if (ing && !p.keyIngredients.some((k) => k.toLowerCase().includes(ing))) return false;
      return true;
    });
    return {
      content: [
        {
          type: "text",
          text: matches.length
            ? matches.map((p) => `- ${p.brand} - ${p.name} (${p.category})`).join("\n")
            : "No matching products.",
        },
      ],
      structuredContent: { products: matches },
    };
  },
});