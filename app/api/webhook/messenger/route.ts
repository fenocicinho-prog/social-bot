import { after, type NextRequest } from "next/server";
import { answer } from "@/lib/chat";
import { sendMessenger, validSignature } from "@/lib/meta";
import { claimOnce } from "@/lib/redis";

export const maxDuration = 60;

type Body = {
  object?: string;
  entry?: {
    messaging?: {
      sender?: { id?: string };
      message?: { mid?: string; text?: string; is_echo?: boolean };
    }[];
  }[];
};

// Vérification du webhook par Meta
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  if (p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === process.env.VERIFY_TOKEN) {
    return new Response(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// Réception des messages
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get("x-hub-signature-256"))) {
    return new Response("Invalid signature", { status: 401 });
  }
  let body: Body;
  try {
    body = JSON.parse(raw) as Body;
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }
  if (body.object !== "page") return new Response("ignored", { status: 200 });

  // On répond 200 tout de suite à Meta ; le travail continue en arrière-plan.
  after(async () => {
    for (const entry of body.entry ?? []) {
      for (const ev of entry.messaging ?? []) {
        const sender = ev.sender?.id;
        const msg = ev.message;
        if (!sender || !msg?.text || msg.is_echo) continue;
        if (msg.mid && !(await claimOnce(`mid:${msg.mid}`, 3600))) continue; // doublon (Meta réessaie)
        try {
          await sendMessenger(sender, await answer(`msgr:${sender}`, msg.text));
        } catch (err) {
          console.error("Messenger: envoi échoué", err);
        }
      }
    }
  });
  return new Response("EVENT_RECEIVED", { status: 200 });
}
