"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConsent } from "@/components/consent/ConsentProvider";

export function ConsentBanner() {
  const pathname = usePathname();
  const { bannerOpen, setConsent } = useConsent();
  if (!bannerOpen || pathname?.startsWith("/track/")) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="consent-title"
      aria-describedby="consent-copy"
      className="fixed inset-x-3 bottom-3 z-[5000] mx-auto max-w-3xl border border-[var(--ink-border)] bg-[var(--ink)] p-4 shadow-lg sm:inset-x-4"
    >
      <p
        id="consent-title"
        className="font-display text-sm font-semibold text-slate-100"
      >
        Ads and cookies
      </p>
      <p id="consent-copy" className="mt-1 text-xs leading-relaxed text-slate-400">
        Personalized ads use Google AdSense cookies. We do not load that
        script until you allow it, or until we can confirm you are outside the
        EU and UK. Analytics is cookieless.{" "}
        <Link href="/privacy" className="text-[var(--scope-cyan)] hover:underline">
          Privacy policy
        </Link>
        .
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setConsent("granted")}
          className="border border-[var(--scope-cyan)]/50 bg-[var(--ink-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--scope-cyan)]"
        >
          Allow personalized ads
        </button>
        <button
          type="button"
          onClick={() => setConsent("denied")}
          className="border border-[var(--ink-border)] px-3 py-1.5 text-xs font-semibold text-slate-300"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
