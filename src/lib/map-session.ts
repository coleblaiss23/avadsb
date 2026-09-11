import type { HomeAirport } from "@/store/planner-store";

const STORAGE_KEY = "avadsb.map-session";

/** Phoenix metro — first-visit map frame. Not a selected airport. */
export const PHOENIX_MSA = {
  lat: 33.4484,
  lng: -112.074,
  zoom: 8,
};

export type MapSession = {
  lat: number;
  lng: number;
  zoom: number;
  originIcao: string;
  destinationIcao: string;
  /** Set only when the user searched an airport. Never the bootstrap default. */
  pinned: HomeAirport | null;
};

export function loadMapSession(): MapSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<MapSession>;
    if (
      typeof data.lat !== "number" ||
      typeof data.lng !== "number" ||
      typeof data.zoom !== "number" ||
      !Number.isFinite(data.lat) ||
      !Number.isFinite(data.lng)
    ) {
      return null;
    }
    return {
      lat: data.lat,
      lng: data.lng,
      zoom: data.zoom,
      originIcao: typeof data.originIcao === "string" ? data.originIcao : "",
      destinationIcao:
        typeof data.destinationIcao === "string" ? data.destinationIcao : "",
      pinned: data.pinned?.icao ? data.pinned : null,
    };
  } catch {
    return null;
  }
}

export function saveMapSession(session: MapSession): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* private mode / quota */
  }
}
