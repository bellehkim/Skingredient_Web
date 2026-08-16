// Conservative client-side preprocessing before a scan photo is sent to
// /api/skin-analysis (src/routes/api/skin-analysis.ts) — applied to both the
// webcam-capture and "Upload photo" paths (src/routes/scan.index.tsx). Goal
// is upload reliability (smaller bodies = fewer transient network failures,
// see the "SocketError: other side closed" mid-upload of a ~4.8MB photo),
// not image compression for its own sake: fine skin detail (acne, pores,
// redness, texture) must survive for YouCam's analysis to stay accurate, so
// this only touches images that are unnecessarily large and re-encodes at a
// high JPEG quality.

/** Long edge cap — within YouCam's documented-safe range, well above what a
 * cropped webcam capture ever produces, only kicks in for large uploaded
 * photos (e.g. an uncompressed phone photo). */
export const MAX_LONG_EDGE = 1920;
export const JPEG_QUALITY = 0.9;

export interface TargetDimensions {
  width: number;
  height: number;
  /** False when the image is already within maxLongEdge — the caller should
   * return the original blob untouched rather than re-encode it. */
  scaled: boolean;
}

/**
 * Pure sizing math, exported separately from the canvas/decode side effects
 * below so it's deterministic and unit-testable without a DOM. Never
 * upscales: an image already at or under maxLongEdge on its long edge is
 * returned unchanged. Preserves aspect ratio exactly (proportional scale on
 * both dimensions), rounded to whole pixels.
 */
export function computeTargetDimensions(
  width: number,
  height: number,
  maxLongEdge: number = MAX_LONG_EDGE,
): TargetDimensions {
  const longEdge = Math.max(width, height);
  if (longEdge <= maxLongEdge) {
    return { width, height, scaled: false };
  }
  const scale = maxLongEdge / longEdge;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
    scaled: true,
  };
}

/**
 * Resizes only if the image's long edge exceeds MAX_LONG_EDGE; otherwise
 * returns the original blob byte-for-byte (no redundant re-encode of an
 * already-reasonable webcam capture). Runs entirely in-browser via
 * createImageBitmap + canvas — no server round trip before the real
 * analysis upload.
 */
export async function preprocessImageForAnalysis(image: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(image);
  try {
    const target = computeTargetDimensions(bitmap.width, bitmap.height);
    if (!target.scaled) return image;

    const canvas = document.createElement("canvas");
    canvas.width = target.width;
    canvas.height = target.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return image;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, target.width, target.height);

    const resized = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    return resized ?? image;
  } finally {
    bitmap.close();
  }
}
