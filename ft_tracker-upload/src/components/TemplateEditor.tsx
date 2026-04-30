"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Button,
  Card,
  Input,
  Label,
  LinkButton,
  Select,
} from "@/components/ui";
import { AddExerciseSheet } from "@/components/AddExerciseSheet";
import { formatTime, parseTimeInput } from "@/lib/format";
import type { Exercise, Template, TemplateExercise } from "@/lib/types";

export function TemplateEditor({
  template,
  initialItems,
  exercises: initialExercises,
}: {
  template: Template;
  initialItems: TemplateExercise[];
  exercises: Exercise[];
}) {
  const [items, setItems] = useState<TemplateExercise[]>(initialItems);
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  const [name, setName] = useState(template.name);
  const [savingName, setSavingName] = useState(false);
  const [pickedId, setPickedId] = useState<string>(initialExercises[0]?.id ?? "");
  const [targetSets, setTargetSets] = useState<string>("3");
  const [targetReps, setTargetReps] = useState<string>("10");
  const [targetTime, setTargetTime] = useState<string>("");
  const [showPicker, setShowPicker] = useState(false);
  const [busy, setBusy] = useState(false);

  const exById = useMemo(
    () => new Map(exercises.map((e) => [e.id, e])),
    [exercises]
  );
  const existingNames = useMemo(
    () => new Set(exercises.map((e) => e.name.toLowerCase())),
    [exercises]
  );

  const pickedExercise = exById.get(pickedId);

  async function saveName() {
    if (name === template.name) return;
    setSavingName(true);
    const supabase = createClient();
    await supabase.from("templates").update({ name }).eq("id", template.id);
    setSavingName(false);
  }

  async function addExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!pickedId || !pickedExercise) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const position = items.length;
      const sets = parseInt(targetSets, 10);
      const reps = parseInt(targetReps, 10);
      const seconds = parseTimeInput(targetTime);
      const { data, error } = await supabase
        .from("template_exercises")
        .insert({
          template_id: template.id,
          exercise_id: pickedId,
          position,
          target_sets: Number.isFinite(sets) ? sets : null,
          target_reps:
            pickedExercise.kind !== "time" && Number.isFinite(reps) ? reps : null,
          target_time_seconds:
            pickedExercise.kind === "time" ? seconds : null,
        })
        .select()
        .single();
      if (error) throw error;
      setItems((prev) => [...prev, data as TemplateExercise]);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  function handleExerciseAdded(ex: Exercise) {
    setExercises((prev) =>
      prev.some((e) => e.id === ex.id)
        ? prev
        : [...prev, ex].sort((a, b) => a.name.localeCompare(b.name))
    );
    setPickedId(ex.id);
    setShowPicker(false);
  }

  async function remove(itemId: string) {
    const supabase = createClient();
    await supabase.from("template_exercises").delete().eq("id", itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  async function move(idx: number, dir: -1 | 1) {
    const next = [...items];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    const reindexed = next.map((it, i) => ({ ...it, position: i }));
    setItems(reindexed);
    const supabase = createClient();
    await Promise.all(
      reindexed.map((it) =>
        supabase
          .from("template_exercises")
          .update({ position: it.position })
          .eq("id", it.id)
      )
    );
  }

  return (
    <div className="space-y-5">
      <Card className="p-4 space-y-3">
        <div>
          <Label>Template name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
          />
          {savingName ? (
            <p className="text-xs text-[var(--muted)] mt-1">Saving…</p>
          ) : null}
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        {showPicker ? (
          <AddExerciseSheet
            existingNames={existingNames}
            onAdded={handleExerciseAdded}
            onCancel={() => setShowPicker(false)}
          />
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">Add exercise</p>
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="text-sm font-medium text-[var(--primary)]"
              >
                + New exercise
              </button>
            </div>

            {exercises.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                No exercises in your library yet — tap{" "}
                <span className="text-[var(--primary)] font-medium">
                  + New exercise
                </span>{" "}
                to add one.
              </p>
            ) : (
              <form onSubmit={addExercise} className="space-y-3">
                <div>
                  <Label>Exercise</Label>
                  <Select
                    value={pickedId}
                    onChange={(e) => setPickedId(e.target.value)}
                  >
                    {exercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Sets</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={targetSets}
                      onChange={(e) => setTargetSets(e.target.value)}
                    />
                  </div>
                  {pickedExercise?.kind === "time" ? (
                    <div>
                      <Label>Time (mm:ss)</Label>
                      <Input
                        inputMode="numeric"
                        placeholder="e.g. 0:45"
                        value={targetTime}
                        onChange={(e) => setTargetTime(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div>
                      <Label>
                        {pickedExercise?.kind === "reps" ? "Reps" : "Reps"}
                      </Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        placeholder="leave blank for failure"
                        value={targetReps}
                        onChange={(e) => setTargetReps(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? "Adding…" : "Add to template"}
                </Button>
              </form>
            )}
          </>
        )}
      </Card>

      <section>
        <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
          Exercises in this template
        </h2>
        {items.length === 0 ? (
          <Card className="p-4 text-sm text-[var(--muted)]">
            None yet — add some above.
          </Card>
        ) : (
          <ul className="space-y-2">
            {items.map((it, idx) => {
              const ex = exById.get(it.exercise_id);
              return (
                <li key={it.id}>
                  <Card className="p-3 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {ex?.name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {targetText(it, ex)}
                      </p>
                    </div>
                    <button
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                      className="px-2 py-1 text-[var(--muted)] disabled:opacity-30"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => move(idx, 1)}
                      disabled={idx === items.length - 1}
                      className="px-2 py-1 text-[var(--muted)] disabled:opacity-30"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => remove(it.id)}
                      className="px-2 py-1 text-xs text-[var(--danger)] font-medium"
                    >
                      Remove
                    </button>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="flex gap-2">
        <LinkButton href="/templates" variant="secondary">
          Back
        </LinkButton>
      </div>
    </div>
  );
}

function targetText(it: TemplateExercise, ex: Exercise | undefined): string {
  const sets = it.target_sets ?? "?";
  if (!ex) return `${sets} sets`;
  if (ex.kind === "time" && it.target_time_seconds)
    return `${sets} × ${formatTime(it.target_time_seconds)}`;
  if (it.target_reps != null) return `${sets} × ${it.target_reps}`;
  return `${sets} sets`;
}
