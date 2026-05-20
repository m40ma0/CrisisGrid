import "maplibre-gl/dist/maplibre-gl.css";

import { Loader2, MapPinned } from "lucide-react";
import maplibregl, { type Map as MapLibreMap, type Marker as MapLibreMarker } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import { resolveVisibleRoute } from "../services/routing";
import { useCrisisStore } from "../store/useCrisisStore";
import type { Facility, GeoPoint, Incident, Resource } from "../types/crisis";

const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

const incidentColor: Record<Incident["urgency"], string> = {
  critical: "#dc2626",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#65a30d",
};

const facilityColor: Record<Facility["type"], string> = {
  hospital: "#16a34a",
  shelter: "#7c3aed",
  depot: "#52525b",
};

const resourceColor: Record<Resource["type"], string> = {
  ambulance: "#2563eb",
  medical: "#0891b2",
  supply: "#0f766e",
  volunteer: "#4f46e5",
  food: "#ca8a04",
  power: "#9333ea",
};

const project = (point: GeoPoint, center: GeoPoint) => {
  const latSpan = 0.24;
  const lngSpan = 0.28;
  return {
    left: `${Math.max(4, Math.min(96, 50 + ((point.lng - center.lng) / lngSpan) * 100))}%`,
    top: `${Math.max(4, Math.min(96, 50 - ((point.lat - center.lat) / latSpan) * 100))}%`,
  };
};

const lngLat = (point: GeoPoint): [number, number] => [point.lng, point.lat];

const safeId = (value: string) => value.replace(/[^a-zA-Z0-9-_]/g, "-");

const routeColor = (mode: string) => (mode === "osrm" ? "#7c3aed" : "#f97316");

const createMarkerElement = (color: string, label: string, pulse = false) => {
  const element = document.createElement("div");
  element.className = pulse ? "marker-pulse" : "";
  element.style.width = "32px";
  element.style.height = "32px";
  element.style.borderRadius = "9999px";
  element.style.background = color;
  element.style.border = "3px solid white";
  element.style.boxShadow = "0 10px 20px rgba(15, 23, 42, 0.25)";
  element.style.color = "white";
  element.style.display = "grid";
  element.style.placeItems = "center";
  element.style.fontSize = "11px";
  element.style.fontWeight = "900";
  element.textContent = label;
  return element;
};

function FallbackMarker({
  point,
  center,
  color,
  label,
  title,
  pulse,
}: {
  point: GeoPoint;
  center: GeoPoint;
  color: string;
  label: string;
  title: string;
  pulse?: boolean;
}) {
  return (
    <div
      className={`absolute z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-[10px] font-black text-white shadow-md ${
        pulse ? "marker-pulse" : ""
      }`}
      style={{ ...project(point, center), background: color }}
      title={title}
    >
      {label}
    </div>
  );
}

function FallbackRoute({
  from,
  to,
  center,
  color,
}: {
  from: GeoPoint;
  to: GeoPoint;
  center: GeoPoint;
  color: string;
}) {
  const start = project(from, center);
  const end = project(to, center);
  const x1 = Number.parseFloat(start.left);
  const y1 = Number.parseFloat(start.top);
  const x2 = Number.parseFloat(end.left);
  const y2 = Number.parseFloat(end.top);

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full">
      <line
        x1={`${x1}%`}
        y1={`${y1}%`}
        x2={`${x2}%`}
        y2={`${y2}%`}
        stroke={color}
        strokeDasharray="8 8"
        strokeWidth="3"
        opacity="0.75"
      />
    </svg>
  );
}

