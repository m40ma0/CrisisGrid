import { Radio } from "lucide-react";
import { useCrisisStore } from "../store/useCrisisStore";

const labels = ["Situation", "Action", "Reason", "Tradeoff", "Watch"];

export function AiBriefing() {
  const { briefing, isGeneratingBriefing, apiStatus } = useCrisisStore();

  return (
    <section className="rounded-lg border border-command-line bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-zinc-950">AI Incident Commander Brief</h2>
          <p className="text-xs text-zinc-500">
            {apiStatus.gemini === "fallback" ? "Local summary" : "Live summary"}
          </p>
        </div>
        <Radio className="h-5 w-5 text-amber-600" />
      </div>

      {isGeneratingBriefing ? (
        <div className="rounded border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
          Preparing brief...
        </div>
      ) : briefing.length ? (
        <ul className="space-y-2">
          {briefing.map((line, index) => (
            <li
              key={`${line}-${index}`}
              className="rounded border border-zinc-200 bg-[#f7f8f4] px-3 py-2"
            >
              <span className="block text-[10px] font-black uppercase tracking-wide text-amber-700">
                {labels[index] ?? "Note"}
              </span>
              <span className="text-sm leading-6 text-zinc-700">{line}</span>
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
