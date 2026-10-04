// Client Redis minimal (API REST d'Upstash), sans dépendance.
const URL = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

export const hasRedis = Boolean(URL && TOKEN);

export async function redis(...cmd: (string | number)[]): Promise<unknown> {
  if (!URL || !TOKEN) return null;
  const res = await fetch(URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(cmd),
  });
  if (!res.ok) throw new Error(`Redis HTTP ${res.status}`);
  return ((await res.json()) as { result: unknown }).result;
}

/** Réserve une clé une seule fois. Renvoie true si c'est la première fois. */
export async function claimOnce(key: string, ttlSeconds: number): Promise<boolean> {
  if (!hasRedis) return true;
  return (await redis("SET", key, "1", "NX", "EX", ttlSeconds)) === "OK";
}

/** Limite de messages par utilisateur (protège ton crédit OpenRouter). */
export async function rateLimited(id: string, max = 20, windowSec = 3600): Promise<boolean> {
  const n = Number(await redis("INCR", `rl:${id}`));
  if (n === 1) await redis("EXPIRE", `rl:${id}`, windowSec);
  return n > max;
}
