import type { Metadata } from "next";
import { ToolPageShell } from "@/components/layout/ToolPageShell";
import { SquawkDecoder } from "@/components/ui/SquawkDecoder";

export const metadata: Metadata = {
  title: "Squawk Code Decoder",
  description:
    "Decode Mode-A squawk codes including VFR 1200 and emergency discretes 7500, 7600, and 7700.",
  alternates: { canonical: "/squawk" },
};

export default function SquawkPage() {
  return (
    <ToolPageShell
      eyebrow="Transponder"
      title="Squawk Code Decoder"
      description="Look up any four-digit Mode-A code. Emergency discretes can isolate live radar traffic on the home map."
      width="narrow"
    >
      <SquawkDecoder showMapFilter />
    </ToolPageShell>
  );
}
