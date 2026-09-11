export const ANALYTICS_EVENTS = {
  fuelSearch: "fuel search run",
  radarOpened: "radar opened",
  quizCompleted: "quiz completed",
} as const;

type AnalyticsProps = Record<string, string | number | boolean>;

type PlausibleFn = (
  event: string,
  options?: { props?: AnalyticsProps }
) => void;

export function plausibleDomain(): string {
  return process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim() || "";
}

export function plausibleScriptSrc(): string {
  return (
    process.env.NEXT_PUBLIC_PLAUSIBLE_SRC?.trim() ||
    "https://plausible.io/js/script.js"
  );
}

export function track(event: string, props?: AnalyticsProps): void {
  if (typeof window === "undefined") return;
  const plausible = (window as Window & { plausible?: PlausibleFn }).plausible;
  if (typeof plausible !== "function") return;
  if (props) plausible(event, { props });
  else plausible(event);
}
