import { Ban, ChevronRight, Hospital, Play, RefreshCw, RotateCcw, Siren, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useCrisisStore } from "../store/useCrisisStore";

type DisruptionAction = "road" | "demand" | "hospital" | "shelter";

const disruptionCopy: Record<DisruptionAction, { label: string; detail: string }> = {
  road: {
    label: "Block primary corridor",
    detail: "Adds a road-closure penalty near the highest-risk incident.",
  },
  demand: {
    label: "Trigger demand spike",
    detail: "Raises medical demand and affected population at the top incident.",
  },
  hospital: {
    label: "Mark hospital full",
    detail: "Removes the highest-capacity hospital from the active plan.",
  },
  shelter: {
    label: "Mark shelter full",
    detail: "Forces the optimizer to rebalance shelter pressure.",
  },
};

export function OptimizationPanel({ onRunCrisisDrill }: { onRunCrisisDrill?: () => void }) {
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
  const [selectedDisruption, setSelectedDisruption] = useState<DisruptionAction>("road");

  const applyDisruption = () => {
    if (selectedDisruption === "road") blockRoad();
    if (selectedDisruption === "demand") triggerDemandSpike();
    if (selectedDisruption === "hospital") markHospitalFull();
    if (selectedDisruption === "shelter") markShelterFull();
  };

  const selectedCopy = disruptionCopy[selectedDisruption];

  return (
    <section className="rounded-lg border border-[#c8d2c9] bg-white p-4 text-zinc-950 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wide text-zinc-500">
            Runbook
          </p>
          <h2 className="mt-1 text-lg font-black text-zinc-950">Dispatch console</h2>
        </div>
        <span className="rounded-full bg-[#101411] px-3 py-1 text-[10px] font-black text-white">
          RULES
        </span>
      </div>

      {onRunCrisisDrill && (
        <button
          type="button"
          onClick={onRunCrisisDrill}
          className="mb-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-red-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-red-700"
        >
          <Play className="h-4 w-4" />
          Run crisis drill
        </button>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void generatePlan()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded border border-red-200 bg-red-50 px-3 text-xs font-black text-red-700 transition hover:bg-red-100"
        >
          <Siren className="h-4 w-4" />
          {isGeneratingPlan ? "Building" : "Build"}
        </button>
        <button
          type="button"
          onClick={() => void replan()}
          disabled={!dispatchPlan}
          className="inline-flex h-10 items-center justify-center gap-2 rounded border border-blue-200 bg-blue-50 px-3 text-xs font-black text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RefreshCw className="h-4 w-4" />
          Replan
        </button>
      </div>

      <div className="mt-4 rounded-lg border border-zinc-200 bg-[#f7f8f4] p-3">
        <label
          className="mb-2 block text-[11px] font-black uppercase tracking-wide text-zinc-500"
          htmlFor="disruption-action"
        >
          Disruption
        </label>
        <select
          id="disruption-action"
          value={selectedDisruption}
          onChange={(event) => setSelectedDisruption(event.target.value as DisruptionAction)}
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-blue-500"
        >
          <option value="road">Block road</option>
          <option value="demand">Demand spike</option>
          <option value="hospital">Hospital full</option>
          <option value="shelter">Shelter full</option>
        </select>
        <p className="mt-2 text-xs leading-5 text-zinc-500">{selectedCopy.detail}</p>
        <button
          type="button"
          onClick={applyDisruption}
          className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded bg-[#101411] px-3 text-xs font-black text-white transition hover:bg-zinc-800"
        >
          {selectedDisruption === "road" && <Ban className="h-4 w-4" />}
          {selectedDisruption === "demand" && <TrendingUp className="h-4 w-4" />}
          {(selectedDisruption === "hospital" || selectedDisruption === "shelter") && (
            <Hospital className="h-4 w-4" />
          )}
          Apply: {selectedCopy.label}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => void resetScenario()}
        className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-full border border-zinc-300 text-xs font-bold text-zinc-600 transition hover:bg-zinc-50"
      >
        <RotateCcw className="h-4 w-4" />
        Reset scenario
      </button>
    </section>
  );
}
