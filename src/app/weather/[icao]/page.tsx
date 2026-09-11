import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppNav } from "@/components/layout/AppNav";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { CrosswindAnalyzer } from "@/components/weather/CrosswindAnalyzer";
import { MetarBadge } from "@/components/weather/MetarBadge";
import { MetarTokenStrip } from "@/components/weather/MetarTokenStrip";
import {
  isAirportPageIndexable,
  popularRoutesForIcao,
  resolveAirport,
} from "@/lib/airports-db";
import { featuredAirportParams } from "@/lib/airports-db-client";
import { weatherPageJsonLd } from "@/lib/jsonld";
import { getMetarOrMock, FLIGHT_CATEGORY_STYLE } from "@/lib/metar";
import { normalizeIcao } from "@/lib/utils";

type PageProps = {
  params: Promise<{ icao: string }>;
};

export function generateStaticParams() {
  return featuredAirportParams();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { icao: raw } = await params;
  const icao = normalizeIcao(raw);
  const airport = await resolveAirport(icao);
  if (!airport) return { title: "Weather not found" };

  const metar = await getMetarOrMock(airport.icao, airport.elevation);
  const indexable = isAirportPageIndexable(airport);
  const title = `${airport.icao} METAR (${metar.category}) — ${airport.name}, ${airport.city}`;
  const description = [
    `Live ${metar.category} METAR for ${airport.name} (${airport.icao}) in ${airport.city}, ${airport.state}.`,
    `Wind ${metar.wind}, visibility ${metar.visibilitySm} SM`,
    metar.ceilingFt != null
      ? `ceiling ${metar.ceilingFt.toLocaleString()} ft`
      : "unlimited ceiling",
    metar.densityAltitudeFt != null
      ? `density altitude ${metar.densityAltitudeFt.toLocaleString()} ft.`
      : ".",
    "Plain-English decode, crosswind tools, and airport details.",
  ].join(" ");

  return {
    title,
    description,
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/weather/${airport.icao}`,
    },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: `/weather/${airport.icao}` },
  };
}

export default async function WeatherIcaoPage({ params }: PageProps) {
  const { icao: raw } = await params;
  const icao = normalizeIcao(raw);
  const airport = await resolveAirport(icao);
  if (!airport) notFound();

  const metar = await getMetarOrMock(airport.icao, airport.elevation);
  const style = FLIGHT_CATEGORY_STYLE[metar.category];
  const relatedRoutes = popularRoutesForIcao(airport.icao);

  const description = `Live METAR for ${airport.name} (${airport.icao}): ${metar.category}, wind ${metar.wind}, vis ${metar.visibilitySm} SM.`;

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "METAR", path: "/weather" },
    { name: airport.icao, path: `/weather/${airport.icao}` },
  ];

  return (
    <div className="night-ui tool-atmosphere flex min-h-0 flex-1 flex-col">
      <JsonLd
        data={weatherPageJsonLd({
          airport,
          metar,
          description,
          crumbs,
        })}
      />
      <AppNav
        rightSlot={<CrosswindAnalyzer defaultIcao={airport.icao} />}
      />

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: "METAR", href: "/weather" },
            { name: airport.icao },
          ]}
        />

        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            Live aviation weather
          </p>
          <h1 className="mt-1 font-mono text-3xl font-bold tracking-tight text-[var(--ink-text)]">
            {airport.icao}{" "}
            <span
              className={`inline-flex rounded-md border px-2 py-0.5 font-avionics text-base ${style.bg} ${style.text} ${style.border}`}
            >
              {metar.category}
            </span>
          </h1>
          <p className="mt-2 text-[var(--ink-muted)]">
            {airport.name} · {airport.city}, {airport.state} · elevation{" "}
            {airport.elevation.toLocaleString()} ft
          </p>
        </div>

        <MetarBadge airportIcao={airport.icao} variant="card" showLink={false} />

        <dl className="instrument-panel grid gap-3 p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-xs text-[var(--ink-muted)]">Raw METAR</dt>
            <dd className="mt-1">
              <MetarTokenStrip raw={metar.raw} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--ink-muted)]">
              Ceiling (ft) / visibility (SM)
            </dt>
            <dd className="mt-1 font-mono text-sm tabular-nums text-[var(--ink-text)]">
              {metar.ceilingFt != null
                ? `${metar.ceilingFt.toLocaleString()} ft`
                : "Unlimited"}{" "}
              · {metar.visibilitySm} SM
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--ink-muted)]">Density altitude (ft)</dt>
            <dd className="mt-1 font-mono text-sm tabular-nums text-[var(--ink-text)]">
              {metar.densityAltitudeFt != null
                ? `${metar.densityAltitudeFt.toLocaleString()} ft`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--ink-muted)]">Observed</dt>
            <dd className="mt-1 font-mono text-sm tabular-nums text-[var(--ink-text)]">
              {new Date(metar.observedAt).toLocaleString()}
            </dd>
          </div>
        </dl>

        <nav aria-label="Related pages" className="space-y-2 text-sm text-slate-500">
          <p>
            <Link
              href={`/airports/${airport.icao}`}
              className="font-medium text-accent hover:underline"
            >
              {airport.icao} airport details →
            </Link>
            {" · "}
            <Link
              href={`/crosswind?icao=${airport.icao}`}
              className="font-medium text-accent hover:underline"
            >
              Crosswind analyzer →
            </Link>
            {" · "}
            <Link href="/fuel" className="font-medium text-accent hover:underline">
              Plan fuel stops →
            </Link>
          </p>
          {relatedRoutes.length > 0 ? (
            <ul className="flex flex-wrap gap-x-3 gap-y-1">
              {relatedRoutes.map((route) => (
                <li key={route.slug}>
                  <Link
                    href={`/routes/${route.slug}`}
                    className="font-medium text-accent hover:underline"
                  >
                    Fuel corridor: {route.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </nav>
      </main>
    </div>
  );
}
