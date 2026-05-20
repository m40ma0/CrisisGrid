# CrisisGrid

CrisisGrid is a hackathon MVP for a live emergency-response command center. It blends real map context, weather risk, AI-generated crisis briefings, and deterministic resource optimization for city disaster response.

The important product claim is simple: APIs make the demo realistic, but the optimizer is the core. Gemini explains the response plan; it does not decide assignments.

## Problem

Cities under crisis conditions need to move scarce resources quickly while conditions change. Flooding, fires, blackouts, medical spikes, haze, road closures, hospital saturation, and shelter capacity all affect the dispatch plan.

CrisisGrid helps a commander:

- See incidents, resources, hospitals, shelters, and depots on a city map.
- Generate a deterministic response plan.
- Understand why each resource was assigned.
- Replan after disruption.
- Compare before/after impact metrics.

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- Zustand
- Recharts
- lucide-react
- MapLibre GL JS
- OpenFreeMap hosted map style and tiles
- OpenWeatherMap current weather and air pollution APIs
- Gemini API for command briefings
- NASA EONET natural events API
- OSRM public routing fallback

## APIs

CrisisGrid works in fallback mode without API keys.

For the full demo:

1. Create an OpenWeatherMap free API key.
2. Create a Gemini API key in Google AI Studio.
3. Copy `.env.example` to `.env` and fill in the values.

```bash
VITE_OPENWEATHER_API_KEY=
VITE_GEMINI_API_KEY=

# Optional Vercel serverless proxy:
GEMINI_API_KEY=
```

### API Roles

- MapLibre GL JS: browser map renderer for the command center.
- OpenFreeMap: free hosted map style and tiles with no API key.
- OpenWeatherMap: rain, wind, heat, humidity, and AQI risk signals.
- Gemini: concise command briefing and plan explanation.
- NASA EONET: near-real-time global natural event context.
- OSRM: final selected route geometry before straight-line fallback.

## Algorithms

The optimizer is implemented in TypeScript and runs without API keys.

- Weather risk modifies severity and medical demand.
- Incident priority combines severity, people affected, urgency, and weather.
- Haversine distance scores all resource-incident candidates quickly.
- A generated local graph models simulated city road topology.
- Dijkstra shortest paths estimate routing impact and road closure penalties.
- Priority-aware greedy assignment creates the dispatch plan.
- A local improvement pass swaps in faster compatible resources where useful.
- Metrics compute response time, coverage, unmet demand, utilization, crisis score, runtime, candidate count, and replanning count.

Gemini receives the optimizer output as JSON and only summarizes it. It is intentionally explanation-only for judging clarity and technical defensibility.

## Features

- Real map command center.
- Fallback map if the hosted map style is unavailable.
- Preset city selector for Singapore, New York, London, and Demo - High Risk Score.
- Preset city search for the included command areas.
- Demo - High Risk Score uses deterministic severe weather for judging and rehearsals.
- Scenario selector:
  - Central District Flood
  - Hospital Fire Surge
  - Residential Blackout
  - Haze Medical Spike
  - Downtown Multi-Incident Crisis
- Weather risk panel with OpenWeather fallback.
- NASA EONET natural event panel.
- Incident, resource, hospital, shelter, and depot markers.
- Generate Response Plan.
- Block Road.
- Mark Hospital Full.
- Mark Shelter Full.
- Trigger Demand Spike.
- Replan.
- Reset Scenario.
- Gemini or fallback command briefing.
- Dispatch plan and route mode labels.
- Impact dashboard.
- Algorithm receipts.

## Setup

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite, usually:

```bash
http://localhost:5173
```

Production build:

```bash
npm run build
```

## Demo Flow

1. Open CrisisGrid.
2. Select Demo - High Risk Score for a guaranteed emergency case.
3. Review the severe weather score and incident markers.
4. Click Generate Response Plan.
5. Use the tabs to show briefing, plan, impact, proof, and assets.
6. Click Block Road or Mark Hospital Full.
7. Click Replan.
8. Show changed assignments, updated receipts, and route fallbacks.

## Judging Alignment

- Innovation: disaster response command center with real data context and optimization.
- Algorithmic excellence: deterministic priority scoring, graph routing, greedy assignment, local improvement, replanning, and metrics.
- AI/ML: Gemini produces commander briefings from optimizer JSON without controlling decisions.
- Smart Cities: urban response, facility capacity, road disruption, and live map context.
- HealthTech: hospital fire surge, medical demand spikes, and triage resource allocation.
- Sustainable Technology: flood, haze, weather risk, and disaster resilience.
- Usability: a judge can understand the workflow in under 30 seconds.
- Feasibility: fallback mode protects the demo from API failures and quota limits.

## Key Safety Notes

- Do not commit real API keys.
- Use `.env` locally and keep it ignored by Git.
- Prefer the Vercel serverless `api/briefing.ts` proxy for Gemini in production.
- Keep OSRM calls limited to final selected routes.
- Do not abuse public routing or tile services during load testing.

## Future Roadmap

- Backend proxy for all paid or abuse-sensitive APIs.
- Real shelter and hospital datasets.
- Real road closure feeds.
- Multi-objective optimization with fairness constraints.
- Scenario export for Devpost judging.
- Live collaboration mode for multiple command roles.
- Historical disaster replay mode for algorithm benchmarking.
