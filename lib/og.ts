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

/** Tout ce qui s'affiche sur une carte image. Seul "title" est obligatoire. */
export type OgCard = {
  tag?: string; // petit libellé en haut (ex. "À la une")
  title: string; // grande phrase
  body?: string; // texte de description sous le titre
  points?: string[]; // jusqu'à 3 lignes courtes avec puce
  icon?: OgIcon;
  theme?: OgTheme;
  src?: string; // ex. "Source : Midi Madagasikara"
};

export const LIMITS = { tag: 32, title: 110, body: 220, point: 56, src: 60 } as const;

/** Nettoie et tronque les champs : c'est ce texte-là qui est signé et dessiné. */
export function normalize(c: OgCard): Required<Omit<OgCard, "points">> & { points: string[] } {
  const cut = (s: string | undefined, n: number) => {
    const t = (s ?? "").replace(/\s+/g, " ").trim();
    return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
  };
  return {
    tag: cut(c.tag, LIMITS.tag),
    title: cut(c.title, LIMITS.title),
    body: cut(c.body, LIMITS.body),
    points: (c.points ?? []).map((p) => cut(p, LIMITS.point)).filter(Boolean).slice(0, 3),
    icon: c.icon ?? "news",
    theme: c.theme ?? "ad",
    src: cut(c.src, LIMITS.src),
  };
}

// Les adresses d'image sont signées : personne d'autre ne peut faire fabriquer d'images par ton serveur.
const sign = (c: ReturnType<typeof normalize>) =>
  createHmac("sha256", process.env.CRON_SECRET ?? "")
    .update(JSON.stringify([c.tag, c.title, c.body, c.points, c.icon, c.theme, c.src]))
    .digest("hex")
    .slice(0, 32);

export function ogUrl(card: OgCard): string {
  const c = normalize(card);
  const q = new URLSearchParams({ title: c.title, icon: c.icon, theme: c.theme, sig: sign(c) });
  if (c.tag) q.set("tag", c.tag);
  if (c.body) q.set("body", c.body);
  if (c.points.length) q.set("points", c.points.join("|"));
  if (c.src) q.set("src", c.src);
  return `${siteUrl()}/api/og?${q.toString()}`;
}

const ICONS: OgIcon[] = ["news", "chip", "science", "leaf", "coins", "shield", "phone", "code", "bulb", "book", "chat"];
const THEMES: OgTheme[] = ["ad", "news", "tech", "fact"];

/** Relit une carte depuis l'adresse ; renvoie null si la signature est fausse (en production). */
export function readOg(p: URLSearchParams): ReturnType<typeof normalize> | null {
  const icon = ICONS.find((i) => i === p.get("icon"));
  const theme = THEMES.find((t) => t === p.get("theme"));
  const c = normalize({
    tag: p.get("tag") ?? "",
    title: p.get("title") ?? "",
    body: p.get("body") ?? "",
    points: (p.get("points") ?? "").split("|"),
    icon,
    theme,
    src: p.get("src") ?? "",
  });
  if (!c.title) return null;
  if (process.env.NODE_ENV !== "production") return c; // aperçu libre en local
  const sig = p.get("sig");
  if (!process.env.CRON_SECRET || !sig) return null;
  const a = Buffer.from(sign(c));
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b) ? c : null;
}
