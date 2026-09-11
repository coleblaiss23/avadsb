"use client";

import { useEffect } from "react";
import { FuelWorkspace } from "@/components/planner/FuelWorkspace";
import { usePlannerStore } from "@/store/planner-store";

/**
 * Prefills origin/destination for SEO landing pages, then opens the
 * corridor fuel workspace.
 */
export function PopularRoutePlanner({
  originIcao,
  destinationIcao,
  routeLabel,
}: {
  originIcao: string;
  destinationIcao: string;
  routeLabel?: string;
}) {
  const setOrigin = usePlannerStore((s) => s.setOrigin);
  const setDestination = usePlannerStore((s) => s.setDestination);
  const setActivePanel = usePlannerStore((s) => s.setActivePanel);
  const setResult = usePlannerStore((s) => s.setResult);

  useEffect(() => {
    setOrigin(originIcao);
    setDestination(destinationIcao);
    setActivePanel("fuel");
    setResult(null);
  }, [
    originIcao,
    destinationIcao,
    setOrigin,
    setDestination,
    setActivePanel,
    setResult,
  ]);

  return <FuelWorkspace routeBanner={routeLabel} />;
}
