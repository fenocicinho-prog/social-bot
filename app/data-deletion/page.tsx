import { CONTACT_EMAIL, DELETION_DELAY_DAYS, LAST_UPDATED, LEGAL_NAME, SITE_NAME } from "@/lib/legal";

export const metadata = { title: `Suppression des données – ${SITE_NAME}` };

const page: React.CSSProperties = { maxWidth: 760, margin: "0 auto", padding: "32px 20px", lineHeight: 1.65 };

export default function DataDeletion() {
  return (
    <main style={page}>
      <h1>Suppression de vos données</h1>
      <p>
        <em>Dernière mise à jour : {LAST_UPDATED}</em>
      </p>
      <p>
        Vous avez écrit à {LEGAL_NAME} sur Messenger ou WhatsApp et vous souhaitez que vos données soient supprimées ?
      </p>

      <h2>Comment faire</h2>
      <ol>
        <li>
          Envoyez un e-mail à <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> avec pour objet « Suppression de
          mes données ».
        </li>
        <li>
          Indiquez le nom de votre profil Facebook ou votre numéro WhatsApp, afin que nous retrouvions votre
          conversation.
        </li>
        <li>
          Nous supprimons les données que nous détenons et nous vous confirmons la suppression dans un délai maximum de{" "}
          {DELETION_DELAY_DAYS} jours.
        </li>
      </ol>

      <h2>Ce qui est déjà supprimé automatiquement</h2>
      <p>
        L'historique récent de votre conversation est effacé automatiquement après 24 heures, et les compteurs
        anti-abus après 1 heure. Voir la <a href="/privacy">politique de confidentialité</a>.
      </p>

      <h2>Données conservées par Meta</h2>
      <p>
        Les messages restent aussi dans vos propres conversations Messenger ou WhatsApp, et Meta les conserve selon ses
        règles. Vous pouvez supprimer la conversation de votre côté depuis l'application, et gérer vos données auprès de
        Meta depuis les paramètres de votre compte.
      </p>

      <hr style={{ margin: "40px 0" }} />

      <h1>Data deletion (English)</h1>
      <p>
        To request deletion of your data, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with the subject
        "Delete my data", and include your Facebook profile name or WhatsApp number so we can find your conversation. We
        will delete the data we hold and confirm within {DELETION_DELAY_DAYS} days. Recent conversation history is
        already deleted automatically after 24 hours (see our <a href="/privacy">privacy policy</a>). Meta keeps its own
        copy of your messages under its own rules.
      </p>
    </main>
  );
}
