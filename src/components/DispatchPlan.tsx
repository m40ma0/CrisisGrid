import { ArrowRight, Route } from "lucide-react";
import { useCrisisStore } from "../store/useCrisisStore";
import type { RouteMode } from "../types/crisis";

const routeModeLabel: Record<RouteMode, string> = {
  osrm: "OSRM route",
  haversine: "Estimated route",
};

export function DispatchPlan() {
  const { dispatchPlan } = useCrisisStore();

  return (
    <section className="rounded-xl border border-command-line bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wide text-zinc-500">
            Dispatch Plan
          </p>
          <h2 className="mt-1 text-xl font-black text-zinc-950">
            Optimized resource movements
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {dispatchPlan ? `${dispatchPlan.assignments.length} assignments` : "No plan generated"}
          </p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-700">
          <Route className="h-5 w-5" />
        </span>
      </div>

      {!dispatchPlan ? (
        <div className="rounded border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-500">
          Build a response plan first.
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {dispatchPlan.assignments.map((assignment) => (
            <article key={assignment.id} className="rounded-lg border border-zinc-200 bg-[#f7f8f4] p-4">
              <div className="flex items-center gap-2 text-sm font-black text-zinc-950">
                <span className="min-w-0 truncate">{assignment.resourceName}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-zinc-400" />
                <span className="min-w-0 truncate">{assignment.incidentTitle}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold">
                <span className="rounded bg-blue-100 px-2 py-1 text-blue-700">
                  {assignment.etaMinutes.toFixed(1)} min
                </span>
                <span className="rounded bg-zinc-200 px-2 py-1 text-zinc-700">
                  {assignment.distanceKm.toFixed(1)} km
                </span>
                <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-700">
                  {assignment.coverage} covered
                </span>
                <span className="rounded bg-purple-100 px-2 py-1 text-purple-700">
                  {routeModeLabel[assignment.route.mode]}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-600">{assignment.reason}</p>
            </article>
          ))}
          {dispatchPlan.unassignedDemand.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800 xl:col-span-2">
              {dispatchPlan.unassignedDemand.length} unmet demand units remain after available resources are exhausted.
            </div>
          )}
        </div>
      )}
    </section>
  );
}
