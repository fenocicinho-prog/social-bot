import type { OgIcon } from "@/lib/og";

export type StaticAnnouncement = {
  tag: string;
  icon: OgIcon;
  title: string;
  paragraphs: string[];
  points: string[];
};

// Chaque affirmation reprend uniquement ANGLES et lib/business.ts.
// Ajouter une information ici seulement après l'avoir vérifiée dans lib/business.ts.
export const ANNOUNCEMENTS: StaticAnnouncement[] = [
  {
    tag: "Mini Copilot",
    icon: "code",
    title: "Mini Copilot, assistant IA de développement",
    paragraphs: [
      "Mini Copilot est disponible sur le web et mobile.",
      "Il réunit un chat, un historique et des outils de travail.",
    ],
    points: [
      "Assistant IA de développement",
      "Chat, historique et outils de travail",
      "Disponible sur le web et mobile",
    ],
  },
  {
    tag: "Sites web",
    icon: "news",
    title: "Un site pour présenter ton activité",
    paragraphs: [
      "Un site de présentation aide à être visible et crédible en ligne.",
    ],
    points: [
      "Sites de présentation en HTML, CSS et JavaScript",
      "Pages de téléchargement de produit",
    ],
  },
  {
    tag: "E-commerce",
    icon: "coins",
    title: "Vendre et acheter en ligne",
    paragraphs: [
      "Des plateformes web et e-commerce pour la vente et l'achat en ligne.",
    ],
    points: [
      "Ny Herin'ny Boky connecte vendeurs et acheteurs",
      "Une plateforme de livres malagasy",
      "Une expérience locale",
    ],
  },
  {
    tag: "Applications",
    icon: "phone",
    title: "Applications web et mobiles",
    paragraphs: [
      "Des applications développées avec TypeScript, React et Expo.",
    ],
    points: [
      "Applications web",
      "Applications mobiles",
      "Technologies : TypeScript, React et Expo",
    ],
  },
  {
    tag: "Chatbot IA",
    icon: "chat",
    title: "Assistants IA et chatbots",
    paragraphs: [
      "Des assistants IA et chatbots pour Messenger et WhatsApp.",
    ],
    points: [
      "Pour Messenger",
      "Pour WhatsApp",
    ],
  },
  {
    tag: "Visibilité",
    icon: "shield",
    title: "Être visible et crédible en ligne",
    paragraphs: [
      "Un site de présentation permet de présenter une activité en ligne.",
    ],
    points: [
      "Sites de présentation en HTML, CSS et JavaScript",
      "Pages de téléchargement de produit",
    ],
  },
  {
    tag: "Made in Madagascar",
    icon: "book",
    title: "Les livres malagasy en ligne",
    paragraphs: [
      "Ny Herin'ny Boky est une plateforme web de vente et d'achat de livres malagasy.",
      "Elle connecte vendeurs et acheteurs dans une expérience locale.",
    ],
    points: [
      "Vente et achat de livres malagasy",
      "Vendeurs et acheteurs connectés",
    ],
  },
];
