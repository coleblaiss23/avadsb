import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ads/AdSlot";
import { AppNav } from "@/components/layout/AppNav";
import { CrosswindAnalyzer } from "@/components/weather/CrosswindAnalyzer";
import { MetarBadge } from "@/components/weather/MetarBadge";
import { resolveAirport } from "@/lib/airports-db";
import { POPULAR_ROUTES } from "@/lib/airports-db-client";
import { runwayEndsForAirport } from "@/lib/crosswind";
import { normalizeIcao } from "@/lib/utils";

type PageProps = {
  params: Promise<{ icao: string }>;
};

const STATIC_ICAOS = Array.from(
  new Set<string>([
    ...POPULAR_ROUTES.flatMap((r) => [r.origin, r.destination]),
    "KDEN",
    "KLAX",
    "KJFK",
    "KORD",
    "KTEB",
    "KBFI",
  ])
);

export function generateStaticParams() {
  return STATIC_ICAOS.map((icao) => ({ icao: icao.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { icao: raw } = await params;
  const icao = normalizeIcao(raw);
  const airport = await resolveAirport(icao);
  if (!airport) return { title: "Airport not found" };

  const title = airport.icao;
  const description = `${airport.name} (${airport.icao}) in ${airport.city}, ${airport.state}. Elevation ${airport.elevation} ft, runway ${airport.runwayIdent} ${airport.runwayLength.toLocaleString()} × ${airport.runwayWidth} ft. Live METAR, crosswind, and cheap fuel stops.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `/airports/${airport.icao}`,
    },
    twitter: { card: "summary", title, description },
    alternates: { canonical: `/airports/${airport.icao}` },
  };
}

export default async function AirportIcaoPage({ params }: PageProps) {
  const { icao: raw } = await params;
  const icao = normalizeIcao(raw);
  const airport = await resolveAirport(icao);
  if (!airport) notFound();

  const ends = runwayEndsForAirport(airport);

  return (
    <div className="night-ui tool-atmosphere min-h-dvh">
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
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
            US airport
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
            {airport.city}, {airport.state} · {airport.type}
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

        {ends.length > 0 && (
          <section className="instrument-panel p-4">
            <h2 className="text-sm font-semibold text-[var(--ink-text)]">Runways</h2>
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
                    {end.lengthFt.toLocaleString()} × {end.widthFt} ft · {end.surface}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <AdSlot placement="weather-widget" />

        <p className="text-sm text-slate-500">
          Find cheap fuel stops from {airport.icao}:{" "}
          <Link href="/fuel" className="text-accent hover:underline">
            Open corridor fuel matrix →
          </Link>
        </p>
      </main>
    </div>
  );
}
