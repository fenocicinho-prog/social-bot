import { createHash } from "node:crypto";
import { askAI } from "@/lib/ai";
import { authorized, madagascarDateKey, madagascarNow } from "@/lib/cron";
import { postToPage } from "@/lib/meta";
import { parseRss } from "@/lib/news";
import { claimOnce, hasRedis, redis } from "@/lib/redis";

export const maxDuration = 60;

const QUERY = process.env.NEWS_QUERY ?? "Madagascar";
const MAX_PER_DAY = Number(process.env.NEWS_MAX_PER_DAY ?? 6); // limite quotidienne (reste prudente pour Facebook)
const MIN_GAP_MIN = Number(process.env.NEWS_MIN_GAP_MIN ?? 90); // écart minimal entre deux publications
const USE_AI = process.env.NEWS_USE_AI !== "0";

export async function GET(req: Request) {
  if (!authorized(req)) return new Response("Unauthorized", { status: 401 });
  if (!hasRedis) return Response.json({ error: "Redis requis (anti-doublons)" }, { status: 500 });

  // Pas de publication la nuit (heure de Madagascar)
  const hour = madagascarNow().getUTCHours();
  if (hour < 6 || hour >= 22) return Response.json({ skipped: "nuit" });

  // Garde-fous : écart minimal + quota journalier
  if (await redis("EXISTS", "news:gap")) return Response.json({ skipped: "trop tôt depuis la dernière publication" });
  const dayKey = `news:day:${madagascarDateKey()}`;
  if (Number((await redis("GET", dayKey)) ?? 0) >= MAX_PER_DAY) return Response.json({ skipped: "quota du jour atteint" });

  const feedUrl =
    `https://news.google.com/rss/search?q=${encodeURIComponent(`${QUERY} when:1d`)}&hl=fr&gl=MG&ceid=MG:fr`;
  const res = await fetch(feedUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) return Response.json({ error: `Google News HTTP ${res.status}` }, { status: 502 });
  const items = parseRss(await res.text());

  for (const item of items) {
    if (!item.title || !item.link) continue;
    const headline = item.title.replace(/\s+-\s+[^-]+$/, "").trim(); // retire " - Source"
    const id = createHash("sha1").update(headline.toLowerCase()).digest("hex").slice(0, 16);
    if (!(await claimOnce(`news:seen:${id}`, 7 * 86400))) continue; // déjà vu

    try {
      let text = `📰 ${headline}`;
      if (USE_AI) {
        try {
          const intro = await askAI(
            [
              {
                role: "system",
                content:
                  "Tu rédiges un court post Facebook (1 à 2 phrases, français) à partir d'un titre d'actualité. " +
                  "N'ajoute AUCUN fait, chiffre, nom ou détail absent du titre. Ton neutre et factuel. " +
                  "Réponds uniquement avec le texte du post, sans guillemets.",
              },
              { role: "user", content: headline },
            ],
            { maxTokens: 150, temperature: 0.3 },
          );
          text = `📰 ${intro}`;
        } catch {
          /* repli : le titre seul */
        }
      }
      if (item.source) text += `\n\nSource : ${item.source}`;

      await postToPage(text, item.link);
      await redis("SET", "news:gap", "1", "EX", MIN_GAP_MIN * 60);
      if (Number(await redis("INCR", dayKey)) === 1) await redis("EXPIRE", dayKey, 172800);
      return Response.json({ posted: headline });
    } catch (err) {
      await redis("DEL", `news:seen:${id}`).catch(() => undefined); // on pourra réessayer
      console.error("news: publication échouée", err);
      return Response.json({ error: String(err) }, { status: 500 });
    }
  }
  return Response.json({ skipped: "aucune nouvelle info" });
}
