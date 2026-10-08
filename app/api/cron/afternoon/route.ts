import { SERVICE_URL } from "@/lib/business";
import { authorized, madagascarDateKey, madagascarNow } from "@/lib/cron";
import { factOfTheDay } from "@/lib/facts";
import { postPngAlbumToPage, postPngToPage } from "@/lib/meta";
import { claimFirstUnseen, fetchNews, findFirstUnseen, guessIcon, markPosted, publisherSummary } from "@/lib/news";
import { buildNewsPages } from "@/lib/news-cards";
import { renderOgPng } from "@/lib/og-render";
import { claimOnce, hasRedis, redis } from "@/lib/redis";

export const maxDuration = 60;
const TECH_QUERY = process.env.TECH_QUERY ?? 'informatique OR technologie OR "intelligence artificielle" OR science';
const tail = () => (SERVICE_URL ? `\n\n${SERVICE_URL}` : "");

function captionForNews(headline: string, summary: string, source: string, link: string) {
  return [
    headline,
    summary && summary !== headline ? summary : "",
    source ? `Source : ${source}` : "",
    link,
    SERVICE_URL,
  ].filter(Boolean).join("\n\n");
}

async function postFact(dayNumber: number, dry: boolean) {
  const fact = factOfTheDay(dayNumber);
  const caption = `Le saviez-vous ?\n\n${fact.title}\n\n${fact.text}${tail()}\n\n#LeSaviezVous #Science #Informatique`;
  const png = await renderOgPng({ tag: "Le saviez-vous ?", title: fact.title, body: fact.text, icon: fact.icon, theme: "fact" });
  if (!dry) await postPngToPage(png, caption);
  return {
    posted: "fait",
    title: fact.title,
    text: fact.text,
    caption,
    imageCount: 1,
    images: [{ page: 1, contentType: "image/png", width: 1080, height: 1350, bytes: png.byteLength }],
  };
}

async function postTechNews(dry: boolean) {
  const items = await fetchNews(TECH_QUERY);
  const pick = dry ? await findFirstUnseen(items) : await claimFirstUnseen(items);
  if (!pick) return null;
  const { item, headline, seenKey } = pick;
  try {
    const summary = publisherSummary(item, headline);
    const caption = captionForNews(headline, summary, item.source, item.link);
    const pages = buildNewsPages({
      tag: "Tech & science",
      title: headline,
      summary: summary && summary !== headline ? summary : "",
      source: item.source,
      icon: guessIcon(headline, "chip"),
      theme: "tech",
    });
    const images: Uint8Array[] = [];
    for (const page of pages) images.push(await renderOgPng(page));
    if (!dry) {
      if (images.length === 1) await postPngToPage(images[0], caption);
      else await postPngAlbumToPage(images, caption);
      await markPosted();
    }
    return {
      posted: "actualité",
      headline,
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
    };
  } catch (err) {
    if (!dry) await redis("DEL", seenKey).catch(() => undefined);
    throw err;
  }
}

export async function GET(req: Request) {
  if (!authorized(req)) return new Response("Unauthorized", { status: 401 });
  const dry = new URL(req.url).searchParams.get("dry") === "1";
  const slotKey = `post:afternoon:${madagascarDateKey()}`;
  if (!dry && !(await claimOnce(slotKey, 86400))) return Response.json({ skipped: "déjà publié aujourd'hui" });

  try {
    const dayNumber = Math.floor(madagascarNow().getTime() / 86_400_000);
    const newsDay = dayNumber % 2 === 0;
    if (newsDay && hasRedis) {
      try {
        const news = await postTechNews(dry);
        if (news) return Response.json({ ...news, dry, published: !dry });
      } catch (err) {
        console.error("afternoon: actualité indisponible, repli sur le fait du jour", err);
      }
    }
    return Response.json({ ...(await postFact(dayNumber, dry)), dry, published: !dry });
  } catch (err) {
    if (!dry) await redis("DEL", slotKey).catch(() => undefined);
    console.error("afternoon a échoué", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
