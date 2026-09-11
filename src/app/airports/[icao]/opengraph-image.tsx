import { ImageResponse } from "next/og";
import { resolveAirport } from "@/lib/airports-db";
import { getMetarOrMock } from "@/lib/metar";
import { OG } from "@/lib/og-theme";
import { SITE_NAME } from "@/lib/site";
import { normalizeIcao } from "@/lib/utils";

export const alt = "Airport briefing";
export const size = { width: OG.width, height: OG.height };
export const contentType = "image/png";

type Props = { params: Promise<{ icao: string }> };

export default async function Image({ params }: Props) {
  const { icao: raw } = await params;
  const icao = normalizeIcao(raw);
  const airport = await resolveAirport(icao);
  const metar = airport
    ? await getMetarOrMock(airport.icao, airport.elevation)
    : null;
  const category = metar?.category ?? "VFR";
  const categoryColor = OG.category[category];

  const title = airport?.icao ?? icao ?? "Airport";
  const name = airport?.name ?? "US airport";
  const place = airport
    ? `${airport.city}, ${airport.state}`
    : "United States";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: OG.ink,
          padding: 56,
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          borderLeft: `16px solid ${categoryColor}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ color: OG.cyan, fontSize: 24, fontWeight: 700 }}>
            {SITE_NAME}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: OG.panel,
              border: `1px solid ${OG.border}`,
              borderRadius: 8,
              padding: "10px 18px",
              color: categoryColor,
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            {category}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ color: OG.text, fontSize: 84, fontWeight: 700 }}>
            {title}
          </div>
          <div style={{ color: OG.text, fontSize: 36, fontWeight: 600 }}>
            {name}
          </div>
          <div style={{ color: OG.muted, fontSize: 28 }}>
            {place}
            {airport
              ? ` · elev ${airport.elevation.toLocaleString()} ft · RWY ${airport.runwayIdent}`
              : ""}
          </div>
        </div>

        <div style={{ color: OG.muted, fontSize: 22 }}>
          {metar
            ? `Wind ${metar.wind} · vis ${metar.visibilitySm} SM`
            : "Airport runway, METAR & fuel briefing"}
        </div>
      </div>
    ),
    { ...size }
  );
}
