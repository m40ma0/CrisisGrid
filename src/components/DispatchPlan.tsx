import { ArrowRight, Route } from "lucide-react";
import { useCrisisStore } from "../store/useCrisisStore";

const routeModeLabel = {
  "google-directions": "Google route",
  osrm: "OSRM route",
  haversine: "Estimated route",
};

export function DispatchPlan() {
  const { dispatchPlan } = useCrisisStore();

  return (
    <section className="rounded-lg border border-command-line bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-zinc-950">Dispatch Plan</h2>
          <p className="text-xs text-zinc-500">
            {dispatchPlan ? `${dispatchPlan.assignments.length} assignments` : "No plan generated"}
          </p>
        </div>
        <Route className="h-5 w-5 text-blue-700" />
      </div>

      {!dispatchPlan ? (
        <div className="rounded border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-500">
          The optimizer output will appear here.
        </div>
      ) : (
        <div className="max-h-[360px] space-y-2 overflow-auto pr-1 scrollbar-thin">
          {dispatchPlan.assignments.map((assignment) => (
            <article key={assignment.id} className="rounded border border-zinc-200 bg-zinc-50 p-3">
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-950">
                <span className="min-w-0 truncate">{assignment.resourceName}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-zinc-400" />
                <span className="min-w-0 truncate">{assignment.incidentTitle}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold">
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
              <p className="mt-2 text-xs leading-5 text-zinc-600">{assignment.reason}</p>
            </article>
          ))}
          {dispatchPlan.unassignedDemand.length > 0 && (
            <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              {dispatchPlan.unassignedDemand.length} unmet demand units remain after available resources are exhausted.
            </div>
          )}
        </div>
      )}
    </section>
  );
}
