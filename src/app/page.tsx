import type { Metadata } from "next";
import Link from "next/link";
import { PlannerShell } from "@/components/planner/PlannerShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { webApplicationJsonLd } from "@/lib/jsonld";
import {
  SITE_DEFAULT_TITLE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: SITE_DEFAULT_TITLE },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE_DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
  },
};

const TOOL_LINKS = [
  { href: "/fuel", label: "Corridor fuel" },
  { href: "/weather", label: "ATIS & METAR" },
  { href: "/crosswind", label: "Crosswind" },
  { href: "/squawk", label: "Squawk decoder" },
  { href: "/quiz", label: "FAA quiz" },
  { href: "/hobbs", label: "Hobbs splitter" },
] as const;

export default function HomePage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <JsonLd data={webApplicationJsonLd()} />
      <PlannerShell />

      {/* Crawlable copy — visually hidden so the radar uses the full viewport. */}
      <section className="sr-only" aria-label="About AvADSB">
        <h1>
          {SITE_NAME} — {SITE_TAGLINE}
        </h1>
        <p>
          {SITE_DESCRIPTION} Plan a corridor, check the METAR, and scan live
          traffic — free tools for GA pilots, not a certified briefing.
        </p>
        <ul>
          {TOOL_LINKS.map((tool) => (
            <li key={tool.href}>
              <Link href={tool.href}>{tool.label}</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
