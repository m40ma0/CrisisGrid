import type { BriefingPayload } from "../types/crisis";
import { apiKeys, hasApiKey } from "./env";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

export const buildFallbackBriefing = (payload: BriefingPayload) => {
  const plan = payload.plan;
  const highest = [...payload.incidents].sort((a, b) => b.severity - a.severity)[0];
  const resources = plan?.assignments.length ?? 0;
  const unmet = plan?.metrics.unmetDemand ?? payload.incidents.length;
  const covered = plan?.metrics.peopleCovered ?? 0;

  return [
    `${highest?.title ?? "Primary incident"} is driving a ${payload.weather.riskLabel.toLowerCase()} emergency posture in ${payload.city.name}.`,
    `Deploy ${resources} optimized resources now and keep evacuation, triage, and utility crews coordinated.`,
    `The allocation was chosen from deterministic priority, ETA, resource-fit, weather, and capacity scoring.`,
    `The plan prioritizes faster high-severity coverage while leaving ${unmet} unmet resource units visible for commanders.`,
    `Watch facility capacity and weather-driven road disruption; ${covered} residents are currently covered.`,
  ];
};

const buildPrompt = (payload: BriefingPayload) => `You are an emergency operations analyst.

Summarize this dispatch plan in exactly 5 concise lines for a city emergency commander.

Include:
- Situation
- Recommended action
- Why this allocation was chosen
- Tradeoff made
- Next risk to watch

Do not invent numbers. Use only the JSON provided.
Do not make dispatch decisions. The JSON plan was produced by a deterministic optimizer.
Do not include headings; the user interface adds those.

JSON:
${JSON.stringify(payload, null, 2)}`;

const parseBullets = (text: string) =>
  text
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 5);

const callGeminiDirect = async (payload: BriefingPayload) => {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKeys.gemini,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: buildPrompt(payload) }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 450,
        },
      }),
    },
  );

  if (!response.ok) throw new Error("Gemini direct request failed");
  const data = (await response.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n");

  return parseBullets(text ?? "");
};

export const generateBriefing = async (payload: BriefingPayload): Promise<string[]> => {
  if (hasApiKey.gemini) {
    try {
      const directBullets = await callGeminiDirect(payload);
      if (directBullets.length) return directBullets;
    } catch {
      return buildFallbackBriefing(payload);
    }
  }

  return buildFallbackBriefing(payload);
};
