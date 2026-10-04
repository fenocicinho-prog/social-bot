// Équivalent de call_openrouter() dans agent.py : essaie chaque modèle, avec nouvel essai sur 429.
export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

const API_URL = process.env.OPENROUTER_URL ?? "https://openrouter.ai/api/v1/chat/completions";
const MAX_ATTEMPTS_PER_MODEL = 3;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function askAI(
  messages: ChatMsg[],
  opts: { maxTokens?: number; temperature?: number } = {},
): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY manquante");
  const models = (process.env.OPENROUTER_MODEL ?? "openrouter/auto")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  let lastErr: unknown = new Error("aucun modèle configuré");
  for (const model of models) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt++) {
      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "X-Title": "Cicinho Social Bot" },
          body: JSON.stringify({
            model,
            messages,
            temperature: opts.temperature ?? 0.3,
            max_tokens: opts.maxTokens ?? 600,
          }),
          signal: AbortSignal.timeout(40_000),
        });
        if (res.status === 429) {
          lastErr = new Error("OpenRouter 429 (quota/débit)");
          await sleep(1000 * 2 ** (attempt - 1));
          continue;
        }
        if (!res.ok) {
          lastErr = new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 300)}`);
          break; // modèle suivant
        }
        const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) return text;
        lastErr = new Error("réponse vide");
        break;
      } catch (err) {
        lastErr = err;
        break;
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("échec IA");
}
