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

/** Découpe sans tronquer, en privilégiant paragraphes, phrases puis espaces. */
export function splitTextIntoChunks(text: string, maxChars: number): string[] {
  if (!Number.isInteger(maxChars) || maxChars < 1) throw new Error("maxChars doit être un entier positif");
  if (!text) return [];

  const chunks: string[] = [];
  let rest = text;
  while (rest.length > maxChars) {
    const window = rest.slice(0, maxChars + 1);
    const minPreferredEnd = Math.floor(maxChars / 2);
    let end = -1;

    const paragraphEnd = window.lastIndexOf("\n\n");
    if (paragraphEnd >= minPreferredEnd) end = paragraphEnd + 2;

    if (end < 0) {
      const sentenceBoundary = /[.!?…]["'”’»)]*\s+/g;
      for (const match of window.matchAll(sentenceBoundary)) {
        const candidate = (match.index ?? 0) + match[0].length;
        if (candidate <= maxChars && candidate >= minPreferredEnd) end = candidate;
      }
    }

    if (end < 0) {
      const newlineEnd = window.lastIndexOf("\n", maxChars - 1);
      if (newlineEnd >= minPreferredEnd) end = newlineEnd + 1;
    }
    if (end < 0) {
      const whitespace = /\s/g;
      for (const match of window.matchAll(whitespace)) {
        const candidate = (match.index ?? 0) + 1;
        if (candidate <= maxChars && candidate >= minPreferredEnd) end = candidate;
      }
    }
    // Un seul mot/URL dépasse la limite : seule cette situation impose une coupure stricte.
    if (end < 1 || end > maxChars) end = maxChars;

    chunks.push(rest.slice(0, end));
    rest = rest.slice(end);
  }
  if (rest) chunks.push(rest);
  return chunks;
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

export async function sendMessenger(psid: string, text: string) {
  const token = need("PAGE_ACCESS_TOKEN");
  const chunks = splitTextIntoChunks(text, 1900);
  for (const chunk of chunks) {
    await graphPost("me/messages", token, {
      recipient: { id: psid },
      messaging_type: "RESPONSE",
      message: { text: chunk },
    });
  }
}

export async function sendWhatsApp(to: string, text: string) {
  const phoneNumberId = need("WA_PHONE_NUMBER_ID");
  const token = need("WA_TOKEN");
  const chunks = splitTextIntoChunks(text, 3900);
  for (const chunk of chunks) {
    await graphPost(`${phoneNumberId}/messages`, token, {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: chunk },
    });
  }
}

export function postToPage(message: string, link?: string) {
  return graphPost(`${need("PAGE_ID")}/feed`, need("PAGE_ACCESS_TOKEN"), link ? { message, link } : { message });
}

async function uploadPagePhoto(
  image: Uint8Array,
  token: string,
  options: { published: boolean; caption?: string },
): Promise<string> {
  const form = new FormData();
  const bytes = image.slice();
  form.set("source", new Blob([bytes.buffer as ArrayBuffer], { type: "image/png" }), "announcement.png");
  form.set("published", String(options.published));
  if (options.caption) form.set("caption", options.caption);
  const res = await fetch(`${GRAPH}/${need("PAGE_ID")}/photos`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json().catch(() => ({})) as { id?: string; error?: unknown };
  if (!res.ok || !data.id) throw new Error(`Graph photo ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  return data.id;
}

/** Publie une image PNG envoyée en binaire, sans URL signée ni limite de query string. */
export async function postPngToPage(image: Uint8Array, caption: string) {
  const token = need("PAGE_ACCESS_TOKEN");
  return uploadPagePhoto(image, token, { published: true, caption });
}

/** Publie plusieurs PNG comme album unique : d'abord privés, puis attachés au même post. */
export async function postPngAlbumToPage(images: Uint8Array[], caption: string) {
  if (images.length < 2) throw new Error("Un album exige au moins deux images");
  const token = need("PAGE_ACCESS_TOKEN");
  const photoIds: string[] = [];
  for (const image of images) photoIds.push(await uploadPagePhoto(image, token, { published: false }));

  const form = new URLSearchParams({ message: caption });
  photoIds.forEach((photoId, index) => {
    form.set(`attached_media[${index}]`, JSON.stringify({ media_fbid: photoId }));
  });
  const res = await fetch(`${GRAPH}/${need("PAGE_ID")}/feed`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Graph album ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  return data;
}
