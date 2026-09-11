/** Client-safe re-exports (no fs). */
/** ICAOs the airport and weather pages prebuild. The pages still resolve any field in the airport DB. */
export const FEATURED_AIRPORT_ICAOS = [
  "KDEN",
  "KLAX",
  "KJFK",
  "KORD",
  "KTEB",
  "KBFI",
] as const;

export function featuredAirportIcaos(): string[] {
  return Array.from(
    new Set<string>([
      ...POPULAR_ROUTES.flatMap((r) => [r.origin, r.destination]),
      ...FEATURED_AIRPORT_ICAOS,
    ])
  );
}

export function featuredAirportParams(): { icao: string }[] {
  return featuredAirportIcaos().map((icao) => ({ icao: icao.toLowerCase() }));
}

export const POPULAR_ROUTES = [
  {
    origin: "KAPA",
    destination: "KSDL",
    slug: "kapa-to-ksdl",
    label: "Denver (KAPA) → Scottsdale (KSDL)",
  },
  {
    origin: "KVNY",
    destination: "KLAS",
    slug: "kvny-to-klas",
    label: "Van Nuys (KVNY) → Las Vegas (KLAS)",
  },
  {
    origin: "KAPA",
    destination: "KASE",
    slug: "kapa-to-kase",
    label: "Denver (KAPA) → Aspen (KASE)",
  },
  {
    origin: "KSJC",
    destination: "KRNO",
    slug: "ksjc-to-krno",
    label: "San Jose (KSJC) → Reno (KRNO)",
  },
  {
    origin: "KDVT",
    destination: "KFLG",
    slug: "kdvt-to-kflg",
    label: "Deer Valley (KDVT) → Flagstaff (KFLG)",
  },
] as const;
