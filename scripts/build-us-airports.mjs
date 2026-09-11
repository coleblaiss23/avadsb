/**
 * Build compact US airport catalog from OurAirports dumps.
 * Usage: node scripts/build-us-airports.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const airportsPath = path.join(root, "data/raw/airports.csv");
const runwaysPath = path.join(root, "data/raw/runways.csv");
const outJson = path.join(root, "public/data/us-airports.json");
const outMeta = path.join(root, "public/data/us-airports.meta.json");

const INCLUDE_TYPES = new Set([
  "large_airport",
  "medium_airport",
  "small_airport",
  "seaplane_base",
  "heliport",
]);

function parseCsv(file) {
  const raw = fs.readFileSync(file, "utf8");
  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });
}

function stateFromRegion(isoRegion) {
  // US-AZ → AZ
  if (!isoRegion) return "";
  const parts = isoRegion.split("-");
  return parts[1] || "";
}

function pickCode(row) {
  const icao = (row.icao_code || "").trim().toUpperCase();
  const gps = (row.gps_code || "").trim().toUpperCase();
  const local = (row.local_code || "").trim().toUpperCase();
  const ident = (row.ident || "").trim().toUpperCase();

  // Prefer ICAO (Kxxx), then GPS, then local FAA, then ident
  const primary =
    icao ||
    (gps && /^[A-Z0-9]{3,4}$/.test(gps) ? gps : "") ||
    local ||
    ident;

  const faa = local || (ident.length <= 4 ? ident : "") || primary.slice(-3);
  return { primary, faa, icao: icao || (primary.startsWith("K") && primary.length === 4 ? primary : "") };
}

console.log("Parsing CSVs…");
const airportRows = parseCsv(airportsPath);
const runwayRows = parseCsv(runwaysPath);

function headingFromIdent(ident) {
  const m = String(ident || "")
    .trim()
    .toUpperCase()
    .match(/^(\d{1,2})/);
  if (!m) return null;
  const n = Number.parseInt(m[1], 10);
  if (!Number.isFinite(n) || n < 1 || n > 36) return null;
  return (n * 10) % 360;
}

function parseHeading(raw, fallbackIdent) {
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 0) return Math.round(n * 10) / 10;
  return headingFromIdent(fallbackIdent);
}

/** @type {Map<string, {len:number,width:number,surface:string,ident:string,ends:Array<{ident:string,headingDegT:number,lengthFt:number,widthFt:number,surface:string}>}>} */
const longestByIdent = new Map();
/** @type {Map<string, Array<{ident:string,headingDegT:number,lengthFt:number,widthFt:number,surface:string}>>} */
const runwaysByIdent = new Map();

for (const r of runwayRows) {
  if (r.closed === "1") continue;
  const len = Number(r.length_ft) || 0;
  if (len <= 0) continue;
  const key = (r.airport_ident || "").toUpperCase();
  const width = Number(r.width_ft) || 0;
  const le = (r.le_ident || "").trim();
  const he = (r.he_ident || "").trim();
  const ident = le && he ? `${le}/${he}` : le || he || "??";
  const surface = (r.surface || "UNK").split("-")[0].toUpperCase().slice(0, 12);
  const w = width || 75;

  const ends = [];
  if (le) {
    const h = parseHeading(r.le_heading_degT, le);
    if (h != null) {
      ends.push({
        ident: le,
        headingDegT: h,
        lengthFt: len,
        widthFt: w,
        surface,
      });
    }
  }
  if (he) {
    const h = parseHeading(r.he_heading_degT, he);
    if (h != null) {
      ends.push({
        ident: he,
        headingDegT: h,
        lengthFt: len,
        widthFt: w,
        surface,
      });
    }
  }

  if (ends.length) {
    const list = runwaysByIdent.get(key) || [];
    list.push(...ends);
    runwaysByIdent.set(key, list);
  }

  const prev = longestByIdent.get(key);
  if (!prev || len > prev.len) {
    longestByIdent.set(key, { len, width: w, surface, ident, ends });
  }
}

const us = [];
for (const row of airportRows) {
  if (row.iso_country !== "US") continue;
  if (!INCLUDE_TYPES.has(row.type)) continue;
  const lat = Number(row.latitude_deg);
  const lon = Number(row.longitude_deg);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

  const codes = pickCode(row);
  if (!codes.primary) continue;

  const identKey = (row.ident || "").toUpperCase();
  const rwy =
    longestByIdent.get(identKey) ||
    longestByIdent.get(codes.primary) ||
    { len: 0, width: 0, surface: "UNK", ident: "N/A", ends: [] };

  const runways =
    runwaysByIdent.get(identKey) ||
    runwaysByIdent.get(codes.primary) ||
    rwy.ends ||
    [];

  // Keep all open facilities for search coverage; fuel corridor filters by runway.
  const entry = {
    id: String(row.id),
    icao: codes.icao || codes.primary,
    faa: codes.faa,
    ident: (row.ident || codes.primary).toUpperCase(),
    name: row.name || codes.primary,
    city: row.municipality || "",
    state: stateFromRegion(row.iso_region),
    latitude: Math.round(lat * 1e6) / 1e6,
    longitude: Math.round(lon * 1e6) / 1e6,
    elevation: Math.round(Number(row.elevation_ft) || 0),
    runwayLength: rwy.len || 0,
    runwayWidth: rwy.width || 0,
    runwayIdent: rwy.ident,
    surface: rwy.surface,
    type: row.type.replace("_airport", "").replace("_base", ""),
  };
  if (runways.length) entry.runways = runways;
  us.push(entry);
}

// Deduplicate by primary icao/ident keeping longest runway
const byKey = new Map();
for (const a of us) {
  const key = a.icao || a.faa || a.ident;
  const prev = byKey.get(key);
  if (!prev || a.runwayLength > prev.runwayLength) byKey.set(key, a);
}
const airports = [...byKey.values()].sort((a, b) =>
  a.icao.localeCompare(b.icao)
);

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, JSON.stringify(airports));
fs.writeFileSync(
  outMeta,
  JSON.stringify(
    {
      count: airports.length,
      generatedAt: new Date().toISOString(),
      source: "OurAirports (FAA-compatible US facilities)",
      types: [...INCLUDE_TYPES],
      minRunwayFt: 0,
      note: "Includes heliports/seaplane for search; fuel corridor uses runway-capable fields only.",
    },
    null,
    2
  )
);

console.log(`Wrote ${airports.length} US airports → ${outJson}`);
const samples = ["KAPA", "KSDL", "E37", "P08", "38E", "SDL", "APA"];
for (const s of samples) {
  const hit = airports.find(
    (a) => a.icao === s || a.faa === s || a.ident === s
  );
  console.log(s, hit ? `${hit.icao}/${hit.faa} ${hit.name}` : "MISSING");
}
