import { after, type NextRequest } from "next/server";
import { answer } from "@/lib/chat";
import { sendWhatsApp, validSignature } from "@/lib/meta";
import { claimOnce } from "@/lib/redis";

export const maxDuration = 60;

type Body = {
  object?: string;
  entry?: {
    changes?: {
      value?: {
        messages?: { id?: string; from?: string; type?: string; text?: { body?: string } }[];
      };
    }[];
  }[];
};

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  if (p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === process.env.VERIFY_TOKEN) {
    return new Response(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

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
  if (body.object !== "whatsapp_business_account") return new Response("ignored", { status: 200 });

  after(async () => {
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        for (const m of change.value?.messages ?? []) {
          if (m.type !== "text" || !m.from || !m.text?.body) continue;
          if (m.id && !(await claimOnce(`wamid:${m.id}`, 3600))) continue;
          try {
            await sendWhatsApp(m.from, await answer(`wa:${m.from}`, m.text.body));
          } catch (err) {
            console.error("WhatsApp: envoi échoué", err);
          }
        }
      }
    }
  });
  return new Response("EVENT_RECEIVED", { status: 200 });
}
