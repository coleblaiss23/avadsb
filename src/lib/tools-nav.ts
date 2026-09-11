/** Shared tool destinations linked from the radar home and page chrome. */

export type ToolNavItem = {
  href: string;
  id: string;
  title: string;
  short: string;
  subtitle: string;
  /** Hidden from nav/sidebar until real fuel data is ready. */
  disabled?: boolean;
};

export const TOOL_NAV: ToolNavItem[] = [
  {
    id: "fuel",
    href: "/fuel",
    title: "Corridor Fuel Matrix",
    short: "Fuel",
    subtitle: "Cheapest 100LL / Jet-A along route",
    disabled: true,
  },
  {
    id: "atis",
    href: "/weather",
    title: "ATIS & Plain METAR",
    short: "METAR",
    subtitle: "Flight category & token decode",
  },
  {
    id: "crosswind",
    href: "/crosswind",
    title: "Crosswind & Runway",
    short: "X-Wind",
    subtitle: "Headwind / crosswind components",
  },
  {
    id: "quiz",
    href: "/quiz",
    title: "FAA Ground School Quiz",
    short: "Quiz",
    subtitle: "Private, Instrument, Commercial, CFI",
  },
  {
    id: "squawk",
    href: "/squawk",
    title: "Squawk Code Decoder",
    short: "Squawk",
    subtitle: "VFR and emergency codes",
  },
  {
    id: "hobbs",
    href: "/hobbs",
    title: "Hobbs & Cost Splitter",
    short: "Hobbs",
    subtitle: "Wet / dry flight cost split",
  },
];

/** Use this in nav/sidebar UI — filters out tools not ready for launch. */
export const VISIBLE_TOOL_NAV = TOOL_NAV.filter((item) => !item.disabled);