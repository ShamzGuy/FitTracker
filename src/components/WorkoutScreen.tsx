"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  PageHeader,
  Select,
} from "@/components/ui";
import { AddExerciseSheet } from "@/components/AddExerciseSheet";
import { NumberStepper } from "@/components/NumberStepper";
import { TimeStepper } from "@/components/TimeStepper";
import { formatDateTime, formatTime } from "@/lib/format";
import type {
  Exercise,
  TemplateExercise,
  Workout,
  WorkoutSet,
} from "@/lib/types";

export function WorkoutScreen({
  workout,
  initialSets,
  exercises: initialExercises,
  templateItems,
}: {
  workout: Workout;
  initialSets: WorkoutSet[];
  exercises: Exercise[];
  templateItems: TemplateExercise[];
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  const exById = useMemo(
    () => new Map(exercises.map((e) => [e.id, e])),
    [exercises]
  );
  const existingNames = useMemo(
    () => new Set(exercises.map((e) => e.name.toLowerCase())),
    [exercises]
  );
  const templateById = useMemo(
    () => new Map(templateItems.map((t) => [t.exercise_id, t])),
    [templateItems]
  );

  const [sets, setSets] = useState<WorkoutSet[]>(initialSets);
  const [activeExerciseId, setActiveExerciseId] = useState<string>(() => {
    if (templateItems[0]) return templateItems[0].exercise_id;
    if (initialSets[0]) return initialSets[0].exercise_id;
    return exercises[0]?.id ?? "";
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [name, setName] = useState(workout.name ?? "");
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(!!workout.ended_at);

  const setsByExercise = useMemo(() => {
    const map = new Map<string, WorkoutSet[]>();
    for (const s of sets) {
      if (!map.has(s.exercise_id)) map.set(s.exercise_id, []);
      map.get(s.exercise_id)!.push(s);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.set_number - b.set_number);
    }
    return map;
  }, [sets]);

  const orderedExerciseIds = useMemo(() => {
    const ordered: string[] = [];
    const seen = new Set<string>();
    for (const t of templateItems) {
      if (!seen.has(t.exercise_id)) {
        ordered.push(t.exercise_id);
        seen.add(t.exercise_id);
      }
    }
    for (const s of sets) {
      if (!seen.has(s.exercise_id)) {
        ordered.push(s.exercise_id);
        seen.add(s.exercise_id);
      }
    }
    return ordered;
  }, [templateItems, sets]);

  const totalSets = sets.length;

  async function saveName() {
    if ((name || null) === (workout.name || null)) return;
    await supabase
      .from("workouts")
      .update({ name: name.trim() || null })
      .eq("id", workout.id);
  }

  async function addSet(input: {
    exerciseId: string;
    weight?: number | null;
    reps?: number | null;
    timeSeconds?: number | null;
  }) {
    const existing = setsByExercise.get(input.exerciseId) ?? [];
    const setNumber = existing.length + 1;
    const optimistic: WorkoutSet = {
      id: `tmp-${Date.now()}`,
      workout_id: workout.id,
      exercise_id: input.exerciseId,
      set_number: setNumber,
      reps: input.reps ?? null,
      weight: input.weight ?? null,
      time_seconds: input.timeSeconds ?? null,
      completed_at: new Date().toISOString(),
    };
    setSets((prev) => [...prev, optimistic]);

    const { data, error } = await supabase
      .from("sets")
      .insert({
        workout_id: workout.id,
        exercise_id: input.exerciseId,
        set_number: setNumber,
        reps: input.reps ?? null,
        weight: input.weight ?? null,
        time_seconds: input.timeSeconds ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      setSets((prev) => prev.filter((s) => s.id !== optimistic.id));
      alert(error?.message ?? "Failed to save set");
      return;
    }
    setSets((prev) =>
      prev.map((s) => (s.id === optimistic.id ? (data as WorkoutSet) : s))
    );
  }

  async function deleteSet(id: string) {
    const removed = sets.find((s) => s.id === id);
    if (!removed) return;
    setSets((prev) => prev.filter((s) => s.id !== id));
    await supabase.from("sets").delete().eq("id", id);

    const remaining = sets
      .filter((s) => s.exercise_id === removed.exercise_id && s.id !== id)
      .sort((a, b) => a.set_number - b.set_number);
    await Promise.all(
      remaining.map((s, idx) =>
        supabase.from("sets").update({ set_number: idx + 1 }).eq("id", s.id)
      )
    );
    setSets((prev) =>
      prev.map((s) => {
        if (s.exercise_id !== removed.exercise_id) return s;
        const idx = remaining.findIndex((r) => r.id === s.id);
        return idx === -1 ? s : { ...s, set_number: idx + 1 };
      })
    );
  }

  function handleExerciseAdded(ex: Exercise) {
    setExercises((prev) =>
      prev.some((e) => e.id === ex.id)
        ? prev
        : [...prev, ex].sort((a, b) => a.name.localeCompare(b.name))
    );
    setActiveExerciseId(ex.id);
    setPickerOpen(false);
  }

  async function finish() {
    setBusy(true);
    await supabase
      .from("workouts")
      .update({
        ended_at: new Date().toISOString(),
        name: name.trim() || null,
      })
      .eq("id", workout.id);
    setFinished(true);
    setBusy(false);
    router.push("/");
    router.refresh();
  }

  async function discard() {
    if (!confirm("Discard this workout? All sets will be deleted.")) return;
    setBusy(true);
    await supabase.from("workouts").delete().eq("id", workout.id);
    router.push("/");
    router.refresh();
  }

  const activeExercise = exById.get(activeExerciseId);

  return (
    <div className="space-y-5">
      <PageHeader
        title={finished ? "Workout summary" : name.trim() || "Workout"}
        subtitle={`${formatDateTime(workout.started_at)} · ${totalSets} ${
          totalSets === 1 ? "set" : "sets"
        }`}
      />

      {!finished ? (
        <Card className="p-4">
          <Label>Workout name</Label>
          <Input
            placeholder="e.g. Push day"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
          />
        </Card>
      ) : null}

      {!finished && (
        <Card className="p-5 space-y-5">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <Label className="!mb-0">Logging</Label>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="text-sm font-semibold text-[var(--primary)] active:scale-95 transition"
              >
                + Add exercise
              </button>
            </div>
            <Select
              value={activeExerciseId}
              onChange={(e) => setActiveExerciseId(e.target.value)}
            >
              {exercises.length === 0 ? (
                <option value="">No exercises — tap + Add exercise</option>
              ) : (
                exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))
              )}
            </Select>
          </div>

          {activeExercise ? (
            <SetEntry
              key={activeExercise.id}
              exercise={activeExercise}
              target={templateById.get(activeExercise.id) ?? null}
              previous={(setsByExercise.get(activeExercise.id) ?? []).slice(-1)[0]}
              onAdd={addSet}
            />
          ) : null}
        </Card>
      )}

      <section className="space-y-3">
        {orderedExerciseIds.length === 0 ? (
          <Card className="p-5 text-sm text-[var(--foreground-muted)] text-center">
            Pick an exercise above to start logging.
          </Card>
        ) : (
          orderedExerciseIds.map((exId) => {
            const ex = exById.get(exId);
            if (!ex) return null;
            const exSets = setsByExercise.get(exId) ?? [];
            const target = templateById.get(exId) ?? null;
            const targetText = formatTarget(ex, target);
            const isActive = !finished && exId === activeExerciseId;
            const targetSets = target?.target_sets ?? null;
            const complete =
              targetSets != null && exSets.length >= targetSets && exSets.length > 0;
            return (
              <Card
                key={exId}
                className={clsx(
                  "p-4 transition",
                  isActive && "ring-2 ring-[var(--primary)]/40",
                  complete && !isActive && "ring-1 ring-[var(--primary)]/30"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold truncate">{ex.name}</p>
                      {complete ? (
                        <Badge variant="primary">Done</Badge>
                      ) : null}
                    </div>
                    {targetText ? (
                      <p className="text-xs text-[var(--foreground-muted)]">
                        Target: {targetText}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-xs text-[var(--foreground-muted)] font-semibold tabular-nums">
                      {exSets.length}
                      {target?.target_sets ? ` / ${target.target_sets}` : ""}
                    </p>
                    {!finished && !isActive ? (
                      <button
                        onClick={() => {
                          setActiveExerciseId(exId);
                          setPickerOpen(false);
                        }}
                        className="text-xs text-[var(--primary)] font-semibold px-2"
                      >
                        Log
                      </button>
                    ) : null}
                  </div>
                </div>

                {exSets.length === 0 ? (
                  <p className="text-sm text-[var(--foreground-subtle)]">
                    No sets yet.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {exSets.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between py-1.5 px-3 rounded-[10px] bg-[var(--surface-2)]"
                      >
                        <span className="text-[var(--foreground-muted)] text-xs font-semibold w-6 tabular-nums">
                          {s.set_number}
                        </span>
                        <span className="flex-1 font-semibold tabular-nums text-center">
                          {formatSetValue(s, ex)}
                        </span>
                        {!finished ? (
                          <button
                            onClick={() => deleteSet(s.id)}
                            className="text-[var(--foreground-subtle)] hover:text-[var(--danger)] text-xs px-1"
                            aria-label="Delete set"
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })
        )}
      </section>

      {!finished ? (
        <div className="fixed bottom-20 left-0 right-0 z-20 px-4 pointer-events-none">
          <div className="max-w-xl mx-auto flex gap-2 pointer-events-auto">
            <Button variant="secondary" onClick={discard} disabled={busy}>
              Discard
            </Button>
            <Button onClick={finish} disabled={busy} className="flex-1">
              {busy ? "Finishing…" : "Finish workout"}
            </Button>
          </div>
        </div>
      ) : null}

      <AddExerciseSheet
        open={pickerOpen}
        existingNames={existingNames}
        onAdded={handleExerciseAdded}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}

function formatSetValue(s: WorkoutSet, ex: Exercise) {
  if (ex.kind === "weight") {
    const w = s.weight ?? 0;
    const r = s.reps ?? 0;
    return `${w} × ${r}`;
  }
  if (ex.kind === "time") {
    return formatTime(s.time_seconds);
  }
  return `${s.reps ?? 0} reps`;
}

function formatTarget(
  ex: Exercise,
  target: TemplateExercise | null
): string | null {
  if (!target) return null;
  const sets = target.target_sets;
  if (ex.kind === "weight") {
    if (sets && target.target_reps) return `${sets} × ${target.target_reps}`;
    if (sets) return `${sets} sets`;
    return null;
  }
  if (ex.kind === "reps") {
    if (sets && target.target_reps)
      return `${sets} × ${target.target_reps} reps`;
    if (sets) return `${sets} × failure`;
    return null;
  }
  if (ex.kind === "time") {
    if (sets && target.target_time_seconds)
      return `${sets} × ${formatTime(target.target_time_seconds)}`;
    if (target.target_time_seconds)
      return formatTime(target.target_time_seconds);
    if (sets) return `${sets} sets`;
    return null;
  }
  return null;
}

function SetEntry({
  exercise,
  previous,
  target,
  onAdd,
}: {
  exercise: Exercise;
  previous: WorkoutSet | undefined;
  target: TemplateExercise | null;
  onAdd: (input: {
    exerciseId: string;
    weight?: number | null;
    reps?: number | null;
    timeSeconds?: number | null;
  }) => Promise<void>;
}) {
  // Initial values: previous set first, then template target, then sane defaults.
  const [weight, setWeight] = useState<number>(() => {
    if (exercise.kind !== "weight") return 0;
    if (previous?.weight != null) return previous.weight;
    return 0;
  });
  const [reps, setReps] = useState<number>(() => {
    if (exercise.kind === "time") return 0;
    if (previous?.reps != null) return previous.reps;
    if (target?.target_reps != null) return target.target_reps;
    return exercise.kind === "weight" ? 10 : 12;
  });
  const [timeSeconds, setTimeSeconds] = useState<number>(() => {
    if (exercise.kind !== "time") return 0;
    if (previous?.time_seconds != null) return previous.time_seconds;
    if (target?.target_time_seconds != null) return target.target_time_seconds;
    return 30;
  });
  const [busy, setBusy] = useState(false);

  const weightStep = 2;

  async function submit() {
    setBusy(true);
    try {
      if (exercise.kind === "weight") {
        await onAdd({
          exerciseId: exercise.id,
          weight,
          reps,
        });
      } else if (exercise.kind === "reps") {
        await onAdd({ exerciseId: exercise.id, reps });
      } else {
        await onAdd({ exerciseId: exercise.id, timeSeconds });
      }
    } finally {
      setBusy(false);
    }
  }

  function copyLast() {
    if (!previous) return;
    if (exercise.kind === "weight") {
      if (previous.weight != null) setWeight(previous.weight);
      if (previous.reps != null) setReps(previous.reps);
    } else if (exercise.kind === "reps") {
      if (previous.reps != null) setReps(previous.reps);
    } else {
      if (previous.time_seconds != null) setTimeSeconds(previous.time_seconds);
    }
  }

  return (
    <div className="space-y-5">
      {exercise.kind === "weight" ? (
        <div className="space-y-5">
          <NumberStepper
            label="Weight"
            value={weight}
            onChange={setWeight}
            step={weightStep}
            min={0}
            unit="kg"
          />
          <div className="h-px bg-[var(--border)]" />
          <NumberStepper
            label="Reps"
            value={reps}
            onChange={setReps}
            step={1}
            min={0}
            unit="reps"
          />
        </div>
      ) : exercise.kind === "reps" ? (
        <NumberStepper
          label="Reps"
          value={reps}
          onChange={setReps}
          step={1}
          min={0}
          unit="reps"
        />
      ) : (
        <TimeStepper
          label="Time"
          totalSeconds={timeSeconds}
          onChange={setTimeSeconds}
        />
      )}

      <div className="flex gap-2">
        {previous ? (
          <Button
            type="button"
            variant="secondary"
            onClick={copyLast}
            disabled={busy}
            className="shrink-0"
          >
            Same as last
          </Button>
        ) : null}
        <Button
          type="button"
          onClick={submit}
          disabled={busy}
          size="lg"
          className="flex-1"
        >
          {busy ? "Logging…" : "Log set"}
        </Button>
      </div>
    </div>
  );
}
