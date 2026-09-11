import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl, siteOrigin } from "@/lib/site";
import type { Airport, ParsedMetar } from "@/types";

export type Crumb = { name: string; path: string };

function breadcrumbList(crumbs: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

function airportNode(airport: Airport) {
  return {
    "@type": "Airport",
    "@id": absoluteUrl(`/airports/${airport.icao}`),
    name: airport.name,
    icaoCode: airport.icao,
    ...(airport.faa && airport.faa.length === 3
      ? { iataCode: airport.faa }
      : {}),
    geo: {
      "@type": "GeoCoordinates",
      latitude: airport.latitude,
      longitude: airport.longitude,
      ...(Number.isFinite(airport.elevation)
        ? { elevation: airport.elevation }
        : {}),
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: airport.city,
      addressRegion: airport.state,
      addressCountry: "US",
    },
  };
}

/** Homepage — free aviation tool suite. */
export function webApplicationJsonLd(): Record<string, unknown> {
  const origin = siteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: `${origin}/`,
    description: SITE_DESCRIPTION,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    browserRequirements: "Requires JavaScript",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Unfiltered live ADS-B traffic radar",
      "Live ATIS / METAR decode",
      "Runway crosswind calculator",
      "Corridor fuel price optimizer",
      "Squawk code decoder",
      "FAA ground school practice quiz (Private, Instrument, Commercial, CFI)",
      "Hobbs cost splitter",
    ],
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: origin,
    },
  };
}

export function airportPageJsonLd(opts: {
  airport: Airport;
  description: string;
  crumbs: Crumb[];
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [
      airportNode(opts.airport),
      {
        "@type": "WebPage",
        "@id": absoluteUrl(`/airports/${opts.airport.icao}`),
        url: absoluteUrl(`/airports/${opts.airport.icao}`),
        name: `${opts.airport.name} (${opts.airport.icao})`,
        description: opts.description,
        about: { "@id": absoluteUrl(`/airports/${opts.airport.icao}`) },
        isPartOf: {
          "@type": "WebSite",
          name: SITE_NAME,
          url: siteOrigin(),
        },
      },
      breadcrumbList(opts.crumbs),
    ],
  };
}

export function weatherPageJsonLd(opts: {
  airport: Airport;
  metar: ParsedMetar;
  description: string;
  crumbs: Crumb[];
}): Record<string, unknown> {
  const pageUrl = absoluteUrl(`/weather/${opts.airport.icao}`);
  const airportId = absoluteUrl(`/airports/${opts.airport.icao}`);
  return {
    "@context": "https://schema.org",
    "@graph": [
      airportNode(opts.airport),
      {
        "@type": "Dataset",
        "@id": `${pageUrl}#metar`,
        name: `${opts.airport.icao} METAR`,
        description: opts.description,
        url: pageUrl,
        about: { "@id": airportId },
        temporalCoverage: opts.metar.observedAt,
        variableMeasured: [
          "flight category",
          "wind",
          "visibility",
          "ceiling",
          "density altitude",
        ],
        creator: {
          "@type": "Organization",
          name: "AviationWeather.gov",
        },
      },
      {
        "@type": "WebPage",
        "@id": pageUrl,
        url: pageUrl,
        name: `${opts.airport.icao} METAR — ${opts.airport.name}`,
        description: opts.description,
        about: { "@id": airportId },
        mainEntity: { "@id": `${pageUrl}#metar` },
        isPartOf: {
          "@type": "WebSite",
          name: SITE_NAME,
          url: siteOrigin(),
        },
      },
      breadcrumbList(opts.crumbs),
    ],
  };
}

export function routePageJsonLd(opts: {
  slug: string;
  label: string;
  description: string;
  origin: Airport | undefined;
  destination: Airport | undefined;
  originIcao: string;
  destinationIcao: string;
  distanceNm: number | null;
  crumbs: Crumb[];
}): Record<string, unknown> {
  const pageUrl = absoluteUrl(`/routes/${opts.slug}`);
  const itinerary = [opts.originIcao, opts.destinationIcao].map(
    (icao, index) => {
      const airport =
        index === 0 ? opts.origin : opts.destination;
      return {
        "@type": "ListItem",
        position: index + 1,
        item: airport
          ? airportNode(airport)
          : { "@type": "Airport", icaoCode: icao, name: icao },
      };
    }
  );

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Trip",
        "@id": `${pageUrl}#trip`,
        name: opts.label,
        description: opts.description,
        ...(opts.distanceNm != null
          ? {
              itineraryDistance: {
                "@type": "Distance",
                name: `${Math.round(opts.distanceNm)} nautical miles`,
              },
            }
          : {}),
        itinerary: {
          "@type": "ItemList",
          itemListElement: itinerary,
        },
      },
      {
        "@type": "WebPage",
        "@id": pageUrl,
        url: pageUrl,
        name: opts.label,
        description: opts.description,
        mainEntity: { "@id": `${pageUrl}#trip` },
        isPartOf: {
          "@type": "WebSite",
          name: SITE_NAME,
          url: siteOrigin(),
        },
      },
      breadcrumbList(opts.crumbs),
    ],
  };
}

/** @deprecated Prefer typed builders; kept for any remaining call sites. */
export function landingJsonLd(opts: {
  path: string;
  name: string;
  description: string;
  crumbs: Crumb[];
}): Record<string, unknown> {
  const url = absoluteUrl(opts.path);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: opts.name,
        description: opts.description,
        isPartOf: {
          "@type": "WebSite",
          name: SITE_NAME,
          url: siteOrigin(),
        },
      },
      breadcrumbList(opts.crumbs),
    ],
  };
}
