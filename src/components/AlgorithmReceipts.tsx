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
    <section className="rounded-lg border border-command-line bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-zinc-950">Proof Trail</h2>
          <p className="text-xs text-zinc-500">Why the plan is defensible</p>
        </div>
        <Binary className="h-5 w-5 text-zinc-900" />
      </div>

      <div className="mb-3 grid gap-2 md:grid-cols-2">
        <ProofCard
          label="Objective"
          value="min ETA + unmet demand + overload + disruption penalty"
        />
        <ProofCard
          label="Inputs"
          value="incidents, resources, facilities, weather, closures"
        />
        <ProofCard
          label="Algorithm"
          value="priority scoring + Dijkstra + greedy assignment + local improvement"
        />
        <ProofCard
          label="Complexity"
          value="O(incidents x resources log resources)"
        />
      </div>

      {!dispatchPlan ? (
        <div className="rounded border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-500">
          Build a plan to see the proof trail.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
            Evaluated {metrics?.candidateAssignments ?? 0} candidate assignments in{" "}
            {metrics?.optimizationRuntimeMs ?? 0}ms. ETA improved by{" "}
            {metrics?.responseTimeReductionPct ?? 0}%.
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-6">
          {dispatchPlan.receipts.map((receipt) => {
            const Icon = receipt.tone === "warning" || receipt.tone === "critical" ? TriangleAlert : CheckCircle2;
            return (
              <div key={receipt.id} className={`rounded border p-3 ${toneClass[receipt.tone]}`}>
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

function ProofCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-zinc-200 bg-[#f7f8f4] px-3 py-2">
      <div className="text-[10px] font-black uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-xs font-bold leading-5 text-zinc-800">{value}</div>
    </div>
  );
}
