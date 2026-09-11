import { create } from "zustand";
import {
  AIRCRAFT_PROFILES,
  profileToSpecs,
} from "@/data/aircraft-profiles";
import { DEFAULT_HOME_AIRPORT } from "@/lib/default-home";
import {
  loadMapSession,
  PHOENIX_MSA,
  saveMapSession,
  type MapSession,
} from "@/lib/map-session";
import type {
  AircraftSpecs,
  FuelStopCandidate,
  FuelType,
  RouteOptimizationResult,
  RoutePlannerInput,
} from "@/types";

const DEFAULT_PROFILE = AIRCRAFT_PROFILES.find((p) => p.id === "c182")!;

export const DEFAULT_AIRCRAFT: AircraftSpecs = profileToSpecs(DEFAULT_PROFILE);

export type HomeAirport = {
  icao: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  distanceNm?: number;
  source: "default" | "geolocation" | "ip" | "manual";
};

export type DashboardPanel =
  | "home"
  | "fuel"
  | "atis"
  | "crosswind"
  | "hobbs"
  | "squawk"
  | "quiz";

export type HomeAirportStatus = "pending" | "detecting" | "ready";

export type FuelMapFilter = "top" | "under6" | "profitable" | "all";

interface PlannerState {
  originIcao: string;
  destinationIcao: string;
  aircraft: AircraftSpecs;
  maxDetourNm: number;
  fuelType: FuelType;
  result: RouteOptimizationResult | null;
  selectedStopIcao: string | null;
  error: string | null;
  isCalculating: boolean;
  homeAirport: HomeAirport;
  homeAirportStatus: HomeAirportStatus;
  activePanel: DashboardPanel;
  /** When true, radar only shows 7500 / 7600 / 7700 traffic. */
  emergencyTrafficOnly: boolean;
  /** How fuel stops are labeled on the map and list. */
  fuelMapFilter: FuelMapFilter;
  /** Bumps when the user searches an airport so the map recenters. */
  mapFocusNonce: number;
  /** Last map frame. Phoenix MSA until the user pans or a saved view loads. */
  mapView: { lat: number; lng: number; zoom: number };

  setOrigin: (icao: string) => void;
  setDestination: (icao: string) => void;
  setAircraft: (partial: Partial<AircraftSpecs>) => void;
  setMaxDetourNm: (nm: number) => void;
  setFuelType: (fuelType: FuelType) => void;
  setResult: (result: RouteOptimizationResult | null) => void;
  setSelectedStop: (icao: string | null) => void;
  setError: (error: string | null) => void;
  setIsCalculating: (v: boolean) => void;
  setHomeAirport: (airport: HomeAirport) => void;
  setHomeAirportStatus: (status: HomeAirportStatus) => void;
  goToAirport: (airport: HomeAirport) => void;
  setActivePanel: (panel: DashboardPanel) => void;
  setEmergencyTrafficOnly: (v: boolean) => void;
  setFuelMapFilter: (filter: FuelMapFilter) => void;
  setMapView: (view: { lat: number; lng: number; zoom: number }) => void;
  /** Clear fuel route overlays and return to local radar. */
  clearPath: () => void;
  getInput: () => RoutePlannerInput;
  selectCandidate: (c: FuelStopCandidate | null) => void;
}

/** Persist the current map frame so the next visit opens where the user left it. */
export function rememberMapView(lat: number, lng: number, zoom: number) {
  usePlannerStore.getState().setMapView({ lat, lng, zoom });
  writeSession({ lat, lng, zoom });
}

function writeSession(partial: Partial<MapSession> = {}) {
  const s = usePlannerStore.getState();
  const current = loadMapSession();
  const pinned =
    partial.pinned !== undefined
      ? partial.pinned
      : s.homeAirport.source === "manual"
        ? s.homeAirport
        : (current?.pinned ?? null);
  saveMapSession({
    lat: partial.lat ?? current?.lat ?? PHOENIX_MSA.lat,
    lng: partial.lng ?? current?.lng ?? PHOENIX_MSA.lng,
    zoom: partial.zoom ?? current?.zoom ?? PHOENIX_MSA.zoom,
    originIcao: partial.originIcao ?? s.originIcao,
    destinationIcao: partial.destinationIcao ?? s.destinationIcao,
    pinned,
  });
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  originIcao: "",
  destinationIcao: "",
  aircraft: { ...DEFAULT_AIRCRAFT },
  maxDetourNm: 25,
  fuelType: "100LL",
  result: null,
  selectedStopIcao: null,
  error: null,
  isCalculating: false,
  homeAirport: { ...DEFAULT_HOME_AIRPORT },
  homeAirportStatus: "pending",
  activePanel: "home",
  emergencyTrafficOnly: false,
  fuelMapFilter: "top",
  mapFocusNonce: 0,
  mapView: { ...PHOENIX_MSA },

  setOrigin: (icao) => {
    const originIcao = icao.toUpperCase();
    set((s) => ({
      originIcao,
      homeAirport:
        originIcao.length < 3 && s.homeAirport.source === "manual"
          ? { ...DEFAULT_HOME_AIRPORT }
          : s.homeAirport,
    }));
    writeSession({
      originIcao,
      pinned:
        originIcao.length < 3
          ? null
          : get().homeAirport.source === "manual"
            ? get().homeAirport
            : undefined,
    });
  },
  setDestination: (icao) => {
    const destinationIcao = icao.toUpperCase();
    set({ destinationIcao });
    writeSession({ destinationIcao });
  },
  setAircraft: (partial) =>
    set((s) => ({ aircraft: { ...s.aircraft, ...partial } })),
  setMaxDetourNm: (nm) => set({ maxDetourNm: nm }),
  setFuelType: (fuelType) => set({ fuelType }),
  setResult: (result) => set({ result }),
  setSelectedStop: (icao) => set({ selectedStopIcao: icao }),
  setError: (error) => set({ error }),
  setIsCalculating: (isCalculating) => set({ isCalculating }),
  setHomeAirport: (homeAirport) => set({ homeAirport }),
  setHomeAirportStatus: (homeAirportStatus) => set({ homeAirportStatus }),
  goToAirport: (airport) => {
    const pinned = { ...airport, source: "manual" as const };
    set((s) => ({
      homeAirport: pinned,
      originIcao: airport.icao,
      mapFocusNonce: s.mapFocusNonce + 1,
    }));
    writeSession({
      originIcao: airport.icao,
      pinned,
      lat: airport.latitude,
      lng: airport.longitude,
    });
  },
  setActivePanel: (activePanel) => set({ activePanel }),
  setEmergencyTrafficOnly: (emergencyTrafficOnly) =>
    set({ emergencyTrafficOnly }),
  setFuelMapFilter: (fuelMapFilter) => set({ fuelMapFilter }),
  setMapView: (mapView) => set({ mapView }),
  clearPath: () =>
    set((s) => ({
      result: null,
      destinationIcao: "",
      selectedStopIcao: null,
      error: null,
      isCalculating: false,
      activePanel: "home",
      emergencyTrafficOnly: false,
      mapFocusNonce: s.mapFocusNonce + 1,
    })),
  getInput: () => {
    const s = get();
    return {
      originIcao: s.originIcao,
      destinationIcao: s.destinationIcao,
      aircraft: s.aircraft,
      maxDetourNm: s.maxDetourNm,
      fuelType: s.fuelType,
    };
  },
  selectCandidate: (c) =>
    set({ selectedStopIcao: c ? c.airport.icao : null }),
}));
