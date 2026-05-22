import {
  Activity,
  BarChart3,
  Building2,
  ChevronRight,
  Clock,
  Cpu,
  FileText,
  MapPinned,
  Radio,
  Route,
  ShieldAlert,
  Siren,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

type PageId =
  | "overview"
  | "operations"
  | "incidents"
  | "dispatch"
  | "intelligence"
  | "analytics"
  | "infrastructure";

const pages: Array<{
  id: PageId;
  label: string;
  Icon: typeof MapPinned;
}> = [
  { id: "overview", label: "Overview", Icon: Activity },
  { id: "operations", label: "Operations", Icon: MapPinned },
  { id: "incidents", label: "Incidents", Icon: Siren },
  { id: "dispatch", label: "Dispatch", Icon: Route },
  { id: "intelligence", label: "Intelligence", Icon: Radio },
  { id: "analytics", label: "Analytics", Icon: BarChart3 },
  { id: "infrastructure", label: "Infrastructure", Icon: Building2 },
];

const drillSteps = [
  "Detect",
  "Score",
  "Assign",
  "Disrupt",
  "Replan",
  "Stabilize",
];

export function CommandCenter() {
  const {
    apiStatus,
    initialize,
    dispatchPlan,
    selectedScenarioId,
    selectedCity,
    scenarios,
    incidents,
    resources,
    facilities,
    roadClosures,
    disruptionLog,
    runJudgeDemo,
    isRunningJudgeDemo,
    judgeDemoStep,
    weather,
    routesReplanned,
  } = useCrisisStore();
  const scenario = scenarios.find((item) => item.id === selectedScenarioId) ?? scenarios[0];
  const [activePage, setActivePage] = useState<PageId>("overview");

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const runCrisisDrill = async () => {
    setActivePage("operations");
    await runJudgeDemo();
    setActivePage("analytics");
  };

  const systemStatus = useMemo(() => {
    if (weather.riskScore >= 80) return "Emergency response active";
    if (weather.riskScore >= 55) return "Elevated readiness";
    return "Monitoring";
  }, [weather.riskScore]);

  const openIncidentCount = incidents.filter((incident) => incident.status !== "covered").length;
  const overloadedFacilities = facilities.filter(
    (facility) => facility.offline || facility.currentLoad >= facility.capacity,
  ).length;
  const visibleRoutesReplanned = Math.max(
    routesReplanned,
    dispatchPlan?.metrics.routesReplanned ?? 0,
    roadClosures.length > 0 ? roadClosures.length : 0,
  );

  return (
    <main className="mission-shell min-h-screen overflow-x-hidden text-[#f7f7ee]">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080a07]/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1680px] flex-col gap-3 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
          <button
            type="button"
            onClick={() => setActivePage("overview")}
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 bg-white/10">
              <ShieldAlert className="h-5 w-5 text-red-300" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black uppercase tracking-[0.16em]">
                CrisisGrid
              </span>
              <span className="block truncate text-xs text-white/55">
                {selectedCity.name} Emergency Operations
              </span>
            </span>
          </button>

          <label className="grid gap-1 md:hidden">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/38">
              Section
            </span>
            <select
              value={activePage}
              onChange={(event) => setActivePage(event.target.value as PageId)}
              className="h-10 w-full rounded-full border border-white/10 bg-[#f7f7ee] px-4 text-sm font-black text-[#080a07] outline-none"
            >
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.label}
                </option>
              ))}
            </select>
          </label>

          <div className="nav-fade relative hidden min-w-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.04] md:block">
            <nav className="nav-scroll flex min-w-0 gap-1 overflow-x-auto p-1 pr-8">
              {pages.map(({ id, label, Icon }) => {
                const active = activePage === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActivePage(id)}
                    className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3 text-xs font-bold transition duration-300 ${
                      active
                        ? "bg-[#f7f7ee] text-[#080a07]"
                        : "text-white/62 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <StatusBadge label="MapLibre" mode={apiStatus.mapLibre} />
            <StatusBadge label="Weather" mode={apiStatus.openWeather} />
            <StatusBadge label="Gemini" mode={apiStatus.gemini} />
            <button
              type="button"
              onClick={() => void runCrisisDrill()}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-red-500 px-4 text-xs font-black text-white shadow-sm transition hover:bg-red-400"
            >
              <Zap className="h-4 w-4" />
              {isRunningJudgeDemo ? "Running drill" : "Run crisis drill"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1680px] px-4 pb-10 pt-5">
        <SystemHeader
          page={pages.find((item) => item.id === activePage)?.label ?? "Overview"}
          status={systemStatus}
          scenario={scenario.name}
          selectedCity={selectedCity.name}
          dispatchPlan={dispatchPlan}
          incidents={incidents.length}
          openIncidentCount={openIncidentCount}
          resources={resources.length}
          weatherRisk={weather.riskScore}
          routesReplanned={visibleRoutesReplanned}
        />

        <section key={activePage} className="page-transition mt-5">
          {activePage === "overview" && (
            <OverviewPage
              dispatchPlan={dispatchPlan}
              incidents={incidents.length}
              openIncidentCount={openIncidentCount}
              resources={resources.length}
              weatherRisk={weather.riskScore}
              overloadedFacilities={overloadedFacilities}
              disruptionLog={disruptionLog}
              routesReplanned={visibleRoutesReplanned}
              onOpenOperations={() => setActivePage("operations")}
              onOpenAnalytics={() => setActivePage("analytics")}
              onRunDrill={() => void runCrisisDrill()}
            />
          )}
          {activePage === "operations" && (
            <OperationsPage
              dispatchPlan={dispatchPlan}
              disruptionLog={disruptionLog}
              onRunDrill={() => void runCrisisDrill()}
            />
          )}
          {activePage === "incidents" && <IncidentsPage />}
          {activePage === "dispatch" && (
            <DispatchPage
              onRunDrill={() => void runCrisisDrill()}
              routesReplanned={visibleRoutesReplanned}
              disruptionLog={disruptionLog}
            />
          )}
          {activePage === "intelligence" && (
            <IntelligencePage
              running={isRunningJudgeDemo}
              step={judgeDemoStep}
              routesReplanned={visibleRoutesReplanned}
              disruptionLog={disruptionLog}
              onRunDrill={() => void runCrisisDrill()}
            />
          )}
          {activePage === "analytics" && <AnalyticsPage />}
          {activePage === "infrastructure" && <InfrastructurePage />}
        </section>
      </div>
    </main>
  );
}

function SystemHeader({
  page,
  status,
  scenario,
  selectedCity,
  dispatchPlan,
  incidents,
  openIncidentCount,
  resources,
  weatherRisk,
  routesReplanned,
}: {
  page: string;
  status: string;
  scenario: string;
  selectedCity: string;
  dispatchPlan: ReturnType<typeof useCrisisStore.getState>["dispatchPlan"];
  incidents: number;
  openIncidentCount: number;
  resources: number;
  weatherRisk: number;
  routesReplanned: number;
}) {
  return (
    <section className="grid gap-4 rounded border border-white/10 bg-white/[0.04] p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-red-200">
          {status}
        </p>
        <h1 className="mt-2 text-4xl font-black leading-none sm:text-5xl">{page}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/58">
          {selectedCity} command area. Scenario: {scenario}. CrisisGrid ranks incidents, assigns
          limited emergency resources, and replans routes when conditions change.
        </p>
        <p className="mt-3 w-fit rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-bold text-white/62">
          Live map + deterministic optimizer + simulated emergency feed
        </p>
      </div>
      <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-5 lg:min-w-[620px]">
        <HeaderStat label="Risk" value={weatherRisk} />
        <HeaderStat label="Open" value={`${openIncidentCount}/${incidents}`} />
        <HeaderStat label="Resources" value={resources} />
        <HeaderStat
          label="ETA"
          value={dispatchPlan ? `${dispatchPlan.metrics.responseTimeReductionPct}%` : "--"}
        />
        <HeaderStat label="Replans" value={routesReplanned} />
      </div>
    </section>
  );
}

function OverviewPage({
  dispatchPlan,
  incidents,
  openIncidentCount,
  resources,
  weatherRisk,
  overloadedFacilities,
  disruptionLog,
  routesReplanned,
  onOpenOperations,
  onOpenAnalytics,
  onRunDrill,
}: {
  dispatchPlan: ReturnType<typeof useCrisisStore.getState>["dispatchPlan"];
  incidents: number;
  openIncidentCount: number;
  resources: number;
  weatherRisk: number;
  overloadedFacilities: number;
  disruptionLog: string[];
  routesReplanned: number;
  onOpenOperations: () => void;
  onOpenAnalytics: () => void;
  onRunDrill: () => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_410px]">
      <section className="min-w-0 space-y-4">
        <CrisisMap />
        <MissionStrip dispatchPlan={dispatchPlan} disruptionLog={disruptionLog} />
        <OverviewProofPanel dispatchPlan={dispatchPlan} routesReplanned={routesReplanned} />
        <OptimizationExplainerPanel />
      </section>

      <aside className="space-y-4">
        <section className="rounded border border-white/10 bg-[#f7f7ee] p-5 text-[#080a07]">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#080a07]/50">
            Operational snapshot
          </p>
          <h2 className="mt-3 text-3xl font-black leading-tight">
            {dispatchPlan
              ? `${dispatchPlan.metrics.resourcesDeployed} units assigned in ${formatRuntime(dispatchPlan.metrics.optimizationRuntimeMs)}.`
              : "Building the active response plan."}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#080a07]/62">
            {dispatchPlan
              ? `${dispatchPlan.metrics.peopleCovered.toLocaleString()} people covered, with unmet demand reduced from ${dispatchPlan.metrics.baselineUnmetDemand} to ${dispatchPlan.metrics.unmetDemand}.`
              : "The optimizer runs automatically so this screen starts with proof, not empty state."}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <SystemTile label="Incidents" value={`${openIncidentCount}/${incidents}`} />
            <SystemTile label="Resources" value={resources} />
            <SystemTile label="Risk score" value={weatherRisk} />
            <SystemTile label="Facility pressure" value={overloadedFacilities} />
          </div>
        </section>

        <div className="grid gap-2">
          <button
            type="button"
            onClick={onOpenOperations}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-red-500 px-5 text-sm font-black text-white transition hover:bg-red-400"
          >
            Open operations map
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRunDrill}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/15 px-5 text-sm font-bold text-white/72 transition hover:bg-white/10"
          >
            Run crisis drill
          </button>
          <button
            type="button"
            onClick={onOpenAnalytics}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/15 px-5 text-sm font-bold text-white/72 transition hover:bg-white/10"
          >
            Review analytics
          </button>
        </div>

        <AiBriefing />
      </aside>
    </div>
  );
}

