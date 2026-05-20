import type { Graph } from "./graph";

export type PathResult = {
  distance: number;
  path: string[];
};

export const dijkstra = (graph: Graph, startId: string, endId: string): PathResult | null => {
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const unvisited = new Set(graph.nodes.map((node) => node.id));

  graph.nodes.forEach((node) => {
    distances.set(node.id, node.id === startId ? 0 : Number.POSITIVE_INFINITY);
    previous.set(node.id, null);
  });

  while (unvisited.size) {
    const current = [...unvisited].sort(
      (a, b) => (distances.get(a) ?? Number.POSITIVE_INFINITY) - (distances.get(b) ?? Number.POSITIVE_INFINITY),
    )[0];

    if (!current || current === endId) break;
    unvisited.delete(current);

    graph.edges
      .filter((edge) => edge.from === current && unvisited.has(edge.to))
      .forEach((edge) => {
        const nextDistance = (distances.get(current) ?? Number.POSITIVE_INFINITY) + edge.weight;
        if (nextDistance < (distances.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
          distances.set(edge.to, nextDistance);
          previous.set(edge.to, current);
        }
      });
  }

  const distance = distances.get(endId);
  if (distance === undefined || !Number.isFinite(distance)) return null;

  const path: string[] = [];
  let cursor: string | null = endId;
  while (cursor) {
    path.unshift(cursor);
    cursor = previous.get(cursor) ?? null;
  }

  return { distance, path };
};
