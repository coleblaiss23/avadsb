# AvADSB

Interactive web app for General Aviation pilots combining **unfiltered live ADS-B radar**, **METAR/ATIS**, crosswind tools, and cheapest **100LL** / **Jet-A** fuel stops along a planned route.

## Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS** + Radix/Shadcn-style UI (light theme)
- **Leaflet / React-Leaflet** + CARTO Voyager tiles
- **TanStack Query** + **Zustand**
- **OurAirports / FAA-compatible** US catalog in `public/data/us-airports.json`
- **Supabase** (PostgreSQL + PostGIS) schema ready for production sync

## Quick start

```bash
npm install
npm run build:airports   # optional — rebuild US catalog from OurAirports CSVs
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Default route: **KAPA → KSDL**, 25 NM corridor, 100LL. Click **Find cheapest fuel stops**.

Search origin/dest by ICAO (`KSDL`) or FAA ID (`SDL`).

### Example SEO pages

- [/routes/kapa-to-ksdl](http://localhost:3000/routes/kapa-to-ksdl)
- [/weather/KAPA](http://localhost:3000/weather/KAPA) — live METAR + density altitude
- [/airports/KAPA](http://localhost:3000/airports/KAPA) — runway list + weather

### Pilot utilities

- **METAR badges** — flight category (VFR/MVFR/IFR/LIFR) from AviationWeather.gov
- **Runway & Crosswind Analyzer** — wind components vs catalog runway headings
- **Hobbs Splitter** — wet/dry cost split (header toolbar)

METAR API: `GET /api/metar?icao=KAPA`

Airport detail (with runways): `GET /api/airports/KAPA`

## How the optimizer works

1. **Direct distance** — Haversine great-circle (nm) between origin and destination.
2. **Corridor** — rectangular buffer of ± max detour nm around the track (cross-track filter).
3. **Candidate airports** — in corridor, excluding endpoints, with a price for the selected fuel type.
4. **Net savings**

   ```
   Net Savings = (Fuel Gallons Needed × Price Delta) − (Detour Time Hours × Hourly DOC)
   ```

   - Price delta = destination $/gal − stop $/gal  
   - Detour time = extra path nm ÷ cruise speed  
   - Fuel needed ≈ burn × (stop→dest hours + 45 min reserve), capped at 90% tank

5. Results ranked by net $ saved (highest first).

Map markers: **green** &lt; $5.50 · **yellow** $5.50–$6.80 · **red** &gt; $6.80.

## Crowdsourced & live prices

`GET /api/fuel?icao=KAPA&fuelType=100LL` resolves prices with fallback:

1. **AirNav / FBO API** when `AIRNAV_API_KEY` (+ `AIRNAV_API_URL`) are set  
2. **Pilot crowdsource** reports from the last **72 hours**  
3. **Demo synthetic** quote (clearly tagged)

`POST /api/fuel` accepts crowdsourced updates. Every result shows a verification tag, e.g. `Updated 3 hrs ago via Demo Quote`.

Optimize a corridor:

```bash
curl -X POST http://localhost:3000/api/optimize \
  -H 'Content-Type: application/json' \
  -d '{"originIcao":"KAPA","destinationIcao":"KSDL","aircraft":{"cruiseSpeedKts":140,"fuelBurnGph":13.5,"tankCapacityGal":88,"hourlyOperatingCost":65},"maxDetourNm":25,"fuelType":"100LL"}'
```

Airport autocomplete: `GET /api/airports/search?q=SDL`

---

## Supabase setup (step-by-step)

### 1. Create a project

1. Go to [https://supabase.com](https://supabase.com) → **New project**.
2. Note the **Project URL** and **anon** / **service_role** keys (Settings → API).

### 2. Enable PostGIS & create tables

1. Open **SQL Editor** → **New query**.
2. Paste the full contents of [`supabase/schema.sql`](supabase/schema.sql).
3. Click **Run**. This enables PostGIS, creates `airports` / `fuel_prices` / `price_reports`, and RLS.

### 3. Load US airports

1. Download OurAirports dumps (or use `data/raw/` if present).
2. `npm run build:airports` writes `public/data/us-airports.json` (~25k US facilities).
3. ETL that JSON into Supabase `airports` for production PostGIS corridor queries.

### 4. Environment variables

Copy `.env.example` → `.env.local` and set Supabase + optional AirNav keys.
Optional `FAA_NOTAM_CLIENT_ID` / `FAA_NOTAM_CLIENT_SECRET` (from notams@faa.gov)
enable live NOTAMs. Without them, `/api/notams` returns demo data tagged
`source: "demo"`. TFRs use the public FAA map feed and fall back to the same
demo tag if that feed fails.

---

## Project structure

```
src/
  app/
    page.tsx                 # Split-screen planner + map
    routes/[slug]/page.tsx   # SEO popular-route landings
    api/fuel-updates/        # Crowdsource POST + rate limit
  components/
    planner/                 # Form, results, shell
    map/                     # Leaflet map (SSR-safe loader)
    fuel/                    # Price update modal
    ads/                     # AdSense placeholders
    ui/                      # Button, Input, Dialog, …
  data/airports.ts           # 50 airports + mock prices
  lib/geo.ts                 # Haversine, corridor, cross-track
  lib/fuel-optimizer.ts      # Net savings matrix
  store/planner-store.ts     # Zustand
  types/index.ts
supabase/
  schema.sql
  seed.sql
```

## Ads & analytics placeholders

- Header leaderboard, sidebar rectangle, bottom in-feed: `src/components/ads/AdSlot.tsx`
- Privacy-first analytics comment in `src/app/layout.tsx` (e.g. Plausible)

## Scripts

```bash
npm run dev      # development
npm run build    # production build
npm run start    # serve build
npm run lint     # ESLint
```

## License

Private / demo — verify all fuel prices with the FBO before flight. Verify all
NOTAMs and TFRs against an official briefing (1800wxbrief, ForeFlight, or FAA
channels) before flight. This app is a convenience layer, not a certified
briefing source.

Radar marker silhouettes use GPL-2.0-or-later shapes from tar1090 (same family
as ADS-B Exchange). See [`NOTICE.md`](NOTICE.md) and
[`third_party/tar1090-markers/`](third_party/tar1090-markers/).
