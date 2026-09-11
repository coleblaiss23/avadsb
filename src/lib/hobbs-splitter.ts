export interface HobbsSplitterInput {
  hobbsStart: number;
  hobbsEnd: number;
  fuelBurnGph: number;
  fuelPricePerGal: number;
  dryRatePerHour: number;
  /** Engine / maintenance reserve $/hr (often part of wet rate) */
  engineReservePerHour: number;
  passengers: number;
}

export interface HobbsSplitterResult {
  flightHours: number;
  fuelGallons: number;
  totalFuelCost: number;
  totalRentalFee: number;
  engineReserve: number;
  totalCost: number;
  costPerPerson: number;
  wetRateEquivalent: number;
}

export function computeHobbsSplit(input: HobbsSplitterInput): HobbsSplitterResult | null {
  const hours = input.hobbsEnd - input.hobbsStart;
  if (!Number.isFinite(hours) || hours <= 0) return null;
  if (input.passengers < 1) return null;

  const fuelGallons = hours * input.fuelBurnGph;
  const totalFuelCost = fuelGallons * input.fuelPricePerGal;
  const totalRentalFee = hours * input.dryRatePerHour;
  const engineReserve = hours * input.engineReservePerHour;
  const totalCost = totalFuelCost + totalRentalFee + engineReserve;

  return {
    flightHours: Math.round(hours * 100) / 100,
    fuelGallons: Math.round(fuelGallons * 10) / 10,
    totalFuelCost: Math.round(totalFuelCost * 100) / 100,
    totalRentalFee: Math.round(totalRentalFee * 100) / 100,
    engineReserve: Math.round(engineReserve * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    costPerPerson: Math.round((totalCost / input.passengers) * 100) / 100,
    wetRateEquivalent:
      Math.round(
        (input.dryRatePerHour +
          input.engineReservePerHour +
          input.fuelBurnGph * input.fuelPricePerGal) *
          100
      ) / 100,
  };
}
