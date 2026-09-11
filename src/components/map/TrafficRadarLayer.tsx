"use client";

import { useEffect, useMemo, useState } from "react";
import { Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useAircraftTrails } from "@/hooks/use-aircraft-trails";
import {
  altitudeRainbowBand,
  altitudeRainbowColor,
} from "@/lib/adsb-colors";
import {
  isAircraftOnGround,
  silhouetteSvgMarkup,
  SILHOUETTE_STYLE,
  type AircraftSilhouette,
} from "@/lib/aircraft-silhouettes";
import type { LiveAircraft } from "@/lib/traffic";

function buildAircraftIcon(
  category: AircraftSilhouette,
  trackDeg: number | null,
  altBaro: number | null,
  label: string | null,
  selected: boolean
): L.DivIcon {
  const style = SILHOUETTE_STYLE[category];
  const zoomScale = selected ? 1.15 : 1;
  const px = Math.round(style.iconPx * zoomScale);
  const rot = trackDeg != null ? trackDeg : 0;
  const fill = altitudeRainbowColor(altBaro);
  const grounded = isAircraftOnGround(altBaro);
  const svg = silhouetteSvgMarkup(category, fill, px, "#0a0a0a");
  const labelHtml = label
    ? `<span class="afm-ac-label">${escapeHtml(label)}</span>`
    : "";
  const html = `<div class="afm-ac-wrap${selected ? " is-selected" : ""}"><div class="afm-ac ${style.className}${grounded ? " afm-ac--ground" : ""}" style="--ac-rot:${rot}deg;width:${px}px;height:${px}px">${svg}</div>${labelHtml}</div>`;

  const labelW = label ? Math.max(px, label.length * 6.2 + 8) : px;
  const labelH = label ? 14 : 0;
  const w = Math.ceil(labelW);
  const h = px + labelH;
  return L.divIcon({
    className: "afm-ac-marker",
    html,
    iconSize: [w, h],
    iconAnchor: [w / 2, px / 2],
    popupAnchor: [0, -px / 2],
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function AircraftMarker({
  ac,
  pinned,
  showLabel,
  onPin,
}: {
  ac: LiveAircraft;
  pinned: boolean;
  showLabel: boolean;
  onPin: (ac: LiveAircraft) => void;
  onUnpin: () => void;
}) {
  const label =
    showLabel || pinned
      ? ac.flight || ac.registration || ac.hex.toUpperCase()
      : null;

  const icon = useMemo(
    () =>
      buildAircraftIcon(ac.category, ac.track, ac.alt_baro, label, pinned),
    [ac.category, ac.track, ac.alt_baro, label, pinned]
  );

  return (
    <Marker
      position={[ac.lat, ac.lon]}
      icon={icon}
      zIndexOffset={
        pinned ? 900 : isAircraftOnGround(ac.alt_baro) ? 200 : 400
      }
      eventHandlers={{
        click: (e) => {
          L.DomEvent.stopPropagation(e.originalEvent);
          onPin(ac);
        },
      }}
    />
  );
}

type TrafficRadarLayerProps = {
  aircraft: LiveAircraft[];
  selectedHex?: string | null;
  onSelect?: (ac: LiveAircraft | null) => void;
  /** Draw fading position history (ADSBX-style). */
  showTrails?: boolean;
  /** Show callsign / reg labels at/above this zoom. */
  labelMinZoom?: number;
};

/**
 * ADS-B Exchange–style radar: altitude colors, trails, zoom labels, pin/hover.
 */
export function TrafficRadarLayer({
  aircraft,
  selectedHex,
  onSelect,
  showTrails = true,
  labelMinZoom = 9,
}: TrafficRadarLayerProps) {
  const map = useMap();
  const [bounds, setBounds] = useState(() => map.getBounds());
  const [zoom, setZoom] = useState(() => map.getZoom());
  const [pinnedHex, setPinnedHex] = useState<string | null>(
    selectedHex?.toLowerCase() ?? null
  );
  const trails = useAircraftTrails(aircraft, showTrails);

  useEffect(() => {
    setPinnedHex(selectedHex?.toLowerCase() ?? null);
  }, [selectedHex]);

  useEffect(() => {
    const sync = () => {
      const next = map.getBounds();
      setZoom(map.getZoom());
      setBounds((prev) => {
        const same =
          prev.getSouth().toFixed(5) === next.getSouth().toFixed(5) &&
          prev.getWest().toFixed(5) === next.getWest().toFixed(5) &&
          prev.getNorth().toFixed(5) === next.getNorth().toFixed(5) &&
          prev.getEast().toFixed(5) === next.getEast().toFixed(5);
        return same ? prev : next;
      });
    };
    sync();
    map.on("moveend", sync);
    map.on("zoomend", sync);
    return () => {
      map.off("moveend", sync);
      map.off("zoomend", sync);
    };
  }, [map]);

  useMapEvents({
    click: () => {
      if (!pinnedHex && !selectedHex) return;
      setPinnedHex(null);
      onSelect?.(null);
    },
  });

  const showLabels = zoom >= labelMinZoom;
  // Cap density at low zoom like tar1090 declutter
  const maxVisible = zoom < 7 ? 120 : zoom < 9 ? 220 : 500;

  const visible = useMemo(() => {
    const sel = pinnedHex;
    const inView = aircraft.filter((ac) => {
      if (!Number.isFinite(ac.lat) || !Number.isFinite(ac.lon)) return false;
      if (sel && ac.hex === sel) return true;
      return bounds.contains(L.latLng(ac.lat, ac.lon));
    });
    if (inView.length <= maxVisible) return inView;
    // Prefer selected + airborne when decluttering
    const selected = sel ? inView.filter((a) => a.hex === sel) : [];
    const rest = inView
      .filter((a) => a.hex !== sel)
      .sort((a, b) => (b.alt_baro ?? 0) - (a.alt_baro ?? 0));
    return [...selected, ...rest.slice(0, maxVisible - selected.length)];
  }, [aircraft, bounds, pinnedHex, maxVisible]);

  return (
    <>
      {showTrails &&
        visible.map((ac) => {
          const pts = trails.get(ac.hex);
          if (!pts || pts.length < 2) return null;
          const color = altitudeRainbowColor(ac.alt_baro);
          return (
            <Polyline
              key={`trail-${ac.hex}`}
              positions={pts}
              pathOptions={{
                color,
                weight: pinnedHex === ac.hex ? 2.5 : 1.4,
                opacity: pinnedHex === ac.hex ? 0.85 : 0.45,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          );
        })}
      {visible.map((ac) => (
        <AircraftMarker
          key={`${ac.hex}-${altitudeRainbowBand(ac.alt_baro)}-${showLabels || pinnedHex === ac.hex ? "L" : "N"}`}
          ac={ac}
          pinned={pinnedHex === ac.hex}
          showLabel={showLabels || pinnedHex === ac.hex}
          onPin={(plane) => {
            map.closePopup();
            setPinnedHex(plane.hex);
            onSelect?.(plane);
          }}
          onUnpin={() => {
            setPinnedHex(null);
            onSelect?.(null);
          }}
        />
      ))}
    </>
  );
}
