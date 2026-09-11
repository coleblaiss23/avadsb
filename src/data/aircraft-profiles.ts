import type { AircraftProfile, AircraftSpecs } from "@/types";

export const AIRCRAFT_PROFILES: AircraftProfile[] = [
  {
    id: "c172",
    label: "Cessna 172",
    cruiseSpeedKts: 115,
    fuelBurnGph: 9.5,
    tankCapacityGal: 53,
    hourlyOperatingCost: 45,
  },
  {
    id: "c182",
    label: "Cessna 182",
    cruiseSpeedKts: 140,
    fuelBurnGph: 13.5,
    tankCapacityGal: 88,
    hourlyOperatingCost: 65,
  },
  {
    id: "sr22",
    label: "Cirrus SR22",
    cruiseSpeedKts: 170,
    fuelBurnGph: 17.5,
    tankCapacityGal: 92,
    hourlyOperatingCost: 95,
  },
  {
    id: "pa28",
    label: "Piper Cherokee",
    cruiseSpeedKts: 110,
    fuelBurnGph: 8.5,
    tankCapacityGal: 50,
    hourlyOperatingCost: 40,
  },
];

export function profileToSpecs(profile: AircraftProfile): AircraftSpecs {
  return {
    cruiseSpeedKts: profile.cruiseSpeedKts,
    fuelBurnGph: profile.fuelBurnGph,
    tankCapacityGal: profile.tankCapacityGal,
    hourlyOperatingCost: profile.hourlyOperatingCost,
  };
}

export function matchProfileId(specs: AircraftSpecs): string | "custom" {
  const hit = AIRCRAFT_PROFILES.find(
    (p) =>
      p.cruiseSpeedKts === specs.cruiseSpeedKts &&
      p.fuelBurnGph === specs.fuelBurnGph &&
      p.hourlyOperatingCost === specs.hourlyOperatingCost
  );
  return hit?.id ?? "custom";
}
