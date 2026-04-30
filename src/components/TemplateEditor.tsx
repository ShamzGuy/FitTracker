"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Button,
  Card,
  Input,
  Label,
  LinkButton,
  SectionTitle,
  Select,
} from "@/components/ui";
import { AddExerciseSheet } from "@/components/AddExerciseSheet";
import { NumberStepper } from "@/components/NumberStepper";
import { TimeStepper } from "@/components/TimeStepper";
import { formatTime } from "@/lib/format";
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
  const [targetSets, setTargetSets] = useState<number>(3);
  const [targetReps, setTargetReps] = useState<number>(10);
  const [targetTime, setTargetTime] = useState<number>(45);
  const [pickerOpen, setPickerOpen] = useState(false);
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

  async function addExercise() {
    if (!pickedId || !pickedExercise) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const position = items.length;
      const { data, error } = await supabase
        .from("template_exercises")
        .insert({
          template_id: template.id,
          exercise_id: pickedId,
          position,
          target_sets: targetSets,
          target_reps: pickedExercise.kind !== "time" ? targetReps : null,
          target_time_seconds:
            pickedExercise.kind === "time" ? targetTime : null,
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
    setPickerOpen(false);
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
      <Card className="p-4">
        <Label>Plan name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
        />
        {savingName ? (
          <p className="text-xs text-[var(--foreground-muted)] mt-1.5">Saving…</p>
        ) : null}
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">Add exercise</p>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="text-sm font-semibold text-[var(--primary)] active:scale-95 transition"
          >
            + New
          </button>
        </div>

        {exercises.length === 0 ? (
          <p className="text-sm text-[var(--foreground-muted)]">
            No exercises yet — tap{" "}
            <span className="text-[var(--primary)] font-semibold">+ New</span>{" "}
            to add one.
          </p>
        ) : (
          <>
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

            <div className="grid grid-cols-2 gap-4">
              <NumberStepper
                label="Sets"
                value={targetSets}
                onChange={setTargetSets}
                step={1}
                min={1}
                max={20}
              />
              {pickedExercise?.kind === "time" ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)] mb-3 text-center">
                    Time
                  </p>
                  <p className="text-center text-3xl font-bold tabular-nums tracking-tight">
                    {formatTime(targetTime)}
                  </p>
                </div>
              ) : (
                <NumberStepper
                  label="Reps"
                  value={targetReps}
                  onChange={setTargetReps}
                  step={1}
                  min={1}
                  max={50}
                />
              )}
            </div>

            {pickedExercise?.kind === "time" ? (
              <TimeStepper
                totalSeconds={targetTime}
                onChange={setTargetTime}
              />
            ) : null}

            <Button
              type="button"
              onClick={addExercise}
              disabled={busy}
              size="lg"
              className="w-full"
            >
              {busy ? "Adding…" : "Add to plan"}
            </Button>
          </>
        )}
      </Card>

      <section>
        <SectionTitle>Exercises in this plan</SectionTitle>
        {items.length === 0 ? (
          <Card className="p-4 text-sm text-[var(--foreground-muted)]">
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
                      <p className="font-semibold truncate">
                        {ex?.name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-[var(--foreground-muted)]">
                        {targetText(it, ex)}
                      </p>
                    </div>
                    <button
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                      className="px-2 py-1 text-[var(--foreground-muted)] disabled:opacity-30"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => move(idx, 1)}
                      disabled={idx === items.length - 1}
                      className="px-2 py-1 text-[var(--foreground-muted)] disabled:opacity-30"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => remove(it.id)}
                      className="px-2 py-1 text-xs text-[var(--danger)] font-semibold"
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

      <div>
        <LinkButton href="/templates" variant="secondary">
          Back
        </LinkButton>
      </div>

      <AddExerciseSheet
        open={pickerOpen}
        existingNames={existingNames}
        onAdded={handleExerciseAdded}
        onClose={() => setPickerOpen(false)}
      />
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
