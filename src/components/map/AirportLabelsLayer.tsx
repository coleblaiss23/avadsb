"use client";

import { useEffect, useMemo, useState } from "react";
import { Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

/** ICAO tags fade in once the view is local enough to read them. */
const LABEL_ZOOM = 9;
const MAX_LABELS = 70;

type AirportMapLabel = {
  icao: string;
  latitude: number;
  longitude: number;
  type: string;
  runwayLength: number;
};

type BBox = { south: number; west: number; north: number; east: number };

const iconCache = new Map<string, L.DivIcon>();

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function icaoIcon(icao: string): L.DivIcon {
  const cached = iconCache.get(icao);
  if (cached) return cached;
  const width = Math.max(28, icao.length * 7.2 + 10);
  const icon = L.divIcon({
    className: "afm-icao-label-marker",
    html: `<span class="afm-icao-label">${escapeHtml(icao)}</span>`,
    iconSize: [width, 16],
    iconAnchor: [width / 2, 8],
  });
  iconCache.set(icao, icon);
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

function minRunwayForZoom(zoom: number): number {
  if (zoom >= 13) return 0;
  if (zoom >= 11) return 2500;
  if (zoom >= 10) return 4000;
  return 5500;
}

function maxLabelsForZoom(zoom: number): number {
  if (zoom >= 13) return MAX_LABELS;
  if (zoom >= 11) return 48;
  if (zoom >= 10) return 28;
  return 16;
}

function declutter(
  airports: AirportMapLabel[],
  map: L.Map,
  minPx: number,
  exclude: Set<string>,
  limit: number
): AirportMapLabel[] {
  const kept: { x: number; y: number }[] = [];
  const out: AirportMapLabel[] = [];
  for (const airport of airports) {
    if (exclude.has(airport.icao)) continue;
    const pt = map.latLngToContainerPoint([
      airport.latitude,
      airport.longitude,
    ]);
    if (kept.some((prev) => Math.hypot(prev.x - pt.x, prev.y - pt.y) < minPx)) {
      continue;
    }
    kept.push({ x: pt.x, y: pt.y });
    out.push(airport);
    if (out.length >= limit) break;
  }
  return out;
}

function EnsureAirportLabelPane() {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane("airport-labels")) {
      const pane = map.createPane("airport-labels");
      pane.style.zIndex = "440";
      pane.style.pointerEvents = "none";
    }
  }, [map]);
  return null;
}

type Props = {
  /** ICAOs already labeled elsewhere (fuel pills, home pin). */
  excludeIcaos?: Iterable<string>;
};

export function AirportLabelsLayer({ excludeIcaos }: Props) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  const [catalog, setCatalog] = useState<AirportMapLabel[]>([]);
  const [visible, setVisible] = useState<AirportMapLabel[]>([]);

  const exclude = useMemo(
    () => new Set([...(excludeIcaos ?? [])].map((c) => c.toUpperCase())),
    [excludeIcaos]
  );

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  useEffect(() => {
    let timer = 0;
    let abort: AbortController | null = null;
    let loaded: BBox | null = null;
    let loadedMinRwy = -1;

    const load = () => {
      const z = map.getZoom();
      setZoom(z);
      if (z < LABEL_ZOOM) {
        window.clearTimeout(timer);
        abort?.abort();
        setCatalog([]);
        setVisible([]);
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
      const minRunway = minRunwayForZoom(z);
      if (loaded && covers(loaded, view) && loadedMinRwy <= minRunway) {
        return;
      }

      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const requestBox = padBox(view, 0.2);
        abort?.abort();
        abort = new AbortController();
        const params = new URLSearchParams({
          south: requestBox.south.toFixed(5),
          west: requestBox.west.toFixed(5),
          north: requestBox.north.toFixed(5),
          east: requestBox.east.toFixed(5),
          minRunway: String(minRunway),
          limit: "160",
        });
        fetch(`/api/airports/bbox?${params}`, { signal: abort.signal })
          .then((res) =>
            res.ok ? res.json() : Promise.reject(new Error("bbox"))
          )
          .then((json: { airports?: AirportMapLabel[] }) => {
            loaded = requestBox;
            loadedMinRwy = minRunway;
            setCatalog(Array.isArray(json.airports) ? json.airports : []);
          })
          .catch((err: unknown) => {
            if (err instanceof DOMException && err.name === "AbortError") return;
          });
      }, 220);
    };

    load();
    map.on("moveend", load);
    return () => {
      window.clearTimeout(timer);
      abort?.abort();
      map.off("moveend", load);
    };
  }, [map]);

  useEffect(() => {
    const place = () => {
      const z = map.getZoom();
      if (z < LABEL_ZOOM || catalog.length === 0) {
        setVisible([]);
        return;
      }
      const minPx = z >= 13 ? 34 : z >= 11 ? 44 : z >= 10 ? 56 : 72;
      const next = declutter(
        catalog,
        map,
        minPx,
        exclude,
        maxLabelsForZoom(z)
      );
      setVisible((prev) =>
        prev.length === next.length &&
        prev.every((item, i) => item.icao === next[i]?.icao)
          ? prev
          : next
      );
    };
    place();
    map.on("moveend", place);
    return () => {
      map.off("moveend", place);
    };
  }, [catalog, exclude, map, zoom]);

  if (zoom < LABEL_ZOOM) return <EnsureAirportLabelPane />;

  return (
    <>
      <EnsureAirportLabelPane />
      {visible.map((airport) => (
        <Marker
          key={airport.icao}
          position={[airport.latitude, airport.longitude]}
          icon={icaoIcon(airport.icao)}
          pane="airport-labels"
          interactive={false}
          keyboard={false}
        />
      ))}
    </>
  );
}
