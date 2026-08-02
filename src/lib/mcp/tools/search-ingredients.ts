import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { ingredients } from "../data";

export default defineTool({
  name: "search_ingredients",
  title: "Search ingredients",
  description:
    "Search Skingredient's ingredient dictionary by name, alias, benefit, or caution keyword. Returns a compact list with id, name, category, caution level, and primary benefits.",
  inputSchema: {
    query: z
      .string()
      .trim()
      .min(1)
      .describe("Keyword to match against ingredient name, aliases, benefits, or supports."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(20)
      .optional()
      .describe("Maximum number of results (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ query, limit }) => {
    const q = query.toLowerCase();
    const matches = ingredients
      .filter((i) => {
        const hay = [
          i.name,
          ...i.aliases,
          ...(i.primaryBenefits ?? []),
          ...i.supports,
          i.category ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .slice(0, limit ?? 10)
      .map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category ?? "neutral",
        cautionLevel: i.cautionLevel ?? 1,
        primaryBenefits: i.primaryBenefits ?? [],
      }));

    return {
      content: [
        {
          type: "text",
          text:
            matches.length === 0
              ? `No ingredients matched "${query}".`
              : matches.map((m) => `• ${m.name} — ${m.primaryBenefits.join(", ") || "—"}`).join("\n"),
        },
      ],
      structuredContent: { matches },
    };
  },
});