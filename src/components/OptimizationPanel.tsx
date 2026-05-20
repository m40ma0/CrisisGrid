import { Ban, Hospital, RefreshCw, RotateCcw, Siren, TrendingUp } from "lucide-react";
import { useCrisisStore } from "../store/useCrisisStore";

export function OptimizationPanel() {
  const {
    generatePlan,
    replan,
    blockRoad,
    markHospitalFull,
    markShelterFull,
    triggerDemandSpike,
    resetScenario,
    isGeneratingPlan,
    dispatchPlan,
  } = useCrisisStore();

  const actionClass =
    "inline-flex items-center justify-center gap-2 rounded px-3 py-2 text-xs font-bold transition";

  return (
    <section className="rounded-lg border border-command-line bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h2 className="text-sm font-bold text-zinc-950">Optimization Engine</h2>
        <p className="text-xs text-zinc-500">Deterministic assignment and replanning</p>
      </div>

      <button
        type="button"
        onClick={() => void generatePlan()}
        className={`${actionClass} mb-2 w-full bg-red-600 text-white hover:bg-red-700`}
      >
        <Siren className="h-4 w-4" />
        {isGeneratingPlan ? "Optimizing..." : "Generate Response Plan"}
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={blockRoad}
          className={`${actionClass} border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100`}
        >
          <Ban className="h-4 w-4" />
          Block Road
        </button>
        <button
          type="button"
          onClick={triggerDemandSpike}
          className={`${actionClass} border border-red-200 bg-red-50 text-red-700 hover:bg-red-100`}
        >
          <TrendingUp className="h-4 w-4" />
          Demand Spike
        </button>
        <button
          type="button"
          onClick={markHospitalFull}
          className={`${actionClass} border border-zinc-300 bg-zinc-50 text-zinc-700 hover:bg-zinc-100`}
        >
          <Hospital className="h-4 w-4" />
          Hospital Full
        </button>
        <button
          type="button"
          onClick={markShelterFull}
          className={`${actionClass} border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100`}
        >
          <Hospital className="h-4 w-4" />
          Shelter Full
        </button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void replan()}
          disabled={!dispatchPlan}
          className={`${actionClass} border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40`}
        >
          <RefreshCw className="h-4 w-4" />
          Replan
        </button>
        <button
          type="button"
          onClick={() => void resetScenario()}
          className={`${actionClass} border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50`}
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>
    </section>
  );
}
