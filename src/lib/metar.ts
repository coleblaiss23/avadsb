import type { FlightCategory, MetarSnapshot, ParsedMetar } from "@/types";

/** AviationWeather.gov METAR JSON row (subset). */
export interface AviationWeatherMetar {
  icaoId?: string;
  rawOb?: string;
  reportTime?: string;
  obsTime?: number;
  temp?: number;
  dewp?: number;
  wdir?: number | string;
  wspd?: number;
  wgst?: number;
  visib?: string | number;
  altim?: number;
  elev?: number;
  cover?: string;
  clouds?: Array<{ cover?: string; base?: number }>;
  fltCat?: string;
  name?: string;
}

const AW_METAR_URL = "https://aviationweather.gov/api/data/metar";

/** FAA flight category colors: VFR green, MVFR blue, IFR red, LIFR magenta. */
export const FLIGHT_CATEGORY_STYLE: Record<
  FlightCategory,
  { label: string; bg: string; text: string; border: string; hex: string }
> = {
  VFR: {
    label: "VFR",
    bg: "bg-vfr/15",
    text: "text-vfr",
    border: "border-vfr/70",
    hex: "#3dcc6a",
  },
  MVFR: {
    label: "MVFR",
    bg: "bg-mvfr/15",
    text: "text-mvfr",
    border: "border-mvfr/70",
    hex: "#4d8dff",
  },
  IFR: {
    label: "IFR",
    bg: "bg-ifr/15",
    text: "text-ifr",
    border: "border-ifr/70",
    hex: "#ff4d4d",
  },
  LIFR: {
    label: "LIFR",
    bg: "bg-lifr/15",
    text: "text-lifr",
    border: "border-lifr/70",
    hex: "#ff4dff",
  },
};

/** FAA flight category from ceiling (ft AGL) and visibility (SM). */
export function flightCategoryFromWx(
  ceilingFt: number | null,
  visibilitySm: number
): FlightCategory {
  const ceil = ceilingFt ?? Infinity;
  if (ceil < 500 || visibilitySm < 1) return "LIFR";
  if (ceil < 1000 || visibilitySm < 3) return "IFR";
  if (ceil <= 3000 || visibilitySm <= 5) return "MVFR";
  return "VFR";
}

export function parseVisibilitySm(visib: string | number | undefined): number {
  if (visib == null) return 10;
  if (typeof visib === "number") return visib;
  const s = String(visib).trim();
  if (s.endsWith("+")) return Number.parseFloat(s) || 10;
  if (s.includes("/")) {
    const [a, b] = s.split("/").map(Number);
    if (b) return a / b;
  }
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : 10;
}

/** Lowest BKN/OVC/VV base in feet, or null if unlimited / clear. */
export function ceilingFromClouds(
  clouds: AviationWeatherMetar["clouds"],
  cover?: string
): number | null {
  const layers = clouds ?? [];
  let lowest: number | null = null;
  for (const c of layers) {
    const cov = (c.cover || "").toUpperCase();
    if (!["BKN", "OVC", "VV"].includes(cov)) continue;
    const base = c.base;
    if (base == null || !Number.isFinite(base)) continue;
    if (lowest == null || base < lowest) lowest = base;
  }
  if (lowest != null) return lowest;
  const top = (cover || "").toUpperCase();
  if (["CLR", "SKC", "CAVOK", "FEW", "SCT"].includes(top)) return null;
  return null;
}

/**
 * Density altitude (ft) from field elevation, altimeter (inHg), and OAT (°C).
 * Uses standard pressure-altitude + rule-of-thumb ISA deviation.
 */
export function densityAltitudeFt(
  elevationFt: number,
  altimeterInHg: number,
  tempC: number
): number {
  const pressureAltitude =
    elevationFt + (29.92 - altimeterInHg) * 1000;
  const isaC = 15 - (pressureAltitude / 1000) * 1.9812;
  return Math.round(pressureAltitude + 120 * (tempC - isaC));
}

/** hPa → inHg */
export function hPaToInHg(hPa: number): number {
  return Math.round((hPa * 0.029529983071) * 100) / 100;
}

export function parseWindDir(wdir: number | string | undefined): number | null {
  if (wdir == null) return null;
  if (typeof wdir === "string") {
    if (wdir.toUpperCase() === "VRB") return null;
    const n = Number.parseInt(wdir, 10);
    return Number.isFinite(n) ? n : null;
  }
  return Number.isFinite(wdir) ? wdir : null;
}

export function formatWindString(
  dir: number | null,
  speedKt: number,
  gustKt?: number | null
): string {
  const d =
    dir == null ? "VRB" : String(Math.round(dir) % 360).padStart(3, "0");
  const s = String(Math.round(speedKt)).padStart(2, "0");
  const g =
    gustKt != null && gustKt > speedKt
      ? `G${String(Math.round(gustKt)).padStart(2, "0")}`
      : "";
  return `${d}${s}${g}KT`;
}

