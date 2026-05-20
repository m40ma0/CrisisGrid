export type GeoPoint = {
  lat: number;
  lng: number;
};

export type CityId = "singapore" | "new-york" | "london";

export type Urgency = "critical" | "high" | "medium" | "low";

export type FacilityType = "hospital" | "shelter" | "depot";

export type ResourceType =
  | "ambulance"
  | "medical"
  | "supply"
  | "volunteer"
  | "food"
  | "power";

export type IncidentType = "flood" | "fire" | "blackout" | "medical" | "haze";

export type ScenarioId =
  | "central-flood"
  | "hospital-fire"
  | "residential-blackout"
  | "haze-medical"
  | "multi-incident";

export type ApiMode = "live" | "fallback" | "mixed";

export type City = {
  id: CityId;
  name: string;
  country: string;
  center: GeoPoint;
  zoom: number;
  averageSpeedKmh: number;
  bboxKm: number;
};

export type Facility = {
  id: string;
  type: FacilityType;
  name: string;
  location: GeoPoint;
  capacity: number;
  currentLoad: number;
  offline?: boolean;
};

export type Resource = {
  id: string;
  type: ResourceType;
  name: string;
  location: GeoPoint;
  capacity: number;
  available: boolean;
  assignedIncidentId?: string;
};

export type Incident = {
  id: string;
  type: IncidentType;
  title: string;
  location: GeoPoint;
  severity: number;
  baseSeverity: number;
  peopleAffected: number;
  urgency: Urgency;
  requiredResources: Partial<Record<ResourceType, number>>;
  coveredPeople?: number;
  status?: "open" | "covered" | "partial";
};

export type WeatherSnapshot = {
  cityName: string;
  source: "openweather" | "seed";
  condition: string;
  temperatureC: number;
  windKph: number;
  rainMm: number;
  airQualityIndex: number;
  humidity: number;
  riskScore: number;
  riskLabel: "Low" | "Moderate" | "High" | "Severe";
  modifiers: {
    floodSeverity: number;
    medicalDemand: number;
    roadBlockProbability: number;
  };
  updatedAt: string;
};

export type NaturalEvent = {
  id: string;
  title: string;
  category: string;
  source: "nasa-eonet" | "seed";
  location?: GeoPoint;
  distanceKm?: number;
};

export type RoadClosure = {
  id: string;
  label: string;
  from: GeoPoint;
  to: GeoPoint;
  penaltyMultiplier: number;
};

export type RouteMode = "google-directions" | "osrm" | "haversine";

export type RouteEstimate = {
  mode: RouteMode;
  distanceKm: number;
  etaMinutes: number;
  path: GeoPoint[];
  warning?: string;
};

export type Assignment = {
  id: string;
  resourceId: string;
  incidentId: string;
  resourceType: ResourceType;
  resourceName: string;
  incidentTitle: string;
  priorityScore: number;
  distanceKm: number;
  etaMinutes: number;
  coverage: number;
  route: RouteEstimate;
  reason: string;
};

export type DispatchPlan = {
  id: string;
  createdAt: string;
  scenarioId: ScenarioId;
  cityId: CityId;
  assignments: Assignment[];
  unassignedDemand: Array<{
    incidentId: string;
    incidentTitle: string;
    resourceType: ResourceType;
    unitsMissing: number;
  }>;
  metrics: CrisisMetrics;
  receipts: AlgorithmReceipt[];
  disruptionLog: string[];
};

export type CrisisMetrics = {
  averageResponseTime: number;
  baselineResponseTime: number;
  peopleCovered: number;
  peopleAtRisk: number;
  unmetDemand: number;
  resourcesDeployed: number;
  hospitalUtilization: number;
  shelterUtilization: number;
  crisisScore: number;
  optimizationRuntimeMs: number;
  candidateAssignments: number;
  assignmentsCreated: number;
  routesReplanned: number;
};

export type AlgorithmReceipt = {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: "neutral" | "good" | "warning" | "critical";
};

export type ScenarioDefinition = {
  id: ScenarioId;
  name: string;
  description: string;
  trackFit: string[];
  incidents: Record<CityId, Incident[]>;
};

export type BriefingPayload = {
  city: City;
  scenarioName: string;
  weather: WeatherSnapshot;
  incidents: Incident[];
  facilities: Facility[];
  resources: Resource[];
  plan: DispatchPlan | null;
  disruptions: string[];
};

export type ApiStatus = {
  googleMaps: ApiMode;
  geocoding: ApiMode;
  directions: ApiMode;
  openWeather: ApiMode;
  gemini: ApiMode;
  nasaEonet: ApiMode;
  osrm: ApiMode;
};
