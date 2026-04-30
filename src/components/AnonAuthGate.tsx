"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Ensures every visitor has a Supabase session — no login required.
 * If the user has no session, we sign them in anonymously. The anonymous
 * user gets a stable `auth.uid()` that all RLS policies still respect,
 * so cloud sync works exactly as before, but with zero friction.
 *
 * Setup: in Supabase dashboard → Authentication → Providers (or Sign In/Up
 * settings) → enable "Allow anonymous sign-ins".
 */
export function AnonAuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          const { error } = await supabase.auth.signInAnonymously();
          if (error) throw error;
        }
        if (!cancelled) setReady(true);
      } catch (e: unknown) {
        if (cancelled) return;
        setError(
          e instanceof Error
            ? e.message
            : "Could not start a session. Check Supabase setup."
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6 text-center">
        <div>
          <p className="font-semibold text-lg">Couldn&rsquo;t start a session</p>
          <p className="text-sm text-[var(--foreground-muted)] mt-2">
            {error}
          </p>
          <p className="text-xs text-[var(--foreground-subtle)] mt-4">
            In Supabase, enable <span className="font-mono">Allow anonymous sign-ins</span> under
            Authentication → Sign In / Up.
          </p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--border)] border-t-[var(--primary)] animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
