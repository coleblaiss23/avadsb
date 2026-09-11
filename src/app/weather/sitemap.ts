import type { MetadataRoute } from "next";
import { listIndexableIcaos } from "@/lib/airports-db";
import { siteOrigin } from "@/lib/site";

/** Hour-bucketed lastmod — METARs refresh continuously; avoid a static build stamp. */
function weatherLastModified(): Date {
  const d = new Date();
  d.setUTCMinutes(0, 0, 0);
  return d;
}

/** /weather/sitemap.xml — one METAR page per indexable airport. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const lastModified = weatherLastModified();
  const icaos = await listIndexableIcaos();

  return icaos.map((icao) => ({
    url: `${origin}/weather/${icao}`,
    lastModified,
    changeFrequency: "hourly",
    priority: 0.6,
  }));
}
