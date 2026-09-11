import type { Metadata } from "next";
import { FuelWorkspace } from "@/components/planner/FuelWorkspace";

export const metadata: Metadata = {
  title: "Corridor Fuel Matrix",
  description:
    "Find the cheapest 100LL and Jet-A along your route corridor with live map overlays and savings ranking.",
};

export default function FuelPage() {
  return <FuelWorkspace />;
}
