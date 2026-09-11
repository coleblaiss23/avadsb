"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConsent } from "@/components/consent/ConsentProvider";
import { CONTACT_EMAIL, LAUNCH_DISCLAIMER } from "@/lib/site";

export function SiteFooter() {
  const pathname = usePathname();
  const { openBanner } = useConsent();

  // Private opt-in track pages stay minimal — no site chrome.
  // Home keeps the radar full-bleed (SEO copy is sr-only on that page).
  if (pathname === "/" || pathname?.startsWith("/track/")) return null;

  return (
    <footer className="border-t border-[var(--ink-border)] bg-[var(--ink)] px-4 py-3">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center gap-2 text-center">
        <p className="text-[11px] text-slate-500">{LAUNCH_DISCLAIMER}</p>
        <nav
          aria-label="Legal"
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px]"
        >
          <Link href="/fuel" className="text-slate-400 hover:text-slate-200">
            Fuel
          </Link>
          <Link href="/weather" className="text-slate-400 hover:text-slate-200">
            Weather
          </Link>
          <Link href="/privacy" className="text-slate-400 hover:text-slate-200">
            Privacy
          </Link>
          <Link href="/terms" className="text-slate-400 hover:text-slate-200">
            Terms
          </Link>
          <a
            href="https://github.com/wiedehopf/tar1090"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-slate-200"
            title="Aircraft markers from tar1090 (GPL-2.0-or-later)"
          >
            Markers: tar1090
          </a>
          <button
            type="button"
            onClick={openBanner}
            className="text-slate-400 hover:text-slate-200"
          >
            Ad choices
          </button>
          {CONTACT_EMAIL ? (
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-slate-400 hover:text-slate-200"
            >
              {CONTACT_EMAIL}
            </a>
          ) : null}
        </nav>
      </div>
    </footer>
  );
}
