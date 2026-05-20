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
    <section className="rounded-lg border border-[#c8d2c9] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-zinc-950">Dispatch Console</h2>
          <p className="text-xs text-zinc-500">Rank, assign, replan</p>
        </div>
        <span className="rounded bg-[#101411] px-2 py-1 text-[10px] font-black text-white">
          RULES
        </span>
      </div>

      <button
        type="button"
        onClick={() => void generatePlan()}
        className={`${actionClass} mb-2 w-full bg-red-600 text-white shadow-sm hover:bg-red-700`}
      >
        <Siren className="h-4 w-4" />
        {isGeneratingPlan ? "Building plan..." : "Build Response Plan"}
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
      <div className="mt-3 rounded border border-zinc-200 bg-[#f7f8f4] px-3 py-2 text-[11px] leading-5 text-zinc-600">
        Sorts incidents by risk, matches available units by ETA and resource type, then reroutes after disruption.
      </div>
    </section>
  );
}
