"use client";

import { useEffect, useMemo, useState } from "react";
import { Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useExtrapolatedAircraft } from "@/hooks/use-extrapolated-aircraft";
import {
  altitudeRainbowBand,
  altitudeRainbowColor,
} from "@/lib/adsb-colors";
import {
  isAircraftOnGround,
  silhouetteSize,
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
  const { width: pxW, height: pxH } = silhouetteSize(category, zoomScale);
  const rot = style.noRotate ? 0 : trackDeg != null ? trackDeg : 0;
  const fill = altitudeRainbowColor(altBaro);
  const grounded = isAircraftOnGround(altBaro);
  const svg = silhouetteSvgMarkup(
    category,
    fill,
    Math.max(pxW, pxH),
    "#0a0a0a"
  );
  const labelHtml = label
    ? `<span class="afm-ac-label">${escapeHtml(label)}</span>`
    : "";
  const html = `<div class="afm-ac-wrap${selected ? " is-selected" : ""}"><div class="afm-ac ${style.className}${grounded ? " afm-ac--ground" : ""}" style="--ac-rot:${rot}deg;width:${pxW}px;height:${pxH}px">${svg}</div>${labelHtml}</div>`;

  const labelW = label ? Math.max(pxW, label.length * 6.2 + 8) : pxW;
  const labelH = label ? 14 : 0;
  const w = Math.ceil(labelW);
  const h = pxH + labelH;
  return L.divIcon({
    className: "afm-ac-marker",
    html,
    iconSize: [w, h],
    iconAnchor: [w / 2, pxH / 2],
    popupAnchor: [0, -pxH / 2],
  });
}

function pointerStillInsideMarker(e: L.LeafletMouseEvent): boolean {
  const markerEl = e.target.getElement();
  const next = e.originalEvent.relatedTarget;
  return (
    !!markerEl && next instanceof Node && markerEl.contains(next)
  );
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
  onHover,
}: {
  ac: LiveAircraft;
  pinned: boolean;
  showLabel: boolean;
  onPin: (ac: LiveAircraft) => void;
  onUnpin: () => void;
  onHover: (ac: LiveAircraft | null) => void;
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
        mouseover: (e) => {
          if (pointerStillInsideMarker(e)) return;
          e.target.getElement()?.classList.add("is-hovered");
          onHover(ac);
        },
        mouseout: (e) => {
          if (pointerStillInsideMarker(e)) return;
          e.target.getElement()?.classList.remove("is-hovered");
          onHover(null);
        },
      }}
    />
  );
}

type TrafficRadarLayerProps = {
  aircraft: LiveAircraft[];
  selectedHex?: string | null;
  onSelect?: (ac: LiveAircraft | null) => void;
  /** Preview the info tile. Null when the pointer leaves the aircraft. */
  onHover?: (ac: LiveAircraft | null) => void;
  /** Show callsign / reg labels at/above this zoom. */
  labelMinZoom?: number;
};

/**
 * Live traffic radar: altitude colors, zoom labels, pin/hover.
 * Flight paths are drawn by the parent when an aircraft is selected.
 */
export function TrafficRadarLayer({
  aircraft,
  selectedHex,
  onSelect,
  onHover,
  labelMinZoom = 9,
}: TrafficRadarLayerProps) {
  const map = useMap();
  const [bounds, setBounds] = useState(() => map.getBounds());
  const [zoom, setZoom] = useState(() => map.getZoom());
  const [pinnedHex, setPinnedHex] = useState<string | null>(
    selectedHex?.toLowerCase() ?? null
  );
  const moving = useExtrapolatedAircraft(aircraft, true);

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
    // Marker mouseout is unreliable when the icon is rebuilt or the target moves.
    mousemove: (e) => {
      const el = e.originalEvent.target;
      if (!(el instanceof Element) || !el.closest(".afm-ac-marker")) {
        onHover?.(null);
      }
    },
    mouseout: (e) => {
      const next = e.originalEvent.relatedTarget;
      const container = map.getContainer();
      if (!(next instanceof Node) || !container.contains(next)) {
        onHover?.(null);
      }
    },
  });

  const showLabels = zoom >= labelMinZoom;
  // Cap density at low zoom to reduce clutter
  const maxVisible = zoom < 7 ? 120 : zoom < 9 ? 220 : 500;

  const visible = useMemo(() => {
    const sel = pinnedHex;
    const inView = moving.filter((ac) => {
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
  }, [moving, bounds, pinnedHex, maxVisible]);

  return (
    <>
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
          onHover={(plane) => onHover?.(plane)}
          onUnpin={() => {
            setPinnedHex(null);
            onSelect?.(null);
          }}
        />
      ))}
    </>
  );
}
