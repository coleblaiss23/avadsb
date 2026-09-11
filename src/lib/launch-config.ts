import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";

const SUPABASE_CREDENTIALS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const AIRNAV_CREDENTIALS = ["AIRNAV_API_KEY", "AIRNAV_API_URL"] as const;

const PUBLIC_LAUNCH_CREDENTIALS = [
  "NEXT_PUBLIC_CONTACT_EMAIL",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_PLAUSIBLE_DOMAIN",
] as const;

export type LaunchCredentialStatus = {
  envFilePresent: boolean;
  supabaseLive: boolean;
  airnavConfigured: boolean;
  missingSupabase: string[];
  missingAirnav: string[];
  missingPublic: string[];
  /** True when neither AirNav nor Supabase can supply verified fuel quotes. */
  fuelOnDemoPath: boolean;
};

function missingKeys(keys: readonly string[]): string[] {
  return keys.filter((key) => !process.env[key]?.trim());
}

export function launchCredentialStatus(): LaunchCredentialStatus {
  const missingSupabase = missingKeys(SUPABASE_CREDENTIALS);
  const missingAirnav = missingKeys(AIRNAV_CREDENTIALS);
  return {
    envFilePresent: existsSync(path.join(process.cwd(), ".env.local")),
    supabaseLive: missingSupabase.length === 0,
    airnavConfigured: missingAirnav.length === 0,
    missingSupabase,
    missingAirnav,
    missingPublic: missingKeys(PUBLIC_LAUNCH_CREDENTIALS),
    fuelOnDemoPath: missingSupabase.length > 0 && missingAirnav.length > 0,
  };
}

export type LaunchNotice = {
  tone: "warning" | "status";
  consoleLevel: "warn" | "info";
  headline: string;
  body: string;
};

export function launchNotices(
  status = launchCredentialStatus()
): LaunchNotice[] {
  const notices: LaunchNotice[] = [];
  const file = status.envFilePresent
    ? ".env.local is present"
    : ".env.local is absent";

  if (!status.supabaseLive) {
    notices.push({
      tone: "warning",
      consoleLevel: "warn",
      headline: "Dev only — Supabase offline.",
      body:
        `${file}, but Supabase is not connected. Missing ${status.missingSupabase.join(", ")}. ` +
        "Crowd fuel reports and other Supabase-backed features stay off until those are set.",
    });
  } else {
    notices.push({
      tone: "status",
      consoleLevel: "info",
      headline: "Dev only — Supabase live.",
      body:
        "Fuel prices use AirNav when it returns a quote, then Supabase crowd reports from the last 72 hours. Airports without a verified quote show as unavailable (no synthetic prices).",
    });
  }

  if (!status.airnavConfigured) {
    notices.push({
      tone: "status",
      consoleLevel: "info",
      headline: "AirNav not configured — expected, non-blocking.",
      body: status.supabaseLive
        ? `Missing ${status.missingAirnav.join(", ")}. Live FBO quotes stay off until those are set. Crowd reports can still supply fuel data.`
        : `Missing ${status.missingAirnav.join(", ")}. Live FBO quotes stay off until those are set. Fuel quotes stay unavailable until AirNav or Supabase is configured.`,
    });
  }

  if (status.missingPublic.length > 0) {
    const extras: string[] = [];
    if (status.missingPublic.includes("NEXT_PUBLIC_CONTACT_EMAIL")) {
      extras.push(
        "NEXT_PUBLIC_CONTACT_EMAIL is unset — the privacy page has no public contact until you set it."
      );
    }
    if (status.missingPublic.includes("NEXT_PUBLIC_SITE_URL")) {
      extras.push(
        "NEXT_PUBLIC_SITE_URL is unset — sitemap and robots fall back to localhost or the Vercel host."
      );
    }
    if (status.missingPublic.includes("NEXT_PUBLIC_PLAUSIBLE_DOMAIN")) {
      extras.push(
        "Plausible is wired but will not load until NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set."
      );
    }
    notices.push({
      tone: "warning",
      consoleLevel: "warn",
      headline: "Launch settings still unset.",
      body: extras.join(" "),
    });
  }

  return notices;
}
