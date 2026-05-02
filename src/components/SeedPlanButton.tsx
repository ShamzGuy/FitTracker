"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import {
  WORKOUT_PLAN,
  findInCatalog,
  guessKind,
  planExerciseNames,
  type WorkoutDay,
} from "@/lib/exerciseCatalog";
import type { Exercise } from "@/lib/types";

export function SeedPlanButton({
  variant = "primary",
  label = "Set up 4-day plan",
  plan = WORKOUT_PLAN,
  onDone,
  className,
}: {
  variant?: "primary" | "secondary";
  label?: string;
  /** Which plan to seed. Defaults to the original 4-day plan. */
  plan?: WorkoutDay[];
  onDone?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function seed() {
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      // 1) Ensure all needed exercises exist (idempotent by case-insensitive name).
      const { data: allUserEx } = await supabase
        .from("exercises")
        .select("id, name, kind");
      const byLowerName = new Map<string, Exercise>(
        ((allUserEx ?? []) as Exercise[]).map((e) => [e.name.toLowerCase(), e])
      );

      const needed = planExerciseNames(plan);
      const toInsert = needed
        .filter((name) => !byLowerName.has(name.toLowerCase()))
        .map((name) => ({
          user_id: user.id,
          name,
          kind: findInCatalog(name)?.kind ?? guessKind(name),
        }));

      if (toInsert.length > 0) {
        const { data: inserted, error: insErr } = await supabase
          .from("exercises")
          .insert(toInsert)
          .select("id, name, kind, user_id, notes, created_at");
        if (insErr) throw insErr;
        for (const e of (inserted ?? []) as Exercise[]) {
          byLowerName.set(e.name.toLowerCase(), e);
        }
      }

      // 2) Create templates that don't already exist (by name).
      const { data: existingTemplates } = await supabase
        .from("templates")
        .select("id, name");
      const existingTplNames = new Set(
        (existingTemplates ?? []).map((t) => t.name.toLowerCase())
      );

      for (const day of plan) {
        if (existingTplNames.has(day.name.toLowerCase())) continue;

        const { data: tpl, error: tplErr } = await supabase
          .from("templates")
          .insert({ user_id: user.id, name: day.name })
          .select("id")
          .single();
        if (tplErr || !tpl) throw tplErr ?? new Error("Failed to create template");

        const items = day.exercises
          .map((ex, idx) => {
            const dbEx = byLowerName.get(ex.name.toLowerCase());
            if (!dbEx) return null;
            return {
              template_id: tpl.id,
              exercise_id: dbEx.id,
              position: idx,
              target_sets: ex.sets,
              target_reps: ex.reps ?? null,
              target_weight: ex.weight ?? null,
              target_time_seconds: ex.seconds ?? null,
            };
          })
          .filter((v): v is NonNullable<typeof v> => v !== null);

        if (items.length > 0) {
          const { error: teErr } = await supabase
            .from("template_exercises")
            .insert(items);
          if (teErr) throw teErr;
        }
      }

      onDone?.();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to set up plan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <Button
        onClick={seed}
        disabled={busy}
        variant={variant}
        size="lg"
        className="w-full"
      >
        {busy ? "Setting up…" : label}
      </Button>
      {error ? (
        <p className="text-sm text-[var(--danger)] mt-2">{error}</p>
      ) : null}
    </div>
  );
}
