import { createHmac, timingSafeEqual } from "node:crypto";

const GRAPH = `https://graph.facebook.com/${process.env.GRAPH_VERSION ?? "v24.0"}`;

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variable d'environnement manquante : ${name}`);
  return v;
}

/** Vérifie que la requête vient bien de Meta (en-tête X-Hub-Signature-256). */
export function validSignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !header?.startsWith("sha256=")) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(rawBody).digest("hex"));
  const received = Buffer.from(header.slice(7));
  return expected.length === received.length && timingSafeEqual(expected, received);
}

async function graphPost(path: string, token: string, body: Record<string, unknown>) {
  const res = await fetch(`${GRAPH}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Graph ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  return data;
}

export function sendMessenger(psid: string, text: string) {
  return graphPost("me/messages", need("PAGE_ACCESS_TOKEN"), {
    recipient: { id: psid },
    messaging_type: "RESPONSE",
    message: { text: text.slice(0, 1900) },
  });
}

export function sendWhatsApp(to: string, text: string) {
  return graphPost(`${need("WA_PHONE_NUMBER_ID")}/messages`, need("WA_TOKEN"), {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text.slice(0, 3900) },
  });
}

export function postToPage(message: string, link?: string) {
  return graphPost(`${need("PAGE_ID")}/feed`, need("PAGE_ACCESS_TOKEN"), link ? { message, link } : { message });
}

/** Publie une image (adresse publique) avec une légende. */
export function postPhotoToPage(imageUrl: string, caption: string) {
  return graphPost(`${need("PAGE_ID")}/photos`, need("PAGE_ACCESS_TOKEN"), { url: imageUrl, caption });
}
