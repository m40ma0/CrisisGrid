import type { Facility, GeoPoint, Incident, Resource, RoadClosure } from "../types/crisis";

export const createRoadClosure = (label: string, from: GeoPoint, to: GeoPoint): RoadClosure => ({
  id: `closure-${Date.now()}`,
  label,
  from,
  to,
  penaltyMultiplier: 2.35,
});

export const markNearestFacilityFull = (
  facilities: Facility[],
  type: Facility["type"],
): { facilities: Facility[]; label: string } => {
  const target = facilities
    .filter((facility) => facility.type === type && !facility.offline)
    .sort((a, b) => b.capacity - a.capacity)[0];

  if (!target) {
    return { facilities, label: `No active ${type} facility remains` };
  }

  return {
    facilities: facilities.map((facility) =>
      facility.id === target.id
        ? { ...facility, currentLoad: facility.capacity, offline: true }
        : facility,
    ),
    label: `${target.name} marked full`,
  };
};

export const triggerDemandSpike = (incidents: Incident[]) =>
  incidents.map((incident, index) =>
    index === 0
      ? {
          ...incident,
          severity: Math.min(100, incident.severity + 12),
          peopleAffected: Math.round(incident.peopleAffected * 1.22),
          requiredResources: {
            ...incident.requiredResources,
            medical: (incident.requiredResources.medical ?? 0) + 1,
          },
        }
      : incident,
  );

export const markAssignedResourcesUnavailable = (resources: Resource[], count = 1) => {
  let remaining = count;
  return resources.map((resource) => {
    if (remaining > 0 && resource.available) {
      remaining -= 1;
      return { ...resource, available: false };
    }
    return resource;
  });
};
