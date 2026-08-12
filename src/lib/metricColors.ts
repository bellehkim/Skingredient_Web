// Muted, low-saturation palette for the 7 Results-page metrics — softer than
// the app's saturated brand accent colors (coral/aqua/sage/sun), chosen so
// every metric has its own distinct identity while reading as one cohesive
// system. Consumed by MetricBar via inline style (hex-driven), not Tailwind
// color tokens — see MetricBar.tsx.
export const METRIC_COLORS = {
  redness: "#F76F65",
  hydration: "#4F8EF7",
  oiliness: "#F7B23F",
  acne: "#4FCB7A",
  pores: "#39C5B8",
  texture: "#E674F2",
  ageSpots: "#B46E3D",
} as const;
