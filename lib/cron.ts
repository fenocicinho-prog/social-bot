/** Vercel Cron envoie automatiquement "Authorization: Bearer <CRON_SECRET>". */
export function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && req.headers.get("authorization") === `Bearer ${secret}`;
}

/** Heure locale de Madagascar (UTC+3, sans heure d'été). */
const MG_OFFSET_MS = 3 * 3600 * 1000;
export function madagascarNow(): Date {
  return new Date(Date.now() + MG_OFFSET_MS);
}
export function madagascarDateKey(): string {
  return madagascarNow().toISOString().slice(0, 10);
}
