import { create } from "zustand";
import type {
  ApiStatus,
  Assignment,
  City,
  DispatchPlan,
  Facility,
  Incident,
  NaturalEvent,
  Resource,
  RoadClosure,
  ScenarioId,
  WeatherSnapshot,
} from "../types/crisis";
import { cities, getCityById } from "../data/cities";
import { facilitiesByCity } from "../data/seedFacilities";
import { resourcesByCity } from "../data/seedResources";
import { getScenarioById, scenarios } from "../data/scenarios";
import { applyWeatherToIncidents } from "../algorithms/scoring";
import { optimizeDispatch } from "../algorithms/optimizer";
import { createRoadClosure, markNearestFacilityFull, triggerDemandSpike } from "../algorithms/replanner";
import { fetchNaturalEvents } from "../services/eonet";
import { hasApiKey } from "../services/env";
import { buildFallbackBriefing, generateBriefing } from "../services/gemini";
import { fetchWeather, getSeedWeather } from "../services/weather";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const initialCity = getCityById("demo-high-risk");
const initialScenario = getScenarioById("multi-incident");

const createDemoHighRiskIncidents = (): Incident[] => [
  {
    id: "demo-flood-1",
    type: "flood",
    title: "River surge evacuation zone",
    location: { lat: 14.61, lng: 120.982 },
    severity: 96,
    baseSeverity: 96,
    peopleAffected: 1250,
    urgency: "critical",
    requiredResources: { ambulance: 1, medical: 1, supply: 1, volunteer: 1, food: 1 },
    status: "open",
    coveredPeople: 0,
  },
  {
    id: "demo-medical-1",
    type: "medical",
    title: "Heat and haze triage surge",
    location: { lat: 14.579, lng: 121.015 },
    severity: 88,
    baseSeverity: 88,
    peopleAffected: 640,
    urgency: "critical",
    requiredResources: { ambulance: 1, medical: 2, supply: 1 },
    status: "open",
    coveredPeople: 0,
  },
  {
    id: "demo-blackout-1",
    type: "blackout",
    title: "Pump station power failure",
    location: { lat: 14.642, lng: 120.954 },
    severity: 81,
    baseSeverity: 81,
    peopleAffected: 820,
    urgency: "high",
    requiredResources: { power: 1, supply: 1, volunteer: 1 },
    status: "open",
    coveredPeople: 0,
  },
  {
    id: "demo-fire-1",
    type: "fire",
    title: "Substation fire exposure",
    location: { lat: 14.622, lng: 121.028 },
    severity: 74,
    baseSeverity: 74,
    peopleAffected: 260,
    urgency: "high",
    requiredResources: { ambulance: 1, medical: 1, power: 1 },
    status: "open",
    coveredPeople: 0,
  },
];

const buildApiStatus = (
  weather: WeatherSnapshot,
  naturalEvents: NaturalEvent[],
  geminiLive: boolean,
): ApiStatus => ({
  mapLibre: "live",
  openFreeMap: "live",
  openWeather: weather.source === "openweather" ? "live" : "fallback",
  gemini: geminiLive || hasApiKey.gemini ? "mixed" : "fallback",
  nasaEonet: naturalEvents.some((event) => event.source === "nasa-eonet") ? "live" : "fallback",
  osrm: "mixed",
});

type CrisisState = {
  cities: City[];
  scenarios: typeof scenarios;
  selectedCity: City;
  selectedScenarioId: ScenarioId;
  facilities: Facility[];
  resources: Resource[];
  incidents: Incident[];
  weather: WeatherSnapshot;
  naturalEvents: NaturalEvent[];
  roadClosures: RoadClosure[];
  dispatchPlan: DispatchPlan | null;
  briefing: string[];
  disruptionLog: string[];
  routesReplanned: number;
  apiStatus: ApiStatus;
  isLoadingWeather: boolean;
  isGeneratingPlan: boolean;
  isGeneratingBriefing: boolean;
  hasInitialized: boolean;
  isRunningJudgeDemo: boolean;
  judgeDemoStep: number;
  initialize: () => Promise<void>;
  selectCity: (cityId: City["id"]) => Promise<void>;
  selectScenario: (scenarioId: ScenarioId) => Promise<void>;
  searchCity: (query: string) => Promise<boolean>;
  refreshWeather: () => Promise<void>;
  generatePlan: () => Promise<void>;
  replan: () => Promise<void>;
  updateAssignmentRoute: (assignmentId: string, route: Assignment["route"]) => void;
  blockRoad: () => void;
  markHospitalFull: () => void;
  markShelterFull: () => void;
  triggerDemandSpike: () => void;
  runJudgeDemo: () => Promise<void>;
  resetScenario: () => Promise<void>;
};

