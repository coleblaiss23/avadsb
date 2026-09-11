import type { MetadataRoute } from "next";
import { catalogLastModified, listIndexableIcaos } from "@/lib/airports-db";
import { siteOrigin } from "@/lib/site";

/** /airports/sitemap.xml — one URL per indexable airport. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const lastModified = await catalogLastModified();
  const icaos = await listIndexableIcaos();

  return icaos.map((icao) => ({
    url: `${origin}/airports/${icao}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
}
