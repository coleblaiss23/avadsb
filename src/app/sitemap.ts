import type { MetadataRoute } from "next";
import { catalogLastModified } from "@/lib/airports-db";
import { POPULAR_ROUTES } from "@/lib/airports-db-client";
import { siteOrigin } from "@/lib/site";

const STATIC_PATHS = [
  "/",
  "/fuel",
  "/weather",
  "/crosswind",
  "/quiz",
  "/squawk",
  "/hobbs",
  "/privacy",
  "/terms",
] as const;

/**
 * Root sitemap: static tools + popular routes.
 * Airport and weather URLs live in child sitemaps so each file stays well
 * under Google's 50,000-URL cap (~13k indexable ICAOs × 2 ≈ 26k today).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const catalogModified = await catalogLastModified();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${origin}${path}`,
    lastModified: catalogModified,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.6,
  }));

  const routeEntries: MetadataRoute.Sitemap = POPULAR_ROUTES.map((route) => ({
    url: `${origin}/routes/${route.slug}`,
    lastModified: catalogModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticEntries, ...routeEntries];
}
