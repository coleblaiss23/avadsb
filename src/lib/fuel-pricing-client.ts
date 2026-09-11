import type { FuelPrice, FuelPriceSource } from "@/types";

/** Client-safe verification helpers (no Node APIs). */
export function formatPriceAge(updatedAt: string): string {
  const ms = Date.now() - new Date(updatedAt).getTime();
  const hours = Math.max(0, Math.floor(ms / 3600_000));
  if (hours < 1) return "Updated <1 hr ago";
  if (hours < 24) return `Updated ${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `Updated ${days} day${days === 1 ? "" : "s"} ago`;
}

export function sourceLabel(source: FuelPriceSource): string {
  switch (source) {
    case "AirNav_API":
      return "via AirNav";
    case "FBO_Direct":
      return "via FBO Direct";
    case "Pilot_Crowdsource":
      return "via Pilot Crowdsource";
    case "Demo_Synthetic":
      return "via Demo Quote";
  }
}

export function verificationTag(price: FuelPrice): string {
  return `${formatPriceAge(price.updatedAt)} ${sourceLabel(price.source)}`;
}
