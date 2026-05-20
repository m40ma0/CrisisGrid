import type { GeoPoint, RouteEstimate } from "../types/crisis";
import { apiKeys, hasApiKey } from "./env";

const GOOGLE_MAPS_SCRIPT_ID = "crisisgrid-google-maps";

let mapsPromise: Promise<typeof google.maps> | null = null;

type MapsLibrary = google.maps.MapsLibrary;
type MarkerLibrary = google.maps.MarkerLibrary;
type RoutesLibrary = google.maps.RoutesLibrary;
type GeocodingLibrary = google.maps.GeocodingLibrary;

const appendGoogleScript = () =>
  new Promise<void>((resolve, reject) => {
    if (!hasApiKey.googleMaps) {
      reject(new Error("Missing VITE_GOOGLE_MAPS_API_KEY"));
      return;
    }

    const existingGoogle = (globalThis as typeof globalThis & { google?: typeof google }).google;
    if ((existingGoogle?.maps as { importLibrary?: unknown } | undefined)?.importLibrary) {
      resolve();
      return;
    }

    const existing = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Maps failed to load")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKeys.googleMaps,
    )}&v=weekly&libraries=marker,routes,geocoding`;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Google Maps failed to load")), {
      once: true,
    });
    document.head.appendChild(script);
  });

export const loadGoogleMaps = async () => {
  if (!mapsPromise) {
    mapsPromise = appendGoogleScript().then(() => window.google.maps);
  }

  return mapsPromise;
};

export const loadMapsLibrary = async () => {
  await loadGoogleMaps();
  return google.maps.importLibrary("maps") as Promise<MapsLibrary>;
};

export const loadMarkerLibrary = async () => {
  await loadGoogleMaps();
  return google.maps.importLibrary("marker") as Promise<MarkerLibrary>;
};

export const loadRoutesLibrary = async () => {
  await loadGoogleMaps();
  return google.maps.importLibrary("routes") as Promise<RoutesLibrary>;
};

export const loadGeocodingLibrary = async () => {
  await loadGoogleMaps();
  return google.maps.importLibrary("geocoding") as Promise<GeocodingLibrary>;
};

export const geocodeAddress = async (address: string): Promise<GeoPoint | null> => {
  if (!address.trim() || !hasApiKey.googleMaps) return null;

  try {
    const { Geocoder } = await loadGeocodingLibrary();
    const geocoder = new Geocoder();
    const response = await geocoder.geocode({ address });
    const location = response.results[0]?.geometry.location;

    if (!location) return null;

    return {
      lat: location.lat(),
      lng: location.lng(),
    };
  } catch {
    return null;
  }
};

export const getGoogleDirectionsRoute = async (
  origin: GeoPoint,
  destination: GeoPoint,
): Promise<RouteEstimate | null> => {
  if (!hasApiKey.googleMaps) return null;

  try {
    const { DirectionsService, TravelMode } = await loadRoutesLibrary();
    const service = new DirectionsService();
    const response = await service.route({
      origin,
      destination,
      travelMode: TravelMode.DRIVING,
      provideRouteAlternatives: false,
    });

    const route = response.routes[0];
    const leg = route?.legs[0];
    if (!route || !leg) return null;

    return {
      mode: "google-directions",
      distanceKm: (leg.distance?.value ?? 0) / 1000,
      etaMinutes: (leg.duration?.value ?? 0) / 60,
      path: route.overview_path.map((point) => ({ lat: point.lat(), lng: point.lng() })),
    };
  } catch {
    return null;
  }
};
