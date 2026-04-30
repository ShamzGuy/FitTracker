"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, EmptyState, Input, Label, Select } from "@/components/ui";
import type { Exercise, ExerciseKind } from "@/lib/types";

const KIND_LABEL: Record<ExerciseKind, string> = {
  weight: "Weight × Reps",
  time: "Time",
  reps: "Bodyweight reps",
};

export function ExerciseManager({ initial }: { initial: Exercise[] }) {
  const [exercises, setExercises] = useState<Exercise[]>(initial);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<ExerciseKind>("weight");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");

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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add exercise");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this exercise? Past logs that reference it will also be removed."))
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
    <div className="space-y-5">
      <Card className="p-4">
        <form onSubmit={add} className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input
              placeholder="e.g. Bench press, Plank, Pull-up"
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
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Adding…" : "Add exercise"}
          </Button>
        </form>
      </Card>

      <div>
        <Input
          placeholder="Search exercises…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No exercises yet"
          description="Add your first exercise above to start logging workouts."
        />
      ) : (
        <ul className="space-y-2">
          {filtered.map((ex) => (
            <li key={ex.id}>
              <Card className="p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{ex.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {KIND_LABEL[ex.kind]}
                  </p>
                </div>
                <button
                  onClick={() => remove(ex.id)}
                  className="text-xs text-[var(--danger)] font-medium px-2 py-1"
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
