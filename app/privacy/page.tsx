import { CONTACT_EMAIL, LAST_UPDATED, LEGAL_NAME, SITE_NAME } from "@/lib/legal";

export const metadata = { title: `Politique de confidentialité – ${SITE_NAME}` };

const page: React.CSSProperties = { maxWidth: 760, margin: "0 auto", padding: "32px 20px", lineHeight: 1.65 };

export default function Privacy() {
  return (
    <main style={page}>
      <h1>Politique de confidentialité</h1>
      <p>
        <em>Dernière mise à jour : {LAST_UPDATED}</em>
      </p>

      <h2>1. Qui sommes-nous ?</h2>
      <p>
        {LEGAL_NAME} exploite un assistant automatique (« {SITE_NAME} ») qui répond aux messages envoyés à sa Page
        Facebook (Messenger) et à son numéro WhatsApp Business, et qui publie du contenu sur cette Page. Contact :{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>2. Données que nous traitons</h2>
      <p>
        Le texte des messages que vous nous envoyez, l'identifiant d'expéditeur attribué par Meta (identifiant Messenger
        ou numéro WhatsApp) et la date d'envoi. Nous ne demandons aucune donnée sensible : merci de ne pas en envoyer
        dans vos messages.
      </p>

      <h2>3. Pourquoi nous les utilisons</h2>
      <p>
        Uniquement pour générer une réponse automatique à votre message et pour limiter le nombre de messages par
        personne (protection contre les abus). Nous ne vendons pas vos données, nous ne les utilisons pas pour de la
        publicité ciblée et nous ne faisons pas de profilage.
      </p>

      <h2>4. Prestataires qui interviennent</h2>
      <ul>
        <li>Meta (Messenger, WhatsApp, Facebook) : transmission des messages.</li>
        <li>Vercel : hébergement du service.</li>
        <li>Upstash : stockage temporaire de l'historique récent et des compteurs.</li>
        <li>
          OpenRouter et les fournisseurs de modèles d'intelligence artificielle : le texte de votre message leur est
          envoyé pour produire la réponse.
        </li>
      </ul>

      <h2>5. Durée de conservation</h2>
      <ul>
        <li>Historique récent de la conversation (10 derniers messages) : supprimé automatiquement après 24 heures.</li>
        <li>Compteurs anti-abus et identifiants de messages déjà traités : supprimés automatiquement après 1 heure.</li>
        <li>Notre code n'enregistre pas le contenu de vos messages dans ses journaux.</li>
        <li>Meta et les autres prestataires appliquent leurs propres règles de conservation.</li>
      </ul>

      <h2>6. Vos droits</h2>
      <p>
        Vous pouvez demander l'accès à vos données ou leur suppression en écrivant à{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. La marche à suivre est détaillée sur la page{" "}
        <a href="/data-deletion">Suppression des données</a>.
      </p>

      <h2>7. Modifications</h2>
      <p>Cette politique peut évoluer. La date de dernière mise à jour figure en haut de cette page.</p>

      <hr style={{ margin: "40px 0" }} />

      <h1>Privacy Policy (English)</h1>
      <p>
        <em>Last updated: {LAST_UPDATED}</em>
      </p>
      <p>
        {LEGAL_NAME} operates an automated assistant ("{SITE_NAME}") that replies to messages sent to its Facebook Page
        (Messenger) and WhatsApp Business number, and publishes posts on that Page. Contact:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
      <p>
        <strong>Data we process:</strong> the text of the messages you send us, the sender identifier assigned by Meta
        (Messenger ID or WhatsApp number) and the time of sending. Please do not send sensitive data.
      </p>
      <p>
        <strong>Why:</strong> only to generate an automatic reply and to limit the number of messages per person
        (abuse protection). We do not sell your data, use it for targeted advertising or profile you.
      </p>
      <p>
        <strong>Service providers:</strong> Meta (message delivery), Vercel (hosting), Upstash (temporary storage of
        recent history and counters), and OpenRouter with the AI model providers (your message text is sent to them to
        produce the reply).
      </p>
      <p>
        <strong>Retention:</strong> recent conversation history (last 10 messages) is deleted automatically after 24
        hours; anti-abuse counters and processed message identifiers after 1 hour. Our code does not write message
        content to its logs. Meta and the other providers apply their own retention rules.
      </p>
      <p>
        <strong>Your rights:</strong> to request access to or deletion of your data, email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. See <a href="/data-deletion">Data deletion</a>.
      </p>
    </main>
  );
}
