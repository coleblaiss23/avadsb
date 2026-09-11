import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ads/AdSlot";
import { AppNav } from "@/components/layout/AppNav";
import { NotamList } from "@/components/notams/NotamList";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { CrosswindAnalyzer } from "@/components/weather/CrosswindAnalyzer";
import { MetarBadge } from "@/components/weather/MetarBadge";
import {
  isAirportPageIndexable,
  popularRoutesForIcao,
  resolveAirport,
} from "@/lib/airports-db";
import { featuredAirportParams } from "@/lib/airports-db-client";
import { runwayEndsForAirport } from "@/lib/crosswind";
import { resolveFuelPrice, verificationTag } from "@/lib/fuel-pricing";
import { airportPageJsonLd } from "@/lib/jsonld";
import { getMetarOrMock } from "@/lib/metar";
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
  if (!airport) return { title: "Airport not found" };

  const ends = runwayEndsForAirport(airport);
  const metar = await getMetarOrMock(airport.icao, airport.elevation);
  const indexable = isAirportPageIndexable(airport);

  const title = `${airport.name} (${airport.icao}) — ${airport.city}, ${airport.state}`;
  const description = [
    `${airport.name} (${airport.icao}) in ${airport.city}, ${airport.state}.`,
    `${airport.type} field, elevation ${airport.elevation.toLocaleString()} ft,`,
    ends.length > 0
      ? `${ends.length} runway end${ends.length === 1 ? "" : "s"}`
      : `primary runway ${airport.runwayIdent}`,
    `(${airport.runwayLength.toLocaleString()} × ${airport.runwayWidth} ft, ${airport.surface}).`,
    `Current flight category ${metar.category}, wind ${metar.wind}.`,
    "Live METAR, NOTAMs, crosswind, and corridor fuel tools.",
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
      url: `/airports/${airport.icao}`,
    },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: `/airports/${airport.icao}` },
  };
}

export default async function AirportIcaoPage({ params }: PageProps) {
  const { icao: raw } = await params;
  const icao = normalizeIcao(raw);
  const airport = await resolveAirport(icao);
  if (!airport) notFound();

  const ends = runwayEndsForAirport(airport);
  const metar = await getMetarOrMock(airport.icao, airport.elevation);
  const realFuel = await resolveFuelPrice(airport.icao, "100LL");
  const relatedRoutes = popularRoutesForIcao(airport.icao);

  const description = [
    `${airport.name} (${airport.icao}) in ${airport.city}, ${airport.state}.`,
    `Elevation ${airport.elevation.toLocaleString()} ft,`,
    `${ends.length || 1} runway end(s), flight category ${metar.category}.`,
  ].join(" ");

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Fuel tools", path: "/fuel" },
    { name: airport.icao, path: `/airports/${airport.icao}` },
  ];

  return (
    <div className="night-ui tool-atmosphere flex min-h-0 flex-1 flex-col">
      <JsonLd
        data={airportPageJsonLd({
          airport,
          description,
          crumbs,
        })}
      />
      <AppNav
        rightSlot={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/weather/${airport.icao}`}
              className="rounded-lg border border-[var(--ink-border)] bg-[var(--ink-elevated)] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"
            >
              Live METAR
            </Link>
            <CrosswindAnalyzer defaultIcao={airport.icao} />
          </div>
        }
      />

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: "Fuel tools", href: "/fuel" },
            { name: airport.icao },
          ]}
        />

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
            US airport · {airport.type}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--ink-text)]">
            {airport.icao}
            {airport.faa && airport.faa !== airport.icao ? (
              <span className="ml-2 font-avionics text-lg font-medium text-slate-400">
                / {airport.faa}
              </span>
            ) : null}
          </h1>
          <p className="mt-2 text-lg text-[var(--ink-text)]">{airport.name}</p>
          <p className="text-[var(--ink-muted)]">
            {airport.city}, {airport.state}
          </p>
        </div>

        <MetarBadge airportIcao={airport.icao} variant="card" />

        <dl className="instrument-panel grid gap-3 p-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-[var(--ink-muted)]">Elevation (ft)</dt>
            <dd className="font-avionics text-sm font-semibold text-[var(--ink-text)]">
              {airport.elevation.toLocaleString()} ft
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Coordinates</dt>
            <dd className="font-avionics text-sm font-semibold text-[var(--ink-text)]">
              {airport.latitude.toFixed(4)}, {airport.longitude.toFixed(4)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Primary runway</dt>
            <dd className="font-avionics text-sm font-semibold text-[var(--ink-text)]">
              {airport.runwayIdent} · {airport.runwayLength.toLocaleString()} ×{" "}
              {airport.runwayWidth} ft · {airport.surface}
            </dd>
          </div>
        </dl>

        {realFuel ? (
          <section className="instrument-panel p-4">
            <h2 className="text-sm font-semibold text-[var(--ink-text)]">
              Reported 100LL
            </h2>
            <p className="mt-2 font-avionics text-lg font-semibold text-[var(--ink-text)]">
              ${realFuel.pricePerGallon.toFixed(2)}
              <span className="ml-2 text-sm font-medium text-slate-400">
                / gal · {realFuel.fboName}
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {verificationTag(realFuel)}
            </p>
          </section>
        ) : null}

        {ends.length > 0 && (
          <section className="instrument-panel p-4">
            <h2 className="text-sm font-semibold text-[var(--ink-text)]">
              Runways
            </h2>
            <ul className="mt-3 divide-y divide-panel-border">
              {ends.map((end) => (
                <li
                  key={`${end.ident}-${end.headingDegT}-${end.lengthFt}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                >
                  <span className="font-avionics font-semibold text-[var(--ink-text)]">
                    RWY {end.ident}
                  </span>
                  <span className="font-avionics text-slate-500">
                    hdg {Math.round(end.headingDegT)}°T ·{" "}
                    {end.lengthFt.toLocaleString()} × {end.widthFt} ft ·{" "}
                    {end.surface}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <NotamList icao={airport.icao} />

        <AdSlot placement="weather-widget" />

        <nav
          aria-label="Related tools"
          className="space-y-2 text-sm text-slate-500"
        >
          <p>
            <Link
              href={`/weather/${airport.icao}`}
              className="font-medium text-accent hover:underline"
            >
              Full {airport.icao} METAR briefing →
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
              Corridor fuel matrix →
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
                    Fuel stops: {route.label}
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
