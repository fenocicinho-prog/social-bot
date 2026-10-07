import { createHash } from "node:crypto";
import { askAI } from "./ai";
import { madagascarDateKey } from "./cron";
import type { OgIcon } from "./og";
import { claimOnce, redis } from "./redis";

export type NewsItem = { title: string; link: string; pubDate: string; source: string };

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1].replace(/^<!\[CDATA\[|\]\]>$/g, "")).trim() : "";
}

export function parseRss(xml: string): NewsItem[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => ({
    title: tag(m[1], "title"),
    link: tag(m[1], "link"),
    pubDate: tag(m[1], "pubDate"),
    source: tag(m[1], "source"),
  }));
}

/** Google Actualités : les résultats sont déjà classés par pertinence (les plus importants en premier). */
export async function fetchNews(query: string): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} when:1d`)}&hl=fr&gl=MG&ceid=MG:fr`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Google News HTTP ${res.status}`);
  return parseRss(await res.text());
}

/** Retire " - Nom du média" à la fin du titre. */
export const headlineOf = (title: string) => title.replace(/\s+-\s+[^-]+$/, "").trim();

/**
 * Prend la première actualité jamais publiée et la réserve (même clé que la route /api/cron/news :
 * une actualité n'est donc jamais publiée deux fois, quelle que soit la route).
 */
export async function claimFirstUnseen(items: NewsItem[]): Promise<{ item: NewsItem; headline: string; seenKey: string } | null> {
  for (const item of items) {
    if (!item.title || !item.link) continue;
    const headline = headlineOf(item.title);
    const id = createHash("sha1").update(headline.toLowerCase()).digest("hex").slice(0, 16);
    const seenKey = `news:seen:${id}`;
    if (await claimOnce(seenKey, 7 * 86400)) return { item, headline, seenKey };
  }
  return null;
}

/** Courte description à partir du titre seul. Renvoie "" si l'IA est indisponible (on publie alors le titre seul). */
export async function describe(headline: string): Promise<string> {
  if (process.env.NEWS_USE_AI === "0") return "";
  try {
    const text = await askAI(
      [
        {
          role: "system",
          content:
            "Tu rédiges une courte description (1 à 2 phrases, 200 caractères maximum, français) à partir d'un titre d'actualité, " +
            "pour accompagner une image. N'ajoute AUCUN fait, chiffre, nom, lieu ou détail absent du titre. " +
            "Ton neutre et factuel, sans emoji. Réponds uniquement avec le texte, sans guillemets.",
        },
        { role: "user", content: headline },
      ],
      { maxTokens: 150, temperature: 0.3 },
    );
    return text.replace(/^["«\s]+|["»\s]+$/g, "").slice(0, 260);
  } catch {
    return "";
  }
}

/** Compte la publication dans le quota du jour et déclenche l'écart minimal de la route /api/cron/news. */
export async function markPosted(): Promise<void> {
  const gapMin = Number(process.env.NEWS_MIN_GAP_MIN ?? 90);
  await redis("SET", "news:gap", "1", "EX", gapMin * 60).catch(() => undefined);
  const dayKey = `news:day:${madagascarDateKey()}`;
  if (Number(await redis("INCR", dayKey).catch(() => 0)) === 1) await redis("EXPIRE", dayKey, 172800).catch(() => undefined);
}

/** Choisit le pictogramme selon le sujet du titre, pour que l'image « ressemble » à l'annonce. */
export function guessIcon(text: string, fallback: OgIcon = "news"): OgIcon {
  const t = text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const rules: [RegExp, OgIcon][] = [
    [/cyber|pirat|piratage|hacker|fuite de donnees|faille/, "shield"],
    [/intelligence artificielle|\bia\b|logiciel|application|internet|numerique|informatique|ordinateur|smartphone|robot|puce|processeur|reseau|google|apple|microsoft|meta\b|openai/, "chip"],
    [/scien|recherche|etude|nasa|spatial|fusee|planete|astro|climat|biolog|medec|vaccin|virus|maladie|decouverte|fossile/, "science"],
    [/econom|marche|prix|inflation|banque|budget|ariary|dollar|euro|fmi|commerce|export|entreprise|investis|croissance/, "coins"],
    [/environnement|cyclone|foret|biodiversite|nature|agricul|peche|lemurien|reserve|sechere|pluie|inondation/, "leaf"],
    [/securite|police|justice|tribunal|arrest|gendarm|enquete|vol\b/, "shield"],
  ];
  return rules.find(([re]) => re.test(t))?.[1] ?? fallback;
}
