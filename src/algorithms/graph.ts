import type { City, GeoPoint, Incident, Resource, RoadClosure } from "../types/crisis";
import { haversineDistanceKm } from "./scoring";

export type GraphNode = {
  id: string;
  point: GeoPoint;
};

export type GraphEdge = {
  from: string;
  to: string;
  weight: number;
};

export type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

const offsetPoint = (center: GeoPoint, northKm: number, eastKm: number): GeoPoint => {
  const lat = center.lat + northKm / 111;
  const lng = center.lng + eastKm / (111 * Math.cos((center.lat * Math.PI) / 180));
  return { lat, lng };
};

export const generateLocalGraph = (
  city: City,
  incidents: Incident[],
  resources: Resource[],
  roadClosures: RoadClosure[],
): Graph => {
  const gridRadius = city.bboxKm / 2;
  const gridSteps = [-0.75, -0.25, 0.25, 0.75];
  const nodes: GraphNode[] = [];

  gridSteps.forEach((north, rowIndex) => {
    gridSteps.forEach((east, colIndex) => {
      nodes.push({
        id: `grid-${rowIndex}-${colIndex}`,
        point: offsetPoint(city.center, north * gridRadius, east * gridRadius),
      });
    });
  });

  incidents.forEach((incident) => nodes.push({ id: `incident-${incident.id}`, point: incident.location }));
  resources.forEach((resource) => nodes.push({ id: `resource-${resource.id}`, point: resource.location }));

  const edges: GraphEdge[] = [];
  for (const node of nodes) {
    const nearest = [...nodes]
      .filter((candidate) => candidate.id !== node.id)
      .map((candidate) => ({
        ...candidate,
        distance: haversineDistanceKm(node.point, candidate.point),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 4);

    nearest.forEach((candidate) => {
      const crossesClosure = roadClosures.some((closure) => {
        const closeToStart = haversineDistanceKm(closure.from, node.point) < 1.5;
        const closeToEnd = haversineDistanceKm(closure.to, candidate.point) < 1.5;
        return closeToStart || closeToEnd;
      });

      edges.push({
        from: node.id,
        to: candidate.id,
        weight: candidate.distance * (crossesClosure ? 2.4 : 1),
      });
    });
  }

  return { nodes, edges };
};
