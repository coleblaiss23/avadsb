import type { Airport, LatLng, RouteOptimizationResult } from "@/types";

function escXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Build a simple GPX route suitable for ForeFlight / Garmin / SkyVector import.
 * Waypoints: origin → optional fuel stop → destination.
 */
export function buildFlightPlanGpx(
  result: RouteOptimizationResult,
  stopIcao?: string | null
): string {
  const stop =
    stopIcao != null
      ? result.candidates.find((c) => c.airport.icao === stopIcao)?.airport
      : result.candidates[0]?.airport;

  const legs: Airport[] = [result.origin];
  if (stop) legs.push(stop);
  legs.push(result.destination);

  const name = stop
    ? `${result.origin.icao}-${stop.icao}-${result.destination.icao}`
    : `${result.origin.icao}-${result.destination.icao}`;

  const wpts = legs
    .map(
      (a, i) => `  <wpt lat="${a.latitude.toFixed(6)}" lon="${a.longitude.toFixed(6)}">
    <name>${escXml(a.icao)}</name>
    <desc>${escXml(a.name)} · ${escXml(a.city)}, ${escXml(a.state)}</desc>
    <type>${i === 0 ? "Airport" : i === legs.length - 1 ? "Airport" : "Fuel Stop"}</type>
  </wpt>`
    )
    .join("\n");

  const rtepts = legs
    .map(
      (a) => `    <rtept lat="${a.latitude.toFixed(6)}" lon="${a.longitude.toFixed(6)}">
      <name>${escXml(a.icao)}</name>
    </rtept>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="AvADSB"
  xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escXml(name)}</name>
    <desc>AvADSB fuel-stop plan · generated ${escXml(result.generatedAt)}</desc>
  </metadata>
${wpts}
  <rte>
    <name>${escXml(name)}</name>
${rtepts}
  </rte>
</gpx>
`;
}

export function downloadGpx(filename: string, gpx: string): void {
  const blob = new Blob([gpx], { type: "application/gpx+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".gpx") ? filename : `${filename}.gpx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** SkyVector flight-plan URL (chart + route polyline). */
export function buildSkyVectorUrl(
  origin: LatLng & { icao?: string },
  destination: LatLng & { icao?: string },
  stop?: (LatLng & { icao?: string }) | null
): string {
  const parts = [origin, stop, destination].filter(Boolean) as Array<
    LatLng & { icao?: string }
  >;
  const ids = parts.map((p) => p.icao).filter(Boolean) as string[];
  if (ids.length >= 2) {
    return `https://skyvector.com/?fpl=${encodeURIComponent(ids.join(" "))}`;
  }
  const first = parts[0]!;
  const ll = `${first.lat.toFixed(4)},${first.lng.toFixed(4)}`;
  const fpl = parts
    .map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`)
    .join("/");
  return `https://skyvector.com/?ll=${encodeURIComponent(ll)}&chart=301&zoom=5&fpl=${encodeURIComponent(fpl)}`;
}

export function formatRunwaySpec(
  ident: string,
  lengthFt: number,
  widthFt: number
): string {
  return `Rwy ${ident}: ${lengthFt.toLocaleString("en-US")}' × ${widthFt}'`;
}

export function formatDetourPenalty(detourNm: number, hours: number): string {
  const mins = hours * 60;
  const time =
    mins < 60
      ? `+${mins.toFixed(1)} min`
      : `+${hours.toFixed(2)} hr`;
  return `+${detourNm.toFixed(1)} NM / ${time}`;
}
