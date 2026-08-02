import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { ingredients } from "../data";

export default defineTool({
  name: "get_ingredient",
  title: "Get ingredient details",
  description:
    "Return the full dictionary entry for a Skingredient ingredient by id or name, including aliases, primary benefits, caution level, and safety notes.",
  inputSchema: {
    idOrName: z
      .string()
      .trim()
      .min(1)
      .describe("Ingredient id (e.g. 'retinol') or display name / alias (e.g. 'Vitamin B3')."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ idOrName }) => {
    const needle = idOrName.trim().toLowerCase();
    const match = ingredients.find(
      (i) =>
        i.id.toLowerCase() === needle ||
        i.name.toLowerCase() === needle ||
        i.aliases.some((a) => a.toLowerCase() === needle),
    );
    if (!match) {
      return {
        content: [{ type: "text", text: `No ingredient found for "${idOrName}".` }],
        isError: true,
      };
    }
    return {
      content: [
        {
          type: "text",
          text: `${match.name}${match.aliases.length ? ` (also: ${match.aliases.join(", ")})` : ""}\n${match.explanation}`,
        },
      ],
      structuredContent: { ingredient: match },
    };
  },
});