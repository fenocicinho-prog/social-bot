import { askAI, type ChatMsg } from "./ai";
import { CONTACT, CUSTOMER_SYSTEM } from "./business";
import { rateLimited, redis } from "./redis";

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
    if (await rateLimited(userKey)) {
      return `Vous avez envoyé beaucoup de messages. Réessayez dans un moment ou contactez-nous directement : ${CONTACT}`;
    }
    const history = await loadHistory(userKey);
    const userText = text.slice(0, 2000);
    const reply = await askAI(
      [{ role: "system", content: CUSTOMER_SYSTEM }, ...history, { role: "user", content: userText }],
      { maxTokens: 600 },
    );
    await saveHistory(userKey, [...history, { role: "user", content: userText }, { role: "assistant", content: reply }]);
    return reply;
  } catch (err) {
    console.error("answer() a échoué", err);
    return `Désolé, petit souci technique. Réessayez dans un instant ou contactez-nous : ${CONTACT}`;
  }
}