export function CrisisMap() {
  const {
    selectedCity,
    facilities,
    resources,
    incidents,
    dispatchPlan,
    roadClosures,
    updateAssignmentRoute,
  } = useCrisisStore();
  const mapNode = useRef<HTMLDivElement | null>(null);
  const map = useRef<MapLibreMap | null>(null);
  const markers = useRef<MapLibreMarker[]>([]);
  const routeIds = useRef<string[]>([]);
  const resolvedPlanId = useRef<string | null>(null);
  const [mapState, setMapState] = useState<"loading" | "live" | "fallback">("loading");

  const selectedResources = useMemo(
    () =>
      new Set(
        dispatchPlan?.assignments.map((assignment) => assignment.resourceId) ??
          ([] as string[]),
      ),
    [dispatchPlan],
  );

  useEffect(() => {
    if (!mapNode.current || map.current) return;

    const timeout = window.setTimeout(() => setMapState("fallback"), 7000);

    try {
      map.current = new maplibregl.Map({
        container: mapNode.current,
        style: OPENFREEMAP_STYLE,
        center: lngLat(selectedCity.center),
        zoom: selectedCity.zoom,
        attributionControl: false,
      });

      map.current.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
      map.current.addControl(
        new maplibregl.AttributionControl({ compact: true, customAttribution: "OpenFreeMap" }),
        "bottom-right",
      );

      map.current.once("load", () => {
        window.clearTimeout(timeout);
        setMapState("live");
      });

      map.current.once("error", () => {
        window.clearTimeout(timeout);
        setMapState("fallback");
      });
    } catch {
      window.clearTimeout(timeout);
      setMapState("fallback");
    }

    return () => {
      window.clearTimeout(timeout);
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, [selectedCity.center, selectedCity.zoom]);

  useEffect(() => {
    if (!map.current || mapState !== "live") return;
    map.current.flyTo({
      center: lngLat(selectedCity.center),
      zoom: selectedCity.zoom,
      duration: 650,
      essential: true,
    });
  }, [mapState, selectedCity.center, selectedCity.zoom]);

  useEffect(() => {
    if (!map.current || mapState !== "live") return;

    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    const addMarker = (point: GeoPoint, color: string, label: string, title: string, pulse = false) => {
      const marker = new maplibregl.Marker({ element: createMarkerElement(color, label, pulse) })
        .setLngLat(lngLat(point))
        .setPopup(new maplibregl.Popup({ offset: 18 }).setText(title))
        .addTo(map.current!);
      markers.current.push(marker);
    };

    incidents.forEach((incident) =>
      addMarker(incident.location, incidentColor[incident.urgency], "I", incident.title, incident.urgency === "critical"),
    );
    resources.forEach((resource) =>
      addMarker(
        resource.location,
        selectedResources.has(resource.id) ? "#1d4ed8" : resourceColor[resource.type],
        "R",
        resource.name,
      ),
    );
    facilities.forEach((facility) =>
      addMarker(
        facility.location,
        facility.offline ? "#dc2626" : facilityColor[facility.type],
        "F",
        facility.name,
      ),
    );

    return () => {
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
    };
  }, [facilities, incidents, mapState, resources, selectedResources]);

  useEffect(() => {
    if (!map.current || mapState !== "live") return;

    routeIds.current.forEach((id) => {
      if (map.current?.getLayer(`${id}-layer`)) map.current.removeLayer(`${id}-layer`);
      if (map.current?.getSource(id)) map.current.removeSource(id);
    });
    routeIds.current = [];

    dispatchPlan?.assignments.forEach((assignment) => {
      if (assignment.route.path.length < 2) return;

      const id = `route-${safeId(assignment.id)}`;
      routeIds.current.push(id);
      map.current!.addSource(id, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: assignment.route.path.map(lngLat),
          },
        },
      });
      map.current!.addLayer({
        id: `${id}-layer`,
        type: "line",
        source: id,
        paint: {
          "line-color": routeColor(assignment.route.mode),
          "line-width": 4,
          "line-opacity": 0.82,
        },
      });
    });

    roadClosures.forEach((closure) => {
      const id = `closure-${safeId(closure.id)}`;
      routeIds.current.push(id);
      map.current!.addSource(id, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [lngLat(closure.from), lngLat(closure.to)],
          },
        },
      });
      map.current!.addLayer({
        id: `${id}-layer`,
        type: "line",
        source: id,
        paint: {
          "line-color": "#dc2626",
          "line-width": 5,
          "line-opacity": 0.75,
          "line-dasharray": [1, 1.4],
        },
      });
    });

    return () => {
      routeIds.current.forEach((id) => {
        if (map.current?.getLayer(`${id}-layer`)) map.current.removeLayer(`${id}-layer`);
        if (map.current?.getSource(id)) map.current.removeSource(id);
      });
      routeIds.current = [];
    };
  }, [dispatchPlan, mapState, roadClosures]);

  useEffect(() => {
    if (!dispatchPlan || resolvedPlanId.current === dispatchPlan.id) return;
    resolvedPlanId.current = dispatchPlan.id;

    const resourcesById = new Map(resources.map((resource) => [resource.id, resource]));
    const incidentsById = new Map(incidents.map((incident) => [incident.id, incident]));

    dispatchPlan.assignments.slice(0, 8).forEach((assignment) => {
      const resource = resourcesById.get(assignment.resourceId);
      const incident = incidentsById.get(assignment.incidentId);
      if (!resource || !incident) return;

      void resolveVisibleRoute(resource.location, incident.location, selectedCity.averageSpeedKmh).then(
        (route) => {
          updateAssignmentRoute(assignment.id, route);
        },
      );
    });
  }, [dispatchPlan, incidents, resources, selectedCity.averageSpeedKmh, updateAssignmentRoute]);

  const routePairs =
    dispatchPlan?.assignments
      .map((assignment) => {
        const resource = resources.find((candidate) => candidate.id === assignment.resourceId);
        const incident = incidents.find((candidate) => candidate.id === assignment.incidentId);
        return resource && incident
          ? { from: resource.location, to: incident.location, mode: assignment.route.mode }
          : null;
      })
      .filter(Boolean) ?? [];

  return (
    <section className="relative min-h-[560px] overflow-hidden rounded-lg border border-command-line bg-zinc-100 shadow-command">
      <div className="absolute left-4 top-4 z-20 rounded border border-white/80 bg-white/95 px-3 py-2 shadow-sm">
        <div className="flex items-center gap-2">
          <MapPinned className="h-4 w-4 text-red-600" />
          <span className="text-sm font-black text-zinc-950">{selectedCity.name}</span>
        </div>
        <p className="text-xs text-zinc-500">
          {mapState === "live" ? "MapLibre + OpenFreeMap" : "Fallback map"} · {incidents.length} incidents
        </p>
      </div>

      {mapState !== "fallback" && <div ref={mapNode} className="h-full min-h-[560px] w-full" />}

      {mapState === "loading" && (
        <div className="absolute inset-0 flex h-full min-h-[560px] items-center justify-center bg-zinc-100">
          <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
        </div>
      )}

      {mapState === "fallback" && (
        <div className="relative h-full min-h-[560px] overflow-hidden bg-[linear-gradient(90deg,#d7dde6_1px,transparent_1px),linear-gradient(#d7dde6_1px,transparent_1px)] bg-[size:36px_36px]">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-zinc-200" />
          {routePairs.map((route, index) =>
            route ? (
              <FallbackRoute
                key={`${route.from.lat}-${route.to.lat}-${index}`}
                from={route.from}
                to={route.to}
                center={selectedCity.center}
                color={routeColor(route.mode)}
              />
            ) : null,
          )}
          {roadClosures.map((closure) => (
            <FallbackRoute
              key={closure.id}
              from={closure.from}
              to={closure.to}
              center={selectedCity.center}
              color="#dc2626"
            />
          ))}
          {incidents.map((incident) => (
            <FallbackMarker
              key={incident.id}
              point={incident.location}
              center={selectedCity.center}
              color={incidentColor[incident.urgency]}
              label="I"
              title={incident.title}
              pulse={incident.urgency === "critical"}
            />
          ))}
          {resources.map((resource) => (
            <FallbackMarker
              key={resource.id}
              point={resource.location}
              center={selectedCity.center}
              color={selectedResources.has(resource.id) ? "#1d4ed8" : resourceColor[resource.type]}
              label="R"
              title={resource.name}
            />
          ))}
          {facilities.map((facility) => (
            <FallbackMarker
              key={facility.id}
              point={facility.location}
              center={selectedCity.center}
              color={facility.offline ? "#dc2626" : facilityColor[facility.type]}
              label="F"
              title={facility.name}
            />
          ))}
        </div>
      )}

      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap gap-2 rounded border border-white/80 bg-white/95 px-3 py-2 text-[11px] font-bold shadow-sm">
        <span className="text-red-700">Incidents</span>
        <span className="text-blue-700">Resources</span>
        <span className="text-emerald-700">Hospitals</span>
        <span className="text-purple-700">Shelters</span>
        <span className="text-amber-700">Estimated routes</span>
      </div>
    </section>
  );
}