export function parseAviationWeatherMetar(
  row: AviationWeatherMetar,
  fallbackElevFt?: number
): ParsedMetar {
  const icao = (row.icaoId || "").toUpperCase();
  const visibilitySm = parseVisibilitySm(row.visib);
  const ceilingFt = ceilingFromClouds(row.clouds, row.cover);
  const apiCat = (row.fltCat || "").toUpperCase();
  const category: FlightCategory =
    apiCat === "VFR" ||
    apiCat === "MVFR" ||
    apiCat === "IFR" ||
    apiCat === "LIFR"
      ? apiCat
      : flightCategoryFromWx(ceilingFt, visibilitySm);

  const windDirDeg = parseWindDir(row.wdir);
  const windSpeedKt = row.wspd ?? 0;
  const windGustKt = row.wgst ?? null;
  const tempC = row.temp ?? null;
  const dewpointC = row.dewp ?? null;
  const elevFt =
    row.elev != null ? Math.round(row.elev * 3.28084) : fallbackElevFt ?? null;
  // API altim is station pressure in hPa → convert to inHg for display
  const altimeterInHg =
    row.altim != null ? hPaToInHg(row.altim) : null;

  let densityAltitude: number | null = null;
  if (
    elevFt != null &&
    altimeterInHg != null &&
    tempC != null &&
    Number.isFinite(tempC)
  ) {
    densityAltitude = densityAltitudeFt(elevFt, altimeterInHg, tempC);
  }

  const observedAt =
    row.reportTime ||
    (row.obsTime != null
      ? new Date(row.obsTime * 1000).toISOString()
      : new Date().toISOString());

  const snapshot: MetarSnapshot = {
    icao,
    category,
    raw: row.rawOb || `${icao} ${formatWindString(windDirDeg, windSpeedKt)}`,
    wind: formatWindString(windDirDeg, windSpeedKt, windGustKt),
    visibilitySm,
    ceilingFt,
    observedAt,
  };

  return {
    ...snapshot,
    windDirDeg,
    windSpeedKt,
    windGustKt,
    tempC,
    dewpointC,
    tempDewSpreadC:
      tempC != null && dewpointC != null
        ? Math.round((tempC - dewpointC) * 10) / 10
        : null,
    altimeterInHg,
    elevationFt: elevFt,
    densityAltitudeFt: densityAltitude,
    stationName: row.name ?? null,
  };
}

export async function fetchMetar(
  icao: string,
  opts?: { elevationFt?: number; signal?: AbortSignal }
): Promise<ParsedMetar | null> {
  const id = icao.trim().toUpperCase();
  if (!id) return null;

  const url = `${AW_METAR_URL}?ids=${encodeURIComponent(id)}&format=json`;
  const res = await fetch(url, {
    signal: opts?.signal,
    headers: { Accept: "application/json" },
    // Cache METAR briefly on the server (Next.js fetch extension).
    ...(typeof window === "undefined"
      ? ({ next: { revalidate: 300 } } as RequestInit)
      : {}),
  });

  if (!res.ok) {
    throw new Error(`METAR fetch failed (${res.status})`);
  }

  const data = (await res.json()) as AviationWeatherMetar[] | AviationWeatherMetar;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || !row.icaoId) return null;
  return parseAviationWeatherMetar(row, opts?.elevationFt);
}

/** Deterministic hash for stable demo METAR categories. */
function hash01(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * Simulated METAR when live API is unavailable.
 */
export function getMockMetar(icao: string, elevationFt = 0): ParsedMetar {
  const n = hash01(`${icao}:metar`);
  let category: FlightCategory;
  let visibilitySm: number;
  let ceilingFt: number | null;

  if (n < 0.62) {
    category = "VFR";
    visibilitySm = 10;
    ceilingFt = null;
  } else if (n < 0.82) {
    category = "MVFR";
    visibilitySm = 4;
    ceilingFt = 2500;
  } else if (n < 0.94) {
    category = "IFR";
    visibilitySm = 2;
    ceilingFt = 800;
  } else {
    category = "LIFR";
    visibilitySm = 0.5;
    ceilingFt = 300;
  }

  const windDirDeg = Math.floor(hash01(`${icao}:wd`) * 36) * 10;
  const windSpeedKt = Math.floor(6 + hash01(`${icao}:wk`) * 18);
  const tempC = Math.round(5 + hash01(`${icao}:t`) * 25);
  const dewpointC = Math.round(tempC - 3 - hash01(`${icao}:dp`) * 12);
  const altimeterInHg = Math.round((29.7 + hash01(`${icao}:alt`) * 0.5) * 100) / 100;
  const wind = formatWindString(windDirDeg, windSpeedKt);
  const ceil =
    ceilingFt == null
      ? "CLR"
      : `BKN${String(Math.round(ceilingFt / 100)).padStart(3, "0")}`;
  const vis =
    visibilitySm >= 10
      ? "10SM"
      : `${visibilitySm.toFixed(visibilitySm < 1 ? 1 : 0)}SM`;
  const code = icao.toUpperCase();

  return {
    icao: code,
    category,
    wind,
    visibilitySm,
    ceilingFt,
    raw: `${code} ${wind} ${vis} ${ceil}`,
    observedAt: new Date().toISOString(),
    windDirDeg,
    windSpeedKt,
    windGustKt: null,
    tempC,
    dewpointC,
    tempDewSpreadC: Math.round((tempC - dewpointC) * 10) / 10,
    altimeterInHg,
    elevationFt,
    densityAltitudeFt: densityAltitudeFt(elevationFt, altimeterInHg, tempC),
    stationName: null,
  };
}

export async function getMetarOrMock(
  icao: string,
  elevationFt?: number
): Promise<ParsedMetar> {
  try {
    const live = await fetchMetar(icao, { elevationFt });
    if (live) return live;
  } catch {
    // fall through to mock
  }
  return getMockMetar(icao, elevationFt ?? 0);
}
