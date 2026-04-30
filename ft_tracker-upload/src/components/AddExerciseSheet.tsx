"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Select } from "@/components/ui";
import {
  CATEGORIES,
  POPULAR_EXERCISES,
  guessKind,
  kindLabel,
  type CatalogExercise,
} from "@/lib/exerciseCatalog";
import type { Exercise, ExerciseKind } from "@/lib/types";

/**
 * Inline picker that lets the user add an exercise to their library.
 * - Search across the popular catalog (grouped by muscle group).
 * - If the typed name doesn't match anything, offer a "create custom" row
 *   with auto-detected type that the user can override.
 */
export function AddExerciseSheet({
  existingNames,
  onAdded,
  onCancel,
}: {
  /** Lowercased names already in the user's library — shown but disabled. */
  existingNames: Set<string>;
  onAdded: (exercise: Exercise) => void;
  onCancel: () => void;
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
      // If it already exists, just return it instead of failing.
      if (existingNames.has(trimmed.toLowerCase())) {
        const { data: existing } = await supabase
          .from("exercises")
          .select("*")
          .eq("user_id", user.id)
          .ilike("name", trimmed)
          .maybeSingle();
        if (existing) {
          onAdded(existing as Exercise);
          return;
        }
      }

      const { data, error: insErr } = await supabase
        .from("exercises")
        .insert({ user_id: user.id, name: trimmed, kind })
        .select()
        .single();

      if (insErr) {
        // Unique-name conflict: fetch the existing row and use that.
        const { data: existing } = await supabase
          .from("exercises")
          .select("*")
          .eq("user_id", user.id)
          .ilike("name", trimmed)
          .maybeSingle();
        if (existing) {
          onAdded(existing as Exercise);
          return;
        }
        throw insErr;
      }
      if (data) onAdded(data as Exercise);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add exercise");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <Input
        autoFocus
        placeholder="Search or type a new exercise…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="max-h-72 overflow-y-auto -mx-1 pr-1">
        {CATEGORIES.map((cat) => {
          const items = filtered.filter((e) => e.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat} className="mb-3">
              <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] font-semibold px-1 mb-1">
                {cat}
              </p>
              <ul>
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
          <p className="text-sm text-[var(--muted)] px-1 py-2">
            No matches. Type a custom name to add it.
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

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      <Button variant="ghost" onClick={onCancel} className="w-full">
        Cancel
      </Button>
    </div>
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
          "w-full text-left px-2 py-2 rounded-lg flex items-center justify-between gap-3 transition",
          already
            ? "opacity-50 cursor-default"
            : "hover:bg-black/[0.04] dark:hover:bg-white/[0.05] active:bg-black/[0.07]"
        )}
      >
        <span className="font-medium text-sm">{item.name}</span>
        <span className="text-[11px] text-[var(--muted)] shrink-0">
          {already ? "in library" : kindLabel(item.kind)}
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
    <div className="border-t border-[var(--border)] pt-3">
      <p className="text-xs text-[var(--muted)] mb-2">
        Add custom exercise — auto-detected as{" "}
        <span className="font-medium text-[var(--foreground)]">
          {kindLabel(guessed)}
        </span>
        . Change below if needed.
      </p>
      <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
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
