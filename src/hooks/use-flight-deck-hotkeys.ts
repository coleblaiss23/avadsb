"use client";

import { useEffect } from "react";

/**
 * Flight-deck hotkeys:
 *  `/`  → focus Origin ICAO
 *  Esc  → close Leaflet popups / blur active field
 */
export function useFlightDeckHotkeys() {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const typing =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target?.isContentEditable;

      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        const origin =
          (document.getElementById("dash-origin") as HTMLInputElement | null) ||
          (document.getElementById("origin-icao") as HTMLInputElement | null);
        origin?.focus();
        origin?.select();
        return;
      }

      if (e.key === "Escape") {
        // Close any open Leaflet popups
        document
          .querySelectorAll(".leaflet-popup-close-button")
          .forEach((btn) => (btn as HTMLElement).click());

        // Close Radix dialogs via Escape is built-in; also blur
        if (typing) {
          (target as HTMLElement).blur();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
