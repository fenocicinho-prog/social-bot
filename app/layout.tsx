export const metadata = { title: "Cicinho Social Bot" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>{children}</body>
    </html>
  );
}
