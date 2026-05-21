import {
  Activity,
  ArrowRight,
  Building2,
  Clock,
  Gauge,
  Route,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCrisisStore } from "../store/useCrisisStore";

export function ImpactDashboard() {
  const { dispatchPlan } = useCrisisStore();

  if (!dispatchPlan) {
    return (
      <section className="rounded-xl border border-command-line bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wide text-zinc-500">
              Impact
            </p>
            <h2 className="mt-1 text-xl font-black text-zinc-950">Awaiting response plan</h2>
          </div>
          <Clock className="h-6 w-6 text-zinc-400" />
        </div>
        <div className="mt-4 rounded-lg border border-dashed border-zinc-300 bg-[#f7f8f4] p-4 text-sm font-semibold text-zinc-500">
          The dashboard will compare baseline dispatch against the optimized plan as soon as
          CrisisGrid finishes assignment.
        </div>
      </section>
    );
  }

  const { metrics } = dispatchPlan;
  const chartData = [
    { name: "Baseline", eta: metrics.baselineResponseTime, color: "#71717a" },
    { name: "Optimized", eta: metrics.averageResponseTime, color: "#2563eb" },
  ];

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-[#c8d2c9] bg-white shadow-sm">
        <div className="grid lg:grid-cols-[minmax(0,1.35fr)_360px]">
          <div className="p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wide text-zinc-500">
                  Before / After
                </p>
                <h2 className="mt-1 text-2xl font-black text-zinc-950">
                  Dispatch impact made visible
                </h2>
              </div>
              <span className="w-fit rounded bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                {metrics.responseTimeReductionPct}% faster
              </span>
            </div>

            <div className="mt-6 grid grid-cols-[minmax(0,1fr)_44px_minmax(0,1fr)] items-stretch gap-3">
              <ComparisonBlock
                label="Baseline ETA"
                value={`${metrics.baselineResponseTime}m`}
                detail="Nearest-resource dispatch"
                muted
              />
              <div className="grid place-items-center">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#101411] text-white shadow-sm">
                  <ArrowRight className="h-5 w-5" />
                </span>
              </div>
              <ComparisonBlock
                label="Optimized ETA"
                value={`${metrics.averageResponseTime}m`}
                detail="Priority, capacity, and route cost"
              />
            </div>
          </div>

          <div className="border-t border-[#d8dde6] bg-[#101411] p-5 text-white lg:border-l lg:border-t-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wide text-zinc-400">
                  Crisis Score
                </p>
                <div className="mt-2 text-5xl font-black tabular-nums">{metrics.crisisScore}</div>
              </div>
              <Gauge className="h-7 w-7 text-red-400" />
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-300">
              Lower is better. Score combines ETA, unmet demand, resource coverage, and facility
              pressure.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <MiniReadout label="Deployed" value={metrics.resourcesDeployed} />
              <MiniReadout label="Runtime" value={formatRuntime(metrics.optimizationRuntimeMs)} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        <ImpactMetric
          label="People Covered"
          value={metrics.peopleCovered.toLocaleString()}
          detail={`${metrics.peopleAtRisk.toLocaleString()} residents at risk`}
          Icon={Users}
          tone="text-emerald-700"
        />
        <ImpactMetric
          label="Unmet Demand"
          value={`${metrics.baselineUnmetDemand} -> ${metrics.unmetDemand}`}
          detail="Demand units left after assignment"
          Icon={Activity}
          tone={metrics.unmetDemand ? "text-amber-700" : "text-emerald-700"}
        />
        <ImpactMetric
          label="Facilities Overloaded"
          value={String(metrics.facilitiesOverloaded)}
          detail="Hospitals or shelters above capacity"
          Icon={Building2}
          tone={metrics.facilitiesOverloaded ? "text-red-700" : "text-emerald-700"}
        />
        <ImpactMetric
          label="Routes Replanned"
          value={String(metrics.routesReplanned)}
          detail="Changed after disruption"
          Icon={Route}
          tone={metrics.routesReplanned ? "text-blue-700" : "text-zinc-500"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-xl border border-command-line bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wide text-zinc-500">
                ETA Comparison
              </p>
              <h3 className="text-lg font-black text-zinc-950">Baseline versus optimized</h3>
            </div>
            <span className="text-xs font-black text-blue-700">
              {metrics.assignmentsCreated} assignments
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: "#eef2ff" }} />
                <Bar dataKey="eta" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-command-line bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wide text-zinc-500">
                Judge Readout
              </p>
              <h3 className="text-lg font-black text-zinc-950">Why this matters</h3>
            </div>
            <ShieldCheck className="h-6 w-6 text-emerald-700" />
          </div>
          <div className="mt-4 space-y-3">
            <ReadoutLine label="Candidates evaluated" value={metrics.candidateAssignments} />
            <ReadoutLine label="Hospital utilization" value={`${metrics.hospitalUtilization}%`} />
            <ReadoutLine label="Shelter utilization" value={`${metrics.shelterUtilization}%`} />
            <ReadoutLine label="Unmet demand reduced" value={`${metrics.baselineUnmetDemand} -> ${metrics.unmetDemand}`} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ComparisonBlock({
  label,
  value,
  detail,
  muted = false,
}: {
  label: string;
  value: string;
  detail: string;
  muted?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-4 ${muted ? "border-zinc-200 bg-zinc-50" : "border-blue-100 bg-blue-50"}`}>
      <div className="text-[11px] font-black uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`mt-3 text-4xl font-black tabular-nums ${muted ? "text-zinc-950" : "text-blue-700"}`}>
        {value}
      </div>
      <p className="mt-2 text-sm font-semibold leading-5 text-zinc-600">{detail}</p>
    </div>
  );
}

function ImpactMetric({
  label,
  value,
  detail,
  Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  Icon: typeof Activity;
  tone: string;
}) {
  return (
    <div className="min-h-[138px] rounded-xl border border-command-line bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-black uppercase tracking-wide text-zinc-500">{label}</span>
        <Icon className={`h-5 w-5 shrink-0 ${tone}`} />
      </div>
      <div className="mt-4 whitespace-nowrap text-3xl font-black tabular-nums text-zinc-950">
        {value}
      </div>
      <p className="mt-2 text-sm font-semibold leading-5 text-zinc-500">{detail}</p>
    </div>
  );
}

function MiniReadout({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border border-white/10 bg-white/10 px-3 py-2">
      <div className="text-lg font-black tabular-nums">{value}</div>
      <div className="text-[10px] font-black uppercase tracking-wide text-zinc-400">{label}</div>
    </div>
  );
}

function ReadoutLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-[#f7f8f4] px-3 py-2">
      <span className="text-sm font-semibold text-zinc-600">{label}</span>
      <span className="text-sm font-black text-zinc-950">{value}</span>
    </div>
  );
}

function formatRuntime(ms: number) {
  if (ms < 1000) return "<1s";
  return `${(ms / 1000).toFixed(1)}s`;
}
