import { CloudRain, Wind } from "lucide-react";
import { hasApiKey } from "../services/env";
import { useCrisisStore } from "../store/useCrisisStore";

const riskColor = {
  Low: "text-emerald-700 bg-emerald-50 border-emerald-200",
  Moderate: "text-amber-700 bg-amber-50 border-amber-200",
  High: "text-orange-700 bg-orange-50 border-orange-200",
  Severe: "text-red-700 bg-red-50 border-red-200",
};

export function WeatherRiskPanel() {
  const { weather, naturalEvents, isLoadingWeather, refreshWeather } = useCrisisStore();
  const syncingLiveWeather = hasApiKey.openWeather && isLoadingWeather;
  const scoreLabel = syncingLiveWeather ? "--" : String(weather.riskScore);
  const scoreWidth = syncingLiveWeather ? 12 : Math.max(6, weather.riskScore);

  return (
    <section className="rounded-lg border border-command-line bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h2 className="text-sm font-bold text-zinc-950">Risk</h2>
          <p className="text-xs capitalize text-zinc-500">
            {syncingLiveWeather ? "Syncing live weather" : weather.condition}
          </p>
        </div>
        <CloudRain className="h-5 w-5 text-blue-600" />
      </div>

      <div className={`mb-3 rounded border p-3 ${riskColor[weather.riskLabel]}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">
            {syncingLiveWeather ? "Live score" : weather.riskLabel}
          </span>
          <span className="text-lg font-black">{scoreLabel}</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-white/70">
          <div className="h-2 rounded-full bg-current" style={{ width: `${scoreWidth}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded border border-zinc-200 bg-zinc-50 p-2">
          <span className="block text-zinc-500">Rain</span>
          <strong>{weather.rainMm} mm</strong>
        </div>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-2">
          <span className="block text-zinc-500">Wind</span>
          <strong>{weather.windKph} kph</strong>
        </div>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-2">
          <span className="block text-zinc-500">Temp</span>
          <strong>{weather.temperatureC} C</strong>
        </div>
        <div className="rounded border border-zinc-200 bg-zinc-50 p-2">
          <span className="block text-zinc-500">AQI</span>
          <strong>{weather.airQualityIndex}</strong>
        </div>
      </div>

      <div className="mt-3 rounded border border-zinc-200 bg-zinc-50 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold text-zinc-700">
          <Wind className="h-4 w-4" />
          Signals
        </div>
        <div className="space-y-2">
          {naturalEvents.slice(0, 2).map((event) => (
            <div key={event.id} className="text-xs text-zinc-600">
              <span className="font-semibold text-zinc-900">{event.category}:</span> {event.title}
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => void refreshWeather()}
        className="mt-3 w-full rounded border border-zinc-300 px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
      >
        {isLoadingWeather ? "Refreshing..." : "Refresh Risk"}
      </button>
    </section>
  );
}
