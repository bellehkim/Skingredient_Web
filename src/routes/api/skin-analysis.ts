import { createFileRoute } from "@tanstack/react-router";
import type { SkinAnalysisResult } from "@/lib/types";
import { generateSkinDirection } from "@/lib/skinDirectionService";

const YOUCAM_API_BASE = "https://yce-api-01.makeupar.com";

// Kept to our existing metric set (redness, hydration, acne, oiliness, texture, pores) —
// SD tier field names, see https://docs.perfectcorp.com/reference/ai_skin_analysis
const DST_ACTIONS = ["redness", "oiliness", "moisture", "acne", "texture", "pore"] as const;

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 30_000;

interface YouCamFileInitResponse {
  data: {
    files: Array<{
      file_id: string;
      requests: Array<{ method: string; url: string; headers: Record<string, string> }>;
    }>;
  };
}

interface YouCamTaskCreateResponse {
  data: { task_id: string };
}

export interface YouCamTaskResultItem {
  type: string;
  ui_score: number;
  raw_score: number;
  mask_urls: string[];
}

interface YouCamTaskStatusResponse {
  data: {
    task_status: "running" | "success" | "error";
    results?: { output: YouCamTaskResultItem[] };
    error?: string;
    error_code?: string;
  };
}

function requireApiKey(): string {
  const key = process.env.YOUCAM_API_KEY;
  if (!key) throw new Error("YOUCAM_API_KEY is not configured on the server");
  return key;
}

async function uploadImage(apiKey: string, image: Blob): Promise<string> {
  const contentType = image.type || "image/jpeg";
  const fileName = `scan_${Date.now()}.${contentType.split("/")[1] ?? "jpg"}`;

  const initRes = await fetch(`${YOUCAM_API_BASE}/s2s/v2.0/file`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      files: [{ content_type: contentType, file_name: fileName, file_size: image.size }],
    }),
  });
  if (!initRes.ok) {
    throw new Error(`YouCam file init failed (${initRes.status}): ${await initRes.text()}`);
  }
  const initData = (await initRes.json()) as YouCamFileInitResponse;
  const file = initData.data.files[0];
  const uploadReq = file.requests[0];

  const putRes = await fetch(uploadReq.url, {
    method: uploadReq.method,
    headers: uploadReq.headers,
    body: image,
  });
  if (!putRes.ok) {
    throw new Error(`YouCam image upload failed (${putRes.status})`);
  }

  return file.file_id;
}

async function createTask(apiKey: string, fileId: string): Promise<string> {
  const res = await fetch(`${YOUCAM_API_BASE}/s2s/v2.0/task/skin-analysis`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      src_file_id: fileId,
      dst_actions: DST_ACTIONS,
      format: "json",
    }),
  });
  if (!res.ok) {
    throw new Error(`YouCam task creation failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as YouCamTaskCreateResponse;
  return data.data.task_id;
}

async function pollTask(apiKey: string, taskId: string): Promise<YouCamTaskResultItem[]> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const res = await fetch(`${YOUCAM_API_BASE}/s2s/v2.0/task/skin-analysis/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      throw new Error(`YouCam task polling failed (${res.status})`);
    }
    const data = (await res.json()) as YouCamTaskStatusResponse;

    if (data.data.task_status === "success") {
      return data.data.results?.output ?? [];
    }
    if (data.data.task_status === "error") {
      throw new Error(data.data.error ?? "YouCam skin analysis task failed");
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error("YouCam skin analysis timed out");
}

export function scoreFor(output: YouCamTaskResultItem[], type: string): number | undefined {
  return output.find((o) => o.type === type)?.ui_score;
}

/**
 * Perfect Corp's `ui_score` is "higher = healthier", and our SkinAnalysisResult uses
 * that exact same convention — higher = healthier/better for every field, including
 * hydration. So this is a direct pass-through with only field-name renames
 * (`moisture` -> `hydration`, `pore` -> `pores`); no inversion.
 *
 * NOTE: no image-quality/dimension validation here yet (postponed for MVP) — the
 * YouCam API rejects unsupported images itself (error_below_min_image_size,
 * error_src_face_too_small, error_lighting_dark, etc.) and that message is
 * surfaced back via the thrown Error below. Add pre-upload validation here later.
 */
export function normalize(output: YouCamTaskResultItem[]): SkinAnalysisResult {
  const redness = scoreFor(output, "redness");
  const hydration = scoreFor(output, "moisture");
  const acne = scoreFor(output, "acne");
  const oiliness = scoreFor(output, "oiliness");
  const texture = scoreFor(output, "texture");
  const pores = scoreFor(output, "pore");

  if (
    redness === undefined ||
    hydration === undefined ||
    acne === undefined ||
    oiliness === undefined ||
    texture === undefined ||
    pores === undefined
  ) {
    throw new Error("YouCam response is missing expected skin concerns");
  }

  return {
    redness,
    hydration,
    acne,
    oiliness,
    texture,
    pores,
    analyzedAt: new Date().toISOString(),
  };
}

export const Route = createFileRoute("/api/skin-analysis")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const apiKey = requireApiKey();

          const formData = await request.formData();
          const image = formData.get("image");
          if (!(image instanceof Blob) || image.size === 0) {
            return Response.json({ error: "Missing image" }, { status: 400 });
          }

          const fileId = await uploadImage(apiKey, image);
          const taskId = await createTask(apiKey, fileId);
          const output = await pollTask(apiKey, taskId);
          const result = normalize(output);

          // Generate the "Today's Skin Direction" sentence once, as part of
          // this same new-analysis request. A failure here must not fail the
          // scan — the client still gets valid YouCam scores with
          // skinDirection: null, and can retry generation alone via
          // /api/skin-direction without re-scanning.
          const skinDirection = await generateSkinDirection(result);

          return Response.json({ ...result, skinDirection });
        } catch (error) {
          console.error("skin-analysis proxy error", error);
          const message = error instanceof Error ? error.message : "Skin analysis failed";
          return Response.json({ error: message }, { status: 502 });
        }
      },
    },
  },
});
