import { askAI } from "@/lib/ai";
import {
  BUSINESS_NAME, CONTACT, HONESTY, MINI_COPILOT, REFERENCES, SERVICES, SERVICE_URL,
} from "@/lib/business";
import { authorized, madagascarDateKey, madagascarNow } from "@/lib/cron";
import { postPhotoToPage } from "@/lib/meta";
import { ogUrl, type OgIcon } from "@/lib/og";
import { claimOnce, redis } from "@/lib/redis";

export const maxDuration = 60;

// Un angle différent chaque jour de la semaine (0 = dimanche). "tag" s'affiche sur la carte.
const ANGLES: { tag: string; icon: OgIcon; brief: string }[] = [
  { tag: "Mini Copilot", icon: "code", brief: "Mini Copilot, assistant IA de développement (la version Windows est en préparation)" },
  { tag: "Sites web", icon: "news", brief: "Un site de présentation : être visible et crédible en ligne" },
  { tag: "E-commerce", icon: "coins", brief: "Une plateforme de vente en ligne, avec Ny Herin'ny Boky comme exemple réel" },
  { tag: "Applications", icon: "phone", brief: "Une application web ou mobile sur mesure" },
  { tag: "Chatbot IA", icon: "chat", brief: "Un chatbot IA sur Messenger et WhatsApp pour répondre aux clients sans attendre" },
  { tag: "Visibilité", icon: "shield", brief: "Pourquoi un site professionnel plutôt qu'une simple page Facebook" },
  { tag: "Made in Madagascar", icon: "book", brief: "Ny Herin'ny Boky : vendre et acheter des livres malagasy en ligne" },
];

type Ad = { title: string; body: string; points: string[]; caption: string };

function parseAd(raw: string, fallbackTitle: string): Ad {
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      const o = JSON.parse(m[0]) as Partial<Ad>;
      if (o.title && o.caption) {
        return {
          title: String(o.title).trim(),
          body: String(o.body ?? "").trim(),
          points: Array.isArray(o.points) ? o.points.map((x) => String(x).replace(/^[•\-\s]+/, "").trim()).filter(Boolean) : [],
          caption: String(o.caption).trim(),
        };
      }
    } catch {
      /* repli ci-dessous */
    }
  }
  return { title: fallbackTitle, body: "", points: [], caption: raw.trim() };
}

export async function GET(req: Request) {
  if (!authorized(req)) return new Response("Unauthorized", { status: 401 });

  const dayKey = `ad:${madagascarDateKey()}`;
  if (!(await claimOnce(dayKey, 86400))) return Response.json({ skipped: "annonce déjà publiée aujourd'hui" });

  try {
    const angle = ANGLES[madagascarNow().getUTCDay()];
    const recent = ((await redis("LRANGE", "ad:recent", 0, 4)) as string[] | null) ?? [];

    const raw = await askAI(
      [
        {
          role: "system",
          content: `Tu rédiges l'annonce du matin de ${BUSINESS_NAME} pour sa Page Facebook. Elle sera publiée avec une carte image.
Réponds UNIQUEMENT avec un objet JSON : {"title":"...","body":"...","points":["...","...","..."],"caption":"..."}
- "title" : phrase d'accroche affichée en grand sur l'image, 70 caractères maximum, sans emoji, sans guillemets.
- "body" : 1 à 2 phrases qui expliquent l'idée, 150 caractères maximum, affichées sous le titre sur l'image, sans emoji.
- "points" : exactement 3 avantages concrets, 50 caractères maximum chacun, sans emoji, sans puce ni tiret au début.
- "caption" : texte du post en français simple et chaleureux, 50 à 100 mots, structuré en lignes courtes :
  une accroche, puis 2 à 3 lignes qui commencent par "•", puis un appel à l'action avec ce contact : ${CONTACT}.
  2 à 3 emojis maximum, 3 hashtags maximum, des sauts de ligne entre les blocs (écris \\n dans le JSON).
- ${HONESTY}
Appuie-toi uniquement sur ces informations :
Services :
${SERVICES}
Réalisations :
${REFERENCES}
Mini Copilot :
${MINI_COPILOT}`,
        },
        {
          role: "user",
          content:
            `Angle du jour : ${angle.brief}.` +
            (recent.length ? `\n\nAnnonces récentes à ne PAS répéter (change l'accroche et la formulation) :\n- ${recent.join("\n- ")}` : ""),
        },
      ],
      { maxTokens: 600, temperature: 0.8 },
    );

    const ad = parseAd(raw, angle.tag);
    const title = ad.title.slice(0, 90);
    const caption = SERVICE_URL ? `${ad.caption}\n\n👉 ${SERVICE_URL}` : ad.caption;

    await postPhotoToPage(
      ogUrl({ tag: angle.tag, title, body: ad.body, points: ad.points, icon: angle.icon, theme: "ad" }),
      caption,
    );
    await redis("LPUSH", "ad:recent", title);
    await redis("LTRIM", "ad:recent", 0, 6);
    return Response.json({ posted: true, tag: angle.tag, title });
  } catch (err) {
    await redis("DEL", dayKey).catch(() => undefined); // permet de réessayer
    console.error("daily-ad a échoué", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
