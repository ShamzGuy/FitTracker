"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Input, Label } from "@/components/ui";

/**
 * Ensures every visitor has a Supabase session — no login required.
 * If there's no session, signs in anonymously. The anonymous user gets a
 * stable `auth.uid()` so RLS works exactly as before.
 *
 * On first launch we also collect a display name and stash it in the auth
 * user's metadata (`raw_user_meta_data.name`). The name is queryable from
 * SQL ("which workouts belong to Sarah?") and shown in the greeting.
 */
export function AnonAuthGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<"loading" | "needs-name" | "ready">(
    "loading"
  );
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        let {
          data: { session },
        } = await supabase.auth.getSession();
        // Track whether we just minted a session so we can refresh the
        // server-rendered tree (cookies changed → server data is stale).
        let signedInJustNow = false;
        if (!session) {
          const { error } = await supabase.auth.signInAnonymously();
          if (error) throw error;
          signedInJustNow = true;
          ({
            data: { session },
          } = await supabase.auth.getSession());
        }
        if (cancelled) return;
        const existingName = (
          session?.user?.user_metadata?.name as string | undefined
        )?.trim();
        if (existingName) {
          setPhase("ready");
          // Children were server-rendered before our sign-in cookies
          // existed; re-fetch so the home page sees the current user.
          if (signedInJustNow) router.refresh();
        } else {
          setPhase("needs-name");
        }
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
  }, [router]);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { name: trimmed },
      });
      if (error) throw error;
      setPhase("ready");
      // Server-rendered children were produced before the name existed —
      // refresh so the home page picks the right plan + greeting.
      router.refresh();
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Could not save your name."
      );
    } finally {
      setSaving(false);
    }
  }

  if (error && phase !== "needs-name") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6 text-center">
        <div>
          <p className="font-semibold text-lg">Couldn&rsquo;t start a session</p>
          <p className="text-sm text-[var(--foreground-muted)] mt-2">
            {error}
          </p>
          <p className="text-xs text-[var(--foreground-subtle)] mt-4">
            In Supabase, enable{" "}
            <span className="font-mono">Allow anonymous sign-ins</span> under
            Authentication → Sign In / Up.
          </p>
        </div>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--border)] border-t-[var(--primary)] animate-spin" />
      </div>
    );
  }

  if (phase === "needs-name") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <Card className="p-6 max-w-sm w-full">
          <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[var(--primary)] mb-2">
            Welcome
          </p>
          <h1 className="text-2xl font-bold leading-tight">
            What should we call you?
          </h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-2 mb-5">
            We&rsquo;ll use this to label your workouts and load the right
            plan. You can change it later from the home screen.
          </p>
          <form onSubmit={saveName} className="space-y-3">
            <div>
              <Label htmlFor="display-name">Your name</Label>
              <Input
                id="display-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Shameed"
                autoFocus
                required
                maxLength={40}
                autoComplete="given-name"
              />
            </div>
            {error ? (
              <p className="text-xs text-[var(--danger)]">{error}</p>
            ) : null}
            <Button
              type="submit"
              className="w-full"
              disabled={saving || !name.trim()}
            >
              {saving ? "Saving…" : "Continue"}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
