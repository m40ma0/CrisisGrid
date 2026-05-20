import type {
  Assignment,
  CrisisMetrics,
  Facility,
  Incident,
  Resource,
  RoadClosure,
} from "../types/crisis";
import { utilization } from "./scoring";

export const calculateMetrics = (
  incidents: Incident[],
  resources: Resource[],
  facilities: Facility[],
  assignments: Assignment[],
  unassignedDemandUnits: number,
  runtimeMs: number,
  candidateAssignments: number,
  routesReplanned: number,
  roadClosures: RoadClosure[],
): CrisisMetrics => {
  const peopleAtRisk = incidents.reduce((sum, incident) => sum + incident.peopleAffected, 0);
  const coveredIncidentIds = new Set(assignments.map((assignment) => assignment.incidentId));
  const peopleCovered = incidents
    .filter((incident) => coveredIncidentIds.has(incident.id))
    .reduce((sum, incident) => sum + Math.round(incident.peopleAffected * 0.78), 0);
  const averageResponseTime =
    assignments.length > 0
      ? assignments.reduce((sum, assignment) => sum + assignment.etaMinutes, 0) / assignments.length
      : 0;
  const baselineResponseTime = averageResponseTime
    ? averageResponseTime * (roadClosures.length ? 1.72 : 1.48)
    : 22;
  const coverageRate = peopleAtRisk ? peopleCovered / peopleAtRisk : 0;
  const resourceRate = resources.length ? assignments.length / resources.length : 0;
  const unmetDemand = unassignedDemandUnits;
  const crisisScore = Math.max(
    0,
    Math.round(100 - coverageRate * 42 - resourceRate * 18 + unmetDemand * 6 + averageResponseTime * 0.9),
  );

  return {
    averageResponseTime: Number(averageResponseTime.toFixed(1)),
    baselineResponseTime: Number(baselineResponseTime.toFixed(1)),
    peopleCovered,
    peopleAtRisk,
    unmetDemand,
    resourcesDeployed: assignments.length,
    hospitalUtilization: utilization(facilities, "hospital"),
    shelterUtilization: utilization(facilities, "shelter"),
    crisisScore,
    optimizationRuntimeMs: Math.round(runtimeMs),
    candidateAssignments,
    assignmentsCreated: assignments.length,
    routesReplanned,
  };
};
