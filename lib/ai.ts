// Équivalent de call_openrouter() dans agent.py : essaie chaque modèle, avec nouvel essai sur 429.
export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

type Choice = {
  message?: { content?: string | null };
  finish_reason?: string | null;
};
type Completion = { choices?: Choice[] };

const API_URL = process.env.OPENROUTER_URL ?? "https://openrouter.ai/api/v1/chat/completions";
const MAX_ATTEMPTS_PER_MODEL = 3;
const MAX_CONTINUATIONS = 2;
const REQUEST_TIMEOUT_MS = 15_000;
const TRUNCATION_NOTICE = "\n\n— La réponse a atteint la limite technique de génération malgré une tentative de continuation. Envoyez « continue » pour obtenir la suite.";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const wasCutOff = (reason: string | null | undefined) =>
  reason === "length" || reason === "max_tokens";

async function requestCompletion(
  model: string,
  messages: ChatMsg[],
  maxTokens: number,
  temperature: number,
): Promise<Completion> {
  let lastErr: unknown = new Error("réponse vide");
  for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt++) {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "X-Title": "Cicinho Social Bot",
        },
        body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (res.status === 429) {
        lastErr = new Error("OpenRouter 429 (quota/débit)");
        if (attempt < MAX_ATTEMPTS_PER_MODEL) {
          await sleep(1000 * 2 ** (attempt - 1));
          continue;
        }
        break;
      }
      if (!res.ok) {
        lastErr = new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 300)}`);
        break;
      }
      return (await res.json()) as Completion;
    } catch (err) {
      lastErr = err;
      break;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("échec IA");
}

export async function askAI(
  messages: ChatMsg[],
  opts: { maxTokens?: number; temperature?: number } = {},
): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY manquante");
  const models = (process.env.OPENROUTER_MODEL ?? "openrouter/auto")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  let lastErr: unknown = new Error("aucun modèle configuré");
  for (const model of models) {
    let fullText = "";
    let requestMessages = messages;
    try {
      for (let part = 0; part <= MAX_CONTINUATIONS; part++) {
        const completion = await requestCompletion(
          model,
          requestMessages,
          part === 0 ? (opts.maxTokens ?? 2500) : Math.min(opts.maxTokens ?? 2500, 2000),
          opts.temperature ?? 0.3,
        );
        const choice = completion.choices?.[0];
        const rawText = choice?.message?.content ?? "";
        if (!rawText.trim()) {
          lastErr = new Error("réponse vide");
          break;
        }
        fullText += part === 0 ? rawText.trim() : rawText;
        if (!wasCutOff(choice?.finish_reason)) return fullText;
        if (part === MAX_CONTINUATIONS) return fullText + TRUNCATION_NOTICE;

        requestMessages = [
          ...messages,
          { role: "assistant", content: fullText },
          {
            role: "user",
            content:
              "Continue exactement à partir du dernier caractère de ta réponse précédente. Ne répète aucun passage et ne réintroduis pas le sujet. Termine complètement ta réponse dans la même langue et le même format.",
          },
        ];
      }
      // Une sortie déjà obtenue est plus utile qu’un échec de la requête de continuation.
      if (fullText) return fullText + TRUNCATION_NOTICE;
    } catch (err) {
      lastErr = err;
      if (fullText) return fullText + TRUNCATION_NOTICE;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("échec IA");
}
