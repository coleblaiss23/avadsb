-- AvFuel Matrix — Supabase / PostgreSQL + PostGIS schema
-- Full US NASR / OurAirports-compatible facilities + live fuel pricing
-- =============================================================================
-- 1. Create Supabase project
-- 2. SQL Editor → run this file
-- 3. Import airports: node scripts/build-us-airports.mjs then load JSON via
--    COPY / ETL, or use the app's public/data/us-airports.json for local demo
-- 4. Seed launch prices: fill scripts/fuel-prices-seed.json, then
--    npm run seed:fuel
-- 5. Set AIRNAV_API_KEY (+ optional AIRNAV_API_URL) in project secrets
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------
-- airports (FAA NASR / USDOT Aviation Facilities shape)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.airports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text UNIQUE,
  icao            text NOT NULL,
  faa             text,
  ident           text,
  name            text NOT NULL,
  city            text,
  state           text,
  latitude        double precision NOT NULL,
  longitude       double precision NOT NULL,
  elevation       integer,
  runway_length   integer,
  runway_width    integer,
  runway_ident    text,
  surface_type    text,
  facility_type   text,
  geom            geography(Point, 4326)
    GENERATED ALWAYS AS (
      ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
    ) STORED,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (icao)
);

CREATE INDEX IF NOT EXISTS airports_icao_idx ON public.airports (icao);
CREATE INDEX IF NOT EXISTS airports_faa_idx ON public.airports (faa);
CREATE INDEX IF NOT EXISTS airports_ident_idx ON public.airports (ident);
CREATE INDEX IF NOT EXISTS airports_name_trgm_idx ON public.airports USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS airports_geom_idx ON public.airports USING GIST (geom);

-- ---------------------------------------------------------------------------
-- fuel_prices — live / cached FBO quotes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fuel_prices (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airport_id       uuid REFERENCES public.airports (id) ON DELETE CASCADE,
  airport_icao     text NOT NULL REFERENCES public.airports (icao) ON DELETE CASCADE,
  fbo_name         text NOT NULL DEFAULT 'Unknown FBO',
  fuel_type        text NOT NULL CHECK (fuel_type IN ('100LL', 'Jet-A')),
  price_per_gallon numeric(6, 2) NOT NULL CHECK (price_per_gallon > 0),
  is_self_serve    boolean NOT NULL DEFAULT false,
  source           text NOT NULL CHECK (
                     source IN ('AirNav_API', 'FBO_Direct', 'Pilot_Crowdsource', 'Demo_Synthetic')
                   ),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (airport_icao, fbo_name, fuel_type)
);

CREATE INDEX IF NOT EXISTS fuel_prices_airport_idx
  ON public.fuel_prices (airport_icao, fuel_type);
CREATE INDEX IF NOT EXISTS fuel_prices_updated_idx
  ON public.fuel_prices (updated_at DESC);

-- ---------------------------------------------------------------------------
-- price_reports — crowdsourced submissions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.price_reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airport_icao    text NOT NULL REFERENCES public.airports (icao) ON DELETE CASCADE,
  fuel_type       text NOT NULL CHECK (fuel_type IN ('100LL', 'Jet-A')),
  reported_price  numeric(6, 2) NOT NULL CHECK (reported_price > 0),
  is_self_serve   boolean NOT NULL DEFAULT false,
  fbo_name        text,
  notes           text,
  reporter_ip     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS price_reports_airport_created_idx
  ON public.price_reports (airport_icao, created_at DESC);

-- Recent crowd prices (≤ 72 hours) helper view
CREATE OR REPLACE VIEW public.recent_crowd_prices AS
SELECT DISTINCT ON (airport_icao, fuel_type)
  airport_icao,
  fuel_type,
  reported_price AS price_per_gallon,
  is_self_serve,
  COALESCE(fbo_name, 'Crowdsourced') AS fbo_name,
  created_at AS updated_at,
  'Pilot_Crowdsource'::text AS source
FROM public.price_reports
WHERE created_at >= now() - interval '72 hours'
ORDER BY airport_icao, fuel_type, created_at DESC;

-- ---------------------------------------------------------------------------
-- Corridor candidates (PostGIS) — origin → dest within max_detour_nm
-- ---------------------------------------------------------------------------
-- WITH ends AS (
--   SELECT
--     (SELECT geom FROM airports WHERE icao = :origin_icao OR faa = :origin_icao LIMIT 1) AS o,
--     (SELECT geom FROM airports WHERE icao = :dest_icao OR faa = :dest_icao LIMIT 1) AS d
-- ),
-- corridor AS (
--   SELECT ST_Buffer(
--            ST_MakeLine(o::geometry, d::geometry)::geography,
--            :max_detour_nm * 1852.0
--          ) AS poly
--   FROM ends
-- )
-- SELECT a.icao, a.faa, a.name, a.runway_length, fp.price_per_gallon, fp.source, fp.updated_at
-- FROM airports a
-- JOIN corridor c ON ST_Intersects(a.geom, c.poly)
-- LEFT JOIN fuel_prices fp ON fp.airport_icao = a.icao AND fp.fuel_type = '100LL'
-- WHERE a.runway_length >= 2000
--   AND COALESCE(a.facility_type, '') <> 'heliport'
--   AND a.icao NOT IN (:origin_icao, :dest_icao)
-- ORDER BY fp.price_per_gallon ASC NULLS LAST;

ALTER TABLE public.airports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read airports"
  ON public.airports FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read fuel_prices"
  ON public.fuel_prices FOR SELECT TO anon, authenticated USING (true);

-- Pilots submitting fuel prices are not logged in. The public `anon` role
-- may INSERT. UPDATE/DELETE stay denied (no policy, and revoked below).
-- SELECT is withheld from anon because rows store reporter_ip.
-- The Next.js server reads and writes with the service role, which bypasses RLS.
DROP POLICY IF EXISTS "Anon insert price_reports" ON public.price_reports;
CREATE POLICY "Anon insert price_reports"
  ON public.price_reports FOR INSERT TO anon, authenticated
  WITH CHECK (true);

REVOKE SELECT, UPDATE, DELETE ON TABLE public.price_reports FROM anon, authenticated, PUBLIC;
GRANT INSERT ON TABLE public.price_reports TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.price_reports TO service_role;

-- =============================================================================
-- MIGRATION-STYLE ADDITION (do not re-run the whole file if already applied)
-- Opt-in “track my flight” share links — random token id, hard 24h expiry.
-- Run from here down on existing projects.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.flight_track_shares (
  id           text PRIMARY KEY,
  tail_number  text NOT NULL,
  label        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  CONSTRAINT flight_track_shares_id_len CHECK (char_length(id) >= 16),
  CONSTRAINT flight_track_shares_tail_len CHECK (
    char_length(tail_number) >= 2 AND char_length(tail_number) <= 12
  ),
  CONSTRAINT flight_track_shares_label_len CHECK (
    label IS NULL OR char_length(label) <= 80
  )
);

CREATE INDEX IF NOT EXISTS flight_track_shares_expires_idx
  ON public.flight_track_shares (expires_at);
CREATE INDEX IF NOT EXISTS flight_track_shares_tail_idx
  ON public.flight_track_shares (tail_number);

ALTER TABLE public.flight_track_shares ENABLE ROW LEVEL SECURITY;

-- Public clients never talk to this table directly; the Next.js server uses
-- the service role. No anon policies on purpose.
REVOKE ALL ON TABLE public.flight_track_shares FROM anon, authenticated, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.flight_track_shares TO service_role;
