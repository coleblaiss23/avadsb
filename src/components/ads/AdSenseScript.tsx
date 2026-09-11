"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useConsent } from "@/components/consent/ConsentProvider";
import { ADSENSE_CLIENT } from "@/lib/site";

/**
 * Loads the AdSense library once, only after consent or a confirmed
 * non-EU/UK region. Missing publisher id means the script stays out.
 * Opt-in /track pages never load ads.
 */
export function AdSenseScript() {
  const pathname = usePathname();
  const { adsAllowed } = useConsent();
  const client = ADSENSE_CLIENT;
  const onPrivateTrack = pathname?.startsWith("/track/");

  useEffect(() => {
    if (onPrivateTrack || !adsAllowed || !client) return;
    if (document.querySelector("script[data-adsense-loader]")) return;
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
    script.crossOrigin = "anonymous";
    script.dataset.adsenseLoader = "true";
    document.head.appendChild(script);
  }, [adsAllowed, client, onPrivateTrack]);

  return null;
}
