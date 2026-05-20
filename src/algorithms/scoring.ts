import type {
  Facility,
  GeoPoint,
  Incident,
  Resource,
  RoadClosure,
  Urgency,
  WeatherSnapshot,
} from "../types/crisis";

const urgencyWeight: Record<Urgency, number> = {
  critical: 1.45,
  high: 1.2,
  medium: 1,
  low: 0.75,
};

export const haversineDistanceKm = (a: GeoPoint, b: GeoPoint) => {
  const radiusKm = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * radiusKm * Math.asin(Math.sqrt(h));
};

export const etaMinutes = (distanceKm: number, averageSpeedKmh: number) =>
  (distanceKm / averageSpeedKmh) * 60;

export const calculateIncidentPriority = (incident: Incident, weather: WeatherSnapshot) => {
  const peopleScore = Math.min(100, incident.peopleAffected / 10);
  const weatherBoost =
    incident.type === "flood"
      ? weather.modifiers.floodSeverity * 100
      : incident.type === "haze" || incident.type === "medical"
        ? weather.modifiers.medicalDemand * 100
        : weather.riskScore * 0.12;

  return Math.round(
    (incident.severity * 0.48 + peopleScore * 0.34 + weatherBoost * 0.18) *
      urgencyWeight[incident.urgency],
  );
};

export const applyWeatherToIncidents = (incidents: Incident[], weather: WeatherSnapshot) =>
  incidents.map((incident) => {
    const floodBoost = incident.type === "flood" ? weather.modifiers.floodSeverity * 100 : 0;
    const medicalBoost =
      incident.type === "medical" || incident.type === "haze"
        ? weather.modifiers.medicalDemand * 100
        : 0;

    return {
      ...incident,
      severity: Math.min(100, Math.round(incident.baseSeverity + floodBoost + medicalBoost)),
      peopleAffected: Math.round(
        incident.peopleAffected *
          (incident.type === "medical" || incident.type === "haze"
            ? 1 + weather.modifiers.medicalDemand
            : 1),
      ),
    };
  });

export const lineDistanceToPointKm = (point: GeoPoint, a: GeoPoint, b: GeoPoint) => {
  const ab = haversineDistanceKm(a, b);
  const ap = haversineDistanceKm(a, point);
  const bp = haversineDistanceKm(b, point);
  if (ab === 0) return ap;

  const semiperimeter = (ab + ap + bp) / 2;
  const area = Math.sqrt(
    Math.max(0, semiperimeter * (semiperimeter - ab) * (semiperimeter - ap) * (semiperimeter - bp)),
  );

  return (2 * area) / ab;
};

export const roadPenaltyMultiplier = (
  origin: GeoPoint,
  destination: GeoPoint,
  roadClosures: RoadClosure[],
) => {
  if (!roadClosures.length) return 1;

  return roadClosures.reduce((multiplier, closure) => {
    const originNear = lineDistanceToPointKm(closure.from, origin, destination);
    const destinationNear = lineDistanceToPointKm(closure.to, origin, destination);
    const closureCrosses = Math.min(originNear, destinationNear) < 1.4;
    return closureCrosses ? Math.max(multiplier, closure.penaltyMultiplier) : multiplier;
  }, 1);
};

export const candidateCost = (
  resource: Resource,
  incident: Incident,
  weather: WeatherSnapshot,
  averageSpeedKmh: number,
  roadClosures: RoadClosure[],
) => {
  const distanceKm = haversineDistanceKm(resource.location, incident.location);
  const penalty = roadPenaltyMultiplier(resource.location, incident.location, roadClosures);
  const eta = etaMinutes(distanceKm * penalty, averageSpeedKmh);
  const priority = calculateIncidentPriority(incident, weather);
  const fitBonus = resource.type in incident.requiredResources ? 0.72 : 1.65;
  const scarcityPenalty = resource.available ? 1 : 999;

  return {
    distanceKm: distanceKm * penalty,
    etaMinutes: eta,
    priority,
    cost: (eta * fitBonus * scarcityPenalty) / Math.max(1, priority / 35),
  };
};

export const utilization = (facilities: Facility[], type: Facility["type"]) => {
  const relevant = facilities.filter((facility) => facility.type === type);
  const capacity = relevant.reduce((sum, facility) => sum + facility.capacity, 0);
  const load = relevant.reduce((sum, facility) => sum + facility.currentLoad, 0);

  return capacity ? Math.round((load / capacity) * 100) : 0;
};
