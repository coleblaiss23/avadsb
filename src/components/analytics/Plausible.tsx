"use client";

import Script from "next/script";
import { plausibleDomain, plausibleScriptSrc } from "@/lib/analytics";

/** Cookieless Plausible. No banner. No-op until a domain is configured. */
export function Plausible() {
  const domain = plausibleDomain();
  if (!domain) return null;

  return (
    <Script
      defer
      data-domain={domain}
      src={plausibleScriptSrc()}
      strategy="afterInteractive"
    />
  );
}
