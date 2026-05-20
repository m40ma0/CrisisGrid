import { Activity, Clock, Gauge, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useCrisisStore } from "../store/useCrisisStore";

const metricCard = (
  label: string,
  value: string,
  detail: string,
  Icon: typeof Activity,
  tone: string,
) => (
  <div className="rounded-lg border border-command-line bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between">
      <span className="text-xs font-bold uppercase text-zinc-500">{label}</span>
      <Icon className={`h-5 w-5 ${tone}`} />
    </div>
    <div className="text-2xl font-black text-zinc-950">{value}</div>
    <p className="mt-1 text-xs text-zinc-500">{detail}</p>
  </div>
);

export function ImpactDashboard() {
  const { dispatchPlan } = useCrisisStore();

  if (!dispatchPlan) {
    return (
      <section className="rounded-lg border border-command-line bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-950">Impact</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {metricCard("ETA", "--", "No plan yet", Clock, "text-zinc-400")}
          {metricCard("Covered", "--", "No plan yet", Users, "text-zinc-400")}
        </div>
      </section>
    );
  }

  const { metrics } = dispatchPlan;
  const chartData = [
    { name: "Before", eta: metrics.baselineResponseTime },
    { name: "After", eta: metrics.averageResponseTime },
  ];

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {metricCard(
          "Avg response",
          `${metrics.averageResponseTime}m`,
          `${Math.max(0, metrics.baselineResponseTime - metrics.averageResponseTime).toFixed(1)}m faster than baseline`,
          Clock,
          "text-blue-700",
        )}
        {metricCard(
          "People covered",
          `${metrics.peopleCovered}`,
          `${metrics.peopleAtRisk} at risk`,
          Users,
          "text-emerald-700",
        )}
        {metricCard(
          "Unmet demand",
          `${metrics.unmetDemand}`,
          "Resource units still needed",
          Activity,
          metrics.unmetDemand ? "text-amber-700" : "text-emerald-700",
        )}
        {metricCard(
          "Crisis score",
          `${metrics.crisisScore}`,
          "Lower is better",
          Gauge,
          metrics.crisisScore > 70 ? "text-red-700" : "text-emerald-700",
        )}
      </div>

      <div className="rounded-lg border border-command-line bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-950">Before / After ETA</h2>
          <span className="text-xs font-semibold text-emerald-700">
            {metrics.resourcesDeployed} deployed
          </span>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="eta" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
