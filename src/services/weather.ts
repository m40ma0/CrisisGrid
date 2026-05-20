import type { City, WeatherSnapshot } from "../types/crisis";
import { apiKeys, hasApiKey } from "./env";

type OpenWeatherCurrent = {
  weather?: Array<{ main?: string; description?: string }>;
  main?: { temp?: number; humidity?: number };
  wind?: { speed?: number };
  rain?: { "1h"?: number; "3h"?: number };
};

type OpenWeatherAir = {
  list?: Array<{
    main?: { aqi?: number };
  }>;
};

export const calculateWeatherRisk = (weather: {
  rainMm: number;
  windKph: number;
  temperatureC: number;
  airQualityIndex: number;
}) => {
  let risk = 0;

  if (weather.rainMm > 10) risk += 25;
  if (weather.rainMm > 25) risk += 15;
  if (weather.windKph > 40) risk += 15;
  if (weather.windKph > 70) risk += 10;
  if (weather.temperatureC > 34) risk += 10;
  if (weather.temperatureC > 38) risk += 10;
  if (weather.airQualityIndex > 100) risk += 20;
  if (weather.airQualityIndex > 150) risk += 15;

  return Math.min(100, risk);
};

const riskLabel = (score: number): WeatherSnapshot["riskLabel"] => {
  if (score >= 75) return "Severe";
  if (score >= 50) return "High";
  if (score >= 25) return "Moderate";
  return "Low";
};

const seededWeather: Record<City["id"], Omit<WeatherSnapshot, "updatedAt">> = {
  singapore: {
    cityName: "Singapore",
    source: "seed",
    condition: "Heavy showers nearby",
    temperatureC: 31,
    windKph: 28,
    rainMm: 18,
    airQualityIndex: 82,
    humidity: 82,
    riskScore: 25,
    riskLabel: "Moderate",
    modifiers: {
      floodSeverity: 0.2,
      medicalDemand: 0.08,
      roadBlockProbability: 0.1,
    },
  },
  "new-york": {
    cityName: "New York",
    source: "seed",
    condition: "Windy rain bands",
    temperatureC: 24,
    windKph: 46,
    rainMm: 13,
    airQualityIndex: 58,
    humidity: 74,
    riskScore: 40,
    riskLabel: "Moderate",
    modifiers: {
      floodSeverity: 0.18,
      medicalDemand: 0.04,
      roadBlockProbability: 0.14,
    },
  },
  london: {
    cityName: "London",
    source: "seed",
    condition: "Steady rain",
    temperatureC: 18,
    windKph: 34,
    rainMm: 11,
    airQualityIndex: 72,
    humidity: 78,
    riskScore: 25,
    riskLabel: "Moderate",
    modifiers: {
      floodSeverity: 0.16,
      medicalDemand: 0.05,
      roadBlockProbability: 0.08,
    },
  },
};

const toAqiIndex = (openWeatherAqi: number | undefined) => {
  if (!openWeatherAqi) return 50;
  return [25, 55, 105, 155, 205][Math.max(0, Math.min(4, openWeatherAqi - 1))];
};

export const getSeedWeather = (city: City): WeatherSnapshot => ({
  ...seededWeather[city.id],
  cityName: city.name,
  updatedAt: new Date().toISOString(),
});

export const fetchWeather = async (city: City): Promise<WeatherSnapshot> => {
  if (!hasApiKey.openWeather) return getSeedWeather(city);

  try {
    const { lat, lng } = city.center;
    const weatherUrl = new URL("https://api.openweathermap.org/data/2.5/weather");
    weatherUrl.searchParams.set("lat", String(lat));
    weatherUrl.searchParams.set("lon", String(lng));
    weatherUrl.searchParams.set("units", "metric");
    weatherUrl.searchParams.set("appid", apiKeys.openWeather);

    const airUrl = new URL("https://api.openweathermap.org/data/2.5/air_pollution");
    airUrl.searchParams.set("lat", String(lat));
    airUrl.searchParams.set("lon", String(lng));
    airUrl.searchParams.set("appid", apiKeys.openWeather);

    const [weatherResponse, airResponse] = await Promise.all([
      fetch(weatherUrl.toString()),
      fetch(airUrl.toString()),
    ]);

    if (!weatherResponse.ok) throw new Error("OpenWeather current weather request failed");

    const weather = (await weatherResponse.json()) as OpenWeatherCurrent;
    const air = airResponse.ok ? ((await airResponse.json()) as OpenWeatherAir) : undefined;

    const temperatureC = Math.round(weather.main?.temp ?? 0);
    const windKph = Math.round((weather.wind?.speed ?? 0) * 3.6);
    const rainMm = Math.round((weather.rain?.["1h"] ?? weather.rain?.["3h"] ?? 0) * 10) / 10;
    const airQualityIndex = toAqiIndex(air?.list?.[0]?.main?.aqi);
    const score = calculateWeatherRisk({ rainMm, windKph, temperatureC, airQualityIndex });

    return {
      cityName: city.name,
      source: "openweather",
      condition:
        weather.weather?.[0]?.description ??
        weather.weather?.[0]?.main ??
        "Current weather available",
      temperatureC,
      windKph,
      rainMm,
      airQualityIndex,
      humidity: Math.round(weather.main?.humidity ?? 0),
      riskScore: score,
      riskLabel: riskLabel(score),
      modifiers: {
        floodSeverity: rainMm > 10 ? 0.2 : rainMm > 5 ? 0.1 : 0,
        medicalDemand: airQualityIndex > 100 || temperatureC > 34 ? 0.18 : 0.05,
        roadBlockProbability: windKph > 40 ? 0.15 : rainMm > 10 ? 0.1 : 0.04,
      },
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return getSeedWeather(city);
  }
};
