import { DEMO_CARDS } from "@/lib/demo-data";
import { renderOgPng } from "@/lib/og-render";

export const runtime = "nodejs";

// Vitrine publique : n'accepte qu'un index de carte prédéfinie, aucun texte libre
// (donc aucun risque d'abus, contrairement à /api/og qui est signé).
export async function GET(req: Request) {
  const i = Number(new URL(req.url).searchParams.get("i"));
  const card = Number.isInteger(i) ? DEMO_CARDS[i] : undefined;
  if (!card) return new Response("Not found", { status: 404 });
  const png = Uint8Array.from(await renderOgPng(card));
  return new Response(png.buffer as ArrayBuffer, {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
  });
}
