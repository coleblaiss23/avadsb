import { ImageResponse } from "next/og";
import { resolveAirport } from "@/lib/airports-db";
import { POPULAR_ROUTES } from "@/lib/airports-db-client";
import { haversineNm } from "@/lib/geo";
import { OG } from "@/lib/og-theme";
import { SITE_NAME } from "@/lib/site";

export const alt = "Fuel corridor route";
export const size = { width: OG.width, height: OG.height };
export const contentType = "image/png";

type Props = { params: Promise<{ slug: string }> };

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const route = POPULAR_ROUTES.find((r) => r.slug === slug);
  const origin = route ? await resolveAirport(route.origin) : undefined;
  const dest = route ? await resolveAirport(route.destination) : undefined;
  const nm =
    origin && dest
      ? Math.round(
          haversineNm(
            { lat: origin.latitude, lng: origin.longitude },
            { lat: dest.latitude, lng: dest.longitude }
          )
        )
      : null;

  const fromCode = route?.origin ?? "ORIGIN";
  const toCode = route?.destination ?? "DEST";

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
        }}
      >
        <div style={{ color: OG.cyan, fontSize: 24, fontWeight: 700 }}>
          {SITE_NAME} · Corridor fuel
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 28,
              color: OG.text,
              fontSize: 72,
              fontWeight: 700,
            }}
          >
            <span>{fromCode}</span>
            <span style={{ color: OG.cyan, fontSize: 48 }}>→</span>
            <span>{toCode}</span>
          </div>
          <div style={{ color: OG.muted, fontSize: 30, maxWidth: 980 }}>
            {route?.label ?? "Popular fuel corridor"}
            {nm != null ? ` · ~${nm} nm` : ""}
          </div>
        </div>

        <div style={{ color: OG.muted, fontSize: 24 }}>
          Ranked 100LL &amp; Jet-A stops along the route
        </div>
      </div>
    ),
    { ...size }
  );
}
