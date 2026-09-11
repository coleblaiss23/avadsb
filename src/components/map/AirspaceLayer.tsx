"use client";

import { useEffect, useMemo, useState } from "react";
import { Marker, Polygon, useMap, useMapEvents } from "react-leaflet";
import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import {
  airspaceAltLabel,
  airspacePathOptions,
  isAirspaceClass,
  type AirspaceCollection,
  type AirspaceFeature,
} from "@/lib/airspace";

/** Altitude labels appear once the pilot is in a local / approach view. */
const LABEL_ZOOM = 10;
const MAX_POLYGONS = 400;
const MAX_LABELS = 40;

const labelIconCache = new Map<string, L.DivIcon>();

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function labelIcon(text: string, cls: string): L.DivIcon {
  const key = `${cls}:${text}`;
  const cached = labelIconCache.get(key);
  if (cached) return cached;
  const width = Math.max(52, text.length * 6.4 + 12);
  const icon = L.divIcon({
    className: "afm-airspace-label-marker",
    html: `<span class="afm-airspace-label afm-airspace-label--${cls}">${escapeHtml(text)}</span>`,
    iconSize: [width, 16],
    iconAnchor: [width / 2, 8],
  });
  labelIconCache.set(key, icon);
  return icon;
}

function ringCentroid(ring: number[][]): [number, number] | null {
  if (!ring.length) return null;
  let x = 0;
  let y = 0;
  let n = 0;
  for (const pt of ring) {
    const lon = pt[0];
    const lat = pt[1];
    if (lon == null || lat == null) continue;
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    x += lon;
    y += lat;
    n += 1;
  }
  if (n === 0) return null;
  return [y / n, x / n];
}

function featureCentroid(f: AirspaceFeature): [number, number] | null {
  const g = f.geometry;
  if (g.type === "Polygon") {
    const ring = g.coordinates[0];
    return ring ? ringCentroid(ring as number[][]) : null;
  }
  const first = g.coordinates[0]?.[0];
  return first ? ringCentroid(first as number[][]) : null;
}

function toLatLngRings(
  f: AirspaceFeature
): [number, number][][][] {
  // Leaflet Polygon wants LatLngExpression[] | LatLngExpression[][]
  // We return an array of polygons, each an array of rings as [lat,lon][]
  if (f.geometry.type === "Polygon") {
    return [
      (f.geometry.coordinates as number[][][]).map((ring) =>
        ring.map(([lon, lat]) => [lat, lon] as [number, number])
      ),
    ];
  }
  return (f.geometry.coordinates as number[][][][]).map((poly) =>
    poly.map((ring) =>
      ring.map(([lon, lat]) => [lat, lon] as [number, number])
    )
  );
}

async function fetchAirspace(): Promise<AirspaceCollection> {
  const res = await fetch("/data/class-airspace.json", { cache: "force-cache" });
  if (!res.ok) throw new Error("Airspace catalog unavailable");
  const data = (await res.json()) as AirspaceCollection;
  if (!data || data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
    throw new Error("Invalid airspace catalog");
  }
  return data;
}

function EnsureAirspacePane() {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane("airspace")) {
      const pane = map.createPane("airspace");
      pane.style.zIndex = "330";
      pane.style.pointerEvents = "none";
    }
    if (!map.getPane("airspace-labels")) {
      const pane = map.createPane("airspace-labels");
      pane.style.zIndex = "335";
      pane.style.pointerEvents = "none";
    }
  }, [map]);
  return null;
}

function featureIntersectsBounds(f: AirspaceFeature, bounds: L.LatLngBounds): boolean {
  const g = f.geometry;
  const rings: number[][][] =
    g.type === "Polygon"
      ? (g.coordinates as number[][][])
      : (g.coordinates as number[][][][]).flat();
  for (const ring of rings) {
    for (const pt of ring) {
      const lon = pt[0];
      const lat = pt[1];
      if (lon == null || lat == null) continue;
      if (bounds.contains(L.latLng(lat, lon))) return true;
    }
  }
  // Also keep if the map view sits inside a large shelf (e.g. Class B outer ring)
  const c = featureCentroid(f);
  if (c && bounds.contains(L.latLng(c[0], c[1]))) return true;
  return false;
}

/**
 * Static FAA Class B/C/D (+ surface E) outlines — loaded once from bundled GeoJSON.
 */
export function AirspaceLayer({ enabled }: { enabled: boolean }) {
  const map = useMap();
  const [bounds, setBounds] = useState(() => map.getBounds());
  const [zoom, setZoom] = useState(() => map.getZoom());

  useMapEvents({
    moveend: () => {
      setBounds(map.getBounds());
      setZoom(map.getZoom());
    },
    zoomend: () => {
      setBounds(map.getBounds());
      setZoom(map.getZoom());
    },
  });

  const query = useQuery({
    queryKey: ["class-airspace"],
    queryFn: fetchAirspace,
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });

  const visible = useMemo(() => {
    if (!enabled || !query.data) return [] as AirspaceFeature[];
    const ranked = query.data.features
      .filter((f) => isAirspaceClass(f.properties?.class))
      .filter((f) => featureIntersectsBounds(f, bounds))
      .sort((a, b) => {
        const order = { B: 0, C: 1, D: 2, E: 3 } as const;
        return order[a.properties.class] - order[b.properties.class];
      });
    return ranked.slice(0, MAX_POLYGONS);
  }, [enabled, query.data, bounds]);

  const labels = useMemo(() => {
    if (!enabled || zoom < LABEL_ZOOM) return [];
    const out: { key: string; lat: number; lon: number; text: string; cls: string }[] = [];
    for (const f of visible) {
      if (out.length >= MAX_LABELS) break;
      if (f.properties.class === "E" && zoom < 11) continue;
      const c = featureCentroid(f);
      if (!c) continue;
      if (!bounds.contains(L.latLng(c[0], c[1]))) continue;
      out.push({
        key: `${f.properties.ident ?? f.properties.name ?? "x"}-${f.properties.class}-${c[0].toFixed(3)}`,
        lat: c[0],
        lon: c[1],
        text: airspaceAltLabel(f.properties),
        cls: f.properties.class,
      });
    }
    return out;
  }, [enabled, visible, zoom, bounds]);

  if (!enabled) return null;

  return (
    <>
      <EnsureAirspacePane />
      {visible.map((f, idx) => {
        const polys = toLatLngRings(f);
        const opts = airspacePathOptions(f.properties.class);
        return polys.map((rings, pi) => (
          <Polygon
            key={`as-${f.properties.class}-${f.properties.ident ?? f.properties.name ?? idx}-${pi}`}
            positions={rings}
            pathOptions={opts}
            pane="airspace"
          />
        ));
      })}
      {labels.map((lab) => (
        <Marker
          key={lab.key}
          position={[lab.lat, lab.lon]}
          icon={labelIcon(lab.text, lab.cls)}
          interactive={false}
          pane="airspace-labels"
        />
      ))}
    </>
  );
}
