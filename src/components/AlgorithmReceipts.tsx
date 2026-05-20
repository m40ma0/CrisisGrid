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

  return (
    <section className="rounded-lg border border-command-line bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-zinc-950">Algorithm Receipts</h2>
          <p className="text-xs text-zinc-500">Optimization proof trail</p>
        </div>
        <Binary className="h-5 w-5 text-zinc-900" />
      </div>

      {!dispatchPlan ? (
        <div className="rounded border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-500">
          Receipts are generated with each plan.
        </div>
      ) : (
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
      )}
    </section>
  );
}
