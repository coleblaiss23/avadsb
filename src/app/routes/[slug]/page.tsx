import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PopularRoutePlanner } from "@/components/planner/PopularRoutePlanner";
import { resolveAirport } from "@/lib/airports-db";
import { POPULAR_ROUTES } from "@/lib/airports-db-client";
import { haversineNm } from "@/lib/geo";

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

  const title = `${route.origin} to ${route.destination} Cheap Fuel Stops`;
  const description = `Find the cheapest 100LL and Jet-A along ${origin?.name ?? route.origin} to ${dest?.name ?? route.destination}${nm != null ? ` · ~${Math.round(nm)} nm` : ""}.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

export default async function PopularRoutePage({ params }: PageProps) {
  const { slug } = await params;
  const route = POPULAR_ROUTES.find((r) => r.slug === slug);
  if (!route) notFound();

  return (
    <PopularRoutePlanner
      originIcao={route.origin}
      destinationIcao={route.destination}
      routeLabel={route.label}
    />
  );
}
