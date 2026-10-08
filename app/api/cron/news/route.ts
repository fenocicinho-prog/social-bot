import { SERVICE_URL } from "@/lib/business";
import { authorized, madagascarDateKey, madagascarNow } from "@/lib/cron";
import { postToPage } from "@/lib/meta";
import { claimFirstUnseen, findFirstUnseen, parseRss, publisherSummary } from "@/lib/news";
import { hasRedis, redis } from "@/lib/redis";

export const maxDuration = 60;
const QUERY = process.env.NEWS_QUERY ?? "Madagascar";
const MAX_PER_DAY = Number(process.env.NEWS_MAX_PER_DAY ?? 6);
const MIN_GAP_MIN = Number(process.env.NEWS_MIN_GAP_MIN ?? 90);

export async function GET(req: Request) {
  if (!authorized(req)) return new Response("Unauthorized", { status: 401 });
  const dry = new URL(req.url).searchParams.get("dry") === "1";
  if (!dry && !hasRedis) return Response.json({ error: "Redis requis (anti-doublons)" }, { status: 500 });

  const hour = madagascarNow().getUTCHours();
  if (hour < 6 || hour >= 22) return Response.json({ skipped: "nuit", dry, published: false, imageCount: 0 });

  if (hasRedis) {
    if (await redis("EXISTS", "news:gap")) {
      return Response.json({ skipped: "trop tôt depuis la dernière publication", dry, published: false, imageCount: 0 });
    }
    const dayKey = `news:day:${madagascarDateKey()}`;
    if (Number((await redis("GET", dayKey)) ?? 0) >= MAX_PER_DAY) {
      return Response.json({ skipped: "quota du jour atteint", dry, published: false, imageCount: 0 });
    }
  }

  const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(`${QUERY} when:1d`)}&hl=fr&gl=MG&ceid=MG:fr`;
  const res = await fetch(feedUrl, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) return Response.json({ error: `Google News HTTP ${res.status}` }, { status: 502 });
  const items = parseRss(await res.text());
  const pick = dry ? await findFirstUnseen(items) : await claimFirstUnseen(items);
  if (!pick) return Response.json({ skipped: "aucune nouvelle info", dry, published: false, imageCount: 0 });

  const { item, headline } = pick;
  const summary = publisherSummary(item, headline);
  const message = [headline, summary && summary !== headline ? summary : "", item.source ? `Source : ${item.source}` : ""]
    .filter(Boolean)
    .join("\n\n");
  const caption = `${message}\n\n${item.link}${SERVICE_URL ? `\n\n${SERVICE_URL}` : ""}`;
  if (dry) {
    return Response.json({
      dry: true,
      published: false,
      title: headline,
      summary,
      source: item.source,
      link: item.link,
      text: message,
      caption,
      imageCount: 0,
      images: [],
    });
  }

  const seenKey = pick.seenKey;
  try {
    await postToPage(message, item.link);
    await redis("SET", "news:gap", "1", "EX", MIN_GAP_MIN * 60);
    const dayKey = `news:day:${madagascarDateKey()}`;
    if (Number(await redis("INCR", dayKey)) === 1) await redis("EXPIRE", dayKey, 172800);
    return Response.json({ posted: headline, published: true, imageCount: 0 });
  } catch (err) {
    await redis("DEL", seenKey).catch(() => undefined);
    console.error("news: publication échouée", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
