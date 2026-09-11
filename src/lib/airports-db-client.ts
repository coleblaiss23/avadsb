/** Client-safe re-exports (no fs). */
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
