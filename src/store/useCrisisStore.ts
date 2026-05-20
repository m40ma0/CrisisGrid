import { create } from "zustand";
import { persist } from "zustand/middleware";
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
import { generateBriefing } from "../services/gemini";
import { fetchWeather, getSeedWeather } from "../services/weather";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const initialCity = cities[0];
const initialScenario = scenarios[0];

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
  resetScenario: () => Promise<void>;
};

const createScenarioState = (city: City, scenarioId: ScenarioId, weather: WeatherSnapshot) => {
  const scenario = getScenarioById(scenarioId);
  return {
    facilities: clone(facilitiesByCity[city.id]),
    resources: clone(resourcesByCity[city.id]),
    incidents: applyWeatherToIncidents(clone(scenario.incidents[city.id]), weather),
  };
};

export const useCrisisStore = create<CrisisState>()(
  persist(
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

      initialize: async () => {
        await get().refreshWeather();
      },

      selectCity: async (cityId) => {
        const city = getCityById(cityId);
        const weather = getSeedWeather(city);
        const scenarioState = createScenarioState(city, get().selectedScenarioId, weather);

        set({
          selectedCity: city,
          weather,
          ...scenarioState,
          roadClosures: [],
          dispatchPlan: null,
          briefing: [],
          disruptionLog: [],
          routesReplanned: 0,
          apiStatus: buildApiStatus(weather, [], false),
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
        set({ isLoadingWeather: true });

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

        set({ dispatchPlan: plan, isGeneratingPlan: false, isGeneratingBriefing: true });

        const scenario = getScenarioById(state.selectedScenarioId);
        const bullets = await generateBriefing({
          city: state.selectedCity,
          scenarioName: scenario.name,
          weather: state.weather,
          incidents: state.incidents,
          facilities: state.facilities,
          resources: state.resources,
          plan,
          disruptions: state.disruptionLog,
        });

        set((current) => ({
          briefing: bullets,
          isGeneratingBriefing: false,
          apiStatus: buildApiStatus(current.weather, current.naturalEvents, hasApiKey.gemini),
        }));
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

        set({ dispatchPlan: plan, isGeneratingPlan: false, isGeneratingBriefing: true });

        const scenario = getScenarioById(state.selectedScenarioId);
        const bullets = await generateBriefing({
          city: state.selectedCity,
          scenarioName: scenario.name,
          weather: state.weather,
          incidents: state.incidents,
          facilities: state.facilities,
          resources: state.resources,
          plan,
          disruptions: state.disruptionLog,
        });

        set((current) => ({
          briefing: bullets,
          isGeneratingBriefing: false,
          apiStatus: buildApiStatus(current.weather, current.naturalEvents, hasApiKey.gemini),
        }));
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
    {
      name: "crisisgrid-scenario",
      partialize: (state) => ({
        selectedCity: state.selectedCity,
        selectedScenarioId: state.selectedScenarioId,
      }),
    },
  ),
);
