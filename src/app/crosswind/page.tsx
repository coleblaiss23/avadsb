import type { Metadata } from "next";
import { Suspense } from "react";
import { ToolPageShell } from "@/components/layout/ToolPageShell";
import { CrosswindPageClient } from "@/components/weather/CrosswindPageClient";

export const metadata: Metadata = {
  title: "Crosswind & Runway",
  description:
    "Recommended into-the-wind runways from live METAR, plus headwind and crosswind components for each end.",
  alternates: { canonical: "/crosswind" },
};

export default function CrosswindPage() {
  return (
    <ToolPageShell
      eyebrow="Runway analysis"
      title="Crosswind & Runway"
      description="Load an airport and get recommended runways for landing into the wind, with headwind / crosswind against the current METAR."
      width="narrow"
    >
      <Suspense
        fallback={
          <div className="instrument-panel p-6 text-sm text-slate-500">
            Loading analyzer…
          </div>
        }
      >
        <CrosswindPageClient />
      </Suspense>
    </ToolPageShell>
  );
}
