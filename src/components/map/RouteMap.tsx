"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Polygon,
  Marker,
  Popup,
  CircleMarker,
  Tooltip,
  useMap,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Crosshair, Eraser, Layers, Radio, Search, ShieldAlert } from "lucide-react";
import { PriceUpdateModal } from "@/components/fuel/PriceUpdateModal";
import {
  AircraftFloatingCard,
  MapAircraftProjector,
  type AircraftScreenPos,
} from "@/components/map/AircraftCardDock";
import { AircraftInfoCard } from "@/components/map/AircraftInfoCard";
import { AirfieldDiagramLayer } from "@/components/map/AirfieldDiagramLayer";
import { AirportLabelsLayer } from "@/components/map/AirportLabelsLayer";
import { AirspaceLayer } from "@/components/map/AirspaceLayer";
import { TFRLayer, tfrStatusLine, useTfrOverlay } from "@/components/map/TFRLayer";
import { TrafficRadarLayer } from "@/components/map/TrafficRadarLayer";
import { AirportNotamFlag } from "@/components/notams/AirportNotamFlag";
import {
  TrafficMapSync,
  useLiveTraffic,
  type QueryPoint,
} from "@/components/map/use-live-traffic";
import { useExtrapolatedAircraft } from "@/hooks/use-extrapolated-aircraft";
import { ADSB_ALT_LEGEND, altitudeRainbowColor } from "@/lib/adsb-colors";
import { greatCirclePath, labelCollisionOffsets } from "@/lib/geo";
import { loadMapSession, PHOENIX_MSA } from "@/lib/map-session";
import { isAircraftOnGround } from "@/lib/aircraft-silhouettes";
import { isEmergencySquawk } from "@/lib/squawk";
import type { LiveAircraft } from "@/lib/traffic";
import { verificationTag } from "@/lib/fuel-pricing-client";
import {
  formatCurrency,
  getPriceSeverity,
  PRICE_SEVERITY_COLORS,
  fuelStopLabeled,
  FUEL_DISPLAY_FILTERS,
  MAP_PRICE_LABEL_CAP,
} from "@/lib/utils";
import { rememberMapView, usePlannerStore } from "@/store/planner-store";
import type { AirportWithFuel, FuelStopCandidate, PriceSeverity } from "@/types";

/**
 * Dark basemap for the radar deck.
 * Prefer Esri Dark Gray Canvas (no API key). Optional CARTO key removes
 * their watermark if you set NEXT_PUBLIC_CARTO_API_KEY.
 */
const ESRI_DARK_BASE =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
const ESRI_DARK_REF =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}";

function cartoDarkUrl(): string | null {
  const key = process.env.NEXT_PUBLIC_CARTO_API_KEY?.trim();
  if (!key) return null;
  return `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(key)}`;
}

/** Regional overview on first load. */
const HOME_ZOOM = 8;
const HOME_RADIUS_NM = 150;
const LOOKUP_ZOOM = 10;

type AltFilter = "all" | "ground" | "low" | "mid" | "high";

type FlightRoute = {
  callsign: string;
  origin: { icao: string; name: string; lat: number; lon: number };
  destination: { icao: string; name: string; lat: number; lon: number };
};

function buildHomeIcon(icao: string): L.DivIcon {
  const html = `<div class="afm-home-pin" title="${icao}"><span class="afm-home-pin__dot"></span><span class="afm-home-pin__label">${icao}</span></div>`;
  return L.divIcon({
    className: "afm-home-pin-marker",
    html,
    iconSize: [72, 28],
    iconAnchor: [12, 14],
    popupAnchor: [0, -12],
  });
}

function FitRouteBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length < 2) return;
    const bounds = L.latLngBounds(positions.map(([lat, lng]) => [lat, lng]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 8 });
  }, [map, positions]);
  return null;
}

function CenterOnHome({
  center,
  zoom,
  nonce,
}: {
  center: [number, number];
  zoom: number;
  nonce: number;
}) {
  const map = useMap();
  const lat = center[0];
  const lng = center[1];

  useEffect(() => {
    // Only when focus target changes — not on parent re-renders from traffic/poll.
    map.setView([lat, lng], zoom, { animate: nonce > 0 });
    const t = window.setTimeout(() => map.invalidateSize(), 80);
    return () => window.clearTimeout(t);
  }, [map, lat, lng, zoom, nonce]);

  return null;
}

function RememberMapView() {
  const map = useMap();
  useEffect(() => {
    let timer = 0;
    const save = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const center = map.getCenter();
        rememberMapView(center.lat, center.lng, map.getZoom());
      }, 250);
    };
    map.on("moveend", save);
    return () => {
      window.clearTimeout(timer);
      map.off("moveend", save);
    };
  }, [map]);
  return null;
}

type MapAirportHit = {
  icao: string;
  latitude: number;
  longitude: number;
  type: string;
};

function sizeRank(type: string): number {
  if (type === "large") return 3;
  if (type === "medium") return 2;
  if (type === "small") return 1;
  return 0;
}

