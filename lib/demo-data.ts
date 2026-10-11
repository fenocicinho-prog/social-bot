// Données de la vitrine /demo : 100 % statiques, aucun secret, aucun appel à Meta, Redis ou OpenRouter.
import { ANNOUNCEMENTS } from "@/content/announcements";
import { FACTS } from "@/lib/facts";
import type { OgCard } from "@/lib/og";

export type DemoPost = { id: number; kind: "ad" | "news" | "tech" | "fact"; time: string; label: string; caption: string };

const sampleNews: OgCard = {
  tag: "À la une",
  title: "Exemple : titre d'une actualité de Madagascar",
  body: "Le bot récupère le titre et le résumé du flux RSS, jamais plus. Cette carte est un exemple de mise en page.",
  icon: "news",
  theme: "news",
  src: "Source : exemple",
};
const sampleTech: OgCard = {
  tag: "Tech & science",
  title: "Exemple : une actualité informatique ou scientifique",
  body: "Un jour sur deux à 16 h, le bot publie une actualité tech ; l'autre jour, un « Le saviez-vous ? ».",
  icon: "chip",
  theme: "tech",
  src: "Source : exemple",
};

/** Cartes affichées dans la galerie, dans l'ordre. L'API /api/demo/card n'accepte que cet index. */
export const DEMO_CARDS: OgCard[] = [
  ...ANNOUNCEMENTS.slice(0, 3).map((a): OgCard => ({
    tag: a.tag, title: a.title, body: a.paragraphs.join(" "), points: a.points, icon: a.icon, theme: "ad",
  })),
  sampleNews,
  sampleTech,
  { tag: "Le saviez-vous ?", title: FACTS[0].title, body: FACTS[0].text, icon: FACTS[0].icon, theme: "fact" },
];

export const GALLERY = [
  { i: 0, kind: "Annonce du matin · 07:00" },
  { i: 1, kind: "Annonce du matin · 07:00" },
  { i: 3, kind: "À la une · 12:00 (exemple)" },
  { i: 4, kind: "Tech & science · 16:00 (exemple)" },
  { i: 5, kind: "Le saviez-vous ? · 16:00" },
];

/** Planning réel du bot, en heure de Madagascar (UTC+3). */
export const SCHEDULE = [
  { h: 7, m: 0, title: "Annonce du matin", route: "/api/cron/daily-ad", text: "Annonce rotative écrite à la main, publiée en image 1080×1350 avec contact et site." },
  { h: 12, m: 0, title: "Actualité du moment", route: "/api/cron/noon", text: "L'info la plus importante de Madagascar (flux Google Actualités), sans doublon." },
  { h: 16, m: 0, title: "Tech ou « Le saviez-vous ? »", route: "/api/cron/afternoon", text: "Un jour sur deux une actualité tech/science, l'autre jour un fait écrit à la main." },
];

export const STATS = [
  { v: "2", l: "canaux : Messenger & WhatsApp" },
  { v: "3", l: "publications automatiques / jour" },
  { v: "24/7", l: "réponses clients" },
  { v: String(FACTS.length), l: "« Le saviez-vous ? » en rotation" },
];

export const GUARDS = [
  { t: "Zéro invention", d: "Le bot n'annonce que ce qui est dans business.ts. Un projet « en préparation » n'est jamais présenté comme disponible." },
  { t: "Anti-doublon", d: "Une actualité n'est jamais publiée deux fois (Redis, 7 jours) et chaque créneau ne part qu'une fois par jour." },
  { t: "Limite de débit", d: "20 messages par heure et par client, pour protéger le crédit IA." },
  { t: "Webhooks signés", d: "Chaque message Meta est vérifié par signature HMAC ; les doublons de livraison sont ignorés." },
  { t: "Heures calmes", d: "Pas de publication de 22 h à 6 h, écart minimal et quota journalier configurables." },
  { t: "Mode essai", d: "?dry=1 prépare texte et images sans rien publier sur Facebook." },
];

export const FLOW = [
  { t: "Déclencheur", d: "Vercel Cron / cron-job.org" },
  { t: "Contenu", d: "Annonces, RSS, faits" },
  { t: "Carte image", d: "Rendu PNG (next/og)" },
  { t: "Facebook", d: "Page Messenger/Meta API" },
];

/** Réponses scriptées pour la démo du chat : même ton et mêmes faits que lib/business.ts. */
export type Reply = { q: string; a: string; match: RegExp };
export const CHAT: Reply[] = [
  { q: "Quels services proposez-vous ?", match: /service|propos|faites|offre|quoi/i,
    a: "Nous réalisons des sites web (HTML, CSS, JavaScript), des plateformes web et e-commerce (TypeScript, Next.js), des applications web et mobiles (React, Expo) et des assistants IA pour Messenger et WhatsApp." },
  { q: "Avez-vous des réalisations ?", match: /r[ée]alisation|projet|exemple|portfolio|r[ée]f[ée]rence/i,
    a: "Oui : Ny Herin'ny Boky (plateforme de livres malagasy, en ligne), Mini Copilot (assistant IA de développement, web et mobile) et son site de présentation. Une version Windows de Mini Copilot est en préparation, pas encore disponible." },
  { q: "Combien ça coûte ?", match: /prix|co[uû]t|combien|tarif|devis/i,
    a: "Je n'ai pas de tarif à vous annoncer. Je transmets votre demande : contactez-nous sur WhatsApp au +261 37 86 774 99 pour un devis." },
  { q: "Mini Copilot Windows est disponible ?", match: /windows|copilot/i,
    a: "Pas encore : la version Windows est en préparation. Elle pourra agir sur l'ordinateur, avec confirmation avant chaque action. Mini Copilot est déjà disponible sur web et mobile." },
  { q: "Quelle est la capitale de la France ?", match: /capitale|france|m[ée]t[ée]o|football/i,
    a: "C'est un sujet hors de mon domaine. Je peux en revanche vous aider sur nos services : sites, e-commerce, applications ou chatbots." },
  { q: "Manao ahoana, afaka manao tranokala ve ianareo?", match: /manao|tranokala|ve ianareo|azafady/i,
    a: "Eny, manao tranokala izahay (HTML, CSS, JavaScript) sy fampiharana web sy finday. Mba hahazoana fanazavana bebe kokoa: WhatsApp +261 37 86 774 99." },
];
export const CHAT_FALLBACK =
  "Je n'ai pas cette information : je transmets votre demande. Contactez-nous sur WhatsApp au +261 37 86 774 99.";
