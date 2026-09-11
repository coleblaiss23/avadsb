import type { Metadata } from "next";
import { Suspense } from "react";
import { ToolPageShell } from "@/components/layout/ToolPageShell";
import { CrosswindPageClient } from "@/components/weather/CrosswindPageClient";

export const metadata: Metadata = {
  title: "Crosswind & Runway",
  description:
    "Compute headwind and crosswind components from live METAR against catalog runway headings.",
};

export default function CrosswindPage() {
  return (
    <ToolPageShell
      eyebrow="Runway analysis"
      title="Crosswind & Runway"
      description="Load an airport, pick a runway end, and see crosswind / headwind against the current METAR wind."
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
