import { createHmac, timingSafeEqual } from "node:crypto";

/** Adresse publique du site déployé (SITE_URL, sinon le domaine de production Vercel). */
export function siteUrl(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!host) throw new Error("SITE_URL manquante");
  return `https://${host}`;
}

// Les adresses d'image sont signées : personne d'autre ne peut faire fabriquer d'images par ton serveur.
const sign = (tag: string, title: string) =>
  createHmac("sha256", process.env.CRON_SECRET ?? "").update(`${tag}\n${title}`).digest("hex").slice(0, 32);

export function ogUrl(tag: string, title: string): string {
  const q = new URLSearchParams({ tag, title, sig: sign(tag, title) });
  return `${siteUrl()}/api/og?${q.toString()}`;
}

export function validOg(tag: string, title: string, sig: string | null): boolean {
  if (process.env.NODE_ENV !== "production") return true; // aperçu libre en local
  if (!process.env.CRON_SECRET || !sig) return false;
  const a = Buffer.from(sign(tag, title));
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}
