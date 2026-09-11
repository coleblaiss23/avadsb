import "server-only";

/**
 * Planespotters.net public photo lookup.
 * Terms require photographer credit + link back; do not disk-cache images.
 * Metadata (URLs + credit) may be TTL-cached to avoid hammering their API.
 */

export type AircraftPhoto = {
  photoUrl: string;
  thumbnailUrl: string;
  photographer: string;
  link: string;
  hex: string | null;
  registration: string | null;
};

export type AircraftPhotoResult =
  | { found: true; photo: AircraftPhoto; source: "planespotters" | "cache" }
  | { found: false; photo: null; source: "planespotters" | "cache" | "demo" };

type CacheEntry = {
  at: number;
  result: AircraftPhotoResult;
};

const CACHE_TTL_MS = 6 * 60 * 60_000; // 6h — same airframe is looked up repeatedly
const NEGATIVE_TTL_MS = 60 * 60_000; // 1h for "no photo"
const cache = new Map<string, CacheEntry>();

const UA =
  "AvADSB/0.1 (+https://avadsb.com; aircraft-photo lookup)";

type UpstreamPhoto = {
  id?: string;
  link?: string;
  photographer?: string;
  thumbnail?: { src?: string };
  thumbnail_large?: { src?: string };
};

function cacheKey(kind: "hex" | "reg", value: string): string {
  return `${kind}:${value}`;
}

function readCache(key: string): AircraftPhotoResult | null {
  const hit = cache.get(key);
  if (!hit) return null;
  const ttl = hit.result.found ? CACHE_TTL_MS : NEGATIVE_TTL_MS;
  if (Date.now() - hit.at > ttl) {
    cache.delete(key);
    return null;
  }
  return { ...hit.result, source: "cache" };
}

function writeCache(key: string, result: AircraftPhotoResult): void {
  cache.set(key, { at: Date.now(), result });
}

function normalizeHex(raw: string): string | null {
  const hex = raw.trim().toLowerCase().replace(/^0x/, "");
  return /^[0-9a-f]{6}$/.test(hex) ? hex : null;
}

function normalizeReg(raw: string): string | null {
  const reg = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (reg.length < 2 || reg.length > 12) return null;
  if (!/^[A-Z0-9-]+$/.test(reg)) return null;
  return reg;
}

function parsePhotos(
  payload: unknown,
  hex: string | null,
  registration: string | null
): AircraftPhoto | null {
  if (!payload || typeof payload !== "object") return null;
  const photos = (payload as { photos?: unknown }).photos;
  if (!Array.isArray(photos) || photos.length === 0) return null;
  const first = photos[0] as UpstreamPhoto;
  const thumbnailUrl = first.thumbnail?.src?.trim() || null;
  const photoUrl =
    first.thumbnail_large?.src?.trim() || thumbnailUrl;
  const link = first.link?.trim() || null;
  const photographer = first.photographer?.trim() || null;
  if (!thumbnailUrl || !photoUrl || !link || !photographer) return null;
  return {
    photoUrl,
    thumbnailUrl,
    photographer,
    link,
    hex,
    registration,
  };
}

async function fetchPlanespotters(
  path: string
): Promise<{ ok: true; json: unknown } | { ok: false; status: number }> {
  try {
    const res = await fetch(`https://api.planespotters.net/pub/photos${path}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": UA,
      },
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, json: await res.json() };
  } catch {
    return { ok: false, status: 502 };
  }
}

/** Lookup by Mode-S hex and/or registration. Prefer hex when both are given. */
export async function lookupAircraftPhoto(opts: {
  hex?: string | null;
  reg?: string | null;
}): Promise<AircraftPhotoResult> {
  const hex = opts.hex ? normalizeHex(opts.hex) : null;
  const reg = opts.reg ? normalizeReg(opts.reg) : null;
  if (!hex && !reg) {
    return { found: false, photo: null, source: "demo" };
  }

  const keys: string[] = [];
  if (hex) keys.push(cacheKey("hex", hex));
  if (reg) keys.push(cacheKey("reg", reg));

  for (const key of keys) {
    const hit = readCache(key);
    if (hit) return hit;
  }

  const attempts: Array<{ key: string; path: string; hex: string | null; reg: string | null }> =
    [];
  if (hex) {
    attempts.push({
      key: cacheKey("hex", hex),
      path: `/hex/${hex}`,
      hex,
      reg,
    });
  }
  if (reg) {
    attempts.push({
      key: cacheKey("reg", reg),
      path: `/reg/${encodeURIComponent(reg)}`,
      hex,
      reg,
    });
  }

  for (const attempt of attempts) {
    const upstream = await fetchPlanespotters(attempt.path);
    if (!upstream.ok) continue;
    const photo = parsePhotos(upstream.json, attempt.hex, attempt.reg);
    if (photo) {
      const result: AircraftPhotoResult = {
        found: true,
        photo,
        source: "planespotters",
      };
      writeCache(attempt.key, result);
      // Cross-fill the other key when we have both identifiers
      for (const k of keys) {
        if (k !== attempt.key) writeCache(k, result);
      }
      return result;
    }
    writeCache(attempt.key, {
      found: false,
      photo: null,
      source: "planespotters",
    });
  }

  return { found: false, photo: null, source: "planespotters" };
}
