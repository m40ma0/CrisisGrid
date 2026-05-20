const buildPrompt = (payload: unknown) => `You are an emergency operations analyst.

Summarize this dispatch plan in 5 concise bullet points for a city emergency commander.

Include:
- most urgent incident
- resources deployed
- expected improvement
- remaining unmet demand
- one operational risk

Do not invent numbers. Use only the JSON provided.
Do not make dispatch decisions. The JSON plan was produced by a deterministic optimizer.

JSON:
${JSON.stringify(payload, null, 2)}`;

const parseBullets = (text: string) =>
  text
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 5);

type VercelRequestLike = {
  method?: string;
  body?: unknown;
};

type VercelResponseLike = {
  status: (code: number) => {
    json: (body: unknown) => void;
  };
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

export default async function handler(request: VercelRequestLike, response: VercelResponseLike) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    response.status(503).json({ error: "GEMINI_API_KEY is not configured" });
    return;
  }

  try {
    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(request.body) }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 450,
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      response.status(geminiResponse.status).json({ error: "Gemini request failed" });
      return;
    }

    const data = (await geminiResponse.json()) as GeminiResponse;
    const text =
      data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n") ?? "";
    response.status(200).json({ bullets: parseBullets(text) });
  } catch {
    response.status(500).json({ error: "Briefing generation failed" });
  }
}
