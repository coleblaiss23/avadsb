import "server-only";

type SupabaseAdminConfig = {
  url: string;
  serviceRoleKey: string;
};

/** Service-role client. Importing this from a Client Component fails the build. */
export function supabaseAdminConfig(): SupabaseAdminConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) return null;
  return { url, serviceRoleKey };
}

export function isSupabaseConfigured(): boolean {
  return supabaseAdminConfig() !== null;
}

export async function supabaseAdminFetch(
  pathAndQuery: string,
  init: RequestInit = {}
): Promise<Response> {
  const config = supabaseAdminConfig();
  if (!config) {
    throw new Error("Supabase is not configured");
  }

  const headers = new Headers(init.headers);
  headers.set("apikey", config.serviceRoleKey);
  headers.set("Authorization", `Bearer ${config.serviceRoleKey}`);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  return fetch(`${config.url}/rest/v1/${pathAndQuery.replace(/^\//, "")}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

export async function readSupabaseError(res: Response): Promise<string> {
  const text = await res.text();
  if (!text) return `Supabase request failed (${res.status})`;
  try {
    const body = JSON.parse(text) as { message?: string; code?: string };
    const message = body.message?.trim() || text;
    return body.code ? `${message} (${body.code})` : message;
  } catch {
    return text.slice(0, 300);
  }
}
