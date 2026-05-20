import { Sparkles } from "lucide-react";
import { useCrisisStore } from "../store/useCrisisStore";

export function AiBriefing() {
  const { briefing, isGeneratingBriefing, apiStatus } = useCrisisStore();

  return (
    <section className="rounded-lg border border-command-line bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-zinc-950">Briefing</h2>
          <p className="text-xs text-zinc-500">
            {apiStatus.gemini === "fallback" ? "Local summary" : "Live summary"}
          </p>
        </div>
        <Sparkles className="h-5 w-5 text-amber-600" />
      </div>

      {isGeneratingBriefing ? (
        <div className="rounded border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
          Preparing brief...
        </div>
      ) : briefing.length ? (
        <ul className="space-y-2">
          {briefing.map((line, index) => (
            <li key={`${line}-${index}`} className="flex gap-2 text-sm leading-6 text-zinc-700">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-500">
          Build a plan to generate the brief.
        </div>
      )}
    </section>
  );
}
