/**
 * Birds-eye aircraft silhouettes for the live radar layer.
 * Paths adapted from FlightAware dump1090 / tar1090 marker shapes
 * (the same family used by FlightAware & ADS-B Exchange-style maps).
 */

export type AircraftSilhouette =
  | "heavy_jet"
  | "midsize_jet"
  | "small_jet"
  | "piston_twin"
  | "piston_single"
  | "helicopter";

export type SilhouetteDef = {
  label: string;
  color: string;
  className: string;
  /** Native marker width (px) — used for DivIcon sizing */
  iconPx: number;
  viewBox: string;
  path: string;
};

export const SILHOUETTE_STYLE: Record<AircraftSilhouette, SilhouetteDef> = {
  heavy_jet: {
    label: "Heavy",
    color: "#1D4ED8",
    className: "afm-ac--heavy-jet",
    iconPx: 38,
    viewBox: "0 0 28 29",
    path: 'M9,28.35c0-.16-.17-1,.23-1.36.65-.59,2.82-2.38,3.4-2.86-.51-1.33-.59-5.15-.57-8.22L10,16,.25,19v-.34a1.78,1.78,0,0,1,.82-1.5l7.78-5.07a4.87,4.87,0,0,1-.51-3l0-.22.23,0h2.26l0,.22a8.32,8.32,0,0,1,0,1.81l1.21-.81c0-6.79.18-9.58,1.91-9.87,1.7.14,2,3,2,9.85L17.3,11a8.3,8.3,0,0,1,0-1.8l0-.22h2.51v.24a4.87,4.87,0,0,1-.51,3l7.66,5a1.77,1.77,0,0,1,.8,1.5V19L18,16l-2-.06c0,3.06-.06,6.88-.57,8.21a28.87,28.87,0,0,1,3.5,3A2,2,0,0,1,19,28.34l-.05.31L14.6,26.71c-.14,1.85-.41,1.85-.6,1.85s-.47,0-.6-1.84L9,28.66Z',
  },
  midsize_jet: {
    label: "Airliner",
    color: "#2563EB",
    className: "afm-ac--midsize-jet",
    iconPx: 34,
    viewBox: "0 0 25 26",
    path: 'M12.51,25.75c-.26,0-.74-.71-.86-1.41l-3.33.86L8,25.29l.08-1.41.11-.07c1.13-.68,2.68-1.64,3.2-2-.37-1.06-.51-3.92-.43-8.52v0L8,13.31C5.37,14.12,1.2,15.39,1,15.5a.5.5,0,0,1-.21,0,.52.52,0,0,1-.49-.45,1,1,0,0,1,.52-1l1.74-.91c1.36-.71,3.22-1.69,4.66-2.43a4,4,0,0,1,0-.52c0-.69,0-1,0-1.14l.25-.13H7.16A1.07,1.07,0,0,1,8.24,7.73,1.12,1.12,0,0,1,9.06,8a1.46,1.46,0,0,1,.26.87L9.08,9h.25c0,.14,0,.31,0,.58l1.52-.84c0-1.48,0-7.06,1.1-8.25a.74.74,0,0,1,1.13,0c1.15,1.19,1.13,6.78,1.1,8.25l1.52.84c0-.32,0-.48,0-.58l.25-.13H15.7A1.46,1.46,0,0,1,16,8a1.11,1.11,0,0,1,.82-.28,1.06,1.06,0,0,1,1.08,1.16V9c0,.19,0,.48,0,1.17a4,4,0,0,1,0,.52c1.75.9,4.4,2.29,5.67,3l.73.38a.9.9,0,0,1,.5,1,.55.55,0,0,1-.5.47h0l-.11,0c-.28-.11-4.81-1.49-7.16-2.2H14.06v0c.09,4.6-.06,7.46-.43,8.52.52.33,2.07,1.29,3.2,2l.11.07L17,25.29l-.33-.09-3.33-.86c-.12.7-.6,1.41-.86,1.41h0Z',
  },
  small_jet: {
    label: "Bizjet",
    color: "#60A5FA",
    className: "afm-ac--small-jet",
    iconPx: 30,
    viewBox: "0 0 18 24",
    path: 'M9.44,23c-.1.6-.35.6-.44.6s-.34,0-.44-.6l-3,.67V22.6A.54.54,0,0,1,6,22.05l2.38-1.12L8,19.33H6.69l0-.2a8.23,8.23,0,0,1-.14-3.85l.06-.18H7.73V13.19h-2L.26,14.29v-.93c0-.28.07-.46.22-.53l7.25-3.6V3.85A4.47,4.47,0,0,1,8.83.49L9,.34l.17.15a4.47,4.47,0,0,1,1.1,3.36V9.23l7.25,3.6c.14.07.22.25.22.53v.93l-5.51-1.1h-2V15.1h1.17l.06.18a8.24,8.24,0,0,1-.15,3.84l0,.2H10l-.36,1.6,2.43,1.14a.52.52,0,0,1,.35.53v1.08Z',
  },
  piston_twin: {
    label: "Twin Prop",
    color: "#10B981",
    className: "afm-ac--piston-twin",
    iconPx: 28,
    viewBox: "0 0 19 16",
    path: 'M9.5,15.75c-.21,0-.34-.17-.41-.51l-2.88.23v-.27c0-.78,0-1.11.28-1.13L9,13.1c-.31-1.86-.55-5-.59-5.55l-.08-.09H6.08L.25,6.54v-1A.43.43,0,0,1,.67,5l3.75-.27L5,4.45V3.53H4.73V2.7a.35.35,0,0,1,.34-.35h.07c.12-.52.26-.83.54-.83s.42.31.53.83h.07a.35.35,0,0,1,.34.35v.83H6.36v1l2-.08C8.42.81,9.09.25,9.49.25s1.09.55,1.12,4.21l2,.08v-1h-.25V2.7a.35.35,0,0,1,.34-.35h.07c.12-.52.26-.83.53-.83s.42.31.54.83h.07a.35.35,0,0,1,.34.35v.83H14v.92l.57.32L18.32,5a.42.42,0,0,1,.43.46v1L13,7.46H10.71l-.08.09c0,.56-.27,3.68-.59,5.55l2.46,1c.28,0,.28.35.28,1.13v.27l-2.88-.23C9.84,15.58,9.71,15.75,9.5,15.75Z',
  },
  piston_single: {
    label: "Single Prop",
    color: "#059669",
    className: "afm-ac--piston-single",
    iconPx: 26,
    viewBox: "0 0 17 13",
    path: 'M8.51,12.75c-.17,0-2-.27-2.56-.35A.41.41,0,0,1,5.6,12V10.87a.41.41,0,0,1,.32-.4l1.81-.37L7.36,6.64H4.75L.6,6a.41.41,0,0,1-.35-.41V4a.41.41,0,0,1,.38-.41l4.09-.28h2.6v-.4l.25,0-.24-.08c0-.21.1-.76.12-1.06A.9.9,0,0,1,8,.94L8.12.54A.41.41,0,0,1,8.5.25a.4.4,0,0,1,.39.29L9,.95a.91.91,0,0,1,.53.75c0,.33.11,1,.13,1.11v.46h2.57l4.12.28a.41.41,0,0,1,.38.41V5.63A.41.41,0,0,1,16.4,6l-4.1.59H9.64L9.26,10.1l1.81.36a.41.41,0,0,1,.32.4V12a.41.41,0,0,1-.34.41c-.56.08-2.37.35-2.55.35Z',
  },
  helicopter: {
    label: "Helicopter",
    color: "#F97316",
    className: "afm-ac--helicopter",
    iconPx: 28,
    viewBox: "0 0 16 18",
    path: 'M8,17.75c-1.38,0-2.46-.63-2.46-1.43,0-.6.58-1.1,1.49-1.32V12.06A5.27,5.27,0,0,1,6,9.53L1.1,13.6l-.75-1L5.78,8.09c0-.25,0-.51,0-.77a12.28,12.28,0,0,1,.09-1.49L.38,1.24l.7-.89,5,4.2C6.48,3,7.17,2.1,8,2.1s1.52,1,1.91,2.57l5-4.21.75,1L10.1,6.07a12.4,12.4,0,0,1,.06,1.24c0,.22,0,.44,0,.65l5.47,4.59-.7.89L10,9.31a8.44,8.44,0,0,1-.35,1.4,3.83,3.83,0,0,1-.55,1.11L9,12v3c.91.22,1.49.72,1.49,1.32C10.46,17.12,9.38,17.75,8,17.75Z',
  },
};

