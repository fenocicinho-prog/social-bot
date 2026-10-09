import { ANNOUNCEMENTS } from "@/content/announcements";
import { buildAnnouncementPages } from "@/lib/announcement";
import { authorized, madagascarDateKey, madagascarNow } from "@/lib/cron";
import { postPngAlbumToPage, postPngToPage } from "@/lib/meta";
import { renderOgPng } from "@/lib/og-render";
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
    const { pages, caption, text } = buildAnnouncementPages(announcement);
    const images: Uint8Array[] = [];
    for (const page of pages) images.push(await renderOgPng(page));

    if (dry) {
      return Response.json({
        dry: true,
        published: false,
        tag: announcement.tag,
        title: announcement.title,
        text,
        caption,
        imageCount: images.length,
        images: images.map((image, index) => ({
          page: index + 1,
          totalPages: images.length,
          contentType: "image/png",
          width: 1080,
          height: 1350,
          bytes: image.byteLength,
          title: pages[index].title,
          text: pages[index].plainText,
        })),
      });
    }

    if (images.length === 1) {
      await postPngToPage(images[0], caption);
    } else {
      await postPngAlbumToPage(images, caption);
    }
    await redis("LPUSH", "ad:recent", announcement.title);
    await redis("LTRIM", "ad:recent", 0, 6);
    return Response.json({ posted: true, tag: announcement.tag, title: announcement.title, imageCount: images.length });
  } catch (err) {
    if (!dry) await redis("DEL", dayKey).catch(() => undefined);
    console.error("daily-ad a échoué", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
