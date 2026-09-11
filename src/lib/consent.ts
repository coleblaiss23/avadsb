/** First-party consent cookie. Not an ad identifier. */
export const CONSENT_COOKIE = "afm_ad_consent";

export type AdConsent = "granted" | "denied";

/** EU, EEA, UK. Unknown country is treated as required — never assume "outside". */
const CONSENT_REQUIRED = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE", "IS", "LI", "NO", "GB", "UK",
]);

export function consentRequiredForCountry(country: string | null | undefined): boolean {
  if (!country) return true;
  return CONSENT_REQUIRED.has(country.trim().toUpperCase());
}

export function countryFromHeaders(headers: Headers): string | null {
  const raw =
    headers.get("x-vercel-ip-country") ||
    headers.get("cf-ipcountry") ||
    headers.get("x-country-code") ||
    headers.get("cloudfront-viewer-country");
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || code === "XX" || code === "T1") return null;
  return code;
}

export function readConsentCookie(raw: string | undefined): AdConsent | null {
  if (raw === "granted" || raw === "denied") return raw;
  return null;
}

/** Personalized ads only after an explicit grant, or a confirmed non-required region. */
export function adsAllowed(opts: {
  consent: AdConsent | null;
  country: string | null;
  regionConfirmed: boolean;
}): boolean {
  if (opts.consent === "denied") return false;
  if (opts.consent === "granted") return true;
  return opts.regionConfirmed && !consentRequiredForCountry(opts.country);
}
