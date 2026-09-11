import type { Metadata } from "next";
import { ToolPageShell } from "@/components/layout/ToolPageShell";
import { HobbsSplitter } from "@/components/tools/HobbsSplitterDrawer";

export const metadata: Metadata = {
  title: "Hobbs & Cost Splitter",
  description:
    "Split wet and dry flight costs — Hobbs time, fuel burn, rental rate, and engine reserve — across pilots and passengers.",
};

export default function HobbsPage() {
  return (
    <ToolPageShell
      eyebrow="Flight economics"
      title="Hobbs & Cost Splitter"
      description="Enter Hobbs start/end, burn, fuel price, dry rate, and how many people are splitting the bill."
      width="narrow"
    >
      <div className="instrument-panel p-5 sm:p-6">
        <HobbsSplitter mode="page" />
      </div>
    </ToolPageShell>
  );
}
