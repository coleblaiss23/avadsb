import { ImageResponse } from "next/og";
import { resolveAirport } from "@/lib/airports-db";
import { getMetarOrMock } from "@/lib/metar";
import { OG } from "@/lib/og-theme";
import { SITE_NAME } from "@/lib/site";
import { normalizeIcao } from "@/lib/utils";

export const alt = "Live METAR";
export const size = { width: OG.width, height: OG.height };
export const contentType = "image/png";

type Props = { params: Promise<{ icao: string }> };

export default async function Image({ params }: Props) {
  const { icao: raw } = await params;
  const icao = normalizeIcao(raw);
  const airport = await resolveAirport(icao);
  const metar = await getMetarOrMock(
    airport?.icao ?? icao,
    airport?.elevation ?? 0
  );
  const categoryColor = OG.category[metar.category];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: `linear-gradient(160deg, ${OG.ink} 0%, ${OG.panel} 100%)`,
          padding: 56,
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
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
            {SITE_NAME} · METAR
          </div>
          <div
            style={{
              background: categoryColor,
              color: "#0a0a0a",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            {metar.category}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ color: OG.text, fontSize: 80, fontWeight: 700 }}>
            {airport?.icao ?? icao}
          </div>
          <div style={{ color: OG.muted, fontSize: 30 }}>
            {airport
              ? `${airport.name} · ${airport.city}, ${airport.state}`
              : "Live aviation weather"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            background: OG.ink,
            border: `1px solid ${OG.border}`,
            borderRadius: 12,
            padding: 24,
            color: OG.text,
            fontSize: 26,
            fontFamily: "ui-monospace, monospace",
          }}
        >
          <div>{metar.raw}</div>
          <div style={{ color: OG.muted, fontSize: 22 }}>
            Wind {metar.wind} · vis {metar.visibilitySm} SM
            {metar.densityAltitudeFt != null
              ? ` · DA ${metar.densityAltitudeFt.toLocaleString()} ft`
              : ""}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