function OperationsPage({
  dispatchPlan,
  disruptionLog,
  onRunDrill,
}: {
  dispatchPlan: ReturnType<typeof useCrisisStore.getState>["dispatchPlan"];
  disruptionLog: string[];
  onRunDrill: () => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
      <aside className="min-w-0 space-y-4 xl:sticky xl:top-24 xl:self-start">
        <ScenarioPanel />
        <WeatherRiskPanel />
        <OptimizationPanel onRunCrisisDrill={onRunDrill} />
      </aside>
      <section className="min-w-0 space-y-4">
        <CrisisMap />
        <MissionStrip dispatchPlan={dispatchPlan} disruptionLog={disruptionLog} />
      </section>
    </div>
  );
}

function OverviewProofPanel({
  dispatchPlan,
  routesReplanned,
}: {
  dispatchPlan: ReturnType<typeof useCrisisStore.getState>["dispatchPlan"];
  routesReplanned: number;
}) {
  const { incidents } = useCrisisStore();
  const topIncidents = [...incidents].sort((a, b) => b.severity - a.severity).slice(0, 3);
  const baseline = dispatchPlan?.metrics.baselineResponseTime ?? 0;
  const optimized = dispatchPlan?.metrics.averageResponseTime ?? 0;
  const optimizedWidth = baseline ? Math.max(8, Math.min(100, (optimized / baseline) * 100)) : 8;

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="rounded border border-white/10 bg-white/[0.05] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
              Response delta
            </p>
            <h2 className="mt-1 text-xl font-black">Baseline versus optimized</h2>
          </div>
          <BarChart3 className="h-5 w-5 text-white/42" />
        </div>
        <div className="mt-5 space-y-4">
          <RouteBar
            label="Nearest-resource dispatch"
            value={baseline ? `${baseline}m` : "--"}
            width={100}
            tone="bg-white/28"
          />
          <RouteBar
            label="CrisisGrid optimized"
            value={optimized ? `${optimized}m` : "--"}
            width={optimizedWidth}
            tone="bg-emerald-300"
          />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <DarkMiniStat
            label="ETA reduced"
            value={dispatchPlan ? `${dispatchPlan.metrics.responseTimeReductionPct}%` : "--"}
          />
          <DarkMiniStat
            label="Candidates"
            value={dispatchPlan?.metrics.candidateAssignments ?? "--"}
          />
          <DarkMiniStat label="Replans" value={routesReplanned} />
        </div>
      </div>

      <div className="rounded border border-white/10 bg-white/[0.05] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
              Priority queue
            </p>
            <h2 className="mt-1 text-xl font-black">Highest-risk incidents</h2>
          </div>
          <Siren className="h-5 w-5 text-red-300" />
        </div>
        <div className="mt-4 grid gap-2">
          {topIncidents.map((incident) => (
            <div
              key={incident.id}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded border border-white/10 bg-black/15 px-3 py-2"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  incident.urgency === "critical" ? "bg-red-400" : "bg-amber-300"
                }`}
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-black text-white/86">{incident.title}</div>
                <div className="text-xs text-white/45">
                  {incident.peopleAffected.toLocaleString()} affected
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black">{incident.severity}</div>
                <div className="text-[10px] font-black uppercase text-white/35">Score</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function IncidentsPage() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <IncidentBoard />
      <aside className="space-y-4">
        <WeatherRiskPanel />
        <ScenarioPanel />
      </aside>
    </div>
  );
}

function OptimizationExplainerPanel() {
  const steps = [
    {
      label: "Inputs",
      value: "Incidents, weather, facilities, resources, closures",
    },
    {
      label: "Scoring",
      value: "Severity + people affected + urgency + weather risk",
    },
    {
      label: "Assignment",
      value: "Greedy resource fit with Dijkstra route penalties",
    },
    {
      label: "Outcome",
      value: "ETA reduction, coverage, unmet demand, replans",
    },
  ];

  return (
    <section className="rounded border border-white/10 bg-white/[0.05] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
            How optimization works
          </p>
          <h2 className="mt-1 text-xl font-black">Not just a map. A dispatch engine.</h2>
        </div>
        <Cpu className="h-5 w-5 text-white/42" />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {steps.map((step, index) => (
          <div key={step.label} className="rounded border border-white/10 bg-black/15 p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-red-200">
              0{index + 1} / {step.label}
            </div>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/68">{step.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DispatchPage({
  onRunDrill,
  routesReplanned,
  disruptionLog,
}: {
  onRunDrill: () => void;
  routesReplanned: number;
  disruptionLog: string[];
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <OptimizationPanel onRunCrisisDrill={onRunDrill} />
        <MissionEventLog routesReplanned={routesReplanned} disruptionLog={disruptionLog} />
      </aside>
      <DispatchPlan />
    </div>
  );
}

function IntelligencePage({
  running,
  step,
  routesReplanned,
  disruptionLog,
  onRunDrill,
}: {
  running: boolean;
  step: number;
  routesReplanned: number;
  disruptionLog: string[];
  onRunDrill: () => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="min-w-0 space-y-4">
        <DrillTimeline step={step} running={running} />
        <AiBriefing />
        <MissionEventLog routesReplanned={routesReplanned} disruptionLog={disruptionLog} />
      </section>
      <aside className="space-y-4">
        <WeatherRiskPanel />
        <section className="rounded border border-white/10 bg-white/[0.05] p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
            Simulation controls
          </p>
          <h2 className="mt-2 text-2xl font-black">Stress the response plan.</h2>
          <p className="mt-3 text-sm leading-6 text-white/58">
            Run a crisis drill to test road closures, demand spikes, and facility saturation without
            changing the deterministic optimizer.
          </p>
          <button
            type="button"
            onClick={onRunDrill}
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-red-500 px-4 text-sm font-black text-white transition hover:bg-red-400"
          >
            <Zap className="h-4 w-4" />
            {running ? "Running drill" : "Run crisis drill"}
          </button>
        </section>
      </aside>
    </div>
  );
}

function AnalyticsPage() {
  return (
    <div className="space-y-5">
      <ImpactDashboard />
      <AlgorithmReceipts />
    </div>
  );
}

function InfrastructurePage() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <ResourcePanel />
      <section className="rounded-xl border border-white/10 bg-white/[0.05] p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
          System design
        </p>
        <h2 className="mt-2 text-xl font-black">Live services with deterministic fallbacks.</h2>
        <p className="mt-3 text-sm leading-6 text-white/58">
          MapLibre/OpenFreeMap render the city map. OpenWeather, Gemini, OSRM, and EONET enrich the
          command picture when available, while local fallback data keeps the operating picture
          stable under quota limits.
        </p>
        <div className="mt-5 grid gap-2">
          <ServiceLine label="Map surface" value="MapLibre + OpenFreeMap" />
          <ServiceLine label="Weather risk" value="OpenWeather + seed fallback" />
          <ServiceLine label="Briefing" value="Gemini explanation-only" />
          <ServiceLine label="Routing" value="Dijkstra + OSRM visual routes" />
        </div>
      </section>
    </div>
  );
}

function IncidentBoard() {
  const { incidents, dispatchPlan } = useCrisisStore();
  const assignedIncidentIds = new Set(
    dispatchPlan?.assignments.map((assignment) => assignment.incidentId) ?? [],
  );

  return (
    <section className="rounded-xl border border-command-line bg-white p-5 text-zinc-950 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wide text-zinc-500">
            Incident queue
          </p>
          <h2 className="mt-1 text-xl font-black">Ranked operational demand</h2>
        </div>
        <Siren className="h-6 w-6 text-red-600" />
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        {[...incidents]
          .sort((a, b) => b.severity - a.severity)
          .map((incident) => (
            <article
              key={incident.id}
              className="rounded-lg border border-zinc-200 bg-[#f7f8f4] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded px-2 py-1 text-[10px] font-black uppercase ${
                        incident.urgency === "critical"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {incident.urgency}
                    </span>
                    {assignedIncidentIds.has(incident.id) && (
                      <span className="rounded bg-emerald-100 px-2 py-1 text-[10px] font-black uppercase text-emerald-700">
                        Assigned
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 text-lg font-black">{incident.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    {incident.peopleAffected.toLocaleString()} people affected. Required units:{" "}
                    {Object.entries(incident.requiredResources)
                      .map(([type, count]) => `${count} ${type}`)
                      .join(", ")}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-3xl font-black text-zinc-950">{incident.severity}</div>
                  <div className="text-[10px] font-black uppercase text-zinc-400">Severity</div>
                </div>
              </div>
            </article>
          ))}
      </div>
    </section>
  );
}

function DrillTimeline({ step, running }: { step: number; running: boolean }) {
  return (
    <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {drillSteps.map((label, index) => {
        const current = step === index + 1 && running;
        const done = step >= index + 1;
        return (
          <div
            key={label}
            className={`rounded border px-3 py-3 transition duration-300 ${
              done
                ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
                : "border-white/10 bg-white/[0.04] text-white/42"
            } ${current ? "scale-[1.02] border-red-300/50 bg-red-400/15 text-red-100" : ""}`}
          >
            <div className="text-[10px] font-black uppercase tracking-[0.18em]">0{index + 1}</div>
            <div className="mt-1 text-sm font-black">{label}</div>
          </div>
        );
      })}
    </div>
  );
}

function MissionStrip({
  dispatchPlan,
  disruptionLog,
}: {
  dispatchPlan: ReturnType<typeof useCrisisStore.getState>["dispatchPlan"];
  disruptionLog: string[];
}) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <MissionMetric
        label="ETA reduced"
        value={dispatchPlan ? `${dispatchPlan.metrics.responseTimeReductionPct}%` : "--"}
        Icon={Clock}
      />
      <MissionMetric
        label="Candidates"
        value={String(dispatchPlan?.metrics.candidateAssignments ?? 0)}
        Icon={Cpu}
      />
      <MissionMetric
        label="Covered"
        value={
          dispatchPlan
            ? `${dispatchPlan.metrics.peopleCovered}/${dispatchPlan.metrics.peopleAtRisk}`
            : "--"
        }
        Icon={Users}
      />
      <MissionMetric label="Disruptions" value={String(disruptionLog.length)} Icon={Zap} />
    </div>
  );
}

function MissionMetric({
  label,
  value,
  Icon,
}: {
  label: string;
  value: string;
  Icon: typeof Activity;
}) {
  return (
    <div className="rounded border border-white/10 bg-white/[0.045] p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
          {label}
        </span>
        <Icon className="h-4 w-4 text-white/42" />
      </div>
      <div className="mt-3 truncate text-2xl font-black text-[#f7f7ee]">{value}</div>
    </div>
  );
}

function HeaderStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="min-w-0 rounded border border-white/10 bg-white/[0.06] px-3 py-2">
      <div className="truncate text-lg font-black">{value}</div>
      <div className="text-[10px] font-black uppercase tracking-[0.14em] text-white/42">
        {label}
      </div>
    </div>
  );
}

function SystemTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded border border-[#080a07]/10 bg-[#080a07]/5 p-3">
      <div className="text-2xl font-black">{value}</div>
      <div className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#080a07]/45">
        {label}
      </div>
    </div>
  );
}

function RouteBar({
  label,
  value,
  width,
  tone,
}: {
  label: string;
  value: string;
  width: number;
  tone: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-white/62">{label}</span>
        <span className="text-sm font-black text-white/86">{value}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-black/35">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function DarkMiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded border border-white/10 bg-black/15 px-3 py-2">
      <div className="truncate text-lg font-black">{value}</div>
      <div className="text-[10px] font-black uppercase tracking-[0.14em] text-white/36">
        {label}
      </div>
    </div>
  );
}

function MissionEventLog({
  routesReplanned,
  disruptionLog,
}: {
  routesReplanned: number;
  disruptionLog: string[];
}) {
  return (
    <section className="rounded border border-white/10 bg-white/[0.05] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
            Event log
          </p>
          <h3 className="mt-1 text-xl font-black">{routesReplanned} routes replanned</h3>
        </div>
        <FileText className="h-5 w-5 text-white/42" />
      </div>
      <div className="mt-4 space-y-2">
        {disruptionLog.length === 0 ? (
          <div className="rounded border border-white/10 bg-black/15 px-3 py-2 text-sm text-white/48">
            No disruptions registered.
          </div>
        ) : (
          disruptionLog.slice(-5).map((event, index) => (
            <div
              key={`${event}-${index}`}
              className="rounded border border-white/10 bg-black/15 px-3 py-2 text-sm text-white/62"
            >
              {event}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function ServiceLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded border border-white/10 bg-black/15 px-3 py-2">
      <span className="text-sm text-white/52">{label}</span>
      <span className="text-right text-sm font-black text-white/82">{value}</span>
    </div>
  );
}

function formatRuntime(ms: number) {
  if (ms < 1000) return "<1s";
  return `${(ms / 1000).toFixed(1)}s`;
}
