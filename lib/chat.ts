import { askAI, type ChatMsg } from "./ai";
import { CONTACT, CUSTOMER_SYSTEM, DAILY_MESSAGE_LIMIT, QUOTA_EXHAUSTED_MESSAGE, quotaWarning } from "./business";
import { dailyQuota, rateLimited, redis } from "./redis";

// En dessous de ce seuil (messages restants), on ajoute un petit rappel à la réponse.
const QUOTA_WARNING_THRESHOLD = 20;

async function loadHistory(key: string): Promise<ChatMsg[]> {
  try {
    const raw = await redis("GET", `h:${key}`);
    return raw ? (JSON.parse(String(raw)) as ChatMsg[]) : [];
  } catch {
    return [];
  }
}

async function saveHistory(key: string, history: ChatMsg[]) {
  try {
    await redis("SET", `h:${key}`, JSON.stringify(history.slice(-10)), "EX", 86400);
  } catch {
    /* l'historique est un bonus, jamais bloquant */
  }
}

/** Répond à un client. Ne lève jamais d'erreur : renvoie toujours un texte à envoyer. */
export async function answer(userKey: string, text: string): Promise<string> {
  try {
    // Quota quotidien : protège le crédit IA et oriente vers Mini Copilot une fois épuisé.
    const quota = await dailyQuota(userKey, DAILY_MESSAGE_LIMIT);
    if (quota.blocked) return QUOTA_EXHAUSTED_MESSAGE;

    if (await rateLimited(userKey)) {
      return `Vous avez envoyé beaucoup de messages. Réessayez dans un moment ou contactez-nous directement : ${CONTACT}`;
    }
    const history = await loadHistory(userKey);
    const userText = text.slice(0, 2000);
    let reply = await askAI(
      [{ role: "system", content: CUSTOMER_SYSTEM }, ...history, { role: "user", content: userText }],
      { maxTokens: 600 },
    );
    const remaining = DAILY_MESSAGE_LIMIT - quota.count;
    if (remaining > 0 && remaining <= QUOTA_WARNING_THRESHOLD) {
      reply += quotaWarning(remaining);
    }
    await saveHistory(userKey, [...history, { role: "user", content: userText }, { role: "assistant", content: reply }]);
    return reply;
  } catch (err) {
    console.error("answer() a échoué", err);
    return `Désolé, petit souci technique. Réessayez dans un instant ou contactez-nous : ${CONTACT}`;
  }
}