/** @deprecated Use SILHOUETTE_STYLE[kind].path */
export const SILHOUETTE_SVG: Record<AircraftSilhouette, string> = {
  heavy_jet: SILHOUETTE_STYLE.heavy_jet.path,
  midsize_jet: SILHOUETTE_STYLE.midsize_jet.path,
  small_jet: SILHOUETTE_STYLE.small_jet.path,
  piston_twin: SILHOUETTE_STYLE.piston_twin.path,
  piston_single: SILHOUETTE_STYLE.piston_single.path,
  helicopter: SILHOUETTE_STYLE.helicopter.path,
};

/** ICAO type designator → silhouette (FlightAware dump1090 specials). */
const TYPE_OVERRIDES: Record<string, AircraftSilhouette> = {
  A10: "small_jet", A148: "small_jet", A225: "heavy_jet", A3: "small_jet", A37: "small_jet",
  A5: "piston_single", A6: "small_jet", A700: "small_jet", AC80: "piston_twin", AC90: "piston_twin",
  AC95: "piston_twin", AJ27: "small_jet", AJET: "small_jet", AN28: "piston_twin", ARCE: "small_jet",
  AT3: "small_jet", ATG1: "small_jet", B18T: "piston_twin", B190: "piston_twin", B25: "piston_twin",
  B350: "piston_twin", B52: "heavy_jet", B712: "small_jet", B721: "midsize_jet", B722: "midsize_jet",
  BE10: "piston_twin", BE20: "piston_twin", BE30: "piston_twin", BE32: "piston_twin", BE40: "small_jet",
  BE99: "piston_twin", BE9L: "piston_twin", BE9T: "piston_twin", BN2T: "piston_twin", BPOD: "small_jet",
  BU20: "piston_twin", C08T: "small_jet", C125: "piston_twin", C212: "piston_twin", C21T: "piston_twin",
  C22J: "small_jet", C25A: "small_jet", C25B: "small_jet", C25C: "small_jet", C25M: "small_jet",
  C425: "piston_twin", C441: "piston_twin", C46: "piston_twin", C500: "small_jet", C501: "small_jet",
  C510: "small_jet", C525: "small_jet", C526: "small_jet", C550: "small_jet", C551: "small_jet",
  C55B: "small_jet", C560: "small_jet", C56X: "small_jet", C650: "small_jet", C680: "small_jet",
  C68A: "small_jet", C750: "small_jet", C82: "piston_twin", CKUO: "small_jet", CL30: "small_jet",
  CL35: "small_jet", CL60: "small_jet", CRJ1: "small_jet", CRJ2: "small_jet", CRJ7: "small_jet",
  CRJ9: "small_jet", CRJX: "small_jet", CVLP: "piston_twin", D228: "piston_twin", DA36: "small_jet",
  DA50: "midsize_jet", DC10: "heavy_jet", DC3: "piston_twin", DC3S: "piston_twin", DHA3: "piston_twin",
  DHC4: "piston_twin", DHC6: "piston_twin", DLH2: "small_jet", E110: "piston_twin", E135: "small_jet",
  E145: "small_jet", E29E: "small_jet", E45X: "small_jet", E500: "small_jet", E50P: "small_jet",
  E545: "small_jet", E55P: "small_jet", EA50: "small_jet", EFAN: "small_jet", EFUS: "small_jet",
  ELIT: "small_jet", EUFI: "small_jet", F1: "small_jet", F100: "small_jet", F111: "small_jet",
  F117: "small_jet", F14: "small_jet", F15: "small_jet", F22: "small_jet", F2TH: "small_jet",
  F4: "small_jet", F406: "piston_twin", F5: "small_jet", F900: "small_jet", FA50: "small_jet",
  FA5X: "small_jet", FA7X: "small_jet", FA8X: "small_jet", FJ10: "small_jet", FOUG: "small_jet",
  FURY: "small_jet", G150: "small_jet", G3: "midsize_jet", GENI: "small_jet", GL5T: "small_jet",
  GLEX: "small_jet", GLF2: "small_jet", GLF3: "small_jet", GLF4: "small_jet", GLF5: "small_jet",
  GLF6: "small_jet", GSPN: "small_jet", H25A: "small_jet", H25B: "small_jet", H25C: "small_jet",
  HA4T: "midsize_jet", HDJT: "small_jet", HERN: "small_jet", J8A: "small_jet", J8B: "small_jet",
  JH7: "small_jet", JS31: "piston_twin", JS32: "piston_twin", JU52: "piston_twin", L101: "heavy_jet",
  LAE1: "small_jet", LEOP: "small_jet", LJ23: "small_jet", LJ24: "small_jet", LJ25: "small_jet",
  LJ28: "small_jet", LJ31: "small_jet", LJ35: "small_jet", LJ40: "small_jet", LJ45: "small_jet",
  LJ55: "small_jet", LJ60: "small_jet", LJ70: "small_jet", LJ75: "small_jet", LJ85: "small_jet",
  LTNG: "small_jet", M28: "piston_twin", MD11: "heavy_jet", MD81: "small_jet", MD82: "small_jet",
  MD83: "small_jet", MD87: "small_jet", MD88: "small_jet", MD90: "small_jet", ME62: "small_jet",
  METR: "small_jet", MG19: "small_jet", MG25: "small_jet", MG29: "small_jet", MG31: "small_jet",
  MG44: "small_jet", MH02: "small_jet", MS76: "small_jet", MT2: "small_jet", MU2: "piston_twin",
  P180: "piston_twin", P2: "piston_twin", P68T: "piston_twin", PA47: "small_jet", PAT4: "piston_twin",
  PAY1: "piston_twin", PAY2: "piston_twin", PAY3: "piston_twin", PAY4: "piston_twin", PIAE: "small_jet",
  PIT4: "small_jet", PITE: "small_jet", PRM1: "small_jet", PRTS: "small_jet", Q5: "small_jet",
  R721: "midsize_jet", R722: "midsize_jet", RFAL: "small_jet", ROAR: "small_jet", S3: "small_jet",
  S32E: "small_jet", S37: "small_jet", S601: "small_jet", SATA: "small_jet", SB05: "small_jet",
  SC7: "piston_twin", SF50: "small_jet", SJ30: "small_jet", SLCH: "heavy_jet", SM60: "piston_twin",
  SOL1: "small_jet", SOL2: "small_jet", SP33: "small_jet", SR71: "small_jet", SS2: "small_jet",
  SU15: "small_jet", SU24: "small_jet", SU25: "small_jet", SU27: "small_jet", SW2: "piston_twin",
  SW3: "piston_twin", SW4: "piston_twin", T154: "midsize_jet", T2: "small_jet", T22M: "small_jet",
  T37: "small_jet", T38: "small_jet", T4: "small_jet", TJET: "small_jet", TOR: "small_jet",
  TRIM: "piston_twin", TRIS: "piston_twin", TRMA: "piston_twin", TU22: "small_jet", VAUT: "small_jet",
  Y130: "small_jet", Y141: "midsize_jet", YK28: "small_jet", YK38: "midsize_jet", YK40: "midsize_jet",
  YK42: "midsize_jet", YURO: "small_jet",
};