const createScenarioState = (city: City, scenarioId: ScenarioId, weather: WeatherSnapshot) => {
  const scenario = getScenarioById(scenarioId);
  const sourceIncidents =
    city.id === "demo-high-risk"
      ? createDemoHighRiskIncidents()
      : clone(scenario.incidents[city.id] ?? scenario.incidents.singapore ?? []);

  return {
    facilities: clone(facilitiesByCity[city.id]),
    resources: clone(resourcesByCity[city.id]),
    incidents: applyWeatherToIncidents(sourceIncidents, weather),
  };
};

export const useCrisisStore = create<CrisisState>()(
  (set, get) => ({
      cities,
      scenarios,
      selectedCity: initialCity,
      selectedScenarioId: initialScenario.id,
      ...createScenarioState(initialCity, initialScenario.id, getSeedWeather(initialCity)),
      weather: getSeedWeather(initialCity),
      naturalEvents: [],
      roadClosures: [],
      dispatchPlan: null,
      briefing: [],
      disruptionLog: [],
      routesReplanned: 0,
      apiStatus: buildApiStatus(getSeedWeather(initialCity), [], false),
      isLoadingWeather: false,
      isGeneratingPlan: false,
      isGeneratingBriefing: false,
      hasInitialized: false,
      isRunningJudgeDemo: false,
      judgeDemoStep: 0,

      initialize: async () => {
        if (get().hasInitialized) return;
        set({ hasInitialized: true });
        await get().refreshWeather();
        if (!get().dispatchPlan) {
          await get().generatePlan();
        }
      },

      selectCity: async (cityId) => {
        const city = getCityById(cityId);
        const seedWeather = getSeedWeather(city);
        const shouldFetchLiveWeather = hasApiKey.openWeather && city.id !== "demo-high-risk";
        const displayWeather = shouldFetchLiveWeather ? get().weather : seedWeather;
        const scenarioState = createScenarioState(city, get().selectedScenarioId, displayWeather);

        set({
          selectedCity: city,
          weather: displayWeather,
          ...scenarioState,
          roadClosures: [],
          dispatchPlan: null,
          briefing: [],
          disruptionLog: [],
          routesReplanned: 0,
          isLoadingWeather: shouldFetchLiveWeather,
          apiStatus: buildApiStatus(displayWeather, [], false),
        });

        await get().refreshWeather();
      },

      selectScenario: async (scenarioId) => {
        const { selectedCity, weather } = get();
        set({
          selectedScenarioId: scenarioId,
          ...createScenarioState(selectedCity, scenarioId, weather),
          roadClosures: [],
          dispatchPlan: null,
          briefing: [],
          disruptionLog: [],
          routesReplanned: 0,
        });
      },

      searchCity: async (query) => {
        const normalized = query.trim().toLowerCase();
        const matched = cities.find(
          (city) =>
            city.name.toLowerCase() === normalized ||
            `${city.name}, ${city.country}`.toLowerCase() === normalized,
        );

        if (matched) {
          await get().selectCity(matched.id);
          return true;
        }

        return false;
      },

      refreshWeather: async () => {
        const { selectedCity, selectedScenarioId } = get();
        const shouldFetchLiveWeather = hasApiKey.openWeather && selectedCity.id !== "demo-high-risk";
        set({ isLoadingWeather: shouldFetchLiveWeather });

        const [weather, naturalEvents] = await Promise.all([
          fetchWeather(selectedCity),
          fetchNaturalEvents(selectedCity),
        ]);

        set({
          weather,
          naturalEvents,
          ...createScenarioState(selectedCity, selectedScenarioId, weather),
          apiStatus: buildApiStatus(weather, naturalEvents, false),
          isLoadingWeather: false,
          dispatchPlan: null,
          briefing: [],
        });
      },

      generatePlan: async () => {
        const state = get();
        set({ isGeneratingPlan: true, routesReplanned: 0 });

        const plan = optimizeDispatch({
          city: state.selectedCity,
          scenarioId: state.selectedScenarioId,
          incidents: state.incidents,
          resources: state.resources,
          facilities: state.facilities,
          weather: state.weather,
          roadClosures: state.roadClosures,
          disruptionLog: state.disruptionLog,
          routesReplanned: 0,
        });

        const scenario = getScenarioById(state.selectedScenarioId);
        const payload = {
          city: state.selectedCity,
          scenarioName: scenario.name,
          weather: state.weather,
          incidents: state.incidents,
          facilities: state.facilities,
          resources: state.resources,
          plan,
          disruptions: state.disruptionLog,
        };

        set({
          dispatchPlan: plan,
          briefing: buildFallbackBriefing(payload),
          isGeneratingPlan: false,
          isGeneratingBriefing: true,
        });

        void generateBriefing(payload).then((bullets) => {
          set((current) => {
            if (current.dispatchPlan?.id !== plan.id) return current;
            return {
              briefing: bullets,
              isGeneratingBriefing: false,
              apiStatus: buildApiStatus(current.weather, current.naturalEvents, hasApiKey.gemini),
            };
          });
        });
      },

      replan: async () => {
        const state = get();
        set({ isGeneratingPlan: true, routesReplanned: state.routesReplanned + 1 });

        const plan = optimizeDispatch({
          city: state.selectedCity,
          scenarioId: state.selectedScenarioId,
          incidents: state.incidents,
          resources: state.resources,
          facilities: state.facilities,
          weather: state.weather,
          roadClosures: state.roadClosures,
          disruptionLog: state.disruptionLog,
          routesReplanned: state.routesReplanned + 1,
        });

        const scenario = getScenarioById(state.selectedScenarioId);
        const payload = {
          city: state.selectedCity,
          scenarioName: scenario.name,
          weather: state.weather,
          incidents: state.incidents,
          facilities: state.facilities,
          resources: state.resources,
          plan,
          disruptions: state.disruptionLog,
        };

        set({
          dispatchPlan: plan,
          briefing: buildFallbackBriefing(payload),
          isGeneratingPlan: false,
          isGeneratingBriefing: true,
        });

        void generateBriefing(payload).then((bullets) => {
          set((current) => {
            if (current.dispatchPlan?.id !== plan.id) return current;
            return {
              briefing: bullets,
              isGeneratingBriefing: false,
              apiStatus: buildApiStatus(current.weather, current.naturalEvents, hasApiKey.gemini),
            };
          });
        });
      },

      updateAssignmentRoute: (assignmentId, route) => {
        set((state) => {
          if (!state.dispatchPlan) return state;

          const assignments = state.dispatchPlan.assignments.map((assignment) =>
            assignment.id === assignmentId
              ? {
                  ...assignment,
                  route,
                  distanceKm: Number(route.distanceKm.toFixed(2)),
                  etaMinutes: Number(route.etaMinutes.toFixed(1)),
                }
              : assignment,
          );

          return {
            dispatchPlan: {
              ...state.dispatchPlan,
              assignments,
            },
          };
        });
      },

      blockRoad: () => {
        const state = get();
        const topIncident = [...state.incidents].sort((a, b) => b.severity - a.severity)[0];
        if (!topIncident) return;

        const closure = createRoadClosure(
          `Primary corridor blocked near ${topIncident.title}`,
          state.selectedCity.center,
          topIncident.location,
        );

        set({
          roadClosures: [...state.roadClosures, closure],
          disruptionLog: [...state.disruptionLog, closure.label],
        });
      },

      markHospitalFull: () => {
        const { facilities, disruptionLog } = get();
        const result = markNearestFacilityFull(facilities, "hospital");
        set({
          facilities: result.facilities,
          disruptionLog: [...disruptionLog, result.label],
        });
      },

      markShelterFull: () => {
        const { facilities, disruptionLog } = get();
        const result = markNearestFacilityFull(facilities, "shelter");
        set({
          facilities: result.facilities,
          disruptionLog: [...disruptionLog, result.label],
        });
      },

      triggerDemandSpike: () => {
        const { incidents, disruptionLog } = get();
        set({
          incidents: triggerDemandSpike(incidents),
          disruptionLog: [...disruptionLog, "Demand spike added to highest-priority incident"],
        });
      },

      runJudgeDemo: async () => {
        const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
        set({ isRunningJudgeDemo: true, judgeDemoStep: 1 });

        const demoCity = getCityById("demo-high-risk");
        const demoWeather = getSeedWeather(demoCity);

        set({
          selectedCity: demoCity,
          selectedScenarioId: "multi-incident",
          weather: demoWeather,
          naturalEvents: [
            {
              id: "judge-demo-storm",
              title: "Simulated severe storm and flood cascade",
              category: "Severe Storms",
              source: "seed",
              distanceKm: 4,
            },
          ],
          ...createScenarioState(demoCity, "multi-incident", demoWeather),
          roadClosures: [],
          dispatchPlan: null,
          briefing: [],
          disruptionLog: ["Judge demo initialized"],
          routesReplanned: 0,
          isLoadingWeather: false,
          apiStatus: buildApiStatus(demoWeather, [], false),
        });

        await wait(350);
        set({ judgeDemoStep: 2 });
        await wait(300);
        set({ judgeDemoStep: 3 });
        await get().generatePlan();
        await wait(350);
        set({ judgeDemoStep: 4 });
        get().blockRoad();
        await wait(250);
        get().triggerDemandSpike();
        get().markHospitalFull();
        await wait(350);
        set({ judgeDemoStep: 5 });
        await get().replan();
        await wait(250);
        set({ isRunningJudgeDemo: false, judgeDemoStep: 6 });
      },

      resetScenario: async () => {
        const { selectedCity, selectedScenarioId, weather } = get();
        set({
          ...createScenarioState(selectedCity, selectedScenarioId, weather),
          roadClosures: [],
          dispatchPlan: null,
          briefing: [],
          disruptionLog: [],
          routesReplanned: 0,
        });
      },
    }),
);
