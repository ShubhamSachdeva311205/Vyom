import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

const SITE_URL = env.NEXT_PUBLIC_SITE_URL ?? "https://advaita.in";

/**
 * Robots policy. Crawlers get the storefront; operational and internal
 * surfaces stay out of search results.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/dashboard",
          "/dashboard/*",
          "/checkout",
          "/design-tokens",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
