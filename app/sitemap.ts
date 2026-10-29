import type { MetadataRoute } from "next";

const siteUrl = "https://social-bot-beta.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${siteUrl}/demo`, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/data-deletion`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
