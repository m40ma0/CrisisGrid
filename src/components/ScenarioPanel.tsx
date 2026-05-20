import { MapPin, Search } from "lucide-react";
import { useState } from "react";
import { useCrisisStore } from "../store/useCrisisStore";
import type { ScenarioId } from "../types/crisis";

export function ScenarioPanel() {
  const {
    cities,
    scenarios,
    selectedCity,
    selectedScenarioId,
    selectCity,
    selectScenario,
    searchCity,
  } = useCrisisStore();
  const [query, setQuery] = useState("");
  const [searchState, setSearchState] = useState<"idle" | "found" | "fallback">("idle");

  const handleSearch = async () => {
    const ok = await searchCity(query);
    setSearchState(ok ? "found" : "fallback");
  };

  return (
    <section className="rounded-lg border border-command-line bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-zinc-950">Scenario</h2>
          <p className="text-xs text-zinc-500">{selectedCity.name} command area</p>
        </div>
        <MapPin className="h-5 w-5 text-red-600" />
      </div>

      <label className="mb-2 block text-xs font-semibold text-zinc-600" htmlFor="city">
        Preset city
      </label>
      <select
        id="city"
        value={selectedCity.id}
        onChange={(event) => void selectCity(event.target.value as typeof selectedCity.id)}
        className="mb-3 w-full rounded border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500"
      >
        {cities.map((city) => (
          <option key={city.id} value={city.id}>
            {city.name}
          </option>
        ))}
      </select>

      <label className="mb-2 block text-xs font-semibold text-zinc-600" htmlFor="scenario">
        Disaster scenario
      </label>
      <select
        id="scenario"
        value={selectedScenarioId}
        onChange={(event) => void selectScenario(event.target.value as ScenarioId)}
        className="mb-3 w-full rounded border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500"
      >
        {scenarios.map((scenario) => (
          <option key={scenario.id} value={scenario.id}>
            {scenario.name}
          </option>
        ))}
      </select>

      <label className="mb-2 block text-xs font-semibold text-zinc-600" htmlFor="city-search">
        City or district search
      </label>
      <div className="flex gap-2">
        <input
          id="city-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Singapore CBD"
          className="min-w-0 flex-1 rounded border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <button
          type="button"
          onClick={() => void handleSearch()}
          className="inline-flex h-10 w-10 items-center justify-center rounded bg-zinc-950 text-white hover:bg-zinc-800"
          aria-label="Search city"
          title="Search city"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
      {searchState !== "idle" && (
        <p className={`mt-2 text-xs ${searchState === "found" ? "text-emerald-700" : "text-amber-700"}`}>
          {searchState === "found" ? "Map context updated." : "Using preset city context."}
        </p>
      )}
    </section>
  );
}