/** Keep origin / NOTAM flag aligned with the largest airport near map center. */
function SyncMapOrigin() {
  const map = useMap();
  const setOrigin = usePlannerStore((s) => s.setOrigin);

  useEffect(() => {
    let timer = 0;
    let abort: AbortController | null = null;

    const sync = () => {
      const { destinationIcao, result } = usePlannerStore.getState();
      // Don't clobber an active fuel-plan origin while a destination/result is set.
      if (result || destinationIcao.trim().length >= 3) return;

      const zoom = map.getZoom();
      if (zoom < 7) return;

      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const bounds = map.getBounds();
        const center = map.getCenter();
        const minRunway = zoom >= 11 ? 2500 : zoom >= 9 ? 4000 : 5500;
        abort?.abort();
        abort = new AbortController();
        const params = new URLSearchParams({
          south: bounds.getSouth().toFixed(5),
          west: bounds.getWest().toFixed(5),
          north: bounds.getNorth().toFixed(5),
          east: bounds.getEast().toFixed(5),
          minRunway: String(minRunway),
          limit: "40",
        });
        fetch(`/api/airports/bbox?${params}`, { signal: abort.signal })
          .then((res) =>
            res.ok ? res.json() : Promise.reject(new Error("bbox"))
          )
          .then((json: { airports?: MapAirportHit[] }) => {
            const airports = Array.isArray(json.airports) ? json.airports : [];
            if (!airports.length) return;

            // BBox API returns largest-first; among the top size tier, pick nearest center.
            const top = airports.slice(0, 8);
            const maxSize = Math.max(...top.map((a) => sizeRank(a.type)));
            const tier = top.filter((a) => sizeRank(a.type) === maxSize);
            let pick = tier[0]!;
            let bestD = Number.POSITIVE_INFINITY;
            for (const a of tier) {
              const d =
                (a.latitude - center.lat) ** 2 +
                (a.longitude - center.lng) ** 2;
              if (d < bestD) {
                bestD = d;
                pick = a;
              }
            }

            if (pick.icao !== usePlannerStore.getState().originIcao) {
              setOrigin(pick.icao);
            }
          })
          .catch((err: unknown) => {
            if (err instanceof DOMException && err.name === "AbortError") return;
          });
      }, 350);
    };

    sync();
    map.on("moveend", sync);
    return () => {
      window.clearTimeout(timer);
      abort?.abort();
      map.off("moveend", sync);
    };
  }, [map, setOrigin]);

  return null;
}

function InvalidateMapSize() {
  const map = useMap();
  useEffect(() => {
    const run = () => map.invalidateSize();
    run();
    const t1 = window.setTimeout(run, 100);
    const t2 = window.setTimeout(run, 400);
    window.addEventListener("resize", run);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("resize", run);
    };
  }, [map]);
  return null;
}

function FlyToAircraft({
  aircraft,
  nonce,
}: {
  aircraft: LiveAircraft | null;
  nonce: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (!aircraft || nonce <= 0) return;
    map.flyTo([aircraft.lat, aircraft.lon], LOOKUP_ZOOM, { duration: 1.1 });
  }, [map, aircraft, nonce]);
  return null;
}

/** Keep the map centered on the selected aircraft while following. */
function FollowAircraft({
  aircraft,
  enabled,
}: {
  aircraft: LiveAircraft | null;
  enabled: boolean;
}) {
  const map = useMap();
  const lastPanAt = useRef(0);
  useEffect(() => {
    if (!enabled || !aircraft) return;
    const now = Date.now();
    // Extrapolated positions update ~10Hz — throttle pans so the map stays usable.
    if (now - lastPanAt.current < 400) return;
    lastPanAt.current = now;
    map.panTo([aircraft.lat, aircraft.lon], {
      animate: true,
      duration: 0.35,
    });
  }, [map, enabled, aircraft?.hex, aircraft?.lat, aircraft?.lon]);
  return null;
}

function passesAltFilter(ac: LiveAircraft, filter: AltFilter): boolean {
  const alt = ac.alt_baro;
  switch (filter) {
    case "all":
      return true;
    case "ground":
      return isAircraftOnGround(alt);
    case "low":
      return alt != null && alt > 0 && alt < 10000;
    case "mid":
      return alt != null && alt >= 10000 && alt < 30000;
    case "high":
      return alt != null && alt >= 30000;
    default:
      return true;
  }
}

function buildPillIcon(opts: {
  icao: string;
  priceLabel: string;
  severity: PriceSeverity | "endpoint";
  selected: boolean;
  offsetPx?: number;
}): L.DivIcon {
  const sevClass =
    opts.severity === "endpoint"
      ? "afm-pill--endpoint"
      : PRICE_SEVERITY_COLORS[opts.severity].pillClass;
  const selectedClass = opts.selected ? " afm-pill--selected" : "";
  const offset = Math.max(0, opts.offsetPx ?? 0);
  const leader =
    offset > 0
      ? `<span class="afm-pill-leader" style="height:${offset}px"></span>`
      : "";
  const html = `<div class="afm-pill-stack"><div class="afm-pill ${sevClass}${selectedClass}">${opts.icao} ${opts.priceLabel}</div>${leader}</div>`;
  const h = 26 + offset;
  return L.divIcon({
    className: "afm-pill-marker",
    html,
    iconSize: [128, h],
    iconAnchor: [64, h - 4],
    popupAnchor: [0, -(h - 8)],
  });
}

