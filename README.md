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

## Programme de publication (Page Facebook)
Heures de Madagascar (UTC+3). Vercel lit les heures en UTC, donc `vercel.json` contient 04:00, 09:00 et 13:00.

| Heure | Route | Contenu |
|---|---|---|
| 07:00 | `/api/cron/daily-ad` | Annonce statique, factuelle et rotative, publiée avec une image PNG 1080×1350. L’image contient le titre et tout le texte exact de la légende (dont le contact et le site) ; les annonces longues sont réparties sans troncature. |
| 12:00 | `/api/cron/noon` | L'actualité la plus importante du moment (`NEWS_QUERY`, par défaut « Madagascar »), avec le titre complet et le résumé fourni par le flux RSS s'il existe. |
| 16:00 | `/api/cron/afternoon` | Un jour sur deux une actualité informatique/science (`TECH_QUERY`), l'autre jour « Le saviez-vous ? » (liste dans `lib/facts.ts`). Si l'actualité est introuvable, le « saviez-vous » la remplace. |

- **Plan Hobby** : chaque tâche part une fois par jour, mais Vercel peut la lancer n'importe quand dans l'heure prévue (ex. 7 h → entre 7 h et 7 h 59). Pour des heures exactes : plan Pro, ou **cron-job.org** (gratuit) qui appelle la route avec l'en-tête `Authorization: Bearer <CRON_SECRET>` (dans ce cas, retire la ligne correspondante de `vercel.json`).
- **Pas de doublon** : si une tâche est déclenchée deux fois le même jour, la seconde est ignorée. Si Facebook refuse la publication, la tâche pourra être relancée.
- **Redis requis** pour les actualités de midi et de 16 h (anti-doublons). Sans Redis, le 16 h publie seulement « Le saviez-vous ? ».
- **Essai sans publication** : ajoute `?dry=1` aux routes cron et envoie `Authorization: Bearer $CRON_SECRET`. Le JSON donne le texte préparé et les images rendues ; aucun post n'est envoyé à Facebook.
- **Actualités en texte seul** : `GET /api/cron/news`, toutes les 3 h depuis **cron-job.org** (ou `vercel.json` sur le plan Pro).
  Garde-fous : pas de publication de 22h à 6h, écart minimal (`NEWS_MIN_GAP_MIN`), quota journalier
  (`NEWS_MAX_PER_DAY`, les publications de midi et de 16 h comptent dedans), jamais deux fois la même actualité.
  Avec les 3 publications programmées, baisse `NEWS_MAX_PER_DAY` (ex. 3) si tu veux un fil moins chargé.
- Les annonces du matin sont écrites à la main dans `content/announcements.ts`; la légende publiée sert aussi de source au visuel, qui doit en reprendre tout le texte. Les publications d'actualités utilisent uniquement le titre et le résumé éventuellement fourni par le flux RSS ; les « Le saviez-vous ? » sont écrits à la main.

## Carte image (1080 × 1350)
- Thème classique : papier crème, titres en serif (PT Serif), or en accent, une couleur par type : bleu nuit (annonces), bordeaux (à la une), vert (tech & science), prune (saviez-vous).
- Chaque carte a un pictogramme choisi selon le sujet (`lib/news.ts` → `guessIcon`, icônes dans `app/api/og/icons.tsx`). Le texte n'est jamais tronqué ; les annonces longues sont découpées aux frontières de phrases, paragraphes ou puces, puis publiées comme un seul album (maximum 10 images).
- Aperçu local : `npm run dev`, puis ouvre
  `http://localhost:3000/api/og?tag=À la une&title=Mon titre&body=Ma description&icon=leaf&theme=news`
  (paramètres : `tag`, `title`, `body`, `points` séparés par `|`, `icon`, `theme` = `ad|news|tech|fact`, `src`).
- En production, les adresses d'image sont signées avec `CRON_SECRET` : personne d'autre ne peut te faire fabriquer d'images.
- Polices dans `assets/` (Inter, PT Serif : licence libre OFL, voir `assets/PTSerif-OFL.txt`).
- **Logo** : place ton fichier à `assets/logo.png` (PNG, fond transparent de préférence, au moins 400 px de haut).
  Il s'affiche en haut à droite de la carte ; s'il est absent, la carte s'affiche sans logo.
