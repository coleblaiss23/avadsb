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
