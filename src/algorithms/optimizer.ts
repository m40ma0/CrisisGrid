import type {
  AlgorithmReceipt,
  Assignment,
  City,
  DispatchPlan,
  Facility,
  GeoPoint,
  Incident,
  Resource,
  ResourceType,
  RoadClosure,
  ScenarioId,
  WeatherSnapshot,
} from "../types/crisis";
import { createHaversineRoute } from "../services/routing";
import { dijkstra } from "./dijkstra";
import { generateLocalGraph } from "./graph";
import { calculateMetrics } from "./metrics";
import { candidateCost, calculateIncidentPriority, etaMinutes } from "./scoring";

const resourceLabels: Record<ResourceType, string> = {
  ambulance: "ambulance",
  medical: "medical team",
  supply: "supply unit",
  volunteer: "volunteer team",
  food: "food unit",
  power: "power crew",
};

const makeAssignmentId = (resourceId: string, incidentId: string) => `${resourceId}->${incidentId}`;

const requiredEntries = (incident: Incident) =>
  Object.entries(incident.requiredResources).filter(([, units]) => (units ?? 0) > 0) as Array<
    [ResourceType, number]
  >;

const improveAssignments = (
  assignments: Assignment[],
  availableResources: Resource[],
  incidents: Incident[],
  city: City,
  weather: WeatherSnapshot,
  roadClosures: RoadClosure[],
) => {
  let improved = [...assignments];

  for (const assignment of assignments) {
    const incident = incidents.find((candidate) => candidate.id === assignment.incidentId);
    if (!incident) continue;

    const alternative = availableResources
      .filter((resource) => resource.type === assignment.resourceType)
      .map((resource) => ({
        resource,
        estimate: candidateCost(resource, incident, weather, city.averageSpeedKmh, roadClosures),
      }))
      .sort((a, b) => a.estimate.cost - b.estimate.cost)[0];

    if (alternative && alternative.estimate.etaMinutes + 3 < assignment.etaMinutes) {
      improved = improved.map((candidate) =>
        candidate.id === assignment.id
          ? {
              ...candidate,
              id: makeAssignmentId(alternative.resource.id, incident.id),
              resourceId: alternative.resource.id,
              resourceName: alternative.resource.name,
              distanceKm: alternative.estimate.distanceKm,
              etaMinutes: alternative.estimate.etaMinutes,
              route: createHaversineRoute(
                alternative.resource.location,
                incident.location,
                city.averageSpeedKmh,
                "Optimizer local-improvement route estimate",
              ),
              reason: `${alternative.resource.name} replaced a slower unit after local improvement.`,
            }
          : candidate,
      );
    }
  }

  return improved;
};

