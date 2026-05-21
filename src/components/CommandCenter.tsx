import {
  Activity,
  BarChart3,
  Cpu,
  FileText,
  Layers3,
  MessageSquare,
  ShieldAlert,
  Truck,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
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

type WorkspaceTab = "brief" | "plan" | "impact" | "proof" | "assets";

const tabs: Array<{
  id: WorkspaceTab;
  label: string;
  Icon: typeof MessageSquare;
}> = [
  { id: "brief", label: "Brief", Icon: MessageSquare },
  { id: "plan", label: "Dispatch", Icon: FileText },
  { id: "impact", label: "Impact", Icon: BarChart3 },
  { id: "proof", label: "Proof", Icon: Layers3 },
  { id: "assets", label: "Assets", Icon: Truck },
];

export function CommandCenter() {
  const {
    apiStatus,
    initialize,
    dispatchPlan,
    selectedScenarioId,
    scenarios,
    incidents,
    disruptionLog,
    runJudgeDemo,
    isRunningJudgeDemo,
    judgeDemoStep,
  } =
    useCrisisStore();
  const scenario = scenarios.find((item) => item.id === selectedScenarioId) ?? scenarios[0];
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("brief");
  const incidentCount = incidents.length;

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const tabContent = {
    brief: (
      <div className="space-y-4">
        <MissionState dispatchPlan={dispatchPlan} disruptionLog={disruptionLog} />
        <AiBriefing />
      </div>
    ),
    plan: <DispatchPlan />,
    impact: <ImpactDashboard />,
    proof: <AlgorithmReceipts />,
    assets: <ResourcePanel />,
  } satisfies Record<WorkspaceTab, JSX.Element>;

  return (
    <main className="ops-background min-h-screen text-zinc-950">
      <header className="border-b border-[#cfd8cf] bg-[#101411] px-4 py-3 text-white shadow-sm">
        <div className="mx-auto flex max-w-[1760px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded bg-red-600 text-white">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-normal">CrisisGrid</h1>
                <span className="rounded bg-white px-2 py-1 text-[11px] font-black text-zinc-950">
                  ALGO CORE
                </span>
              </div>
              <p className="text-sm text-zinc-300">{scenario.name}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label="MapLibre" mode={apiStatus.mapLibre} />
            <StatusBadge label="OpenFreeMap" mode={apiStatus.openFreeMap} />
            <StatusBadge label="OSRM" mode={apiStatus.osrm} />
            <StatusBadge label="Weather" mode={apiStatus.openWeather} />
            <StatusBadge label="Gemini" mode={apiStatus.gemini} />
            <StatusBadge label="EONET" mode={apiStatus.nasaEonet} />
            <button
              type="button"
              onClick={() => {
                setActiveTab("impact");
                void runJudgeDemo();
              }}
              className="inline-flex items-center gap-2 rounded bg-red-600 px-3 py-2 text-xs font-black text-white shadow-sm hover:bg-red-700"
            >
              <Zap className="h-4 w-4" />
              {isRunningJudgeDemo ? "Running..." : "Judge Demo"}
            </button>
          </div>
        </div>
      </header>

      <section className="border-b border-[#d4ddd4] bg-white/90 px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-[1760px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-red-700">
              Active Response
            </p>
            <h2 className="text-lg font-black text-zinc-950">
              {dispatchPlan
                ? `CrisisGrid optimized ${dispatchPlan.metrics.resourcesDeployed} resources across ${incidentCount} incidents in ${formatRuntime(dispatchPlan.metrics.optimizationRuntimeMs)}.`
                : "CrisisGrid is preparing the default emergency response plan."}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              CrisisGrid ranks incidents, assigns limited emergency resources, and reroutes after disruptions to reduce ETA and unmet demand. Live map with a simulated disaster feed for judging.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <BannerStat
              label="ETA Reduced"
              value={dispatchPlan ? `${dispatchPlan.metrics.responseTimeReductionPct}%` : "--"}
            />
            <BannerStat
              label="Covered"
              value={
                dispatchPlan
                  ? `${dispatchPlan.metrics.peopleCovered}/${dispatchPlan.metrics.peopleAtRisk}`
                  : "--"
              }
            />
            <BannerStat
              label="Unmet"
              value={
                dispatchPlan
                  ? `${dispatchPlan.metrics.baselineUnmetDemand} -> ${dispatchPlan.metrics.unmetDemand}`
                  : "--"
              }
            />
          </div>
        </div>
        <DemoTimeline step={judgeDemoStep} running={isRunningJudgeDemo} />
      </section>

      <div className="mx-auto grid max-w-[1760px] gap-4 p-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="order-2 space-y-4 xl:order-1 xl:sticky xl:top-4 xl:self-start">
          <ScenarioPanel />
          <WeatherRiskPanel />
          <OptimizationPanel />
        </aside>

        <section className="order-1 space-y-4 xl:order-2">
          <CrisisMap />
          <div className="grid gap-3 md:grid-cols-3">
            <MiniMetric
              label="Plan"
              value={dispatchPlan ? "Active" : "Standby"}
              tone={dispatchPlan ? "text-emerald-700" : "text-zinc-500"}
            />
            <MiniMetric
              label="Candidates"
              value={String(dispatchPlan?.metrics.candidateAssignments ?? 0)}
              tone="text-blue-700"
            />
            <MiniMetric
              label="Disruptions"
              value={String(disruptionLog.length)}
              tone={disruptionLog.length ? "text-amber-700" : "text-zinc-500"}
            />
          </div>
          <div className="rounded-xl border border-[#c8d2c9] bg-white/95 p-2 shadow-sm backdrop-blur">
            <div className="flex gap-1 overflow-x-auto md:grid md:grid-cols-5">
              {tabs.map(({ id, label, Icon }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`inline-flex h-10 min-w-[118px] shrink-0 items-center justify-center gap-2 rounded-md px-3 text-xs font-black transition md:min-w-0 ${
                      active
                        ? "bg-[#101411] text-white shadow-sm"
                        : "text-zinc-500 hover:bg-[#edf1e9] hover:text-zinc-950"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="min-h-[320px]">{tabContent[activeTab]}</div>
        </section>
      </div>
    </main>
  );
}

const demoSteps = [
  "Detected",
  "Scored",
  "Assigned",
  "Disrupted",
  "Replanned",
  "Improved",
];

function formatRuntime(ms: number) {
  if (ms < 1000) return "<1s";
  return `${(ms / 1000).toFixed(1)}s`;
}

function DemoTimeline({ step, running }: { step: number; running: boolean }) {
  return (
    <div className="mx-auto mt-3 max-w-[1760px] overflow-x-auto pb-1">
      <div className="grid min-w-[640px] grid-cols-6 gap-2">
        {demoSteps.map((label, index) => {
          const current = step === index + 1 && running;
          const done = step >= index + 1;
          return (
            <div
              key={label}
              className={`rounded border px-3 py-2 text-center text-[11px] font-black uppercase tracking-wide ${
                done
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-zinc-200 bg-white text-zinc-400"
              } ${current ? "ring-2 ring-red-300" : ""}`}
            >
              <span className="mr-1">{index + 1}</span>
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border border-command-line bg-white px-4 py-3 shadow-sm">
      <span className="text-[11px] font-black uppercase tracking-wide text-zinc-500">{label}</span>
      <div className={`mt-1 text-xl font-black ${tone}`}>{value}</div>
    </div>
  );
}

function BannerStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-24 rounded border border-[#c8d2c9] bg-[#f7f8f4] px-3 py-2">
      <div className="text-base font-black text-zinc-950">{value}</div>
      <div className="text-[10px] font-black uppercase text-zinc-500">{label}</div>
    </div>
  );
}

function MissionState({
  dispatchPlan,
  disruptionLog,
}: {
  dispatchPlan: ReturnType<typeof useCrisisStore.getState>["dispatchPlan"];
  disruptionLog: string[];
}) {
  return (
    <section className="rounded-lg border border-command-line bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-zinc-950">Mission</h2>
          <p className="text-xs text-zinc-500">{dispatchPlan ? "Plan active" : "Ready"}</p>
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
            <div
              key={item}
              className="rounded border border-amber-200 bg-amber-50 px-2 py-2 text-xs text-amber-800"
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
