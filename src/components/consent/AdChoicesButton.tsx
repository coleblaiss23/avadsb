"use client";

import { useConsent } from "@/components/consent/ConsentProvider";

export function AdChoicesButton({ className }: { className?: string }) {
  const { openBanner } = useConsent();
  return (
    <button type="button" onClick={openBanner} className={className}>
      Ad choices
    </button>
  );
}
