import type { OgIcon } from "./og";

// « Le saviez-vous ? » : liste écrite à la main (aucune IA, donc aucun risque d'invention).
// Ajoute les tiens à la fin : la rotation est automatique, un par jour concerné.
export type Fact = { title: string; text: string; icon: OgIcon };

export const FACTS: Fact[] = [
  { title: "Le premier « bug » était un insecte", icon: "chip", text: "En 1947, des ingénieurs du Harvard Mark II ont trouvé un papillon de nuit coincé dans un relais et l'ont collé dans leur journal. L'anecdote a rendu le mot « bug » célèbre, mais le terme existait déjà." },
  { title: "Le Web est né au CERN", icon: "news", text: "Le Web a été proposé en 1989 par Tim Berners-Lee au CERN. En 1993, le CERN a placé cette technologie dans le domaine public, ce qui a permis son essor mondial." },
  { title: "Le @ des e-mails date de 1971", icon: "chat", text: "Ray Tomlinson a envoyé l'un des premiers e-mails entre deux ordinateurs en réseau en 1971. C'est lui qui a choisi le symbole @ pour séparer le nom de l'utilisateur de celui de la machine." },
  { title: "Le premier SMS date de 1992", icon: "phone", text: "Le 3 décembre 1992, « Merry Christmas » a été envoyé depuis un ordinateur vers un téléphone mobile : c'est considéré comme le tout premier SMS." },
  { title: "« Robot » vient du tchèque", icon: "chip", text: "Le mot vient de « robota », qui signifie travail forcé en tchèque. Il a été popularisé par la pièce R.U.R. de l'écrivain Karel Čapek, en 1920." },
  { title: "Python ne vient pas du serpent", icon: "code", text: "Guido van Rossum, le créateur de Python, a choisi ce nom en hommage à la troupe comique britannique Monty Python, pas au reptile." },
  { title: "Linux a commencé comme un projet d'étudiant", icon: "code", text: "En 1991, l'étudiant finlandais Linus Torvalds annonçait qu'il écrivait un système d'exploitation libre. Il est devenu Linux, présent dans une grande partie des serveurs et dans Android." },
  { title: "Le QR code est né dans les usines", icon: "phone", text: "Le QR code a été créé en 1994 par l'entreprise japonaise Denso Wave pour suivre des pièces automobiles pendant leur fabrication." },
  { title: "Un disque dur d'une tonne pour 5 Mo", icon: "chip", text: "En 1956, IBM lançait le RAMAC 305, l'un des premiers disques durs : le système pesait plus d'une tonne et stockait environ 5 Mo, moins qu'une seule photo de smartphone." },
  { title: "Ada Lovelace, pionnière de la programmation", icon: "book", text: "En 1843, Ada Lovelace publiait des notes contenant ce qui est considéré comme le premier programme destiné à une machine : la machine analytique de Charles Babbage." },
  { title: "Le premier message sur Internet : « LO »", icon: "chat", text: "En 1969, le premier message envoyé sur ARPANET, l'ancêtre d'Internet, devait être « LOGIN ». Le système est tombé en panne après les deux premières lettres." },
  { title: "Le « cloud » n'a rien d'un nuage", icon: "chip", text: "Ce sont des centres de données remplis de serveurs, qui consomment beaucoup d'électricité et doivent être refroidis en permanence." },
  { title: "Le premier ordinateur remplissait une salle", icon: "chip", text: "L'ENIAC, mis en service en 1945-1946, occupait une grande salle, pesait environ 30 tonnes et utilisait des milliers de tubes électroniques." },
  { title: "Un ordinateur quantique utilise des qubits", icon: "science", text: "Un bit classique vaut 0 ou 1. Un qubit peut se trouver dans une combinaison des deux, ce qui permet à certains calculs quantiques de s'y prendre autrement que sur un ordinateur classique." },
  { title: "Les poulpes ont trois cœurs", icon: "science", text: "Deux cœurs envoient le sang vers les branchies et un troisième vers le reste du corps. Leur sang est bleu, car il transporte l'oxygène grâce au cuivre." },
  { title: "Sur Vénus, un jour dure plus qu'une année", icon: "science", text: "Vénus met environ 243 jours terrestres pour tourner sur elle-même, mais seulement environ 225 pour faire le tour du Soleil." },
  { title: "La lumière du Soleil met 8 minutes", icon: "science", text: "Elle met environ 8 minutes et 20 secondes pour atteindre la Terre : le Soleil que tu vois est celui d'il y a plus de 8 minutes." },
  { title: "Les lémuriens sont nés à Madagascar", icon: "leaf", text: "Les lémuriens sont originaires uniquement de Madagascar. L'île abrite aussi une très grande part d'espèces animales et végétales qu'on ne trouve nulle part ailleurs." },
  { title: "L'ADN d'une cellule mesure 2 mètres", icon: "science", text: "Étiré, l'ADN contenu dans le noyau d'une seule cellule humaine mesurerait environ 2 mètres de long." },
  { title: "Les bananes sont très légèrement radioactives", icon: "science", text: "Elles contiennent du potassium, dont une petite partie est radioactive. La dose reste minuscule et sans danger." },
  { title: "Une année-lumière, c'est très loin", icon: "science", text: "C'est la distance parcourue par la lumière en un an : environ 9 460 milliards de kilomètres." },
  { title: "Un éclair est ultra chaud", icon: "science", text: "Un éclair peut chauffer l'air qu'il traverse jusqu'à environ 30 000 °C, soit plusieurs fois la température de la surface du Soleil." },
  { title: "Le cœur bat 100 000 fois par jour", icon: "science", text: "Au repos, le cœur d'un adulte bat entre 60 et 100 fois par minute, soit à peu près 100 000 fois par jour." },
  { title: "Le miel se conserve très longtemps", icon: "leaf", text: "Grâce à sa faible teneur en eau et à son acidité, le miel se conserve extrêmement longtemps sans se gâter, tant qu'il reste bien fermé." },
];

/** Un fait par jour, en rotation (même fait pour tout le monde le même jour). */
export function factOfTheDay(dayNumber: number): Fact {
  return FACTS[((dayNumber % FACTS.length) + FACTS.length) % FACTS.length];
}
