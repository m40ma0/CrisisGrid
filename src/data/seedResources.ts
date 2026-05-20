import type { CityId, Resource } from "../types/crisis";

const resource = (
  cityPrefix: string,
  idx: number,
  type: Resource["type"],
  name: string,
  lat: number,
  lng: number,
  capacity: number,
): Resource => ({
  id: `${cityPrefix}-r-${idx}`,
  type,
  name,
  location: { lat, lng },
  capacity,
  available: true,
});

export const resourcesByCity: Record<CityId, Resource[]> = {
  singapore: [
    resource("sg", 1, "ambulance", "Ambulance Alpha", 1.3039, 103.8321, 55),
    resource("sg", 2, "ambulance", "Ambulance Bravo", 1.3521, 103.9446, 50),
    resource("sg", 3, "medical", "Medical Team Central", 1.3218, 103.8459, 75),
    resource("sg", 4, "medical", "Medical Team East", 1.3496, 103.8736, 65),
    resource("sg", 5, "supply", "Supply Convoy 1", 1.3532, 103.8895, 210),
    resource("sg", 6, "volunteer", "Volunteer Corps A", 1.3342, 103.8501, 120),
    resource("sg", 7, "food", "Food Unit 7", 1.3667, 103.8, 180),
    resource("sg", 8, "power", "Mobile Power Crew", 1.3893, 103.8608, 160),
  ],
  "new-york": [
    resource("ny", 1, "ambulance", "Ambulance Manhattan 1", 40.7392, -73.9767, 60),
    resource("ny", 2, "ambulance", "Ambulance Brooklyn 2", 40.6782, -73.9442, 54),
    resource("ny", 3, "medical", "Medical Strike Team North", 40.7698, -73.9867, 82),
    resource("ny", 4, "medical", "Medical Strike Team East", 40.7282, -73.7949, 70),
    resource("ny", 5, "supply", "Relief Truck Hudson", 40.7571, -74.0026, 230),
    resource("ny", 6, "volunteer", "CERT Team Queens", 40.7421, -73.7694, 140),
    resource("ny", 7, "food", "Food Distribution 4", 40.6501, -73.9496, 190),
    resource("ny", 8, "power", "Utility Restoration Crew", 40.7069, -74.0113, 175),
  ],
  london: [
    resource("ldn", 1, "ambulance", "Ambulance Westminster", 51.4984, -0.1186, 58),
    resource("ldn", 2, "ambulance", "Ambulance East", 51.5194, -0.0598, 52),
    resource("ldn", 3, "medical", "Medical Team Thames", 51.5067, -0.1164, 78),
    resource("ldn", 4, "medical", "Medical Team Stratford", 51.5423, -0.0026, 68),
    resource("ldn", 5, "supply", "Supply Lorry Battersea", 51.479, -0.1498, 220),
    resource("ldn", 6, "volunteer", "Volunteer Unit North", 51.5465, -0.1058, 130),
    resource("ldn", 7, "food", "Food Unit South", 51.467, -0.119, 185),
    resource("ldn", 8, "power", "Grid Repair Crew 2", 51.5155, -0.0922, 170),
  ],
  "demo-high-risk": [
    resource("demo", 1, "ambulance", "Ambulance Delta", 14.633, 120.988, 52),
    resource("demo", 2, "ambulance", "Ambulance Echo", 14.573, 120.992, 48),
    resource("demo", 3, "medical", "Rapid Medical Team", 14.604, 121.028, 76),
    resource("demo", 4, "medical", "Respiratory Response Team", 14.592, 120.944, 68),
    resource("demo", 5, "supply", "High-Water Supply Convoy", 14.622, 121.003, 210),
    resource("demo", 6, "volunteer", "Evacuation Team A", 14.565, 121.018, 135),
    resource("demo", 7, "food", "Emergency Food Unit", 14.648, 120.958, 185),
    resource("demo", 8, "power", "Mobile Power Crew", 14.612, 120.952, 165),
  ],
};
