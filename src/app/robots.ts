import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const origin = siteOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/track/"],
    },
    sitemap: [
      `${origin}/sitemap.xml`,
      `${origin}/airports/sitemap.xml`,
      `${origin}/weather/sitemap.xml`,
    ],
  };
}
