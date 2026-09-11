import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { OG } from "@/lib/og-theme";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: OG.width, height: OG.height };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: `linear-gradient(145deg, ${OG.ink} 0%, #121820 55%, #0a1a1a 100%)`,
          padding: 64,
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: OG.cyan,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          {SITE_NAME}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              color: OG.text,
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
              maxWidth: 980,
            }}
          >
            Unfiltered radar, METAR &amp; fuel tools
          </div>
          <div style={{ color: OG.muted, fontSize: 28, maxWidth: 900 }}>
            Live ADS-B · ATIS decode · crosswind · corridor fuel · squawk · quiz
          </div>
        </div>
        <div style={{ color: OG.muted, fontSize: 22 }}>Free aviation tool suite</div>
      </div>
    ),
    { ...size }
  );
}
