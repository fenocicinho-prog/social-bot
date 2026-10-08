import { SERVICE_URL } from "@/lib/business";
import { authorized, madagascarDateKey } from "@/lib/cron";
import { postPngToPage } from "@/lib/meta";
import { claimFirstUnseen, fetchNews, findFirstUnseen, guessIcon, markPosted, publisherSummary } from "@/lib/news";
import { buildNewsPages } from "@/lib/news-cards";
import { renderOgPng } from "@/lib/og-render";
import { postPngAlbumToPage } from "@/lib/meta";
import { claimOnce, hasRedis, redis } from "@/lib/redis";

export const maxDuration = 60;
const QUERY = process.env.NEWS_QUERY ?? "Madagascar";

export async function GET(req: Request) {
  if (!authorized(req)) return new Response("Unauthorized", { status: 401 });
  const dry = new URL(req.url).searchParams.get("dry") === "1";
  if (!dry && !hasRedis) return Response.json({ error: "Redis requis (anti-doublons)" }, { status: 500 });

  const slotKey = `post:noon:${madagascarDateKey()}`;
  if (!dry && !(await claimOnce(slotKey, 86400))) return Response.json({ skipped: "déjà publié aujourd'hui" });

  let seenKey: string | undefined;
  try {
    const items = await fetchNews(QUERY);
    const pick = dry ? await findFirstUnseen(items) : await claimFirstUnseen(items);
    if (!pick) {
      if (!dry) await redis("DEL", slotKey);
      return Response.json({ skipped: "aucune nouvelle info", dry, published: false });
    }
    seenKey = pick.seenKey;
    const { item, headline } = pick;
    const summary = publisherSummary(item, headline);
    const captionParts = [headline, summary && summary !== headline ? summary : ""];
    if (item.source) captionParts.push(`Source : ${item.source}`);
    captionParts.push(item.link);
    if (SERVICE_URL) captionParts.push(SERVICE_URL);
    const caption = captionParts.filter(Boolean).join("\n\n");
    const pages = buildNewsPages({
      tag: "À la une",
      title: headline,
      summary: summary && summary !== headline ? summary : "",
      source: item.source,
      icon: guessIcon(headline, "news" as const),
      theme: "news" as const,
    });
    const images: Uint8Array[] = [];
    for (const page of pages) images.push(await renderOgPng(page));

    if (dry) {
      return Response.json({
        dry: true,
        published: false,
        title: headline,
        summary,
        source: item.source,
        link: item.link,
        caption,
        imageCount: images.length,
        images: images.map((image, index) => ({
          page: index + 1,
          totalPages: images.length,
          contentType: "image/png",
          width: 1080,
          height: 1350,
          bytes: image.byteLength,
          text: pages[index].plainText,
        })),
      });
    }

    if (images.length === 1) await postPngToPage(images[0], caption);
    else await postPngAlbumToPage(images, caption);
    await markPosted();
    return Response.json({ posted: headline, imageCount: images.length });
  } catch (err) {
    if (!dry) {
      await redis("DEL", slotKey).catch(() => undefined);
      if (seenKey) await redis("DEL", seenKey).catch(() => undefined);
    }
    console.error("noon a échoué", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
