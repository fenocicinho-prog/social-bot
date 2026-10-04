# Cicinho Social Bot

Projet Vercel séparé : bot clients Messenger + WhatsApp, publication d'actualités, annonce du matin.

## Mise en route
1. `npm install`, puis crée un dépôt Git et importe-le dans Vercel (ou `npx vercel`).
2. Modifie `lib/business.ts` (nom, contact, services) : le bot n'annonce que ce qui s'y trouve.
3. Vercel > Storage / Marketplace : ajoute **Upstash Redis** (les variables sont injectées).
4. Vercel > Settings > Environment Variables : remplis toutes les variables de `.env.example`, puis redéploie.

## Meta (developers.facebook.com)
- Une seule app Meta avec les produits **Messenger** et **WhatsApp**. `META_APP_SECRET` = Paramètres > Général.
- Webhook Messenger : `https://TON-DOMAINE/api/webhook/messenger`, token = `VERIFY_TOKEN`, abonnement `messages`.
- Webhook WhatsApp : `https://TON-DOMAINE/api/webhook/whatsapp`, token = `VERIFY_TOKEN`, champ `messages`.
- `PAGE_ACCESS_TOKEN` : token de Page de longue durée (permissions `pages_messaging`, `pages_manage_posts`).
- `WA_TOKEN` : préfère un token d'utilisateur système (permanent) du Business Manager.

## Tâches automatiques
- **Annonce du matin** : `vercel.json`, tous les jours à 04:00 UTC (= 07:00 à Madagascar). Sur le plan Hobby,
  l'heure exacte peut varier dans l'heure. Elle est publiée avec une **carte image** (`/api/og`) et une légende.
  Renseigne `SITE_URL` (adresse publique du projet) : Facebook doit pouvoir télécharger l'image.
- **Actualités** : appelle `GET /api/cron/news` avec l'en-tête `Authorization: Bearer <CRON_SECRET>`
  toutes les 3 h depuis **cron-job.org** (gratuit), ou ajoute-la dans `vercel.json` sur le plan Pro.
  Garde-fous intégrés : pas de publication de 22h à 6h, écart minimal (`NEWS_MIN_GAP_MIN`), quota journalier
  (`NEWS_MAX_PER_DAY`), jamais deux fois la même actualité.

## Carte image
- Aperçu local : `npm run dev`, puis ouvre `http://localhost:3000/api/og?tag=Mini%20Copilot&title=Mon%20titre`.
- Couleurs et mise en page : `app/api/og/route.tsx` (cyan `#00e5ff` sur fond sombre). Polices : `assets/`.
- En production, les adresses d'image sont signées avec `CRON_SECRET` : les autres ne peuvent pas t'en faire fabriquer.
- **Logo** : place ton fichier à `assets/logo.png` (PNG, fond transparent de préférence, au moins 400 px de haut).
  Il s'affiche en haut à droite de la carte ; s'il est absent, la carte s'affiche sans logo.
