import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { HelpCircle, Image as ImageIcon } from "lucide-react";
import { z } from "zod";
import { AppShell } from "@/components/app/AppShell";
import { MobileHeader } from "@/components/app/MobileHeader";
import { skinAnalysisService, ANALYSIS_STEPS } from "@/lib/skinAnalysisService";
import { useAppStore } from "@/lib/appStore";
import { createAnalysis } from "@/lib/data/analyses";
import { generateRecommendation } from "@/lib/recommendationEngine";
import { generateAndPersistSkinStrategy } from "@/lib/skinStrategyFlow";

const scanSearchSchema = z.object({
  // Set only when arriving straight from the onboarding survey (see
  // onboarding.tsx) — a brand-new user hasn't "entered" the app yet (no
  // shelf, no history), so this scan should read as a continuation of the
  // survey rather than a jump into the main app shell. Reached normally
  // (bottom nav / sidebar), the full chrome is correct as-is.
  onboarding: z.boolean().optional(),
});

export const Route = createFileRoute("/scan/")({
  head: () => ({ meta: [{ title: "Skin scan — Skingredient" }] }),
  validateSearch: scanSearchSchema,
  component: Scan,
});

function Scan() {
  const { onboarding: fromOnboarding } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  // Reached normally (bottom nav/sidebar), Scan is a peer top-level page and
  // deliberately has no back arrow, like Ingredients/Routine. But arriving
  // via onboarding it's a step in a flow (survey -> check-in -> here), so it
  // should be able to go back to check-in — history-based since that's the
  // only entry point in this case.
  const goBack = fromOnboarding ? () => router.history.back() : undefined;
  const {
    setAnalysis,
    symptoms,
    scheduleTomorrow,
    eventTiming,
    checkInCompletedToday,
    ingredientHistory,
    irritatingCategories,
    products,
    irritatingIngredientNames,
  } = useAppStore();
  const [scanning, setScanning] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!scanning) return;
    const t = setInterval(() => setStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length - 1)), 400);
    return () => clearInterval(t);
  }, [scanning]);

  // Live webcam preview: request the camera once on mount and bind the stream
  // to the always-mounted <video> element so it's ready before React flips
  // cameraReady (conditionally mounting <video> instead would race the ref).
  useEffect(() => {
    let cancelled = false;
    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera not available in this browser. Upload a photo instead.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        if (!cancelled) setCameraReady(true);
      } catch (err) {
        if (!cancelled) {
          setCameraError(
            err instanceof Error && err.name === "NotAllowedError"
              ? "Camera access denied. Allow camera access or upload a photo instead."
              : "Couldn't access your camera. Upload a photo instead.",
          );
        }
      }
    }
    startCamera();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const start = async (image: Blob) => {
    setError(null);
    setScanning(true);
    setStep(0);
    try {
      const { youcamRaw, ...result } = await skinAnalysisService.analyze(image);

      // A completed scan always produces a report — never gated on today's
      // Daily Check-in. AI Skin Strategy is the one part that IS gated: it
      // requires both today's real analysis AND today's check-in, so it's
      // deliberately generated below (after persisting), only when a
      // check-in already exists — not here. This deterministic
      // recommendation_snapshot always uses whatever check-in context is
      // real right now (empty/"none" if the user hasn't checked in today —
      // never a stale prior day's check-in) plus the always-on ingredient
      // reaction context, so it's the honest "baseline" Case C promises.
      const recommendationSnapshot = generateRecommendation({
        analysis: result,
        symptoms,
        sensitivities: irritatingIngredientNames,
        recentActives: [],
        scheduleTomorrow,
        eventTiming,
        ingredientHistory,
        irritatingCategories,
      });

      // Persist once, then use the inserted row (generated id, created_at,
      // algorithm_version) as the source of truth rather than the pre-insert
      // in-memory object — see src/lib/data/analyses.ts. Best-effort: a save
      // failure shouldn't break a scan that otherwise succeeded, so fall
      // back to the in-memory result and keep going (skinStrategy stays
      // null either way — generateAndPersistSkinStrategy below no-ops
      // without a persisted id).
      let saved = result;
      try {
        saved = await createAnalysis(result, youcamRaw, recommendationSnapshot);
      } catch (saveError) {
        console.error("Failed to save analysis", saveError);
      }

      setAnalysis(saved);

      // Today's Daily Check-in already exists (submitted before this scan) —
      // combine it with the analysis we just saved to generate AI Skin
      // Strategy exactly once, right now, and patch the same row (never a
      // second analysis). If check-in hasn't happened yet, this is skipped
      // entirely; submitting check-in later is what triggers it then (see
      // src/routes/scan.check-in.tsx / appStore.submitTodaysCheckIn).
      if (checkInCompletedToday) {
        const enriched = await generateAndPersistSkinStrategy({
          analysis: saved,
          symptoms,
          scheduleTomorrow,
          eventTiming,
          ingredientHistory,
          irritatingCategories,
          irritatingIngredientNames,
          shelfCategories: Array.from(new Set(products.map((p) => p.category))),
        });
        if (enriched) setAnalysis(enriched);
      }

      setTimeout(() => navigate({ to: "/results" }), 300);
    } catch (err) {
      setScanning(false);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  const openPicker = () => fileInputRef.current?.click();

  // Matches the aspect-[3/4] preview frame below — the <video> is displayed
  // with object-cover inside that frame, so capture must crop to the same
  // region. Otherwise we'd send the full, uncropped webcam frame (much more
  // background, face proportionally smaller than what the user framed),
  // which is what caused YouCam's error_src_face_too_small.
  const FRAME_ASPECT = 3 / 4;

  // Capture-only: never falls back to the file picker on failure (missing
  // camera, canvas, or blob) — that's a distinct, explicit user choice via
  // the Upload photo button/icon, not something this button should trigger
  // as a surprise side effect. cameraError already covers user feedback for
  // the no-camera case via the instruction pill.
  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !cameraReady || !video.videoWidth) return;

    const sourceAspect = video.videoWidth / video.videoHeight;
    let sx = 0;
    let sy = 0;
    let sw = video.videoWidth;
    let sh = video.videoHeight;
    if (sourceAspect > FRAME_ASPECT) {
      sw = video.videoHeight * FRAME_ASPECT;
      sx = (video.videoWidth - sw) / 2;
    } else {
      sh = video.videoWidth / FRAME_ASPECT;
      sy = (video.videoHeight - sh) / 2;
    }
    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
    canvas.toBlob(
      (blob) => {
        if (blob) start(blob);
      },
      "image/jpeg",
      0.92,
    );
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) start(file);
  };

  // Onboarding-only: there's no report without a scan, so skipping goes
  // straight to Home rather than pretending there's somewhere else to land.
  // The old rightSlot here was a "Help" icon that didn't actually open any
  // help content and just linked to "/" anyway — replaced with an honest
  // affordance for what it already did in this context.
  const skipToHome = fromOnboarding ? (
    <Link
      to="/"
      className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-ink-muted hover:bg-surface-muted hover:text-ink"
    >
      Skip
    </Link>
  ) : undefined;

  return (
    <AppShell title="Skin scan" hideNav={fromOnboarding} onBack={goBack} actions={skipToHome}>
      <MobileHeader
        title="Skin scan"
        onBack={goBack}
        rightSlot={
          skipToHome ?? (
            <Link
              to="/"
              aria-label="Help"
              className="grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-surface-muted"
            >
              <HelpCircle size={20} />
            </Link>
          )
        }
      />
      <div className="px-5 lg:mx-auto lg:max-w-[900px] lg:px-10 lg:pt-8">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          hidden
          onChange={onFileSelected}
        />
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,440px)_1fr]">
          <div className="relative mx-auto mt-2 aspect-[3/4] w-full overflow-hidden rounded-[28px] bg-gradient-to-br from-[#F5EFE4] to-[#EDDDC8] lg:mt-0 lg:max-w-[440px]">
            {/* Live camera preview */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 h-full w-full object-cover [transform:scaleX(-1)] ${cameraReady ? "opacity-100" : "opacity-0"}`}
            />
            {/* Face placeholder, shown until the camera stream is ready */}
            {!cameraReady && (
              <div className="absolute inset-0 grid place-items-center">
                <FaceIllustration />
              </div>
            )}
            {/* Mesh overlay */}
            <MeshOverlay />
            {/* Corners */}
            <Corner className="left-4 top-4" rot={0} />
            <Corner className="right-4 top-4" rot={90} />
            <Corner className="right-4 bottom-4" rot={180} />
            <Corner className="left-4 bottom-4" rot={270} />

            {/* Instruction pill */}
            <div className="absolute left-1/2 top-4 -translate-x-1/2 max-w-[85%] rounded-full bg-black/60 px-4 py-1.5 text-center text-[12px] font-medium text-white">
              {error ??
                (scanning
                  ? ANALYSIS_STEPS[step]
                  : (cameraError ?? "Position your face in the frame"))}
            </div>

            {/* Bottom controls */}
            <div className="absolute inset-x-0 bottom-0 space-y-3 bg-gradient-to-t from-black/40 to-transparent p-4 pt-8 text-white">
              <p className="text-center text-[12.5px] font-medium">
                Good lighting helps us analyze your skin better ✨
              </p>
              <div className="flex items-center justify-between">
                <button
                  onClick={openPicker}
                  disabled={scanning}
                  aria-label="Upload photo"
                  className="grid h-11 w-11 place-items-center rounded-full bg-white/90 text-ink disabled:opacity-70"
                >
                  <ImageIcon size={18} />
                </button>
                <button
                  onClick={capturePhoto}
                  disabled={scanning}
                  aria-label="Capture"
                  className="grid h-[72px] w-[72px] place-items-center rounded-full bg-white shadow-lift ring-4 ring-sage disabled:opacity-70"
                >
                  <div
                    className={`h-14 w-14 rounded-full ${scanning ? "animate-pulse bg-sage" : "bg-white"}`}
                  />
                </button>
                <div className="h-11 w-11" />
              </div>
            </div>
          </div>

          {/* Desktop-side instructions & actions */}
          <div className="hidden lg:block">
            <h2 className="text-[22px] font-bold text-ink">
              {scanning ? ANALYSIS_STEPS[step] : "Let's scan your skin"}
            </h2>
            <p className="mt-2 max-w-[440px] text-[14px] leading-relaxed text-ink-muted">
              Face a soft, even light source, remove glasses, and keep your whole face inside the
              frame. You can use your camera or upload a recent photo.
            </p>
            <ul className="mt-5 space-y-2 text-[13.5px] text-ink">
              {[
                "Natural daylight works best",
                "No makeup for the most accurate read",
                "Hold still while we analyze",
              ].map((t) => (
                <li
                  key={t}
                  className="flex items-center gap-2.5 rounded-2xl bg-surface-muted px-4 py-2.5"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" /> {t}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={openPicker}
                disabled={scanning}
                className="inline-flex items-center gap-2 rounded-2xl border border-hairline bg-white px-6 py-3 text-[14px] font-semibold text-ink disabled:opacity-70"
              >
                <ImageIcon size={16} /> Upload photo
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end px-1 text-[13px] text-ink-muted lg:mt-8">
          <span>Skingredient does not diagnose medical conditions.</span>
        </div>
      </div>
    </AppShell>
  );
}

function Corner({ className, rot }: { className?: string; rot: number }) {
  return (
    <div className={`absolute h-6 w-6 ${className}`} style={{ transform: `rotate(${rot}deg)` }}>
      <div className="absolute left-0 top-0 h-1 w-6 rounded bg-white" />
      <div className="absolute left-0 top-0 h-6 w-1 rounded bg-white" />
    </div>
  );
}

function FaceIllustration() {
  return (
    <svg viewBox="0 0 200 260" className="h-full w-full opacity-95">
      <defs>
        <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F6D9B8" />
          <stop offset="100%" stopColor="#E8B58A" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="130" rx="70" ry="90" fill="url(#skin)" />
      <ellipse cx="78" cy="120" rx="5" ry="6" fill="#3b2a1e" />
      <ellipse cx="122" cy="120" rx="5" ry="6" fill="#3b2a1e" />
      <path
        d="M85 165 Q100 175 115 165"
        stroke="#C77A6A"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MeshOverlay() {
  const lines = [];
  for (let i = 0; i < 10; i++) {
    lines.push(
      <line
        key={"h" + i}
        x1="0"
        y1={i * 30}
        x2="400"
        y2={i * 30}
        stroke="white"
        strokeOpacity="0.15"
      />,
    );
    lines.push(
      <line
        key={"v" + i}
        x1={i * 30}
        y1="0"
        x2={i * 30}
        y2="500"
        stroke="white"
        strokeOpacity="0.15"
      />,
    );
  }
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 300 400">
      {lines}
    </svg>
  );
}
