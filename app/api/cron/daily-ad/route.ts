import { ANNOUNCEMENTS } from "@/content/announcements";
import { formatAlbumCaption } from "@/lib/announcement";
import { authorized, madagascarDateKey, madagascarNow } from "@/lib/cron";
import { postToPage } from "@/lib/meta";
import { claimOnce, redis } from "@/lib/redis";

export const maxDuration = 60;

export async function GET(req: Request) {
  if (!authorized(req)) return new Response("Unauthorized", { status: 401 });
  const dry = new URL(req.url).searchParams.get("dry") === "1";
  const dayKey = `ad:${madagascarDateKey()}`;
  if (!dry && !(await claimOnce(dayKey, 86400))) {
    return Response.json({ skipped: "annonce déjà publiée aujourd'hui" });
  }

  try {
    const announcement = ANNOUNCEMENTS[madagascarNow().getUTCDay()];
    const text = formatAlbumCaption(announcement, 1);

    if (dry) {
      return Response.json({
        dry: true,
        published: false,
        tag: announcement.tag,
        title: announcement.title,
        text,
        caption: text,
        imageCount: 0,
        images: [],
      });
    }

    await postToPage(text);
    await redis("LPUSH", "ad:recent", announcement.title);
    await redis("LTRIM", "ad:recent", 0, 6);
    return Response.json({ posted: true, tag: announcement.tag, title: announcement.title, imageCount: 0 });
  } catch (err) {
    if (!dry) await redis("DEL", dayKey).catch(() => undefined);
    console.error("daily-ad a échoué", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