export const optimizeDispatch = ({
  city,
  scenarioId,
  incidents,
  resources,
  facilities,
  weather,
  roadClosures,
  disruptionLog,
  routesReplanned,
}: {
  city: City;
  scenarioId: ScenarioId;
  incidents: Incident[];
  resources: Resource[];
  facilities: Facility[];
  weather: WeatherSnapshot;
  roadClosures: RoadClosure[];
  disruptionLog: string[];
  routesReplanned: number;
}): DispatchPlan => {
  const start = performance.now();
  const availableResources = resources.filter((resource) => resource.available);
  const localGraph = generateLocalGraph(city, incidents, resources, roadClosures);
  const graphNodesById = new Map(localGraph.nodes.map((node) => [node.id, node]));
  const sortedIncidents = [...incidents].sort(
    (a, b) => calculateIncidentPriority(b, weather) - calculateIncidentPriority(a, weather),
  );
  const assignedResourceIds = new Set<string>();
  const assignments: Assignment[] = [];
  const unassignedDemand: DispatchPlan["unassignedDemand"] = [];
  let candidateAssignments = 0;

  for (const incident of sortedIncidents) {
    const priorityScore = calculateIncidentPriority(incident, weather);

    for (const [type, unitsNeeded] of requiredEntries(incident)) {
      for (let unit = 0; unit < unitsNeeded; unit += 1) {
        const candidates = availableResources
          .filter((resource) => resource.type === type && !assignedResourceIds.has(resource.id))
          .map((resource) => ({
            resource,
            estimate: candidateCost(resource, incident, weather, city.averageSpeedKmh, roadClosures),
          }))
          .sort((a, b) => a.estimate.cost - b.estimate.cost);

        candidateAssignments += candidates.length;
        const selected = candidates[0];

        if (!selected) {
          unassignedDemand.push({
            incidentId: incident.id,
            incidentTitle: incident.title,
            resourceType: type,
            unitsMissing: 1,
          });
          continue;
        }

        assignedResourceIds.add(selected.resource.id);
        const graphPath = dijkstra(
          localGraph,
          `resource-${selected.resource.id}`,
          `incident-${incident.id}`,
        );
        const graphDistanceKm = graphPath?.distance ?? selected.estimate.distanceKm;
        const graphRoutePath =
          graphPath?.path
            .map((nodeId) => graphNodesById.get(nodeId)?.point)
            .filter(Boolean) as GeoPoint[] | undefined;

        assignments.push({
          id: makeAssignmentId(selected.resource.id, incident.id),
          resourceId: selected.resource.id,
          incidentId: incident.id,
          resourceType: type,
          resourceName: selected.resource.name,
          incidentTitle: incident.title,
          priorityScore,
          distanceKm: Number(graphDistanceKm.toFixed(2)),
          etaMinutes: Number(etaMinutes(graphDistanceKm, city.averageSpeedKmh).toFixed(1)),
          coverage: Math.min(incident.peopleAffected, selected.resource.capacity),
          route:
            graphRoutePath && graphRoutePath.length > 1
              ? {
                  mode: "haversine",
                  distanceKm: graphDistanceKm,
                  etaMinutes: etaMinutes(graphDistanceKm, city.averageSpeedKmh),
                  path: graphRoutePath,
                  warning: "Dijkstra local graph route estimate",
                }
              : createHaversineRoute(
                  selected.resource.location,
                  incident.location,
                  city.averageSpeedKmh,
                  "Fast-mode haversine candidate scoring",
                ),
          reason: `${selected.resource.name} is the closest available ${resourceLabels[type]} for a priority score of ${priorityScore}.`,
        });
      }
    }
  }

  const improvedAssignments = improveAssignments(
    assignments,
    availableResources.filter((resource) => !assignedResourceIds.has(resource.id)),
    incidents,
    city,
    weather,
    roadClosures,
  );

  const runtime = performance.now() - start;
  const metrics = calculateMetrics(
    incidents,
    resources,
    facilities,
    improvedAssignments,
    unassignedDemand.reduce((sum, demand) => sum + demand.unitsMissing, 0),
    runtime,
    candidateAssignments,
    routesReplanned,
    roadClosures,
  );

  const receipts: AlgorithmReceipt[] = [
    {
      id: "priority",
      label: "Priority scoring",
      value: `${sortedIncidents.length} incidents ranked`,
      detail: "Severity, affected people, urgency, and weather modifiers are combined deterministically.",
      tone: "neutral",
    },
    {
      id: "candidate-count",
      label: "Candidate search",
      value: `${candidateAssignments} candidates`,
      detail: "Haversine ETA is used for all candidate scoring before any route API is touched.",
      tone: "good",
    },
    {
      id: "graph-routing",
      label: "Graph routing",
      value: `${localGraph.nodes.length} nodes`,
      detail: "Dijkstra shortest paths estimate route impact before optional visual route APIs run.",
      tone: "neutral",
    },
    {
      id: "assignments",
      label: "Assignments created",
      value: `${improvedAssignments.length}`,
      detail: `${unassignedDemand.length} demand units remain unmatched after resource constraints.`,
      tone: unassignedDemand.length ? "warning" : "good",
    },
    {
      id: "replanning",
      label: "Replanning state",
      value: `${routesReplanned} route events`,
      detail:
        roadClosures.length > 0
          ? "Road closure penalties were included in assignment costs."
          : "No road closures are currently penalizing the graph.",
      tone: roadClosures.length ? "warning" : "neutral",
    },
    {
      id: "runtime",
      label: "Optimization runtime",
      value: `${Math.round(runtime)} ms`,
      detail: "Greedy priority assignment plus a local improvement pass keeps the optimizer explainable.",
      tone: runtime < 100 ? "good" : "neutral",
    },
  ];

  return {
    id: `plan-${Date.now()}`,
    createdAt: new Date().toISOString(),
    scenarioId,
    cityId: city.id,
    assignments: improvedAssignments,
    unassignedDemand,
    metrics,
    receipts,
    disruptionLog,
  };
};
