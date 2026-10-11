"use client";
import { useEffect, useRef, useState } from "react";
import { CHAT, CHAT_FALLBACK } from "@/lib/demo-data";

type Msg = { from: "u" | "b"; text: string };
const WELCOME: Msg = { from: "b", text: "Bonjour ! Je suis l'assistant virtuel de RT. Posez-moi une question sur nos services ou nos projets." };

export default function ChatDemo() {
  const [channel, setChannel] = useState<"m" | "w">("m");
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" }); }, [msgs, busy]);
  useEffect(() => () => clearTimeout(timer.current), []);

  function ask(q: string) {
    q = q.trim();
    if (!q || busy) return;
    setMsgs((m) => [...m, { from: "u", text: q }]);
    setText("");
    setBusy(true);
    const reply = CHAT.find((r) => r.q === q || r.match.test(q))?.a ?? CHAT_FALLBACK;
    timer.current = setTimeout(() => {
      setMsgs((m) => [...m, { from: "b", text: reply }]);
      setBusy(false);
    }, 900);
  }

  return (
    <div className="chatgrid">
      <div className="phone" aria-label="Simulation de conversation">
        <div className="bar">
          RT · Assistant
          <span className="tabs">
            <button className="tab m" aria-pressed={channel === "m"} onClick={() => setChannel("m")}>Messenger</button>
            <button className="tab w" aria-pressed={channel === "w"} onClick={() => setChannel("w")}>WhatsApp</button>
          </span>
        </div>
        <div className={`msgs ${channel}`} ref={box} aria-live="polite">
          {msgs.map((m, i) => <div key={i} className={`msg ${m.from}`}>{m.text}</div>)}
          {busy && <div className="msg b typing" aria-label="Le bot écrit"><i /><i /><i /></div>}
        </div>
        <form className="in" onSubmit={(e) => { e.preventDefault(); ask(text); }}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Écrivez un message…" aria-label="Votre message" maxLength={200} />
          <button className="send" disabled={busy || !text.trim()}>Envoyer</button>
        </form>
      </div>
      <div>
        <p className="sub" style={{ marginBottom: 12 }}>Essayez une question type :</p>
        <div className="chips">
          {CHAT.map((r) => <button key={r.q} className="chip" onClick={() => ask(r.q)} disabled={busy}>{r.q}</button>)}
        </div>
        <p className="note">Simulation : ces réponses sont scriptées pour la démo. En production, le bot répond via un modèle IA (OpenRouter) cadré par les informations de l'entreprise, en français ou en malgache, avec historique de 10 messages.</p>
      </div>
    </div>
  );
}
