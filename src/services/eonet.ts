import type { City, NaturalEvent } from "../types/crisis";
import { haversineDistanceKm } from "../algorithms/scoring";

type EonetEvent = {
  id: string;
  title: string;
  categories?: Array<{ title?: string }>;
  geometry?: Array<{ coordinates?: [number, number] | [number, number, number] }>;
};

type EonetResponse = {
  events?: EonetEvent[];
};

const seededEvents: Record<City["id"], NaturalEvent[]> = {
  singapore: [
    {
      id: "seed-monsoon",
      title: "Regional monsoon rain band",
      category: "Severe Storms",
      source: "seed",
      distanceKm: 18,
    },
  ],
  "new-york": [
    {
      id: "seed-coastal-storm",
      title: "Atlantic coastal storm watch",
      category: "Severe Storms",
      source: "seed",
      distanceKm: 42,
    },
  ],
  london: [
    {
      id: "seed-river-flood",
      title: "River flood advisory",
      category: "Floods",
      source: "seed",
      distanceKm: 16,
    },
  ],
};

export const fetchNaturalEvents = async (city: City): Promise<NaturalEvent[]> => {
  try {
    const url = new URL("https://eonet.gsfc.nasa.gov/api/v3/events");
    url.searchParams.set("status", "open");
    url.searchParams.set("days", "30");
    url.searchParams.set("limit", "18");

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error("NASA EONET request failed");

    const data = (await response.json()) as EonetResponse;
    const events = (data.events ?? [])
      .map((event) => {
        const coordinates = event.geometry?.find((geometry) => geometry.coordinates)?.coordinates;
        const location = coordinates
          ? {
              lng: coordinates[0],
              lat: coordinates[1],
            }
          : undefined;
        const distanceKm = location ? haversineDistanceKm(city.center, location) : undefined;

        return {
          id: event.id,
          title: event.title,
          category: event.categories?.[0]?.title ?? "Natural Event",
          source: "nasa-eonet" as const,
          location,
          distanceKm,
        };
      })
      .filter((event) => event.distanceKm === undefined || event.distanceKm < 2500)
      .sort((a, b) => (a.distanceKm ?? 99999) - (b.distanceKm ?? 99999))
      .slice(0, 3);

    return events.length ? events : seededEvents[city.id];
  } catch {
    return seededEvents[city.id];
  }
};