const HELI_RE =
  /^(EC|AS[0-9]|BK|R22|R44|R66|B06|B407|B412|B429|S76|S92|H60|UH60|UH1|AH64|AH1|CH47|CH53|MH60|MD50|MD52|MD60|MD90|A109|A119|A139|A169|AW139|AW169|AW189|H130|H145|H125|H135|H155|H175|S300|B212|B407|B505|EC20|EC30|EC35|EC45|EC55)/i;

const HEAVY_RE =
  /^(B74|B77|B78|A38|A34|A33|A35|A36|A359|A35K|MD11|DC10|B1B|C17(?![0-9])|C5M|C5$|KC10|A124|A225|IL96|IL76|L101|B52)/i;

/** Underwing-engine airliners / large regionals */
const AIRLINER_RE =
  /^(A318|A319|A320|A321|A20N|A21N|A19N|B71|B72|B73|B75|B76|MD8|MD9|BCS1|BCS3|E170|E75[LSW]?|E190|E195|E290|E295|A310|A30B|A306)/i;

/** Aft-engine bizjets, light jets, CRJs, high-performance */
const BIZJET_RE =
  /^(GLF|G[456]|G[27]5|C25|C510|C525|C55B|C560|C56X|C650|C68|C70|C75|CL3|CL6|FA[4578]|F2TH|F900|LJ|EA50|BE40|BE4W|HA4T|HDJT|E50P|E55P|PRM1|MU30|FA10|FA20|SBR1|ASTR|WW24|CRJ|E13|E14|RJ[187]|GALX|H25|SF50|PC24|F15|F16|F18|F22|F35|T38|T45|A10|AJ27)/i;

