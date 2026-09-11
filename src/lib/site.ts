/** Public brand / SEO helpers. */
export const SITE_NAME =
  process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "AvADSB";

export const SITE_TAGLINE =
  "Unfiltered Radar, METAR & Flight Intelligence";

export const SITE_DESCRIPTION =
  "AvADSB combines unfiltered live ADS-B traffic radar, real-time ATIS/METAR decodes, runway crosswind math, squawk decoding, FAA ground school practice, and corridor fuel optimization.";

/** Next.js metadata title template: `%s | AvADSB - Unfiltered Radar…` */
export const SITE_TITLE_TEMPLATE = `%s | ${SITE_NAME} - ${SITE_TAGLINE}`;

export const SITE_DEFAULT_TITLE = `${SITE_NAME} - ${SITE_TAGLINE}`;

/** Convenience-layer warning — not a certified preflight briefing. */
export const BRIEFING_DISCLAIMER =
  "Verify all NOTAMs and TFRs against an official briefing (1800wxbrief, ForeFlight, or FAA channels) before flight. This app is a convenience layer, not a certified briefing source.";

/** Site-wide footer line. Keep the wording aligned with the public disclaimer. */
export const LAUNCH_DISCLAIMER =
  "Informational use only — verify all data (fuel prices, weather, NOTAMs, TFRs) with official sources before flight.";

/** Absolute origin for sitemap, robots, and JSON-LD. Never invent a public host. */
export function siteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return "http://localhost:3000";
}

/** Absolute URL for a site path (`/airports/KAPA` → `https://…/airports/KAPA`). */
export function absoluteUrl(path = "/"): string {
  const origin = siteOrigin();
  if (!path || path === "/") return `${origin}/`;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Privacy-policy contact. Empty until NEXT_PUBLIC_CONTACT_EMAIL is set. */
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "";

export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || "";

/** `ca-pub-…` → `pub-…` for ads.txt. Empty until an AdSense account exists. */
export function adsensePublisherId(client = ADSENSE_CLIENT): string | null {
  const match = client.match(/^(?:ca-)?(pub-[0-9]{16})$/);
  return match?.[1] ?? null;
}
