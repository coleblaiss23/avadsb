"use client";

import { useSearchParams } from "next/navigation";
import { CrosswindAnalyzer } from "@/components/weather/CrosswindAnalyzer";
import { useDetectHomeAirport } from "@/hooks/use-home-airport";
import { usePlannerStore } from "@/store/planner-store";
import { normalizeIcao } from "@/lib/utils";

export function CrosswindPageClient() {
  useDetectHomeAirport();
  const search = useSearchParams();
  const home = usePlannerStore((s) => s.homeAirport);
  const fromQuery = search.get("icao");
  const defaultIcao = normalizeIcao(fromQuery || home.icao || "KPHX");

  return (
    <CrosswindAnalyzer
      key={defaultIcao}
      mode="page"
      defaultIcao={defaultIcao}
    />
  );
}
