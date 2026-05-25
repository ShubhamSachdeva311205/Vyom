import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

const SITE_URL = env.NEXT_PUBLIC_SITE_URL ?? "https://advaita.in";

/**
 * Sitemap — only public storefront routes. Admin / dashboard / checkout
 * / design-tokens stay out (also blocked by robots.ts). Phase 5.3
 * extends this with dynamic /store/[slug] entries when the books table
 * is live.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "/", changeFrequency: "weekly", priority: 1.0 },
    { path: "/store", changeFrequency: "daily", priority: 0.9 },
    { path: "/ibdp", changeFrequency: "weekly", priority: 0.8 },
    { path: "/igcse", changeFrequency: "weekly", priority: 0.8 },
    { path: "/community", changeFrequency: "daily", priority: 0.7 },
    { path: "/legal", changeFrequency: "monthly", priority: 0.3 },
    { path: "/legal/terms", changeFrequency: "monthly", priority: 0.3 },
    { path: "/legal/returns", changeFrequency: "monthly", priority: 0.3 },
    { path: "/legal/privacy", changeFrequency: "monthly", priority: 0.3 },
  ];

  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
