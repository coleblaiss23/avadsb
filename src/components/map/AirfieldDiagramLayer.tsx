"use client";

import { useEffect, useMemo, useState } from "react";
import { Marker, Polygon, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import {
  pavementLabels,
  runwayPolygon,
  type AirfieldPavement,
  type PavementLabel,
} from "@/lib/airfield";

/** Diagram appears once the field fills the scope — not on the regional view. */
const DIAGRAM_ZOOM = 14;
const TAXIWAY_LABEL_ZOOM = 15;
const ESRI_IMAGERY =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

type BBox = { south: number; west: number; north: number; east: number };

const iconCache = new Map<string, L.DivIcon>();

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function labelIcon(text: string, kind: "runway" | "taxiway"): L.DivIcon {
  const key = `${kind}:${text}`;
  const cached = iconCache.get(key);
  if (cached) return cached;
  const cls = kind === "runway" ? "afm-rwy-label" : "afm-twy-label";
  const width = Math.max(22, text.length * (kind === "runway" ? 9 : 8) + 10);
  const icon = L.divIcon({
    className: "afm-pavement-marker",
    html: `<span class="${cls}">${escapeHtml(text)}</span>`,
    iconSize: [width, 18],
    iconAnchor: [width / 2, 9],
  });
  iconCache.set(key, icon);
  return icon;
}

function padBox(box: BBox, fraction: number): BBox {
  const latPad = (box.north - box.south) * fraction;
  const lonPad = (box.east - box.west) * fraction;
  return {
    south: box.south - latPad,
    north: box.north + latPad,
    west: box.west - lonPad,
    east: box.east + lonPad,
  };
}

function covers(outer: BBox, inner: BBox): boolean {
  return (
    outer.south <= inner.south &&
    outer.north >= inner.north &&
    outer.west <= inner.west &&
    outer.east >= inner.east
  );
}

function declutter(labels: PavementLabel[], map: L.Map, minPx: number): PavementLabel[] {
  const ranked = [...labels].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "runway" ? -1 : 1;
    return b.text.length - a.text.length;
  });
  const kept: { x: number; y: number; text: string; kind: PavementLabel["kind"] }[] = [];
  const out: PavementLabel[] = [];
  for (const label of ranked) {
    const pt = map.latLngToContainerPoint([label.lat, label.lon]);
    const hit = kept.some((prev) => {
      const dist = Math.hypot(prev.x - pt.x, prev.y - pt.y);
      if (label.kind === "runway" && prev.kind === "runway" && prev.text === label.text) {
      return dist < 72;
    }
    if (label.kind === "runway" && prev.kind === "runway") return dist < 26;
      if (prev.text === label.text) return dist < minPx;
      return dist < minPx * 0.55;
    });
    if (hit) continue;
    kept.push({ x: pt.x, y: pt.y, text: label.text, kind: label.kind });
    out.push(label);
  }
  return out;
}

function EnsureAirfieldPanes() {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane("airfield")) {
      const pane = map.createPane("airfield");
      pane.style.zIndex = "410";
      pane.style.pointerEvents = "none";
    }
    if (!map.getPane("airfield-labels")) {
      const pane = map.createPane("airfield-labels");
      pane.style.zIndex = "450";
      pane.style.pointerEvents = "none";
    }
  }, [map]);
  return null;
}

