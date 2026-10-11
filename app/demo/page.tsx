import type { Metadata } from "next";
import { SERVICE_URL } from "@/lib/business";
import { FLOW, GALLERY, GUARDS, STATS } from "@/lib/demo-data";
import ChatDemo from "./ChatDemo";
import Schedule from "./Schedule";
import "./demo.css";

export const metadata: Metadata = {
  title: "Cicinho Social Bot · Démo",
  description: "Bot Messenger & WhatsApp qui répond aux clients et publie chaque jour sur Facebook.",
};

export default function Demo() {
  return (
    <div className="demo">
      <header className="hero">
        <div className="wrap">
          <span className="live"><span className="dot" /> Bot en service</span>
          <h1>Un assistant qui répond aux clients <em>et publie à ta place</em></h1>
          <p className="lead">Messenger, WhatsApp et page Facebook : le bot répond en français ou en malgache, puis publie chaque jour une annonce, une actualité et un fait à découvrir, sans rien inventer.</p>
          <div className="stats">
            {STATS.map((s) => <div className="stat" key={s.l}><b>{s.v}</b><span>{s.l}</span></div>)}
          </div>
        </div>
      </header>

      <div className="wrap">
        <section>
          <h2>Planning de publication</h2>
          <p className="sub">Trois publications par jour sur la page Facebook, heure de Madagascar.</p>
          <Schedule />
        </section>

        <section>
          <h2>Cartes générées automatiquement</h2>
          <p className="sub">Chaque publication est une image 1080×1350 créée par le bot, avec le texte exact de la légende. Les cartes d'actualité ci-dessous sont des exemples.</p>
          <div className="gallery">
            {GALLERY.map((g) => (
              <figure key={g.i}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/demo/card?i=${g.i}`} alt={g.kind} loading="lazy" width={260} height={325} />
                <figcaption>{g.kind}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section>
          <h2>Assistant clients</h2>
          <p className="sub">Discutez avec une simulation du bot, comme sur Messenger ou WhatsApp.</p>
          <ChatDemo />
        </section>

        <section>
          <h2>Garde-fous</h2>
          <p className="sub">Un bot public doit être fiable : voici ce qui le protège.</p>
          <div className="cards">
            {GUARDS.map((g) => <div className="card" key={g.t}><h3>{g.t}</h3><p>{g.d}</p></div>)}
          </div>
        </section>

        <section>
          <h2>Comment ça marche</h2>
          <p className="sub">Du déclencheur à la publication.</p>
          <div className="flow">
            {FLOW.map((f) => <div className="step" key={f.t}><b>{f.t}</b><span>{f.d}</span></div>)}
          </div>
          <div className="tech" style={{ marginTop: 20 }}>
            {["Next.js 15", "TypeScript", "Vercel Cron", "Upstash Redis", "OpenRouter", "Meta Graph API", "next/og"].map((t) => <span key={t}>{t}</span>)}
          </div>
        </section>

        <footer>
          Projet réalisé par RT, Madagascar.{" "}
          {SERVICE_URL && <a href={SERVICE_URL}>Voir le portfolio</a>}
        </footer>
      </div>
    </div>
  );
}
