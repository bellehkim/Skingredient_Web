import { createFileRoute } from "@tanstack/react-router";
import { generateSkinDirection } from "@/lib/skinDirectionService";

interface SkinDirectionRequestBody {
  redness: number;
  hydration: number;
  acne: number;
  oiliness: number;
  texture: number;
  pores: number;
}

function isValidBody(body: unknown): body is SkinDirectionRequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.redness === "number" &&
    typeof b.hydration === "number" &&
    typeof b.acne === "number" &&
    typeof b.oiliness === "number" &&
    typeof b.texture === "number" &&
    typeof b.pores === "number"
  );
}

// Manual retry only — called when the automatic generation in
// src/routes/api/skin-analysis.ts failed. Never called automatically, and
// never re-runs the YouCam scan; it only re-asks Claude for a sentence from
// scores the client already has.
export const Route = createFileRoute("/api/skin-direction")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null);
        if (!isValidBody(body)) {
          return Response.json({ error: "Missing or invalid scores" }, { status: 400 });
        }

        const skinDirection = await generateSkinDirection(body);
        if (!skinDirection) {
          return Response.json({ error: "Skin direction generation failed" }, { status: 502 });
        }

        return Response.json({ skinDirection });
      },
    },
  },
});
