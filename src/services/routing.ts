import type { GeoPoint, RouteEstimate } from "../types/crisis";
import { haversineDistanceKm } from "../algorithms/scoring";

const routeCache = new Map<string, Promise<RouteEstimate | null>>();

const routeCacheKey = (origin: GeoPoint, destination: GeoPoint) =>
  `${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}:${destination.lat.toFixed(5)},${destination.lng.toFixed(5)}`;

const decodePolyline = (encoded: string): GeoPoint[] => {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const path: GeoPoint[] = [];

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    path.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return path;
};

export const createHaversineRoute = (
  origin: GeoPoint,
  destination: GeoPoint,
  averageSpeedKmh: number,
  warning = "Straight-line fallback route",
): RouteEstimate => {
  const distanceKm = haversineDistanceKm(origin, destination);
  return {
    mode: "haversine",
    distanceKm,
    etaMinutes: (distanceKm / averageSpeedKmh) * 60,
    path: [origin, destination],
    warning,
  };
};

export const fetchOsrmRoute = async (
  origin: GeoPoint,
  destination: GeoPoint,
): Promise<RouteEstimate | null> => {
  const cacheKey = routeCacheKey(origin, destination);
  const cached = routeCache.get(cacheKey);
  if (cached) return cached;

  const request: Promise<RouteEstimate | null> = (async () => {
    try {
      const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
      const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=polyline`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("OSRM request failed");

      const data = (await response.json()) as {
        code?: string;
        routes?: Array<{ distance?: number; duration?: number; geometry?: string }>;
      };

      const route = data.routes?.[0];
      if (data.code !== "Ok" || !route?.geometry) return null;

      return {
        mode: "osrm",
        distanceKm: (route.distance ?? 0) / 1000,
        etaMinutes: (route.duration ?? 0) / 60,
        path: decodePolyline(route.geometry),
      };
    } catch {
      return null;
    }
  })();

  routeCache.set(cacheKey, request);
  return request;
};

export const resolveVisibleRoute = async (
  origin: GeoPoint,
  destination: GeoPoint,
  averageSpeedKmh: number,
): Promise<RouteEstimate> => {
  const osrmRoute = await fetchOsrmRoute(origin, destination);
  if (osrmRoute) return osrmRoute;

  return createHaversineRoute(origin, destination, averageSpeedKmh);
};
