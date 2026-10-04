import type { NextConfig } from "next";

const config: NextConfig = {
  // Inclut les polices de la carte image dans le déploiement Vercel.
  outputFileTracingIncludes: {
    "/api/og": ["./assets/**/*"],
  },
};

export default config;
