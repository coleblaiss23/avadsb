"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { altitudeRainbowColor } from "@/lib/adsb-colors";
import {
  isAircraftOnGround,
  silhouetteSize,
  silhouetteSvgMarkup,
  SILHOUETTE_STYLE,
} from "@/lib/aircraft-silhouettes";
import type { LiveAircraft } from "@/lib/traffic";
import { SITE_NAME } from "@/lib/site";

const ESRI_DARK_BASE =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
const ESRI_DARK_REF =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}";

type TrackPayload =
  | {
      ok: true;
      expired: false;
      share: {
        id: string;
        tailNumber: string;
        label: string | null;
        expiresAt: string;
      };
      aircraft: LiveAircraft | null;
      trail: [number, number][];
      status: "airborne" | "ground" | "not_seen";
      source: string;
      fetchedAt: string;
    }
  | { ok: false; expired: true; error: string };

function buildIcon(ac: LiveAircraft): L.DivIcon {
  const style = SILHOUETTE_STYLE[ac.category];
  const { width: pxW, height: pxH } = silhouetteSize(ac.category, 1.15);
  const fill = altitudeRainbowColor(ac.alt_baro);
  const rot = style.noRotate ? 0 : (ac.track ?? 0);
  const svg = silhouetteSvgMarkup(
    ac.category,
    fill,
    Math.max(pxW, pxH),
    "#0a0a0a"
  );
  const label = ac.flight || ac.registration || ac.hex.toUpperCase();
  const html = `<div class="afm-ac-wrap is-selected"><div class="afm-ac ${style.className}${isAircraftOnGround(ac.alt_baro) ? " afm-ac--ground" : ""}" style="--ac-rot:${rot}deg;width:${pxW}px;height:${pxH}px">${svg}</div><span class="afm-ac-label">${escapeHtml(label)}</span></div>`;
  const w = Math.max(pxW, label.length * 6.2 + 8);
  const h = pxH + 14;
  return L.divIcon({
    className: "afm-ac-marker",
    html,
    iconSize: [w, h],
    iconAnchor: [w / 2, pxH / 2],
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtAlt(ft: number | null): string {
  if (ft == null) return "—";
  if (ft === 0) return "On ground";
  return `${Math.round(ft).toLocaleString()} ft`;
}

function FollowOne({
  aircraft,
}: {
  aircraft: LiveAircraft | null;
}) {
  const map = useMap();
  const lat = aircraft?.lat;
  const lon = aircraft?.lon;
  const hex = aircraft?.hex;
  useEffect(() => {
    if (lat == null || lon == null) return;
    map.panTo([lat, lon], { animate: true, duration: 0.5 });
  }, [map, lat, lon, hex]);
  return null;
}

export function TrackFlightView({ token }: { token: string }) {
  const [data, setData] = useState<TrackPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer = 0;

    async function poll() {
      try {
        const res = await fetch(`/api/track/${encodeURIComponent(token)}`, {
          cache: "no-store",
        });
        const json = (await res.json()) as TrackPayload;
        if (cancelled) return;
        setData(json);
        setError(null);
        if (json.ok) {
          timer = window.setTimeout(poll, 8_000);
        }
      } catch {
        if (cancelled) return;
        setError("Could not load this tracking link.");
        timer = window.setTimeout(poll, 12_000);
      }
    }

    void poll();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [token]);

  const aircraft = data && data.ok ? data.aircraft : null;
  const trail = useMemo(
    () => (data && data.ok ? data.trail : []),
    [data]
  );
  const center = useMemo<[number, number]>(() => {
    if (aircraft) return [aircraft.lat, aircraft.lon];
    if (trail.length > 0) return trail[trail.length - 1]!;
    return [33.43, -112.0]; // CONUS fallback until first fix
  }, [aircraft, trail]);

  const icon = useMemo(
    () => (aircraft ? buildIcon(aircraft) : null),
    [aircraft]
  );

  if (data && !data.ok) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--ink)] px-6 text-center">
        <p className="font-display text-2xl font-semibold text-slate-100">
          Tracking link expired
        </p>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
          {data.error}
        </p>
        <p className="mt-8 text-xs text-slate-600">{SITE_NAME}</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--ink)] px-6 text-center">
        <p className="text-sm text-slate-400">{error}</p>
      </div>
    );
  }

  const share = data && data.ok ? data.share : null;
  const status = data && data.ok ? data.status : "not_seen";

  return (
    <div className="relative flex min-h-dvh flex-col bg-[var(--ink)] text-[var(--ink-text)]">
      <header className="z-20 border-b border-[var(--ink-border)] bg-[var(--ink-panel)] px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
          {SITE_NAME} · private flight track
        </p>
        <h1 className="mt-0.5 font-mono text-xl font-bold text-slate-50">
          {share?.tailNumber ?? "…"}
        </h1>
        {share?.label ? (
          <p className="mt-0.5 text-sm text-slate-400">{share.label}</p>
        ) : null}
      </header>

      <div className="relative min-h-0 flex-1">
        <MapContainer
          center={center}
          zoom={9}
          className="h-[min(70dvh,36rem)] w-full md:h-full md:min-h-[28rem]"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url={ESRI_DARK_BASE} />
          <TileLayer url={ESRI_DARK_REF} opacity={0.85} />
          <ZoomControl position="bottomright" />
          <FollowOne aircraft={aircraft} />
          {trail.length >= 2 && (
            <Polyline
              positions={trail}
              pathOptions={{
                color: altitudeRainbowColor(aircraft?.alt_baro ?? null),
                weight: 2.5,
                opacity: 0.8,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          )}
          {aircraft && icon && (
            <Marker position={[aircraft.lat, aircraft.lon]} icon={icon} />
          )}
        </MapContainer>

        <aside className="border-t border-[var(--ink-border)] bg-[var(--ink-panel)] px-4 py-4 md:absolute md:bottom-4 md:left-4 md:z-20 md:w-72 md:rounded-sm md:border md:shadow-lg">
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-slate-500">
                Status
              </dt>
              <dd className="font-medium text-slate-100">
                {status === "airborne"
                  ? "Airborne"
                  : status === "ground"
                    ? "On ground"
                    : "Waiting for signal"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-slate-500">
                Altitude
              </dt>
              <dd className="font-mono tabular-nums text-slate-100">
                {fmtAlt(aircraft?.alt_baro ?? null)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-slate-500">
                Groundspeed
              </dt>
              <dd className="font-mono tabular-nums text-slate-100">
                {aircraft?.gs != null ? `${Math.round(aircraft.gs)} kt` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-slate-500">
                Track
              </dt>
              <dd className="font-mono tabular-nums text-slate-100">
                {aircraft?.track != null
                  ? `${String(Math.round(aircraft.track)).padStart(3, "0")}°`
                  : "—"}
              </dd>
            </div>
          </dl>
          {share ? (
            <p className="mt-3 text-[10px] leading-snug text-slate-500">
              Expires {new Date(share.expiresAt).toLocaleString()}. This page
              shows only this flight — no other traffic.
            </p>
          ) : (
            <p className="mt-3 text-[10px] text-slate-500">Loading…</p>
          )}
        </aside>
      </div>
    </div>
  );
}
