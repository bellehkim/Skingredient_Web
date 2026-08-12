export function MetricBar({
  name,
  value,
  label,
  color,
}: {
  name: string;
  value: number;
  label: string;
  /** Hex color, e.g. from src/lib/metricColors.ts */
  color: string;
}) {
  return (
    <div className="py-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[15px] font-semibold text-ink">{name}</span>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold" style={{ color }}>
            {label}
          </span>
          <span className="text-[13px] font-medium text-ink-muted">{value} /100</span>
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
