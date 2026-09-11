import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppNav } from "@/components/layout/AppNav";
import { CrosswindAnalyzer } from "@/components/weather/CrosswindAnalyzer";
import { MetarBadge } from "@/components/weather/MetarBadge";
import { MetarTokenStrip } from "@/components/weather/MetarTokenStrip";
import { resolveAirport } from "@/lib/airports-db";
import { POPULAR_ROUTES } from "@/lib/airports-db-client";
import { getMetarOrMock, FLIGHT_CATEGORY_STYLE } from "@/lib/metar";
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
  if (!airport) return { title: "Weather not found" };

  const metar = await getMetarOrMock(airport.icao, airport.elevation);
  const title = airport.icao;
  const description = `Live METAR for ${airport.name} (${airport.icao}, ${airport.city} ${airport.state}): ${metar.category}, wind ${metar.wind}, vis ${metar.visibilitySm} SM. Density altitude and crosswind tools.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `/weather/${airport.icao}`,
    },
    twitter: { card: "summary", title, description },
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

  return (
    <div className="night-ui tool-atmosphere min-h-dvh">
      <AppNav
        rightSlot={<CrosswindAnalyzer defaultIcao={airport.icao} />}
      />

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
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
            <dt className="text-xs text-[var(--ink-muted)]">Ceiling (ft) / visibility (SM)</dt>
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

        <p className="text-sm text-slate-500">
          <Link
            href={`/airports/${airport.icao}`}
            className="font-medium text-accent hover:underline"
          >
            View airport details →
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
      </main>
    </div>
  );
}
