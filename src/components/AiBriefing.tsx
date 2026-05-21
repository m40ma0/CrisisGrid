import { Radio } from "lucide-react";
import { useCrisisStore } from "../store/useCrisisStore";

const labels = ["Situation", "Action", "Reason", "Tradeoff", "Watch"];

export function AiBriefing() {
  const { briefing, isGeneratingBriefing, apiStatus } = useCrisisStore();

  return (
    <section className="rounded-xl border border-command-line bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wide text-zinc-500">
            AI Incident Commander
          </p>
          <h2 className="mt-1 text-xl font-black text-zinc-950">Command brief</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {apiStatus.gemini === "fallback" ? "Local summary" : "Live summary"}
          </p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-amber-50 text-amber-700">
          <Radio className="h-5 w-5" />
        </span>
      </div>

      {briefing.length ? (
        <div className="space-y-2">
          {isGeneratingBriefing && (
            <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-800">
              Updating with Gemini...
            </div>
          )}
          <ul className="grid gap-3 lg:grid-cols-2">
            {briefing.map((line, index) => (
              <li
                key={`${line}-${index}`}
                className="rounded-lg border border-zinc-200 bg-[#f7f8f4] px-4 py-3"
              >
                <span className="block text-[10px] font-black uppercase tracking-wide text-amber-700">
                  {labels[index] ?? "Note"}
                </span>
                <span className="mt-1 block text-sm leading-6 text-zinc-700">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : isGeneratingBriefing ? (
        <div className="rounded border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
          Preparing brief...
        </div>
      ) : (
        <div className="rounded border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-500">
          Build a plan to generate the brief.
        </div>
      )}
    </section>
  );
}
