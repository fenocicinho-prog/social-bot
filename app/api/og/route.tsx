import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { BUSINESS_NAME, CONTACT } from "@/lib/business";
import { readOg, type OgTheme } from "@/lib/og";
import { Icon } from "./icons";

export const runtime = "nodejs";

// Thème classique : papier crème, titres en serif, une couleur forte par type de publication + de l'or.
const PAPER = "#fbf6ea";
const INK = "#1b2233";
const GOLD = "#d4a037";
const BANDS: Record<OgTheme, string> = {
  ad: "#14213d", // bleu nuit : annonces du matin
  news: "#8c1d2b", // rouge bordeaux : à la une
  tech: "#0b5d57", // vert profond : informatique et science
  fact: "#5b2a6e", // prune : « Le saviez-vous ? »
};

export async function GET(req: Request) {
  const card = readOg(new URL(req.url).searchParams);
  if (!card) return new Response("Forbidden", { status: 403 });

  const assets = (f: string) => path.join(process.cwd(), "assets", f);
  const [bold, regular, serif] = await Promise.all([
    readFile(assets("Inter-Bold.woff")),
    readFile(assets("Inter-Regular.woff")),
    readFile(assets("PTSerif-Bold.ttf")),
  ]);

  // Logo optionnel : place ton fichier dans assets/logo.png (s'il est absent, la carte s'affiche sans logo).
  const logoFile = await readFile(assets("logo.png")).catch(() => null);
  const logoSrc = logoFile ? `data:image/png;base64,${logoFile.toString("base64")}` : null;

  const band = BANDS[card.theme];
  const n = card.title.length;
  // La taille du texte s'adapte à sa longueur pour que rien ne déborde sur le pied de carte.
  const titleSize = n <= 28 ? 96 : n <= 50 ? 84 : n <= 75 ? 72 : n <= 95 ? 62 : 54;
  const longTitle = n > 75;
  const bodyLen = card.body.length;
  const bodySize = card.points.length
    ? 38 // avec la liste de points
    : bodyLen <= 150
      ? longTitle ? 42 : 50
      : bodyLen <= 200
        ? longTitle ? 36 : 42
        : 36;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: PAPER, color: INK, fontFamily: "Inter" }}>
        {/* Bandeau du haut */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 170, padding: "0 70px", background: band }}>
          <div style={{ display: "flex", color: GOLD, fontSize: 34, fontWeight: 700, letterSpacing: 5, textTransform: "uppercase" }}>
            {card.tag}
          </div>
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} height={96} style={{ height: 96, maxWidth: 300 }} alt="" />
          ) : null}
        </div>
        <div style={{ display: "flex", height: 12, background: GOLD }} />

        {/* Contenu */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "58px 70px 0", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 44 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 150, height: 150, borderRadius: 75, background: band }}>
              <Icon name={card.icon} size={88} color={GOLD} />
            </div>
            <div style={{ display: "flex", flex: 1, height: 5, marginLeft: 30, background: GOLD, opacity: 0.55 }} />
          </div>

          <div style={{ display: "flex", fontFamily: "PT Serif", fontWeight: 700, fontSize: titleSize, lineHeight: 1.12, color: band }}>
            {card.title}
          </div>

          {card.body ? (
            <div style={{ display: "flex", marginTop: 42, fontSize: bodySize, lineHeight: 1.42, color: "#2a3042" }}>{card.body}</div>
          ) : null}

          {card.points.length ? (
            <div style={{ display: "flex", flexDirection: "column", marginTop: 38 }}>
              {card.points.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", marginTop: i ? 22 : 0 }}>
                  <div style={{ display: "flex", width: 20, height: 20, marginRight: 24, background: GOLD, transform: "rotate(45deg)" }} />
                  <div style={{ display: "flex", flex: 1, fontSize: 36, fontWeight: 700, color: INK }}>{p}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Pied de carte */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 190, padding: "0 70px", background: band }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontFamily: "PT Serif", fontWeight: 700, fontSize: 46, color: "#ffffff" }}>{BUSINESS_NAME}</div>
            <div style={{ display: "flex", marginTop: 10, fontSize: 30, color: GOLD }}>{CONTACT}</div>
          </div>
          {card.src ? (
            <div style={{ display: "flex", maxWidth: 400, textAlign: "right", justifyContent: "flex-end", fontSize: 26, color: "#ffffff", opacity: 0.85 }}>{card.src}</div>
          ) : null}
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1350,
      fonts: [
        { name: "Inter", data: bold, weight: 700, style: "normal" },
        { name: "Inter", data: regular, weight: 400, style: "normal" },
        { name: "PT Serif", data: serif, weight: 700, style: "normal" },
      ],
    },
  );
}
