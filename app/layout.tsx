import type { Metadata } from "next";

const siteUrl = "https://social-bot-beta.vercel.app";
const title = "Cicinho Social Bot — Assistant Messenger et WhatsApp";
const description =
  "Un assistant qui répond aux clients sur Messenger et WhatsApp et publie automatiquement sur Facebook, en français et en malgache.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: `%s | Cicinho Social Bot` },
  description,
  applicationName: "Cicinho Social Bot",
  alternates: { canonical: "/demo" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.png", type: "image/png", sizes: "1024x1024" },
    ],
    apple: [{ url: "/logo.png", sizes: "1024x1024" }],
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Cicinho Social Bot",
    title,
    description,
    url: "/demo",
    images: [{ url: "/logo.png", width: 1024, height: 1024, alt: "Logo Cicinho Social Bot" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/logo.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>{children}</body>
    </html>
  );
}
