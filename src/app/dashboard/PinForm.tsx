"use client";

import { useState, useTransition } from "react";
import { Button, Card, Input, Label } from "@/components/ui";
import { verifyPinAction } from "./actions";

export function PinForm() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = pin.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const res = await verifyPinAction(trimmed);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <Card className="p-6 max-w-sm w-full">
        <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[var(--primary)] mb-2">
          Household dashboard
        </p>
        <h1 className="text-2xl font-bold leading-tight">Enter PIN</h1>
        <p className="text-sm text-[var(--foreground-muted)] mt-2 mb-5">
          This view aggregates both household members&rsquo; workouts and
          progress. PIN-protected so the link can stay public.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="dashboard-pin">PIN</Label>
            <Input
              id="dashboard-pin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              autoFocus
              required
              maxLength={32}
            />
          </div>
          {error ? (
            <p className="text-xs text-[var(--danger)]">{error}</p>
          ) : null}
          <Button
            type="submit"
            className="w-full"
            disabled={pending || !pin.trim()}
          >
            {pending ? "Checking…" : "Continue"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
