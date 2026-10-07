import { SERVICE_URL } from "@/lib/business";
import { authorized, madagascarDateKey } from "@/lib/cron";
import { postPhotoToPage } from "@/lib/meta";
import { claimFirstUnseen, describe, fetchNews, guessIcon, markPosted } from "@/lib/news";
import { ogUrl } from "@/lib/og";
import { claimOnce, hasRedis, redis } from "@/lib/redis";

export const maxDuration = 60;

// 12 h (Madagascar) : l'actualité la plus importante du moment, avec une image et une description.
const QUERY = process.env.NEWS_QUERY ?? "Madagascar";

export async function GET(req: Request) {
  if (!authorized(req)) return new Response("Unauthorized", { status: 401 });
  if (!hasRedis) return Response.json({ error: "Redis requis (anti-doublons)" }, { status: 500 });

  const slotKey = `post:noon:${madagascarDateKey()}`;
  if (!(await claimOnce(slotKey, 86400))) return Response.json({ skipped: "déjà publié aujourd'hui" });

  let seenKey: string | undefined;
  try {
    const pick = await claimFirstUnseen(await fetchNews(QUERY));
    if (!pick) {
      await redis("DEL", slotKey); // on pourra réessayer plus tard dans la journée
      return Response.json({ skipped: "aucune nouvelle info" });
    }
    seenKey = pick.seenKey;
    const { item, headline } = pick;

    const description = await describe(headline);
    const caption =
      `📰 ${description || headline}` +
      (item.source ? `\n\nSource : ${item.source}` : "") +
      `\n🔗 ${item.link}` +
      (SERVICE_URL ? `\n\n👉 ${SERVICE_URL}` : "");

    await postPhotoToPage(
      ogUrl({
        tag: "À la une",
        title: headline,
        body: description,
        icon: guessIcon(headline, "news"),
        theme: "news",
        src: item.source ? `Source : ${item.source}` : "",
      }),
      caption,
    );
    await markPosted();
    return Response.json({ posted: headline });
  } catch (err) {
    await redis("DEL", slotKey).catch(() => undefined);
    if (seenKey) await redis("DEL", seenKey).catch(() => undefined); // l'actualité pourra être reprise
    console.error("noon a échoué", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
