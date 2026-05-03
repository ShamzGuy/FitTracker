import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client that uses the **service role key** —
 * bypasses Row Level Security. Only use for trusted server code that
 * needs cross-user data (e.g. the household dashboard at /dashboard).
 *
 * NEVER import this from a client component or expose its results in a
 * way that leaks one user's data to another. The `server-only` import
 * is a build-time guard: if any client module pulls this in, the build
 * will fail.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error(
      "Missing service-role env vars. Add SUPABASE_SERVICE_ROLE_KEY to .env.local (and Vercel) — copy from Supabase → Project Settings → API → 'service_role' key."
    );
  }

  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
