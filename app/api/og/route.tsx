import { readOg } from "@/lib/og";
import { renderOgPng } from "@/lib/og-render";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const card = readOg(new URL(req.url).searchParams);
  if (!card) return new Response("Forbidden", { status: 403 });

  const png = await renderOgPng(card);
  const body = Uint8Array.from(png);
  return new Response(body.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