export function AirfieldDiagramLayer() {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  const [features, setFeatures] = useState<AirfieldPavement[]>([]);
  const [visibleLabels, setVisibleLabels] = useState<PavementLabel[]>([]);

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  useEffect(() => {
    let timer = 0;
    let abort: AbortController | null = null;
    let loaded: BBox | null = null;

    const load = () => {
      const z = map.getZoom();
      setZoom(z);
      if (z < DIAGRAM_ZOOM) {
        window.clearTimeout(timer);
        abort?.abort();
        setFeatures([]);
        setVisibleLabels([]);
        loaded = null;
        return;
      }
      const bounds = map.getBounds();
      const view: BBox = {
        south: bounds.getSouth(),
        west: bounds.getWest(),
        north: bounds.getNorth(),
        east: bounds.getEast(),
      };
      if (loaded && covers(loaded, view)) return;

      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const requestBox = padBox(view, 0.18);
        abort?.abort();
        abort = new AbortController();
        const params = new URLSearchParams({
          south: requestBox.south.toFixed(5),
          west: requestBox.west.toFixed(5),
          north: requestBox.north.toFixed(5),
          east: requestBox.east.toFixed(5),
        });
        fetch(`/api/airfield?${params}`, { signal: abort.signal })
          .then((res) => (res.ok ? res.json() : Promise.reject(new Error("airfield"))))
          .then((json: { features?: AirfieldPavement[] }) => {
            loaded = requestBox;
            setFeatures(Array.isArray(json.features) ? json.features : []);
          })
          .catch((err: unknown) => {
            if (err instanceof DOMException && err.name === "AbortError") return;
          });
      }, 280);
    };

    load();
    map.on("moveend", load);
    return () => {
      window.clearTimeout(timer);
      abort?.abort();
      map.off("moveend", load);
    };
  }, [map]);

  const labels = useMemo(() => pavementLabels(features), [features]);

  useEffect(() => {
    const place = () => {
      const z = map.getZoom();
      if (z < DIAGRAM_ZOOM || labels.length === 0) {
        setVisibleLabels([]);
        return;
      }
      const minPx = z >= 17 ? 36 : z >= 16 ? 56 : 84;
      const pool =
        z >= TAXIWAY_LABEL_ZOOM ? labels : labels.filter((label) => label.kind === "runway");
      const next = declutter(pool, map, minPx);
      setVisibleLabels((prev) =>
        prev.length === next.length && prev.every((item, i) => item.id === next[i]?.id)
          ? prev
          : next
      );
    };
    place();
    map.on("moveend", place);
    return () => {
      map.off("moveend", place);
    };
  }, [labels, map, zoom]);

  const runways = useMemo(
    () =>
      features
        .map((feature) => ({ feature, ring: runwayPolygon(feature) }))
        .filter((item): item is { feature: AirfieldPavement; ring: [number, number][] } =>
          item.ring != null
        ),
    [features]
  );

  const taxiways = useMemo(
    () => features.filter((feature) => feature.kind === "taxiway" && feature.path.length >= 2),
    [features]
  );

  if (zoom < DIAGRAM_ZOOM) return <EnsureAirfieldPanes />;

  return (
    <>
      <EnsureAirfieldPanes />
      <TileLayer
        attribution='Imagery &copy; Esri — Runways &amp; taxiways &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url={ESRI_IMAGERY}
        maxZoom={19}
        maxNativeZoom={19}
        opacity={zoom >= 16 ? 0.92 : 0.78}
      />
      {runways.map(({ feature, ring }) => (
        <Polygon
          key={`rwy-${feature.id}`}
          positions={ring}
          pane="airfield"
          pathOptions={{
            color: feature.closed ? "#8a8478" : "#f2efe6",
            weight: 1.25,
            opacity: 0.9,
            fillColor: feature.closed ? "#6a655c" : "#d9d4c8",
            fillOpacity: feature.closed ? 0.28 : 0.42,
            dashArray: feature.closed ? "4 5" : undefined,
          }}
        />
      ))}
      {taxiways.map((feature) => (
        <Polyline
          key={`twy-${feature.id}`}
          positions={feature.path}
          pane="airfield"
          pathOptions={{
            color: "#e0b15a",
            weight: zoom >= 16 ? 2.5 : 1.75,
            opacity: 0.9,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      ))}
      {visibleLabels.map((label) => (
        <Marker
          key={label.id}
          position={[label.lat, label.lon]}
          icon={labelIcon(label.text, label.kind)}
          pane="airfield-labels"
          interactive={false}
          keyboard={false}
        />
      ))}
    </>
  );
}
