import { Binary, CheckCircle2, TriangleAlert } from "lucide-react";
import { useCrisisStore } from "../store/useCrisisStore";

const toneClass = {
  neutral: "border-zinc-200 bg-zinc-50 text-zinc-700",
  good: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  critical: "border-red-200 bg-red-50 text-red-700",
};

export function AlgorithmReceipts() {
  const { dispatchPlan } = useCrisisStore();
  const metrics = dispatchPlan?.metrics;

  return (
    <section className="rounded-xl border border-command-line bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wide text-zinc-500">
            Algorithm Proof
          </p>
          <h2 className="mt-1 text-xl font-black text-zinc-950">Why the plan is defensible</h2>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#101411] text-white">
          <Binary className="h-5 w-5" />
        </span>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ProofCard
          label="Objective"
          value="Minimize ETA, unmet demand, overload, and disruption penalties."
        />
        <ProofCard
          label="Inputs"
          value="Incidents, resources, facilities, weather, and road closures."
        />
        <ProofCard
          label="Algorithm"
          value="Priority scoring, Dijkstra routing, greedy assignment, local improvement."
        />
        <ProofCard
          label="Complexity"
          value="O(incidents x resources log resources)."
        />
      </div>

      {!dispatchPlan ? (
        <div className="rounded border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-500">
          Build a plan to see the proof trail.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
            Evaluated {metrics?.candidateAssignments ?? 0} candidate assignments in{" "}
            {formatRuntime(metrics?.optimizationRuntimeMs ?? 0)} simulation runtime. ETA improved by{" "}
            {metrics?.responseTimeReductionPct ?? 0}%.
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {dispatchPlan.receipts.map((receipt) => {
              const Icon =
                receipt.tone === "warning" || receipt.tone === "critical"
                  ? TriangleAlert
                  : CheckCircle2;
              return (
                <div key={receipt.id} className={`rounded-lg border p-4 ${toneClass[receipt.tone]}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase">{receipt.label}</span>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-lg font-black">{receipt.value}</div>
                  <p className="mt-1 text-xs leading-5">{receipt.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function formatRuntime(ms: number) {
  if (ms < 1000) return "<1s";
  return `${(ms / 1000).toFixed(1)}s`;
}

function ProofCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-[#f7f8f4] px-4 py-3">
      <div className="text-[10px] font-black uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-xs font-bold leading-5 text-zinc-800">{value}</div>
    </div>
  );
}
