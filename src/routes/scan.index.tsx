import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { HelpCircle, Zap, Image as ImageIcon } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { MobileHeader } from "@/components/app/MobileHeader";
import { skinAnalysisService, ANALYSIS_STEPS } from "@/lib/skinAnalysisService";
import { useAppStore } from "@/lib/appStore";

export const Route = createFileRoute("/scan/")({
  head: () => ({ meta: [{ title: "Skin Scan — Skingredient" }] }),
  component: Scan,
});

function Scan() {
  const navigate = useNavigate();
  const { setAnalysis } = useAppStore();
  const [scanning, setScanning] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!scanning) return;
    const t = setInterval(() => setStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length - 1)), 400);
    return () => clearInterval(t);
  }, [scanning]);

  const start = async (image: Blob) => {
    setError(null);
    setScanning(true);
    setStep(0);
    try {
      const result = await skinAnalysisService.analyze(image);
      setAnalysis(result);
      setTimeout(() => navigate({ to: "/results" }), 300);
    } catch (err) {
      setScanning(false);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  const openPicker = () => fileInputRef.current?.click();

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) start(file);
  };

  return (
    <AppShell title="Skin Scan" back="/">
      <MobileHeader
        title="Skin Scan"
        back="/"
        rightSlot={
          <Link
            to="/"
            aria-label="Help"
            className="grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-surface-muted"
          >
            <HelpCircle size={20} />
          </Link>
        }
      />
      <div className="px-5 lg:px-10 lg:pt-8">
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
            {/* Face placeholder */}
            <div className="absolute inset-0 grid place-items-center">
              <FaceIllustration />
            </div>
            {/* Mesh overlay */}
            <MeshOverlay />
            {/* Corners */}
            <Corner className="left-4 top-4" rot={0} />
            <Corner className="right-4 top-4" rot={90} />
            <Corner className="right-4 bottom-4" rot={180} />
            <Corner className="left-4 bottom-4" rot={270} />

            {/* Instruction pill */}
            <div className="absolute left-1/2 top-4 -translate-x-1/2 max-w-[85%] rounded-full bg-black/60 px-4 py-1.5 text-center text-[12px] font-medium text-white">
              {error ?? (scanning ? ANALYSIS_STEPS[step] : "Position your face in the frame")}
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
                  onClick={openPicker}
                  disabled={scanning}
                  aria-label="Capture"
                  className="grid h-[72px] w-[72px] place-items-center rounded-full bg-white shadow-lift ring-4 ring-sage disabled:opacity-70"
                >
                  <div
                    className={`h-14 w-14 rounded-full ${scanning ? "animate-pulse bg-sage" : "bg-white"}`}
                  />
                </button>
                <button
                  aria-label="Flash"
                  className="grid h-11 w-11 place-items-center rounded-full bg-white/90 text-ink"
                >
                  <Zap size={18} />
                </button>
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
            {error && <p className="mt-4 text-[13px] font-medium text-coral">{error}</p>}
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={openPicker}
                disabled={scanning}
                className="rounded-2xl bg-brand px-6 py-3 text-[14px] font-semibold text-white disabled:opacity-70"
              >
                {scanning ? "Analyzing…" : error ? "Try again" : "Use camera"}
              </button>
              <button
                onClick={openPicker}
                disabled={scanning}
                className="inline-flex items-center gap-2 rounded-2xl border border-hairline bg-white px-6 py-3 text-[14px] font-semibold text-ink disabled:opacity-70"
              >
                <ImageIcon size={16} /> Upload photo
              </button>
              <Link
                to="/scan/check-in"
                className="inline-flex items-center rounded-2xl border border-hairline bg-white px-6 py-3 text-[14px] font-semibold text-brand"
              >
                Daily check-in
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between px-1 text-[13px] text-ink-muted lg:mt-8">
          <Link to="/scan/check-in" className="font-medium text-brand lg:hidden">
            Daily check-in
          </Link>
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
