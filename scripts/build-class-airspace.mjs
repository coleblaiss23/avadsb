/**
 * Download FAA Class Airspace (B/C/D + surface E) from the ArcGIS FeatureServer
 * and write a compact GeoJSON for the map overlay.
 *
 * Source verified live:
 *   https://services6.arcgis.com/ssFJjBXIUyZDrSYZ/ArcGIS/rest/services/Class_Airspace/FeatureServer/0
 * Open data page: https://adds-faa.opendata.arcgis.com/datasets/class-airspace
 *
 * Usage: node scripts/build-class-airspace.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outJson = path.join(root, "public/data/class-airspace.json");
const outMeta = path.join(root, "public/data/class-airspace.meta.json");

const LAYER =
  "https://services6.arcgis.com/ssFJjBXIUyZDrSYZ/ArcGIS/rest/services/Class_Airspace/FeatureServer/0/query";

const ID_PAGE = 1000;
const GEOM_BATCH = 80;
/** Server-side geometry generalization (degrees). Safe when querying by OBJECTID. */
const MAX_OFFSET = 0.006;
const COORD_DECIMALS = 5;

const WHERE =
  "(CLASS IN ('B','C','D')) OR (CLASS = 'E' AND LOWER_VAL = 0)";

const OUT_FIELDS = [
  "NAME",
  "CLASS",
  "IDENT",
  "LOCAL_TYPE",
  "LOWER_VAL",
  "UPPER_VAL",
  "LOWER_UOM",
  "UPPER_UOM",
  "LOWER_CODE",
  "UPPER_CODE",
].join(",");

const UA =
  "AvADSB/0.1 (+https://github.com/coleblais/avfuel-matrix; class-airspace build)";

function roundCoord(n) {
  const f = 10 ** COORD_DECIMALS;
  return Math.round(n * f) / f;
}

function slimRing(ring) {
  const out = [];
  for (const pt of ring) {
    if (!Array.isArray(pt) || pt.length < 2) continue;
    const next = [roundCoord(pt[0]), roundCoord(pt[1])];
    const prev = out[out.length - 1];
    if (prev && prev[0] === next[0] && prev[1] === next[1]) continue;
    out.push(next);
  }
  if (out.length >= 2) {
    const first = out[0];
    const last = out[out.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) out.push([...first]);
  }
  return out.length >= 4 ? out : null;
}

function simplifyGeometry(geom) {
  if (!geom || !geom.type || !geom.coordinates) return null;
  if (geom.type === "Polygon") {
    const rings = [];
    for (const ring of geom.coordinates) {
      const slim = slimRing(ring);
      if (slim) rings.push(slim);
    }
    return rings.length ? { type: "Polygon", coordinates: rings } : null;
  }
  if (geom.type === "MultiPolygon") {
    const polys = [];
    for (const poly of geom.coordinates) {
      const rings = [];
      for (const ring of poly) {
        const slim = slimRing(ring);
        if (slim) rings.push(slim);
      }
      if (rings.length) polys.push(rings);
    }
    return polys.length ? { type: "MultiPolygon", coordinates: polys } : null;
  }
  return null;
}

function compactFeature(f) {
  const p = f.properties || {};
  const cls = String(p.CLASS || "").toUpperCase();
  if (!["B", "C", "D", "E"].includes(cls)) return null;
  const geometry = simplifyGeometry(f.geometry);
  if (!geometry) return null;
  return {
    type: "Feature",
    properties: {
      name: p.NAME || null,
      class: cls,
      ident: p.IDENT || null,
      localType: p.LOCAL_TYPE || null,
      lowerVal: typeof p.LOWER_VAL === "number" ? p.LOWER_VAL : null,
      upperVal: typeof p.UPPER_VAL === "number" ? p.UPPER_VAL : null,
      lowerUom: p.LOWER_UOM || null,
      upperUom: p.UPPER_UOM || null,
      lowerCode: p.LOWER_CODE || null,
      upperCode: p.UPPER_CODE || null,
    },
    geometry,
  };
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: "application/json,application/geo+json",
      "User-Agent": UA,
    },
  });
  if (!res.ok) throw new Error(`FAA Class_Airspace query failed: ${res.status}`);
  return res.json();
}

async function fetchObjectIds() {
  const ids = [];
  let offset = 0;
  for (;;) {
    const url = new URL(LAYER);
    url.searchParams.set("where", WHERE);
    url.searchParams.set("outFields", "OBJECTID");
    url.searchParams.set("returnGeometry", "false");
    url.searchParams.set("f", "json");
    url.searchParams.set("resultRecordCount", String(ID_PAGE));
    url.searchParams.set("resultOffset", String(offset));
    url.searchParams.set("orderByFields", "OBJECTID ASC");
    const data = await fetchJson(url);
    const batch = Array.isArray(data.features) ? data.features : [];
    for (const row of batch) {
      const id = row.attributes?.OBJECTID;
      if (typeof id === "number") ids.push(id);
    }
    console.log(`  ids page @${offset}: +${batch.length} (total ${ids.length})`);
    if (batch.length < ID_PAGE) break;
    offset += ID_PAGE;
  }
  return ids;
}

async function fetchGeomBatch(objectIds) {
  const url = new URL(LAYER);
  url.searchParams.set(
    "where",
    `OBJECTID IN (${objectIds.join(",")})`
  );
  url.searchParams.set("outFields", OUT_FIELDS);
  url.searchParams.set("outSR", "4326");
  url.searchParams.set("f", "geojson");
  url.searchParams.set("maxAllowableOffset", String(MAX_OFFSET));
  return fetchJson(url);
}

console.log("Fetching FAA Class Airspace object IDs…");
const objectIds = await fetchObjectIds();
console.log(`Fetching geometry for ${objectIds.length} features in batches of ${GEOM_BATCH}…`);

const features = [];
for (let i = 0; i < objectIds.length; i += GEOM_BATCH) {
  const slice = objectIds.slice(i, i + GEOM_BATCH);
  const collection = await fetchGeomBatch(slice);
  const batch = Array.isArray(collection.features) ? collection.features : [];
  for (const raw of batch) {
    const compact = compactFeature(raw);
    if (compact) features.push(compact);
  }
  console.log(
    `  geom ${Math.min(i + GEOM_BATCH, objectIds.length)}/${objectIds.length} (kept ${features.length})`
  );
  await new Promise((r) => setTimeout(r, 80));
}

const payload = {
  type: "FeatureCollection",
  features,
};

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, JSON.stringify(payload));
const bytes = fs.statSync(outJson).size;

const byClass = { B: 0, C: 0, D: 0, E: 0 };
for (const f of features) {
  const c = f.properties.class;
  if (c in byClass) byClass[c] += 1;
}

const meta = {
  source:
    "https://services6.arcgis.com/ssFJjBXIUyZDrSYZ/ArcGIS/rest/services/Class_Airspace/FeatureServer/0",
  openData: "https://adds-faa.opendata.arcgis.com/datasets/class-airspace",
  where: WHERE,
  maxAllowableOffset: MAX_OFFSET,
  coordDecimals: COORD_DECIMALS,
  featureCount: features.length,
  byClass,
  bytes,
  builtAt: new Date().toISOString(),
};

fs.writeFileSync(outMeta, JSON.stringify(meta, null, 2) + "\n");
console.log(
  `Wrote ${features.length} features (${(bytes / 1024 / 1024).toFixed(2)} MB) → ${path.relative(root, outJson)}`
);
console.log("By class:", byClass);
