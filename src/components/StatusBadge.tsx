import type { ApiMode } from "../types/crisis";

const modeClass: Record<ApiMode, string> = {
  live: "border-emerald-200 bg-emerald-50 text-emerald-700",
  mixed: "border-amber-200 bg-amber-50 text-amber-700",
  fallback: "border-zinc-200 bg-zinc-100 text-zinc-600",
};

export function StatusBadge({ label, mode }: { label: string; mode: ApiMode }) {
  const status = mode === "live" ? "LIVE" : mode === "mixed" ? "HYBRID" : "DEMO";
  const detail =
    mode === "live"
      ? `${label} is using a live service.`
      : mode === "mixed"
        ? `${label} uses live calls when available and deterministic fallback when rate-limited.`
        : `${label} is using deterministic fallback data for operational reliability.`;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold ${modeClass[mode]}`}
      title={detail}
      aria-label={`${label}: ${detail}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label} · {status}
    </span>
  );
}
