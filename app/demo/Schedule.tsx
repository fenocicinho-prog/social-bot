"use client";
import { useEffect, useState } from "react";
import { SCHEDULE } from "@/lib/demo-data";

const pad = (n: number) => String(n).padStart(2, "0");

export default function Schedule() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Heure de Madagascar = UTC+3, sans heure d'été.
  const mg = now ? new Date(now.getTime() + 3 * 3600_000) : null;
  const mins = mg ? mg.getUTCHours() * 60 + mg.getUTCMinutes() : -1;
  const nextIdx = mg ? (() => { const i = SCHEDULE.findIndex((s) => s.h * 60 + s.m > mins); return i === -1 ? 0 : i; })() : -1;
  const next = mg ? SCHEDULE[nextIdx] : null;
  const diff = next ? (((next.h * 60 + next.m - mins) % 1440) + 1440) % 1440 : 0;

  return (
    <>
      <div className="tl">
        {SCHEDULE.map((s, i) => (
          <div key={s.route} className={`slot${i === nextIdx ? " next" : ""}`}>
            <div className="t">{pad(s.h)}:{pad(s.m)}</div>
            <div>
              <h3>{s.title}{i === nextIdx && <span className="badge">PROCHAINE</span>}</h3>
              <p>{s.text}</p>
              <p style={{ marginTop: 6 }}><code>{s.route}</code></p>
            </div>
          </div>
        ))}
      </div>
      {mg && next && (
        <p className="clock">
          Il est {pad(mg.getUTCHours())}:{pad(mg.getUTCMinutes())} à Madagascar · prochaine publication dans {Math.floor(diff / 60)} h {pad(diff % 60)}.
        </p>
      )}
    </>
  );
}
