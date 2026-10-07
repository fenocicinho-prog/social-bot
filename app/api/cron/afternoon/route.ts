import { SERVICE_URL } from "@/lib/business";
import { authorized, madagascarDateKey, madagascarNow } from "@/lib/cron";
import { factOfTheDay } from "@/lib/facts";
import { postPhotoToPage } from "@/lib/meta";
import { claimFirstUnseen, describe, fetchNews, guessIcon, markPosted } from "@/lib/news";
import { ogUrl } from "@/lib/og";
import { claimOnce, hasRedis, redis } from "@/lib/redis";

export const maxDuration = 60;

// 16 h (Madagascar) : un jour sur deux une actualité informatique/science, l'autre jour « Le saviez-vous ? ».
// Si l'actualité est introuvable, on publie le « Le saviez-vous ? » à la place : il y a toujours une publication.
const TECH_QUERY = process.env.TECH_QUERY ?? 'informatique OR technologie OR "intelligence artificielle" OR science';

const tail = () => (SERVICE_URL ? `\n\n👉 ${SERVICE_URL}` : "");

async function postFact(dayNumber: number) {
  const fact = factOfTheDay(dayNumber);
  await postPhotoToPage(
    ogUrl({ tag: "Le saviez-vous ?", title: fact.title, body: fact.text, icon: fact.icon, theme: "fact" }),
    `💡 Le saviez-vous ?\n\n${fact.title}\n${fact.text}${tail()}\n\n#LeSaviezVous #Science #Informatique`,
  );
  return fact.title;
}

async function postTechNews(): Promise<string | null> {
  const pick = await claimFirstUnseen(await fetchNews(TECH_QUERY));
  if (!pick) return null;
  const { item, headline, seenKey } = pick;
  try {
    const description = await describe(headline);
    await postPhotoToPage(
      ogUrl({
        tag: "Tech & science",
        title: headline,
        body: description,
        icon: guessIcon(headline, "chip"),
        theme: "tech",
        src: item.source ? `Source : ${item.source}` : "",
      }),
      `🔬 ${description || headline}` +
        (item.source ? `\n\nSource : ${item.source}` : "") +
        `\n🔗 ${item.link}${tail()}\n\n#Informatique #Science #Technologie`,
    );
    await markPosted();
    return headline;
  } catch (err) {
    await redis("DEL", seenKey).catch(() => undefined); // l'actualité pourra être reprise
    throw err;
  }
}

export async function GET(req: Request) {
  if (!authorized(req)) return new Response("Unauthorized", { status: 401 });

  const slotKey = `post:afternoon:${madagascarDateKey()}`;
  if (!(await claimOnce(slotKey, 86400))) return Response.json({ skipped: "déjà publié aujourd'hui" });

  try {
    const dayNumber = Math.floor(madagascarNow().getTime() / 86_400_000);
    const newsDay = dayNumber % 2 === 0;

    if (newsDay && hasRedis) {
      // Une panne de Google Actualités ne doit pas supprimer la publication : on retombe sur le « saviez-vous ».
      const headline = await postTechNews().catch((err) => {
        console.error("afternoon: actualité indisponible, repli sur le fait du jour", err);
        return null;
      });
      if (headline) return Response.json({ posted: "actualité", headline });
    }
    return Response.json({ posted: "fait", title: await postFact(dayNumber) });
  } catch (err) {
    await redis("DEL", slotKey).catch(() => undefined);
    console.error("afternoon a échoué", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
