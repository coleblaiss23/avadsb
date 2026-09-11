import type { Metadata } from "next";
import { ToolPageShell } from "@/components/layout/ToolPageShell";
import { WeatherHub } from "@/components/weather/WeatherHub";

export const metadata: Metadata = {
  title: "ATIS & Plain METAR",
  description:
    "Live flight category, density altitude, and plain-English METAR token decode for any US airport.",
  alternates: { canonical: "/weather" },
};

export default function WeatherIndexPage() {
  return (
    <ToolPageShell
      eyebrow="Weather deck"
      title="ATIS & Plain METAR"
      description="Pull live AviationWeather.gov METARs, see VFR / MVFR / IFR category at a glance, and decode every token into plain English."
      width="narrow"
    >
      <WeatherHub />
    </ToolPageShell>
  );
}