export function RouteMap() {
  const result = usePlannerStore((s) => s.result);
  const fuelType = usePlannerStore((s) => s.fuelType);
  const selectedStopIcao = usePlannerStore((s) => s.selectedStopIcao);
  const selectCandidate = usePlannerStore((s) => s.selectCandidate);
  const homeAirport = usePlannerStore((s) => s.homeAirport);
  const mapFocusNonce = usePlannerStore((s) => s.mapFocusNonce);
  const clearPath = usePlannerStore((s) => s.clearPath);
  const emergencyTrafficOnly = usePlannerStore((s) => s.emergencyTrafficOnly);
  const mapZoom = usePlannerStore((s) => s.mapView.zoom);
  const fuelMapFilter = usePlannerStore((s) => s.fuelMapFilter);
  const setFuelMapFilter = usePlannerStore((s) => s.setFuelMapFilter);

  const [reportTarget, setReportTarget] = useState<{
    icao: string;
    name: string;
  } | null>(null);
  const [radarOn, setRadarOn] = useState(true);
  useEffect(() => {
    if (radarOn) track(ANALYTICS_EVENTS.radarOpened);
  }, [radarOn]);
  const [tfrOn, setTfrOn] = useState(true);
  const [airspaceOn, setAirspaceOn] = useState(false);
  const [trafficPoint, setTrafficPoint] = useState<QueryPoint | null>(() => {
    const view = loadMapSession() ?? PHOENIX_MSA;
    return {
      lat: Number(view.lat.toFixed(4)),
      lon: Number(view.lng.toFixed(4)),
      radiusNm: HOME_RADIUS_NM,
    };
  });
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupPending, setLookupPending] = useState(false);
  const [trackedHex, setTrackedHex] = useState<string | null>(null);
  const [trackedSnapshot, setTrackedSnapshot] = useState<LiveAircraft | null>(
    null
  );
  const [hovered, setHovered] = useState<LiveAircraft | null>(null);
  const [cardScreenPos, setCardScreenPos] = useState<AircraftScreenPos | null>(
    null
  );
  const [flyNonce, setFlyNonce] = useState(0);
  const [follow, setFollow] = useState(false);
  const [altFilter, setAltFilter] = useState<AltFilter>("all");
  const [resyncNonce, setResyncNonce] = useState(0);
  const [flightRoute, setFlightRoute] = useState<FlightRoute | null>(null);
  const [selectedPath, setSelectedPath] = useState<[number, number][]>([]);
  const setEmergencyTrafficOnly = usePlannerStore(
    (s) => s.setEmergencyTrafficOnly
  );

  const onTrafficPoint = useCallback((point: QueryPoint) => {
    setTrafficPoint(point);
  }, []);

  // Re-anchor traffic only when the user pins an airport. Panning is saved separately.
  useEffect(() => {
    if (homeAirport.source !== "manual") return;
    setTrafficPoint({
      lat: Number(homeAirport.latitude.toFixed(4)),
      lon: Number(homeAirport.longitude.toFixed(4)),
      radiusNm: HOME_RADIUS_NM,
    });
  }, [homeAirport.icao, homeAirport.latitude, homeAirport.longitude, homeAirport.source]);

  const traffic = useLiveTraffic(radarOn, trafficPoint);
  const tfrs = useTfrOverlay(tfrOn);
  const originIcao = usePlannerStore((s) => s.originIcao);
  const destinationIcao = usePlannerStore((s) => s.destinationIcao);

  const displayAircraft = useMemo(() => {
    let list = [...traffic.aircraft];
    if (
      trackedSnapshot &&
      !list.some((a) => a.hex === trackedSnapshot.hex)
    ) {
      list.push(trackedSnapshot);
    }
    if (emergencyTrafficOnly) {
      list = list.filter((a) => isEmergencySquawk(a.squawk));
    }
    if (altFilter !== "all") {
      list = list.filter((a) => passesAltFilter(a, altFilter));
    }
    return list;
  }, [
    traffic.aircraft,
    trackedSnapshot,
    emergencyTrafficOnly,
    altFilter,
  ]);

  // Only coast the focused plane(s) here — full fleet moves inside TrafficRadarLayer.
  const focusSource = useMemo(() => {
    const out: LiveAircraft[] = [];
    if (trackedHex) {
      const tracked =
        displayAircraft.find((a) => a.hex === trackedHex) ?? trackedSnapshot;
      if (tracked) out.push(tracked);
    }
    if (hovered && hovered.hex !== trackedHex) {
      out.push(
        displayAircraft.find((a) => a.hex === hovered.hex) ?? hovered
      );
    }
    return out;
  }, [displayAircraft, trackedHex, trackedSnapshot, hovered]);

  const focusMoving = useExtrapolatedAircraft(focusSource, radarOn);

  const trackedLive = useMemo(() => {
    if (!trackedHex) return null;
    return (
      focusMoving.find((a) => a.hex === trackedHex) ?? trackedSnapshot
    );
  }, [focusMoving, trackedHex, trackedSnapshot]);

  const hoveredLive = useMemo(() => {
    if (!hovered) return null;
    return focusMoving.find((a) => a.hex === hovered.hex) ?? hovered;
  }, [focusMoving, hovered]);

  const cardAircraft = hoveredLive ?? trackedLive;
  const cardPinned = !!cardAircraft && cardAircraft.hex === trackedHex;

  const onCardScreenPos = useCallback((pos: AircraftScreenPos | null) => {
    setCardScreenPos(pos);
  }, []);

  useEffect(() => {
    if (!cardAircraft) setCardScreenPos(null);
  }, [cardAircraft]);

  const showHover = useCallback((ac: LiveAircraft) => {
    setHovered((prev) => (prev?.hex === ac.hex ? prev : ac));
  }, []);

  const clearHover = useCallback(() => {
    setHovered((prev) => (prev ? null : prev));
  }, []);

  useEffect(() => {
    const callsign = trackedLive?.flight?.trim().toUpperCase() ?? "";
    if (!trackedHex || callsign.length < 3) {
      setFlightRoute(null);
      return;
    }
    const ac = trackedLive;
    if (!ac) return;
    let cancelled = false;
    const params = new URLSearchParams({
      callsign,
      lat: String(ac.lat),
      lon: String(ac.lon),
    });
    void fetch(`/api/traffic/route?${params}`)
      .then((res) => res.json())
      .then((data: { route?: FlightRoute | null }) => {
        if (!cancelled) setFlightRoute(data.route ?? null);
      })
      .catch(() => {
        if (!cancelled) setFlightRoute(null);
      });
    return () => {
      cancelled = true;
    };
  }, [trackedHex, trackedLive?.flight]);

  // Full current-flight track for the pinned aircraft (not shown for all traffic).
  useEffect(() => {
    if (!trackedHex) {
      setSelectedPath([]);
      return;
    }
    let cancelled = false;
    void fetch(
      `/api/traffic/trace?hex=${encodeURIComponent(trackedHex)}`
    )
      .then((res) => res.json())
      .then((data: { path?: [number, number][] }) => {
        if (cancelled) return;
        setSelectedPath(Array.isArray(data.path) ? data.path : []);
      })
      .catch(() => {
        if (!cancelled) setSelectedPath([]);
      });
    return () => {
      cancelled = true;
    };
  }, [trackedHex]);

  const trackedFlightPath = useMemo(() => {
    if (selectedPath.length < 2 || !trackedLive) return selectedPath;
    const last = selectedPath[selectedPath.length - 1]!;
    if (
      Math.abs(last[0] - trackedLive.lat) < 1e-5 &&
      Math.abs(last[1] - trackedLive.lon) < 1e-5
    ) {
      return selectedPath;
    }
    return [...selectedPath, [trackedLive.lat, trackedLive.lon] as [number, number]];
  }, [selectedPath, trackedLive]);

  // Refresh tracked snapshot from live feed when available
  useEffect(() => {
    if (!trackedHex) return;
    const live = traffic.aircraft.find((a) => a.hex === trackedHex);
    if (live) setTrackedSnapshot(live);
  }, [traffic.aircraft, trackedHex]);

  function matchLocal(q: string): LiveAircraft | null {
    const needle = q.trim().toUpperCase().replace(/\s+/g, "");
    if (!needle) return null;
    return (
      traffic.aircraft.find((a) => {
        const flight = a.flight.replace(/\s+/g, "");
        const reg = (a.registration ?? "").replace(/\s+/g, "");
        const hex = a.hex.toUpperCase();
        return (
          flight === needle ||
          flight.includes(needle) ||
          reg === needle ||
          hex === needle
        );
      }) ?? null
    );
  }

  async function lookupAircraft(e: React.FormEvent) {
    e.preventDefault();
    const q = lookupQuery.trim();
    if (!q) return;

    setLookupError(null);
    setRadarOn(true);
    traffic.bumpActivity();

    const local = matchLocal(q);
    if (local) {
      focusAircraft(local);
      return;
    }

    setLookupPending(true);
    try {
      const res = await fetch(
        `/api/traffic/lookup?q=${encodeURIComponent(q)}`
      );
      const data = (await res.json()) as {
        aircraft?: LiveAircraft[];
        error?: string;
      };
      const hit = data.aircraft?.[0];
      if (!res.ok || !hit) {
        setLookupError(data.error || `No live aircraft for “${q}”`);
        return;
      }
      focusAircraft(hit);
    } catch {
      setLookupError("Lookup failed — try again");
    } finally {
      setLookupPending(false);
    }
  }

  function releaseTrack() {
    setTrackedHex(null);
    setTrackedSnapshot(null);
    setHovered(null);
    setFollow(false);
    setFlightRoute(null);
    setResyncNonce((n) => n + 1);
    traffic.bumpActivity();
    traffic.refresh();
  }

  function focusAircraft(ac: LiveAircraft) {
    setTrackedHex(ac.hex);
    setTrackedSnapshot(ac);
    setFlyNonce((n) => n + 1);
    setFollow(true);
    setLookupError(null);
    setRadarOn(true);
    traffic.ingest([ac]);
    traffic.bumpActivity();
  }

  function handleClearPath() {
    clearPath();
    releaseTrack();
    setLookupQuery("");
    setLookupError(null);
    setRadarOn(true);
    setTrafficPoint({
      lat: Number(homeAirport.latitude.toFixed(4)),
      lon: Number(homeAirport.longitude.toFixed(4)),
      radiusNm: HOME_RADIUS_NM,
    });
  }

  const candidateMap = useMemo(() => {
    const m = new Map<string, FuelStopCandidate>();
    result?.candidates.forEach((c) => m.set(c.airport.icao, c));
    return m;
  }, [result]);

  const [initialView] = useState(() => loadMapSession() ?? PHOENIX_MSA);
  const mapCenter: [number, number] = [
    initialView.lat,
    initialView.lng,
  ];
  const airportPinned = homeAirport.source === "manual";

  const cartoUrl = cartoDarkUrl();

  const corridorPositions: [number, number][] = useMemo(() => {
    if (!result) return [];
    return result.corridor.polygon.map(
      (p) => [p.lat, p.lng] as [number, number]
    );
  }, [result]);

  const routeLine: [number, number][] = useMemo(() => {
    if (!result) return [];
    return result.corridor.directLine.map(
      (p) => [p.lat, p.lng] as [number, number]
    );
  }, [result]);

  const fitPositions = useMemo(() => {
    if (corridorPositions.length) return corridorPositions;
    if (routeLine.length >= 2) return routeLine;
    return [];
  }, [corridorPositions, routeLine]);

  const markersToShow: AirportWithFuel[] = useMemo(() => {
    if (!result) return [];
    const ranked = [...result.candidates].sort((a, b) => a.rank - b.rank);
    const labeled = ranked
      .filter((c) =>
        fuelStopLabeled(fuelMapFilter, {
          always: c.airport.icao === selectedStopIcao,
          rank: c.rank,
          price: c.airport.fuel?.pricePerGallon,
          netSavings: c.netSavings,
        })
      )
      .slice(0, MAP_PRICE_LABEL_CAP);
    const seen = new Set<string>();
    const list: AirportWithFuel[] = [];
    for (const airport of [result.origin, result.destination]) {
      if (seen.has(airport.icao)) continue;
      seen.add(airport.icao);
      list.push(airport);
    }
    for (const c of labeled) {
      if (seen.has(c.airport.icao)) continue;
      seen.add(c.airport.icao);
      list.push(c.airport);
    }
    if (
      selectedStopIcao &&
      !seen.has(selectedStopIcao)
    ) {
      const selected = result.candidates.find(
        (c) => c.airport.icao === selectedStopIcao
      );
      if (selected) list.push(selected.airport);
    }
    return list;
  }, [result, fuelMapFilter, selectedStopIcao]);

  const labelOffsets = useMemo(
    () =>
      labelCollisionOffsets(
        markersToShow.map((airport) => ({
          id: airport.icao,
          lat: airport.latitude,
          lng: airport.longitude,
        }))
      ),
    [markersToShow]
  );

  const labeledIcaos = useMemo(() => {
    const codes = markersToShow.map((a) => a.icao);
    if (!result && airportPinned) codes.push(homeAirport.icao);
    return codes;
  }, [airportPinned, homeAirport.icao, markersToShow, result]);

  return (
    <div className="relative z-0 h-full min-h-[420px] w-full isolate overflow-hidden">
      <MapContainer
        center={mapCenter}
        zoom={initialView.zoom}
        maxZoom={19}
        className="afm-radar-dark h-full w-full"
        scrollWheelZoom
        zoomControl={false}
      >
        {cartoUrl ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url={cartoUrl}
            subdomains="abcd"
            maxZoom={20}
          />
        ) : (
          <>
            <TileLayer
              attribution='Tiles &copy; Esri — Esri, HERE, Garmin, FAO, NOAA, USGS'
              url={ESRI_DARK_BASE}
              maxZoom={19}
              maxNativeZoom={16}
            />
            <TileLayer
              attribution=""
              url={ESRI_DARK_REF}
              maxZoom={19}
              maxNativeZoom={16}
              opacity={0.85}
            />
          </>
        )}
        <ZoomControl position="bottomright" />
        <AirfieldDiagramLayer />
        <AirportLabelsLayer excludeIcaos={labeledIcaos} />
        {tfrOn && <TFRLayer features={tfrs.features} source={tfrs.source} />}
        <AirspaceLayer enabled={airspaceOn} />
        <InvalidateMapSize />
        <RememberMapView />
        <SyncMapOrigin />
        {!result && mapFocusNonce > 0 && (
          <CenterOnHome
            center={[homeAirport.latitude, homeAirport.longitude]}
            zoom={HOME_ZOOM}
            nonce={mapFocusNonce}
          />
        )}
        {fitPositions.length >= 2 && <FitRouteBounds positions={fitPositions} />}
        <TrafficMapSync
          enabled={radarOn}
          onPoint={onTrafficPoint}
          onActivity={traffic.bumpActivity}
          resyncNonce={resyncNonce}
        />
        <FlyToAircraft aircraft={trackedLive} nonce={flyNonce} />
        <FollowAircraft aircraft={trackedLive} enabled={follow && !!trackedLive} />
        {cardAircraft && (
          <MapAircraftProjector
            lat={cardAircraft.lat}
            lon={cardAircraft.lon}
            onProject={onCardScreenPos}
          />
        )}

        {flightRoute && (
          <>
            <Polyline
              positions={greatCirclePath(
                { lat: flightRoute.origin.lat, lng: flightRoute.origin.lon },
                { lat: flightRoute.destination.lat, lng: flightRoute.destination.lon }
              ).map((p) => [p.lat, p.lng] as [number, number])}
              pathOptions={{
                color: "#c5d0d6",
                weight: 1.75,
                opacity: 0.85,
                dashArray: "6 7",
              }}
            />
            <CircleMarker
              center={[flightRoute.origin.lat, flightRoute.origin.lon]}
              radius={5}
              pathOptions={{
                color: "#0a0a0a",
                weight: 1,
                fillColor: "#c5d0d6",
                fillOpacity: 1,
              }}
            >
              <Tooltip permanent direction="right" className="afm-route-tip">
                {flightRoute.origin.icao}
              </Tooltip>
            </CircleMarker>
            <CircleMarker
              center={[flightRoute.destination.lat, flightRoute.destination.lon]}
              radius={5}
              pathOptions={{
                color: "#0a0a0a",
                weight: 1,
                fillColor: "#8a9aa3",
                fillOpacity: 1,
              }}
            >
              <Tooltip permanent direction="right" className="afm-route-tip">
                {flightRoute.destination.icao}
              </Tooltip>
            </CircleMarker>
          </>
        )}

        {corridorPositions.length > 0 && (
          <Polygon
            positions={corridorPositions}
            pathOptions={{
              color: "#5a8a9a",
              weight: 1.25,
              fillColor: "#5a8a9a",
              fillOpacity: 0.06,
              dashArray: "4 6",
              opacity: 0.55,
            }}
          />
        )}

        {routeLine.length >= 2 && (
          <Polyline
            positions={routeLine}
            pathOptions={{
              color: "#7a9eaa",
              weight: 3,
              opacity: 0.9,
              lineCap: "round",
            }}
          />
        )}

        {radarOn && (
          <TrafficRadarLayer
            aircraft={displayAircraft}
            selectedHex={trackedHex}
            labelMinZoom={9}
            onHover={(ac) => {
              if (ac) showHover(ac);
              else clearHover();
            }}
            onSelect={(ac) => {
              if (!ac) {
                releaseTrack();
                return;
              }
              setHovered(null);
              setTrackedHex(ac.hex);
              setTrackedSnapshot(ac);
              setFollow(false);
            }}
          />
        )}

        {trackedFlightPath.length >= 2 && trackedLive && (
          <Polyline
            positions={trackedFlightPath}
            pathOptions={{
              color: altitudeRainbowColor(trackedLive.alt_baro),
              weight: 3,
              opacity: 1,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        )}


        {!result && airportPinned && (
          <Marker
            position={[homeAirport.latitude, homeAirport.longitude]}
            icon={buildHomeIcon(homeAirport.icao)}
            zIndexOffset={600}
          >
            <Popup>
              <div className="min-w-[180px] space-y-1 text-sm">
                <p className="font-mono text-base font-bold text-[var(--ink-text)]">
                  {homeAirport.icao}
                </p>
                <p className="font-medium">{homeAirport.name}</p>
                <p className="text-xs text-slate-500">
                  {homeAirport.city}, {homeAirport.state}
                </p>
                <p className="text-[11px] text-slate-400">
                  Map centered here — search another airport to move.
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {markersToShow.map((airport) => {
          const isEndpoint =
            airport.icao === result?.origin.icao ||
            airport.icao === result?.destination.icao;
          const candidate = candidateMap.get(airport.icao);
          const price = airport.fuel?.pricePerGallon;
          const severity: PriceSeverity | "endpoint" = isEndpoint
            ? "endpoint"
            : price != null
              ? getPriceSeverity(price)
              : "average";
          const selected = selectedStopIcao === airport.icao;
          const labeled = fuelStopLabeled(fuelMapFilter, {
            always: isEndpoint || selected,
            rank: candidate?.rank,
            price,
            netSavings: candidate?.netSavings,
          });
          if (!labeled) return null;
          const priceLabel =
            price != null ? `${formatCurrency(price)}/gal` : "——";
          const icon = buildPillIcon({
            icao: airport.icao,
            priceLabel,
            severity,
            selected,
            offsetPx: labelOffsets.get(airport.icao) ?? 0,
          });

          return (
            <Marker
              key={`${airport.icao}-${selected}-${priceLabel}`}
              position={[airport.latitude, airport.longitude]}
              icon={icon}
              zIndexOffset={selected ? 1000 : isEndpoint ? 500 : 0}
              eventHandlers={{
                click: () => {
                  if (candidate) selectCandidate(candidate);
                  else selectCandidate(null);
                },
              }}
            >
              <Popup>
                <div className="min-w-[200px] space-y-1 text-sm">
                  <p className="font-avionics text-base font-bold text-[var(--ink-text)]">
                    {airport.icao}
                    {airport.faa && airport.faa !== airport.icao
                      ? ` / ${airport.faa}`
                      : ""}
                  </p>
                  <p className="font-medium">{airport.name}</p>
                  <p className="text-xs text-slate-500">
                    {airport.city}, {airport.state} — elev{" "}
                    {airport.elevation.toLocaleString()} ft MSL
                  </p>
                  {price != null && airport.fuel && (
                    <>
                      <p className="font-avionics font-semibold">
                        {fuelType}: {formatCurrency(price)}/gal
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {verificationTag(airport.fuel)}
                      </p>
                    </>
                  )}
                  {candidate && (
                    <p className="font-avionics text-xs font-semibold text-accent">
                      Net {candidate.netSavings >= 0 ? "+" : ""}
                      {formatCurrency(candidate.netSavings)} — #{candidate.rank}
                    </p>
                  )}
                  <button
                    type="button"
                    className="mt-1 rounded-sm bg-[var(--scope-cyan)] px-2 py-1 text-[11px] font-semibold text-[#0e1116] hover:bg-[var(--scope-cyan-dim)] hover:text-slate-100"
                    onClick={() =>
                      setReportTarget({
                        icao: airport.icao,
                        name: airport.name,
                      })
                    }
                  >
                    Crowdsource update
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="pointer-events-none absolute left-3 top-3 z-[1100] flex max-w-[min(100%-1.5rem,24rem)] flex-col gap-2">
        <form
          onSubmit={lookupAircraft}
          className="pointer-events-auto scope-bezel overflow-hidden"
        >
          <label className="block border-b border-[var(--ink-border)] px-3 py-1.5 text-[11px] font-medium text-slate-400">
            Find aircraft
          </label>
          <div className="flex">
            <input
              type="text"
              value={lookupQuery}
              onChange={(e) => {
                setLookupQuery(e.target.value);
                if (lookupError) setLookupError(null);
              }}
              placeholder="N123AB, AAL100, or Mode-S hex"
              className="min-w-0 flex-1 bg-transparent px-3 py-2.5 font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none"
              aria-label="Look up aircraft by callsign, tail number, or Mode-S hex"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="submit"
              disabled={lookupPending || !lookupQuery.trim()}
              className="inline-flex items-center gap-1.5 border-l border-[var(--ink-border)] bg-[var(--scope-cyan)] px-3.5 text-xs font-semibold text-[#0e1116] hover:bg-[var(--scope-cyan-dim)] hover:text-slate-100 disabled:opacity-50"
            >
              <Search className="h-3.5 w-3.5" aria-hidden />
              {lookupPending ? "…" : "Go"}
            </button>
          </div>
        </form>
        {lookupError && (
          <p className="pointer-events-auto scope-bezel border-[var(--signal-red)]/40 px-2.5 py-1.5 text-[11px] text-red-200">
            {lookupError}
          </p>
        )}
        {!result && !trackedHex && (
          <p className="scope-bezel px-3 py-2 text-xs text-slate-400">
            Live ADS-B — pan the map or find a flight. Zoom in on a field for
            runway numbers and taxiway letters.
          </p>
        )}
        {(originIcao.length >= 3 || destinationIcao.length >= 3) && (
          <div className="flex flex-col items-start gap-1">
            {originIcao.length >= 3 && (
              <AirportNotamFlag icao={originIcao} role="Origin" />
            )}
            {destinationIcao.length >= 3 &&
              destinationIcao.toUpperCase() !== originIcao.toUpperCase() && (
                <AirportNotamFlag icao={destinationIcao} role="Dest" />
              )}
          </div>
        )}
      </div>

      {cardAircraft && (
        <AircraftFloatingCard
          hex={cardAircraft.hex}
          screenPos={cardScreenPos}
          clearLegend={radarOn}
          interactive={cardPinned}
        >
          <AircraftInfoCard
            ac={cardAircraft}
            following={cardPinned ? follow : undefined}
            route={cardPinned ? flightRoute : null}
            allowTrackShare={cardPinned}
            onToggleFollow={
              cardPinned ? () => setFollow((v) => !v) : undefined
            }
            onClose={cardPinned ? releaseTrack : () => setHovered(null)}
          />
        </AircraftFloatingCard>
      )}

      <div className="pointer-events-none absolute right-3 top-3 z-[1050] flex flex-col items-end gap-2">
        {(result || trackedHex) && (
          <button
            type="button"
            onClick={handleClearPath}
            className="pointer-events-auto inline-flex items-center gap-1.5 scope-bezel px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-[var(--bezel)]"
          >
            <Eraser className="h-3.5 w-3.5" aria-hidden />
            Clear
          </button>
        )}
        {trackedLive && (
          <button
            type="button"
            onClick={() => setFollow((v) => !v)}
            className={
              follow
                ? "pointer-events-auto inline-flex items-center gap-1.5 border border-[var(--scope-cyan)]/50 bg-[var(--ink)] px-3 py-1.5 text-xs font-semibold text-[var(--scope-cyan)]"
                : "pointer-events-auto inline-flex items-center gap-1.5 scope-bezel px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-[var(--bezel)]"
            }
            aria-pressed={follow}
          >
            <Crosshair className="h-3.5 w-3.5" aria-hidden />
            {follow ? "Following" : "Follow"}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setRadarOn((v) => !v);
            traffic.bumpActivity();
          }}
          className={
            radarOn
              ? "pointer-events-auto inline-flex items-center gap-1.5 border border-[var(--scope-cyan)]/40 bg-[var(--ink)] px-3 py-1.5 text-xs font-semibold text-[var(--scope-cyan)]"
              : "pointer-events-auto inline-flex items-center gap-1.5 scope-bezel px-3 py-1.5 text-xs font-semibold text-slate-400 hover:border-[var(--bezel)]"
          }
          aria-pressed={radarOn}
        >
          <Radio className="h-3.5 w-3.5" aria-hidden />
          Radar {radarOn ? "ON" : "OFF"}
        </button>
        <button
          type="button"
          onClick={() => {
            setTfrOn((v) => !v);
            tfrs.bumpActivity();
          }}
          className={
            tfrOn
              ? "pointer-events-auto inline-flex items-center gap-1.5 border border-[var(--signal-amber)]/50 bg-[var(--ink)] px-3 py-1.5 text-xs font-semibold text-[var(--signal-amber)]"
              : "pointer-events-auto inline-flex items-center gap-1.5 scope-bezel px-3 py-1.5 text-xs font-semibold text-slate-400 hover:border-[var(--bezel)]"
          }
          aria-pressed={tfrOn}
        >
          <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
          TFRs {tfrOn ? "ON" : "OFF"}
        </button>
        <button
          type="button"
          onClick={() => setAirspaceOn((v) => !v)}
          className={
            airspaceOn
              ? "pointer-events-auto inline-flex items-center gap-1.5 border border-[var(--bezel)]/70 bg-[var(--ink)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-muted)]"
              : "pointer-events-auto inline-flex items-center gap-1.5 scope-bezel px-3 py-1.5 text-xs font-semibold text-slate-400 hover:border-[var(--bezel)]"
          }
          aria-pressed={airspaceOn}
        >
          <Layers className="h-3.5 w-3.5" aria-hidden />
          Airspace
        </button>
        {tfrOn && (
          <p className="pointer-events-none scope-bezel px-2.5 py-1 text-[10px] text-slate-400">
            {tfrStatusLine({
              count: tfrs.features.length,
              source: tfrs.source,
              fetchedAt: tfrs.fetchedAt,
              isFetching: tfrs.isFetching,
              isError: tfrs.isError,
            })}
            {tfrs.source === "demo" ? " · demo" : ""}
          </p>
        )}
        {radarOn && (
          <div className="pointer-events-auto flex flex-col items-end gap-1.5">
            <div className="flex flex-wrap justify-end gap-1">
              {(
                [
                  ["all", "All"],
                  ["ground", "GND"],
                  ["low", "<10k ft"],
                  ["mid", "10–30k ft"],
                  ["high", "30k+ ft"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAltFilter(id)}
                  className={
                    altFilter === id
                      ? "border border-[var(--scope-cyan)]/40 bg-[var(--scope-cyan)]/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--scope-cyan)]"
                      : "scope-bezel px-2 py-0.5 font-mono text-[10px] text-slate-400 hover:text-slate-200"
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setEmergencyTrafficOnly(!emergencyTrafficOnly)}
                className={
                  emergencyTrafficOnly
                    ? "emergency-squawk px-2.5 py-1 font-mono text-[11px] font-bold tracking-wide"
                    : "border border-[#ff5a4a]/55 bg-[#2a1210] px-2.5 py-1 font-mono text-[11px] font-bold tracking-wide text-[#ffe8d8]"
                }
                aria-pressed={emergencyTrafficOnly}
              >
                7500 / 7600 / 7700
              </button>
            </div>
            <p className="scope-bezel px-2.5 py-1 text-[10px] text-slate-400">
              {traffic.isError
                ? "Radar offline"
                : traffic.isFetching
                  ? "Updating…"
                  : `${displayAircraft.length} live${
                      emergencyTrafficOnly ? " emergency" : ""
                    }${traffic.source ? ` / ${traffic.source}` : ""}`}
            </p>
          </div>
        )}
      </div>

      {radarOn && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-[900] scope-bezel px-3 py-2">
          {mapZoom >= 14 && (
            <p className="mb-1.5 font-avionics text-[10px] text-[var(--signal-amber)]">
              RWY numbers / TWY letters
            </p>
          )}
          <p className="mb-1.5 text-[11px] font-medium text-[var(--ink-muted)]">
            Altitude (ft)
          </p>
          <ul className="afm-alt-legend">
            {ADSB_ALT_LEGEND.map((row) => (
              <li key={row.label} className="afm-alt-legend__row">
                <span
                  className="afm-alt-legend__swatch"
                  style={{ background: row.color }}
                />
                {row.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {markersToShow.length > 0 && (
        <div className="pointer-events-none absolute bottom-3 right-14 z-[900] max-h-[40%] overflow-y-auto scope-bezel px-3 py-2 text-[10px] text-slate-300">
          <div className="pointer-events-auto mb-2 flex flex-wrap gap-1">
            {FUEL_DISPLAY_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFuelMapFilter(item.id)}
                className={
                  fuelMapFilter === item.id
                    ? "border border-[var(--scope-cyan)]/40 bg-[var(--scope-cyan)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--scope-cyan)]"
                    : "border border-[var(--ink-border)] px-2 py-0.5 text-[10px] text-slate-400 hover:text-slate-200"
                }
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="mb-1 text-[11px] font-medium text-[var(--ink-muted)]">
            Fuel price ($/gal) — map labels top {MAP_PRICE_LABEL_CAP}; full
            ranking is in the table
          </p>
          <ul className="space-y-0.5 font-avionics">
            {(Object.keys(PRICE_SEVERITY_COLORS) as PriceSeverity[]).map(
              (k) => (
                <li key={k} className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2"
                    style={{ background: PRICE_SEVERITY_COLORS[k].fill }}
                  />
                  {PRICE_SEVERITY_COLORS[k].label}
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {reportTarget && (
        <PriceUpdateModal
          open={!!reportTarget}
          onOpenChange={(o) => !o && setReportTarget(null)}
          airportIcao={reportTarget.icao}
          airportName={reportTarget.name}
          defaultFuelType={fuelType}
        />
      )}
    </div>
  );
}
