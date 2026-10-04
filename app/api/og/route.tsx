import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { BUSINESS_NAME, CONTACT } from "@/lib/business";
import { validOg } from "@/lib/og";

export const runtime = "nodejs";

const CYAN = "#00e5ff";

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const tag = (p.get("tag") ?? "").slice(0, 32);
  const title = (p.get("title") ?? "").slice(0, 90);
  if (!title || !validOg(tag, title, p.get("sig"))) return new Response("Forbidden", { status: 403 });

  const [bold, regular] = await Promise.all([
    readFile(path.join(process.cwd(), "assets", "Inter-Bold.woff")),
    readFile(path.join(process.cwd(), "assets", "Inter-Regular.woff")),
  ]);

  // Logo optionnel : place ton fichier dans assets/logo.png (s'il est absent, la carte s'affiche sans logo).
  const logoFile = await readFile(path.join(process.cwd(), "assets", "logo.png")).catch(() => null);
  const logoSrc = logoFile ? `data:image/png;base64,${logoFile.toString("base64")}` : null;

  const fontSize = title.length > 60 ? 68 : title.length > 40 ? 80 : 94;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 84,
          position: "relative",
          color: "#ffffff",
          fontFamily: "Inter",
          background: "linear-gradient(135deg, #04080d 0%, #0a1824 60%, #06303a 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -220,
            right: -220,
            width: 760,
            height: 760,
            borderRadius: 380,
            display: "flex",
            background: "radial-gradient(circle, rgba(0,229,255,0.35) 0%, rgba(0,229,255,0) 70%)",
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {tag ? (
            <div
              style={{
                display: "flex",
                border: `2px solid ${CYAN}`,
                color: CYAN,
                borderRadius: 999,
                padding: "10px 28px",
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              {tag}
            </div>
          ) : (
            <div style={{ display: "flex" }} />
          )}
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} height={110} style={{ height: 110, maxWidth: 360 }} alt="" />
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", width: 120, height: 8, background: CYAN, marginBottom: 44 }} />
          <div style={{ display: "flex", fontSize, fontWeight: 700, lineHeight: 1.12 }}>{title}</div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            borderTop: "2px solid rgba(255,255,255,0.18)",
            paddingTop: 36,
          }}
        >
          <div style={{ display: "flex", fontSize: 38, fontWeight: 700 }}>{BUSINESS_NAME}</div>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 400, color: "#8fe9f5", marginTop: 10 }}>{CONTACT}</div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
      fonts: [
        { name: "Inter", data: bold, weight: 700, style: "normal" },
        { name: "Inter", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
