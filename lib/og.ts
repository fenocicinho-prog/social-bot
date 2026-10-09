import { createHmac, timingSafeEqual } from "node:crypto";

/** Adresse publique du site déployé (SITE_URL, sinon le domaine de production Vercel). */
export function siteUrl(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!host) throw new Error("SITE_URL manquante");
  return `https://${host}`;
}

export type OgIcon =
  | "news" | "chip" | "science" | "leaf" | "coins" | "shield" | "phone" | "code" | "bulb" | "book" | "chat";
export type OgTheme = "ad" | "news" | "tech" | "fact";
export type OgSegment = { type: "paragraph" | "bullet"; text: string };

/** Tout le texte fourni est gardé intégralement ; les annonces longues sont paginées avant rendu. */
export type OgCard = {
  tag?: string;
  title: string;
  body?: string;
  points?: string[];
  segments?: OgSegment[];
  showFooter?: boolean;
  icon?: OgIcon;
  theme?: OgTheme;
  src?: string;
};

export type NormalizedOgCard = Required<Omit<OgCard, "points" | "segments" | "showFooter">> & {
  points: string[];
  segments: OgSegment[];
  showFooter: boolean;
};

/** Nettoie seulement les espaces extérieurs : aucun champ ni point n'est tronqué. */
export function normalize(c: OgCard): NormalizedOgCard {
  return {
    tag: (c.tag ?? "").trim(),
    title: (c.title ?? "").trim(),
    body: (c.body ?? "").trim(),
    points: (c.points ?? []).map((point) => point.trim()).filter(Boolean),
    segments: (c.segments ?? []).map((segment) => ({ type: segment.type, text: segment.text.trim() })).filter((segment) => segment.text),
    showFooter: c.showFooter ?? true,
    icon: c.icon ?? "news",
    theme: c.theme ?? "ad",
    src: (c.src ?? "").trim(),
  };
}

const sign = (c: NormalizedOgCard) =>
  createHmac("sha256", process.env.CRON_SECRET ?? "")
    .update(JSON.stringify([c.tag, c.title, c.body, c.points, c.segments, c.icon, c.theme, c.src, c.showFooter]))
    .digest("hex")
    .slice(0, 32);

/** URL surtout destinée à l'aperçu ; les routes cron rendent leurs images directement en mémoire. */
export function ogUrl(card: OgCard): string {
  const c = normalize(card);
  const q = new URLSearchParams({ title: c.title, icon: c.icon, theme: c.theme, sig: sign(c) });
  if (!c.showFooter) q.set("footer", "0");
  if (c.tag) q.set("tag", c.tag);
  if (c.body) q.set("body", c.body);
  if (c.points.length) q.set("points", JSON.stringify(c.points));
  if (c.segments.length) q.set("segments", JSON.stringify(c.segments));
  if (c.src) q.set("src", c.src);
  return `${siteUrl()}/api/og?${q.toString()}`;
}

const ICONS: OgIcon[] = ["news", "chip", "science", "leaf", "coins", "shield", "phone", "code", "bulb", "book", "chat"];
const THEMES: OgTheme[] = ["ad", "news", "tech", "fact"];

function parseArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value as T[] : [];
  } catch {
    return [];
  }
}

/** Relit une carte depuis l'adresse ; renvoie null si la signature est fausse (en production). */
export function readOg(params: URLSearchParams): NormalizedOgCard | null {
  const icon = ICONS.find((value) => value === params.get("icon"));
  const theme = THEMES.find((value) => value === params.get("theme"));
  const rawPoints = params.get("points");
  const points = rawPoints?.startsWith("[") ? parseArray<string>(rawPoints) : (rawPoints ?? "").split("|");
  const c = normalize({
    tag: params.get("tag") ?? "",
    title: params.get("title") ?? "",
    body: params.get("body") ?? "",
    points,
    segments: parseArray<OgSegment>(params.get("segments")),
    showFooter: params.get("footer") !== "0",
    icon,
    theme,
    src: params.get("src") ?? "",
  });
  if (!c.title) return null;
  if (process.env.NODE_ENV !== "production") return c;
  const sig = params.get("sig");
  if (!process.env.CRON_SECRET || !sig) return null;
  const expected = Buffer.from(sign(c));
  const received = Buffer.from(sig);
  return expected.length === received.length && timingSafeEqual(expected, received) ? c : null;
}
