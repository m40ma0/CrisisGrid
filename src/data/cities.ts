import type { City } from "../types/crisis";

export const cities: City[] = [
  {
    id: "singapore",
    name: "Singapore",
    country: "Singapore",
    center: { lat: 1.3521, lng: 103.8198 },
    zoom: 12,
    averageSpeedKmh: 32,
    bboxKm: 18,
  },
  {
    id: "new-york",
    name: "New York",
    country: "United States",
    center: { lat: 40.7128, lng: -74.006 },
    zoom: 11,
    averageSpeedKmh: 28,
    bboxKm: 24,
  },
  {
    id: "london",
    name: "London",
    country: "United Kingdom",
    center: { lat: 51.5072, lng: -0.1276 },
    zoom: 11,
    averageSpeedKmh: 30,
    bboxKm: 22,
  },
  {
    id: "demo-high-risk",
    name: "Manila Demo - High Risk",
    country: "Philippines",
    center: { lat: 14.5995, lng: 120.9842 },
    zoom: 11,
    averageSpeedKmh: 24,
    bboxKm: 26,
  },
];

export const getCityById = (id: City["id"]) =>
  cities.find((city) => city.id === id) ?? cities[0];
