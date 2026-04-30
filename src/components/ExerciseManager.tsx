"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Label,
  Select,
} from "@/components/ui";
import type { Exercise, ExerciseKind } from "@/lib/types";

const KIND_LABEL: Record<ExerciseKind, string> = {
  weight: "Weight × Reps",
  time: "Time",
  reps: "Bodyweight",
};

export function ExerciseManager({ initial }: { initial: Exercise[] }) {
  const [exercises, setExercises] = useState<Exercise[]>(initial);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<ExerciseKind>("weight");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((e) => e.name.toLowerCase().includes(q));
  }, [exercises, filter]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("exercises")
        .insert({ user_id: user.id, name: name.trim(), kind })
        .select()
        .single();
      if (error) throw error;
      setExercises((prev) =>
        [...prev, data as Exercise].sort((a, b) => a.name.localeCompare(b.name))
      );
      setName("");
      setAdding(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add exercise");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (
      !confirm(
        "Delete this exercise? Past logs that reference it will also be removed."
      )
    )
      return;
    const supabase = createClient();
    const { error } = await supabase.from("exercises").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    setExercises((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      {adding ? (
        <Card className="p-4 space-y-3">
          <form onSubmit={add} className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input
                autoFocus
                placeholder="e.g. Bench press, Plank"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={kind}
                onChange={(e) => setKind(e.target.value as ExerciseKind)}
              >
                <option value="weight">Weight × Reps</option>
                <option value="time">Time (seconds)</option>
                <option value="reps">Bodyweight reps</option>
              </Select>
            </div>
            {error ? (
              <p className="text-sm text-[var(--danger)]">{error}</p>
            ) : null}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setAdding(false);
                  setName("");
                  setError(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy} className="flex-1">
                {busy ? "Adding…" : "Add exercise"}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Button
          variant="secondary"
          onClick={() => setAdding(true)}
          className="w-full"
        >
          + Add exercise
        </Button>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title="No exercises yet"
          description="Tap “Add exercise” above, or import the 4-day plan from Plans."
        />
      ) : (
        <ul className="space-y-2">
          {filtered.map((ex) => (
            <li key={ex.id}>
              <Card className="p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{ex.name}</p>
                  <div className="mt-1">
                    <Badge>{KIND_LABEL[ex.kind]}</Badge>
                  </div>
                </div>
                <button
                  onClick={() => remove(ex.id)}
                  className="text-xs text-[var(--danger)] font-semibold px-2 py-1"
                  aria-label={`Delete ${ex.name}`}
                >
                  Delete
                </button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
