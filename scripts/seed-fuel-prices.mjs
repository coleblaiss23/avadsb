/**
 * One-off seed of real fuel prices into Supabase public.price_reports.
 *
 * Usage:
 *   1. Put records in scripts/fuel-prices-seed.json (see shape below).
 *   2. node scripts/seed-fuel-prices.mjs
 *      or: npm run seed:fuel
 *
 * Each record:
 *   {
 *     "icao": "KAPA",
 *     "fuelType": "100LL",
 *     "price": 6.49,
 *     "fboName": "Signature Flight Support",
 *     "isSelfServe": false
 *   }
 *
 * fuelType must be "100LL" or "Jet-A". price is dollars per gallon.
 * isSelfServe is optional (defaults to false).
 *
 * Rows land in price_reports, so the app treats them as Pilot_Crowdsource
 * (same tag as a pilot submission). Re-running skips an identical row.
 * price_reports.airport_icao references airports, so this script upserts a
 * matching airport from public/data/us-airports.json when needed.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const seedPath = path.join(__dirname, "fuel-prices-seed.json");
const airportsPath = path.join(root, "public/data/us-airports.json");

const FUEL_TYPES = new Set(["100LL", "Jet-A"]);

function loadEnvLocal() {
  const file = path.join(root, ".env.local");
  if (!fs.existsSync(file)) {
    console.error("Missing .env.local. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.");
    process.exit(1);
  }
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local."
    );
    process.exit(1);
  }
  return { url, key };
}

async function rest(config, pathAndQuery, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("apikey", config.key);
  headers.set("Authorization", `Bearer ${config.key}`);
  headers.set("Accept", "application/json");
  const res = await fetch(`${config.url}/rest/v1/${pathAndQuery}`, {
    ...init,
    headers,
  });
  return res;
}

async function errorText(res) {
  const text = await res.text();
  if (!text) return `HTTP ${res.status}`;
  try {
    const body = JSON.parse(text);
    return body.message || text;
  } catch {
    return text.slice(0, 300);
  }
}

function loadAirportsByIcao() {
  if (!fs.existsSync(airportsPath)) {
    console.error(`Missing ${airportsPath}. Run npm run build:airports first.`);
    process.exit(1);
  }
  const rows = JSON.parse(fs.readFileSync(airportsPath, "utf8"));
  const byIcao = new Map();
  for (const airport of rows) {
    const icao = String(airport.icao || "").trim().toUpperCase();
    if (icao) byIcao.set(icao, airport);
  }
  return byIcao;
}

function loadSeed() {
  if (!fs.existsSync(seedPath)) {
    console.error(`Missing ${seedPath}.`);
    process.exit(1);
  }
  const parsed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  if (!Array.isArray(parsed)) {
    console.error("scripts/fuel-prices-seed.json must be a JSON array.");
    process.exit(1);
  }
  if (parsed.length === 0) {
    console.error(
      "scripts/fuel-prices-seed.json is empty. Add ICAO / fuelType / price / fboName records, then run this again."
    );
    process.exit(1);
  }
  return parsed;
}

function normalize(raw, index) {
  const icao = String(raw.icao || "").trim().toUpperCase();
  const fuelType = String(raw.fuelType || "").trim();
  const price = Number(raw.price ?? raw.pricePerGallon);
  const fboName = String(raw.fboName || "").trim();
  const isSelfServe = Boolean(raw.isSelfServe);
  const where = `record ${index + 1}`;
  if (!icao) throw new Error(`${where}: missing icao`);
  if (!FUEL_TYPES.has(fuelType)) {
    throw new Error(`${where}: fuelType must be 100LL or Jet-A`);
  }
  if (!Number.isFinite(price) || price <= 0 || price >= 10000) {
    throw new Error(`${where}: price must be a positive number under 10000`);
  }
  if (!fboName) throw new Error(`${where}: missing fboName`);
  return {
    icao,
    fuelType,
    price: Math.round(price * 100) / 100,
    fboName: fboName.slice(0, 120),
    isSelfServe,
  };
}

async function ensureAirport(config, airport) {
  const res = await rest(config, "airports?on_conflict=icao", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=ignore-duplicates,return=minimal",
    },
    body: JSON.stringify({
      icao: airport.icao,
      faa: airport.faa || null,
      ident: airport.ident || airport.icao,
      name: airport.name,
      city: airport.city || null,
      state: airport.state || null,
      latitude: airport.latitude,
      longitude: airport.longitude,
      elevation: airport.elevation ?? null,
      runway_length: airport.runwayLength || null,
      runway_width: airport.runwayWidth || null,
      runway_ident: airport.runwayIdent || null,
      surface_type: airport.surface || null,
      facility_type: airport.type || null,
    }),
  });
  if (res.ok || res.status === 409) return;
  const message = await errorText(res);
  if (message.includes("23505")) return;
  throw new Error(`could not ensure airport ${airport.icao}: ${message}`);
}

async function alreadySeeded(config, row) {
  const query = new URLSearchParams({
    select: "id",
    airport_icao: `eq.${row.icao}`,
    fuel_type: `eq.${row.fuelType}`,
    reported_price: `eq.${row.price.toFixed(2)}`,
    fbo_name: `eq.${row.fboName}`,
    limit: "1",
  });
  const res = await rest(config, `price_reports?${query.toString()}`);
  if (!res.ok) throw new Error(await errorText(res));
  const existing = await res.json();
  return Array.isArray(existing) && existing.length > 0;
}

async function insertReport(config, row) {
  const res = await rest(config, "price_reports", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      airport_icao: row.icao,
      fuel_type: row.fuelType,
      reported_price: row.price,
      is_self_serve: row.isSelfServe,
      fbo_name: row.fboName,
      notes: "Launch seed",
    }),
  });
  if (!res.ok) throw new Error(await errorText(res));
}

async function main() {
  loadEnvLocal();
  const config = supabaseConfig();
  const seed = loadSeed().map(normalize);
  const airports = loadAirportsByIcao();

  console.log(`Seeding ${seed.length} fuel price report(s) into price_reports…`);
  let inserted = 0;
  let skipped = 0;

  for (const row of seed) {
    const airport = airports.get(row.icao);
    if (!airport) {
      throw new Error(
        `${row.icao} is not in public/data/us-airports.json, so it cannot satisfy the airports foreign key.`
      );
    }
    await ensureAirport(config, airport);
    if (await alreadySeeded(config, row)) {
      skipped += 1;
      console.log(`skip ${row.icao} ${row.fuelType} $${row.price.toFixed(2)} (${row.fboName})`);
      continue;
    }
    await insertReport(config, row);
    inserted += 1;
    console.log(`insert ${row.icao} ${row.fuelType} $${row.price.toFixed(2)} (${row.fboName})`);
  }

  console.log(`Done. Inserted ${inserted}, skipped ${skipped} already present.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
