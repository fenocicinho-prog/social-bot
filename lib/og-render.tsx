import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { BUSINESS_NAME, CONTACT, SERVICE_URL } from "@/lib/business";
import { normalize, type OgCard, type OgTheme } from "@/lib/og";
import { Icon } from "@/app/api/og/icons";

const WIDTH = 1080;
const HEIGHT = 1350;
const PAPER = "#fbf6ea";
const INK = "#1b2233";
const GOLD = "#d4a037";
const BANDS: Record<OgTheme, string> = {
  ad: "#14213d",
  news: "#8c1d2b",
  tech: "#0b5d57",
  fact: "#5b2a6e",
};

export async function renderOgPng(input: OgCard): Promise<Uint8Array> {
  const card = normalize(input);
  const assets = (file: string) => path.join(process.cwd(), "assets", file);
  const [bold, regular, serif] = await Promise.all([
    readFile(assets("Inter-Bold.woff")),
    readFile(assets("Inter-Regular.woff")),
    readFile(assets("PTSerif-Bold.ttf")),
  ]);
  const logoFile = await readFile(assets("logo.png")).catch(() => null);
  const logoSrc = logoFile ? `data:image/png;base64,${logoFile.toString("base64")}` : null;
  const band = BANDS[card.theme];
  const titleLength = [...card.title].length;
  const titleSize = Math.max(42, Math.min(96, 96 - Math.max(0, titleLength - 25) * 0.62));
  const segments = card.segments.length
    ? card.segments
    : [
        ...(card.body ? [{ type: "paragraph" as const, text: card.body }] : []),
        ...card.points.map((text) => ({ type: "bullet" as const, text })),
      ];
  const contentLength = segments.reduce((sum, segment) => sum + [...segment.text].length, 0);
  const bodySize = Math.max(
    20,
    Math.min(40, 40 - Math.max(0, contentLength - 125) * 0.055 - Math.max(0, segments.length - 6) * 1.2),
  );

  const response = new ImageResponse(
    (
      <div style={{ width: WIDTH, height: HEIGHT, display: "flex", flexDirection: "column", background: PAPER, color: INK, fontFamily: "Inter" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 154, padding: "0 70px", background: band }}>
          <div style={{ display: "flex", color: GOLD, fontSize: 31, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" }}>{card.tag}</div>
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} height={88} style={{ height: 88, maxWidth: 280 }} alt="" />
          ) : null}
        </div>
        <div style={{ display: "flex", height: 10, background: GOLD }} />

        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, padding: "42px 70px 25px", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 120, height: 120, borderRadius: 60, background: band }}>
              <Icon name={card.icon} size={70} color={GOLD} />
            </div>
            <div style={{ display: "flex", flex: 1, height: 5, marginLeft: 30, background: GOLD, opacity: 0.55 }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", fontFamily: "PT Serif", fontWeight: 700, fontSize: titleSize, lineHeight: 1.08, color: band, wordBreak: "break-word" }}>
            {card.title}
          </div>

          {segments.length ? (
            <div style={{ display: "flex", flexDirection: "column", marginTop: 26, gap: 13 }}>
              {segments.map((segment, index) => (
                <div key={index} style={{ display: "flex", alignItems: "flex-start", gap: segment.type === "bullet" ? 17 : 0, fontSize: bodySize, lineHeight: 1.26, color: INK, wordBreak: "break-word" }}>
                  {segment.type === "bullet" ? (
                    <div style={{ display: "flex", flexShrink: 0, width: 13, height: 13, marginTop: bodySize * 0.48, background: GOLD, transform: "rotate(45deg)" }} />
                  ) : null}
                  <span style={{ display: "flex", flex: 1 }}>{segment.text}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 205, padding: "22px 70px", background: band }}>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: card.src ? 590 : 900 }}>
            <div style={{ display: "flex", fontFamily: "PT Serif", fontWeight: 700, fontSize: 42, color: "#ffffff" }}>{BUSINESS_NAME}</div>
            <div style={{ display: "flex", marginTop: 7, fontSize: 24, color: GOLD }}>{CONTACT}</div>
            <div style={{ display: "flex", marginTop: 6, fontSize: 18, color: "#ffffff" }}>{SERVICE_URL}</div>
          </div>
          {card.src ? (
            <div style={{ display: "flex", maxWidth: 310, textAlign: "right", justifyContent: "flex-end", fontSize: 21, lineHeight: 1.2, color: "#ffffff", opacity: 0.9, overflowWrap: "anywhere" }}>{card.src}</div>
          ) : null}
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: "Inter", data: bold, weight: 700, style: "normal" },
        { name: "Inter", data: regular, weight: 400, style: "normal" },
        { name: "PT Serif", data: serif, weight: 700, style: "normal" },
      ],
    },
  );
  return new Uint8Array(await response.arrayBuffer());
}
