"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePlannerStore, type HomeAirport } from "@/store/planner-store";

type AirportPayload = {
  icao: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  distanceNm?: number;
};

type IpApiPayload = {
  latitude?: number;
  longitude?: number;
  error?: boolean;
};

async function fetchNearest(
  lat: number,
  lon: number
): Promise<AirportPayload | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
  });
  const res = await fetch(`/api/airports/nearest?${params}`);
  if (!res.ok) return null;
  return (await res.json()) as AirportPayload;
}

function toHome(
  data: AirportPayload,
  source: HomeAirport["source"]
): HomeAirport {
  return {
    icao: data.icao,
    name: data.name,
    city: data.city,
    state: data.state,
    latitude: data.latitude,
    longitude: data.longitude,
    elevation: data.elevation,
    distanceNm: data.distanceNm,
    source,
  };
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 8_000,
      maximumAge: 300_000,
    });
  });
}

async function coordsFromIp(): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch("https://ipapi.co/json/", {
      signal: AbortSignal.timeout(6_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as IpApiPayload;
    if (
      data.error ||
      data.latitude == null ||
      data.longitude == null ||
      !Number.isFinite(data.latitude) ||
      !Number.isFinite(data.longitude)
    ) {
      return null;
    }
    return { lat: data.latitude, lon: data.longitude };
  } catch {
    return null;
  }
}

/**
 * On first mount: geolocate (fallback ipapi.co) → nearest airport → home.
 * Skips if the user already picked an airport manually.
 */
export function useDetectHomeAirport() {
  const home = usePlannerStore((s) => s.homeAirport);
  const setHomeAirportStatus = usePlannerStore((s) => s.setHomeAirportStatus);
  const setHomeAirport = usePlannerStore((s) => s.setHomeAirport);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    // Only auto-detect while still on the bootstrap default (KPHX).
    if (home.source === "geolocation" || home.source === "ip") return;
    if (home.icao !== "KPHX") return;
    ran.current = true;

    let cancelled = false;

    (async () => {
      setHomeAirportStatus("detecting");
      try {
        let lat: number | null = null;
        let lon: number | null = null;
        let source: HomeAirport["source"] = "ip";

        try {
          const pos = await getCurrentPosition();
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
          source = "geolocation";
        } catch {
          const ip = await coordsFromIp();
          if (ip) {
            lat = ip.lat;
            lon = ip.lon;
            source = "ip";
          }
        }

        if (cancelled || lat == null || lon == null) {
          setHomeAirportStatus("ready");
          return;
        }

        const nearest = await fetchNearest(lat, lon);
        if (cancelled || !nearest) {
          setHomeAirportStatus("ready");
          return;
        }

        // Don't overwrite a manual selection made while we were detecting.
        const current = usePlannerStore.getState().homeAirport;
        if (current.source === "manual" && current.icao !== "KPHX") {
          setHomeAirportStatus("ready");
          return;
        }

        setHomeAirport(toHome(nearest, source));
        setHomeAirportStatus("ready");
      } catch {
        if (!cancelled) setHomeAirportStatus("ready");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [home.icao, home.source, setHomeAirport, setHomeAirportStatus]);
}

/**
 * Look up an ICAO and recenter the live map / ticker on that field.
 */
export function useGoToAirport() {
  const goToAirport = usePlannerStore((s) => s.goToAirport);

  return useCallback(
    async (icaoRaw: string) => {
      const icao = icaoRaw.trim().toUpperCase();
      if (icao.length < 3) return;
      try {
        const res = await fetch(`/api/airports/${encodeURIComponent(icao)}`);
        if (!res.ok) return;
        const data = (await res.json()) as AirportPayload;
        if (data.latitude == null || data.longitude == null) return;
        const airport: HomeAirport = {
          icao: data.icao,
          name: data.name,
          city: data.city,
          state: data.state,
          latitude: data.latitude,
          longitude: data.longitude,
          elevation: data.elevation,
          source: "manual",
        };
        goToAirport(airport);
      } catch {
        /* ignore lookup errors */
      }
    },
    [goToAirport]
  );
}
