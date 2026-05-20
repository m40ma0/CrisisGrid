import { Activity, Cpu, ShieldAlert } from "lucide-react";
import { useEffect } from "react";
import { useCrisisStore } from "../store/useCrisisStore";
import { AiBriefing } from "./AiBriefing";
import { AlgorithmReceipts } from "./AlgorithmReceipts";
import { CrisisMap } from "./CrisisMap";
import { DispatchPlan } from "./DispatchPlan";
import { ImpactDashboard } from "./ImpactDashboard";
import { OptimizationPanel } from "./OptimizationPanel";
import { ResourcePanel } from "./ResourcePanel";
import { ScenarioPanel } from "./ScenarioPanel";
import { StatusBadge } from "./StatusBadge";
import { WeatherRiskPanel } from "./WeatherRiskPanel";

export function CommandCenter() {
  const { apiStatus, initialize, dispatchPlan, selectedScenarioId, scenarios, disruptionLog } =
    useCrisisStore();
  const scenario = scenarios.find((item) => item.id === selectedScenarioId) ?? scenarios[0];

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return (
    <main className="min-h-screen bg-[#e8edf3] text-zinc-950">
      <header className="border-b border-command-line bg-white/95 px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-[1760px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded bg-red-600 text-white">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-normal text-zinc-950">CrisisGrid</h1>
                <span className="rounded bg-zinc-950 px-2 py-1 text-[11px] font-black text-white">
                  ALGO CORE
                </span>
              </div>
              <p className="text-sm text-zinc-600">{scenario.description}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label="Maps" mode={apiStatus.googleMaps} />
            <StatusBadge label="Directions" mode={apiStatus.directions} />
            <StatusBadge label="Weather" mode={apiStatus.openWeather} />
            <StatusBadge label="Gemini" mode={apiStatus.gemini} />
            <StatusBadge label="EONET" mode={apiStatus.nasaEonet} />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1760px] gap-4 p-4 xl:grid-cols-[320px_minmax(0,1fr)_380px]">
        <aside className="space-y-4">
          <ScenarioPanel />
          <WeatherRiskPanel />
          <OptimizationPanel />
        </aside>

        <section className="space-y-4">
          <CrisisMap />
          <AlgorithmReceipts />
          <ImpactDashboard />
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg border border-command-line bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-zinc-950">Mission State</h2>
                <p className="text-xs text-zinc-500">
                  {dispatchPlan ? "Response plan active" : "Awaiting optimized dispatch"}
                </p>
              </div>
              <Cpu className="h-5 w-5 text-zinc-900" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded border border-zinc-200 bg-zinc-50 p-3">
                <Activity className="mb-2 h-4 w-4 text-red-600" />
                <div className="text-xl font-black">{disruptionLog.length}</div>
                <div className="text-xs text-zinc-500">Disruptions</div>
              </div>
              <div className="rounded border border-zinc-200 bg-zinc-50 p-3">
                <Cpu className="mb-2 h-4 w-4 text-blue-700" />
                <div className="text-xl font-black">
                  {dispatchPlan?.metrics.candidateAssignments ?? 0}
                </div>
                <div className="text-xs text-zinc-500">Candidates</div>
              </div>
            </div>
            {disruptionLog.length > 0 && (
              <div className="mt-3 space-y-2">
                {disruptionLog.slice(-3).map((item) => (
                  <div key={item} className="rounded border border-amber-200 bg-amber-50 px-2 py-2 text-xs text-amber-800">
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
          <AiBriefing />
          <DispatchPlan />
          <ResourcePanel />
        </aside>
      </div>
    </main>
  );
}
