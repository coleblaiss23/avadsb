import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PopularRoutePlanner } from "@/components/planner/PopularRoutePlanner";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { resolveAirport } from "@/lib/airports-db";
import { POPULAR_ROUTES } from "@/lib/airports-db-client";
import { haversineNm } from "@/lib/geo";
import { routePageJsonLd } from "@/lib/jsonld";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return POPULAR_ROUTES.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const route = POPULAR_ROUTES.find((r) => r.slug === slug);
  if (!route) return { title: "Route not found" };

  const origin = await resolveAirport(route.origin);
  const dest = await resolveAirport(route.destination);
  const nm =
    origin && dest
      ? haversineNm(
          { lat: origin.latitude, lng: origin.longitude },
          { lat: dest.latitude, lng: dest.longitude }
        )
      : null;

  const originLabel = origin
    ? `${origin.name} (${route.origin}) in ${origin.city}, ${origin.state}`
    : route.origin;
  const destLabel = dest
    ? `${dest.name} (${route.destination}) in ${dest.city}, ${dest.state}`
    : route.destination;

  const title = `${route.origin} → ${route.destination} cheap fuel stops`;
  const description = [
    `Find the cheapest 100LL and Jet-A along ${originLabel} to ${destLabel}`,
    nm != null ? `(~${Math.round(nm)} nm).` : ".",
    "Ranked corridor stops with live map overlays on AvADSB.",
  ].join(" ");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `/routes/${route.slug}`,
    },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: `/routes/${route.slug}` },
  };
}

export default async function PopularRoutePage({ params }: PageProps) {
  const { slug } = await params;
  const route = POPULAR_ROUTES.find((r) => r.slug === slug);
  if (!route) notFound();

  const origin = await resolveAirport(route.origin);
  const dest = await resolveAirport(route.destination);
  const nm =
    origin && dest
      ? Math.round(
          haversineNm(
            { lat: origin.latitude, lng: origin.longitude },
            { lat: dest.latitude, lng: dest.longitude }
          )
        )
      : null;

  const description = `Cheapest 100LL and Jet-A stops from ${origin?.name ?? route.origin} to ${dest?.name ?? route.destination}${nm != null ? ` (~${nm} nm)` : ""}.`;

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Fuel", path: "/fuel" },
    { name: route.label, path: `/routes/${route.slug}` },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <JsonLd
        data={routePageJsonLd({
          slug: route.slug,
          label: route.label,
          description,
          origin,
          destination: dest,
          originIcao: route.origin,
          destinationIcao: route.destination,
          distanceNm: nm,
          crumbs,
        })}
      />

      <section className="night-ui shrink-0 border-b border-[var(--ink-border)] bg-[var(--ink)] px-4 py-4">
        <div className="mx-auto max-w-[1600px] space-y-3">
          <Breadcrumbs
            items={[
              { name: "Home", href: "/" },
              { name: "Fuel", href: "/fuel" },
              { name: `${route.origin} → ${route.destination}` },
            ]}
          />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--scope-cyan)]">
              Popular fuel corridor
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[var(--ink-text)] sm:text-3xl">
              {route.origin} → {route.destination}
              {nm != null ? (
                <span className="ml-2 font-avionics text-lg font-medium text-slate-400">
                  ~{nm} nm
                </span>
              ) : null}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              {description} Prefills the corridor fuel matrix for{" "}
              {origin?.name ?? route.origin} to {dest?.name ?? route.destination}
              .
            </p>
            <nav
              aria-label="Airport links"
              className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm"
            >
              <Link
                href={`/airports/${route.origin}`}
                className="font-medium text-accent hover:underline"
              >
                {route.origin} airport
              </Link>
              <Link
                href={`/weather/${route.origin}`}
                className="font-medium text-accent hover:underline"
              >
                {route.origin} METAR
              </Link>
              <Link
                href={`/airports/${route.destination}`}
                className="font-medium text-accent hover:underline"
              >
                {route.destination} airport
              </Link>
              <Link
                href={`/weather/${route.destination}`}
                className="font-medium text-accent hover:underline"
              >
                {route.destination} METAR
              </Link>
            </nav>
          </div>
        </div>
      </section>

      <PopularRoutePlanner
        originIcao={route.origin}
        destinationIcao={route.destination}
        routeLabel={route.label}
      />
    </div>
  );
}
