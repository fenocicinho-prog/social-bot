import { createHash } from "node:crypto";
import { madagascarDateKey } from "./cron";
import type { OgIcon } from "./og";
import { claimOnce, hasRedis, redis } from "./redis";

export type NewsItem = { title: string; link: string; pubDate: string; source: string; summary: string };

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

function cleanSummary(raw: string): string {
  return decode(
    decode(raw.replace(/^<!\[CDATA\[|\]\]>$/g, ""))
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
      .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16))),
  ).replace(/\s+/g, " ").replace(/\s+([,.;!?])/g, "$1").trim();
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? cleanSummary(m[1]) : "";
}

export function parseRss(xml: string): NewsItem[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => ({
    title: tag(m[1], "title"),
    link: tag(m[1], "link"),
    pubDate: tag(m[1], "pubDate"),
    source: tag(m[1], "source"),
    summary: cleanSummary(tag(m[1], "description")),
  }));
}

function comparable(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

/** Retourne uniquement un vrai résumé éditorial, pas la répétition titre + source de Google RSS. */
export function publisherSummary(item: Pick<NewsItem, "summary" | "source">, headline: string): string {
  const summary = item.summary.trim();
  if (!summary) return "";
  const cleanHeadline = headlineOf(headline);
  const candidate = comparable(summary);
  const title = comparable(cleanHeadline);
  const source = comparable(item.source);
  if (candidate === title || (source && candidate === `${title} ${source}`)) return "";
  if (candidate.startsWith(`${title} `)) {
    const remainder = candidate.slice(title.length).trim();
    if (!remainder || (source && remainder === source)) return "";
  }
  return summary;
}

/** Google Actualités : résultats classés par pertinence (les plus importants en premier). */
export async function fetchNews(query: string): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} when:1d`)}&hl=fr&gl=MG&ceid=MG:fr`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Google News HTTP ${res.status}`);
  return parseRss(await res.text());
}

/** Retire « - Nom du média » à la fin du titre. */
export const headlineOf = (title: string) => title.replace(/\s+-\s+[^-]+$/, "").trim();

/** Réserve la première actualité encore inédite. */
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

/** Choisit sans réserver la clé Redis, réservé aux essais sans publication. */
export async function findFirstUnseen(items: NewsItem[]): Promise<{ item: NewsItem; headline: string; seenKey: string } | null> {
  for (const item of items) {
    if (!item.title || !item.link) continue;
    const headline = headlineOf(item.title);
    const id = createHash("sha1").update(headline.toLowerCase()).digest("hex").slice(0, 16);
    const seenKey = `news:seen:${id}`;
    if (!hasRedis || !(await redis("EXISTS", seenKey))) return { item, headline, seenKey };
  }
  return null;
}

/** Compte la publication et met en place l'écart minimal entre deux publications. */
export async function markPosted(): Promise<void> {
  const gapMin = Number(process.env.NEWS_MIN_GAP_MIN ?? 90);
  await redis("SET", "news:gap", "1", "EX", gapMin * 60).catch(() => undefined);
  const dayKey = `news:day:${madagascarDateKey()}`;
  if (Number(await redis("INCR", dayKey).catch(() => 0)) === 1) await redis("EXPIRE", dayKey, 172800).catch(() => undefined);
}

/** Choisit le pictogramme selon le sujet du titre. */
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
