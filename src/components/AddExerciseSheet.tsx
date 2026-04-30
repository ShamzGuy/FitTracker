"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Select } from "@/components/ui";
import { Sheet } from "@/components/Sheet";
import {
  CATEGORIES,
  POPULAR_EXERCISES,
  guessKind,
  kindLabel,
  type CatalogExercise,
} from "@/lib/exerciseCatalog";
import type { Exercise, ExerciseKind } from "@/lib/types";

/**
 * Bottom-sheet picker that lets the user add an exercise to their library.
 * - Search filters the popular catalog (grouped by muscle).
 * - If no exact match, offers a "create custom" row with auto-detected
 *   type that the user can override.
 */
export function AddExerciseSheet({
  open,
  existingNames,
  onAdded,
  onClose,
}: {
  open: boolean;
  existingNames: Set<string>;
  onAdded: (exercise: Exercise) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return POPULAR_EXERCISES;
    return POPULAR_EXERCISES.filter((e) => e.name.toLowerCase().includes(q));
  }, [q]);

  const exactPopular = POPULAR_EXERCISES.find(
    (e) => e.name.toLowerCase() === q
  );
  const offerCustom = q.length > 0 && !exactPopular;

  async function add(name: string, kind: ExerciseKind) {
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const trimmed = name.trim();
      if (existingNames.has(trimmed.toLowerCase())) {
        const { data: existing } = await supabase
          .from("exercises")
          .select("*")
          .eq("user_id", user.id)
          .ilike("name", trimmed)
          .maybeSingle();
        if (existing) {
          onAdded(existing as Exercise);
          setSearch("");
          return;
        }
      }

      const { data, error: insErr } = await supabase
        .from("exercises")
        .insert({ user_id: user.id, name: trimmed, kind })
        .select()
        .single();

      if (insErr) {
        const { data: existing } = await supabase
          .from("exercises")
          .select("*")
          .eq("user_id", user.id)
          .ilike("name", trimmed)
          .maybeSingle();
        if (existing) {
          onAdded(existing as Exercise);
          setSearch("");
          return;
        }
        throw insErr;
      }
      if (data) {
        onAdded(data as Exercise);
        setSearch("");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add exercise");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Add exercise">
      <div className="space-y-4">
        <Input
          autoFocus
          placeholder="Search or type a new exercise…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="space-y-4">
          {CATEGORIES.map((cat) => {
            const items = filtered.filter((e) => e.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--foreground-muted)] font-semibold mb-1.5 px-1">
                  {cat}
                </p>
                <ul className="space-y-1">
                  {items.map((it) => (
                    <CatalogRow
                      key={it.name}
                      item={it}
                      already={existingNames.has(it.name.toLowerCase())}
                      busy={busy}
                      onPick={() => add(it.name, it.kind)}
                    />
                  ))}
                </ul>
              </div>
            );
          })}

          {filtered.length === 0 && !offerCustom ? (
            <p className="text-sm text-[var(--foreground-muted)] px-1 py-2">
              No matches. Type a name to add it as a custom exercise.
            </p>
          ) : null}
        </div>

        {offerCustom ? (
          <CustomAddRow
            name={search.trim()}
            busy={busy}
            onAdd={(name, kind) => add(name, kind)}
          />
        ) : null}

        {error ? (
          <p className="text-sm text-[var(--danger)]">{error}</p>
        ) : null}
      </div>
    </Sheet>
  );
}

function CatalogRow({
  item,
  already,
  busy,
  onPick,
}: {
  item: CatalogExercise;
  already: boolean;
  busy: boolean;
  onPick: () => void;
}) {
  return (
    <li>
      <button
        disabled={busy || already}
        onClick={onPick}
        className={clsx(
          "w-full text-left px-3 py-3 rounded-[14px] flex items-center justify-between gap-3 transition border",
          already
            ? "opacity-40 cursor-default border-transparent"
            : "border-transparent hover:bg-[var(--surface-2)] hover:border-[var(--border)] active:scale-[0.99]"
        )}
      >
        <span className="font-medium">{item.name}</span>
        <span
          className={clsx(
            "text-[11px] font-semibold uppercase tracking-wider shrink-0",
            already
              ? "text-[var(--foreground-subtle)]"
              : "text-[var(--foreground-muted)]"
          )}
        >
          {already ? "added" : kindLabel(item.kind)}
        </span>
      </button>
    </li>
  );
}

function CustomAddRow({
  name,
  busy,
  onAdd,
}: {
  name: string;
  busy: boolean;
  onAdd: (name: string, kind: ExerciseKind) => void;
}) {
  const guessed = guessKind(name);
  const [kind, setKind] = useState<ExerciseKind>(guessed);

  return (
    <div className="border-t border-[var(--border)] pt-4 mt-2">
      <p className="text-xs text-[var(--foreground-muted)] mb-3">
        Add custom exercise — auto-detected as{" "}
        <span className="font-semibold text-[var(--foreground)]">
          {kindLabel(guessed)}
        </span>
        .
      </p>
      <div className="grid grid-cols-[1fr_auto] gap-2 items-stretch">
        <Select
          value={kind}
          onChange={(e) => setKind(e.target.value as ExerciseKind)}
        >
          <option value="weight">Weight × Reps</option>
          <option value="reps">Bodyweight reps</option>
          <option value="time">Time</option>
        </Select>
        <Button disabled={busy} onClick={() => onAdd(name, kind)}>
          Add &ldquo;{name}&rdquo;
        </Button>
      </div>
    </div>
  );
}