const TWIN_PROP_RE =
  /^(PA34|PA44|BE55|BE58|BE76|BE95|BE10|BE20|BE30|BE9L|BE9T|BE99|B350|C310|C320|C337|C340|C402|C404|C414|C421|C425|C441|DA42|DA62|P68|BN2|AC50|AC90|AC95|PA30|PA23|PA31|DHC6|DH8A|DH8B|DH8C|DH8D|AT43|AT45|AT72|AT75|SF34|E110|E120|JS31|JS32|MU2|P180|B190|C212|D228)/i;

function normalizeType(raw: string | null | undefined): string {
  return (raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Map ICAO type + ADS-B emitter category to a birds-eye silhouette.
 */
export function classifySilhouette(
  typeCode: string | null | undefined,
  emitterCategory?: string | null,
  dbFlags?: number
): AircraftSilhouette {
  const type = normalizeType(typeCode);
  const emitter = (emitterCategory ?? "").toUpperCase();

  if (type && TYPE_OVERRIDES[type]) {
    return TYPE_OVERRIDES[type];
  }

  if (emitter === "A7" || (type && HELI_RE.test(type))) {
    return "helicopter";
  }

  if (type && HEAVY_RE.test(type)) return "heavy_jet";
  if (emitter === "A5" || emitter === "A4") return "heavy_jet";

  if (type && AIRLINER_RE.test(type)) return "midsize_jet";
  if (emitter === "A3") return "midsize_jet";

  if (type && BIZJET_RE.test(type)) return "small_jet";
  if (emitter === "A6") return "small_jet";

  if (type && TWIN_PROP_RE.test(type)) return "piston_twin";

  // ADS-B A2 = Small (15.5k–75k lb): light jets & larger GA
  if (emitter === "A2") {
    if (type && /^(C|L|BE|EA|MU|FA|HA|PR|SF|PC|HD|WW|SB|AS)/.test(type)) {
      return "small_jet";
    }
    return "piston_twin";
  }

  if ((dbFlags ?? 0) & 1) return "small_jet";

  return "piston_single";
}

export function silhouetteSvgMarkup(
  kind: AircraftSilhouette,
  color: string,
  size?: number,
  stroke: string = "#0a0a0a"
): string {
  const def = SILHOUETTE_STYLE[kind];
  const px = size ?? def.iconPx;
  return `<svg viewBox="${def.viewBox}" width="${px}" height="${px}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path fill="${color}" fill-opacity="1" stroke="${stroke}" stroke-width="1" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" d="${def.path}"/></svg>`;
}

/** ADS-B reports `alt_baro: "ground"` which we normalize to 0. */
export function isAircraftOnGround(altBaro: number | null): boolean {
  return altBaro === 0;
}

const GROUND_FILL = "#94A3B8";

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

/** Mix toward black (amount 0–1) or white (negative amount = lighten via invert). */
function shadeHex(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  if (amount >= 0) {
    // Darken toward black
    const t = clamp01(amount);
    return rgbToHex(r * (1 - t), g * (1 - t), b * (1 - t));
  }
  // Lighten toward white
  const t = clamp01(-amount);
  return rgbToHex(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t);
}

/**
 * Ground = slate gray. Airborne = category hue, darker near the surface and
 * lighter at cruise / high altitude (roughly surface → FL450).
 * Prefer altitudeRainbowColor() for ADSBX-style radar.
 */
export function aircraftMarkerColor(
  category: AircraftSilhouette,
  altBaro: number | null
): string {
  if (isAircraftOnGround(altBaro)) return GROUND_FILL;
  const base = SILHOUETTE_STYLE[category].color;
  if (altBaro == null || !Number.isFinite(altBaro)) return base;

  const clamped = Math.max(100, Math.min(45000, altBaro));
  const t = (clamped - 100) / (45000 - 100);
  const shade = 0.22 - t * 0.5;
  return shadeHex(base, shade);
}

/** Coarse band so marker icons rebuild when altitude changes meaningfully. */
export function altitudeColorBand(altBaro: number | null): string {
  if (isAircraftOnGround(altBaro)) return "gnd";
  if (altBaro == null) return "unk";
  return String(Math.floor(altBaro / 2500));
}
