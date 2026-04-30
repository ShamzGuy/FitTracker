"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Button,
  Card,
  Input,
  Label,
  PageHeader,
  Select,
} from "@/components/ui";
import { AddExerciseSheet } from "@/components/AddExerciseSheet";
import { formatDateTime, formatTime, parseTimeInput } from "@/lib/format";
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
  const [showPicker, setShowPicker] = useState(false);
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

  // Order: template order first, then any extra exercises that have sets logged.
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
    setShowPicker(false);
  }

  async function finish() {
    setBusy(true);
    await supabase
      .from("workouts")
      .update({ ended_at: new Date().toISOString(), name: name.trim() || null })
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
        title={finished ? "Workout summary" : "Workout"}
        subtitle={formatDateTime(workout.started_at)}
      />

      <Card className="p-4 space-y-3">
        <div>
          <Label>Name</Label>
          <Input
            placeholder="e.g. Push day"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            disabled={finished}
          />
        </div>
      </Card>

      {!finished && (
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
                <Label className="!mb-0">Exercise</Label>
                <button
                  type="button"
                  onClick={() => setShowPicker(true)}
                  className="text-sm font-medium text-[var(--primary)]"
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
              {activeExercise ? (
                <SetEntry
                  key={activeExercise.id}
                  exercise={activeExercise}
                  target={templateById.get(activeExercise.id) ?? null}
                  previous={(setsByExercise.get(activeExercise.id) ?? []).slice(-1)[0]}
                  onAdd={addSet}
                />
              ) : null}
            </>
          )}
        </Card>
      )}

      <section className="space-y-3">
        {orderedExerciseIds.length === 0 ? (
          <Card className="p-4 text-sm text-[var(--muted)]">
            No sets logged yet. Pick an exercise above to start.
          </Card>
        ) : (
          orderedExerciseIds.map((exId) => {
            const ex = exById.get(exId);
            if (!ex) return null;
            const exSets = setsByExercise.get(exId) ?? [];
            const target = templateById.get(exId) ?? null;
            const targetText = formatTarget(ex, target);
            const isActive = !finished && exId === activeExerciseId;
            return (
              <Card
                key={exId}
                className={
                  isActive
                    ? "p-4 border-[var(--primary)]/50"
                    : "p-4"
                }
              >
                <div className="flex items-center justify-between mb-2 gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{ex.name}</p>
                    {targetText ? (
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        Target: {targetText}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-xs text-[var(--muted)]">
                      {exSets.length}
                      {target?.target_sets ? `/${target.target_sets}` : ""} set
                      {exSets.length === 1 ? "" : "s"}
                    </p>
                    {!finished && !isActive ? (
                      <button
                        onClick={() => {
                          setActiveExerciseId(exId);
                          setShowPicker(false);
                        }}
                        className="text-xs text-[var(--primary)] font-medium px-2"
                      >
                        Log
                      </button>
                    ) : null}
                  </div>
                </div>
                {exSets.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">No sets yet.</p>
                ) : (
                  <ul className="divide-y divide-[var(--border)]">
                    {exSets.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between py-2 text-sm"
                      >
                        <span className="text-[var(--muted)] w-6">
                          {s.set_number}.
                        </span>
                        <span className="flex-1 font-medium">
                          {formatSetValue(s, ex)}
                        </span>
                        {!finished ? (
                          <button
                            onClick={() => deleteSet(s.id)}
                            className="text-[var(--muted)] text-xs px-2"
                            aria-label="Delete set"
                          >
                            ✕
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
        <div className="flex gap-2 sticky bottom-16 z-10">
          <Button variant="secondary" onClick={discard} disabled={busy}>
            Discard
          </Button>
          <Button onClick={finish} disabled={busy} className="flex-1">
            {busy ? "Finishing…" : "Finish workout"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function formatSetValue(s: WorkoutSet, ex: Exercise) {
  if (ex.kind === "weight") {
    return `${s.weight ?? 0} × ${s.reps ?? 0}`;
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
    if (sets && target.target_reps) return `${sets} × ${target.target_reps} reps`;
    if (sets) return `${sets} × failure`;
    return null;
  }
  if (ex.kind === "time") {
    if (sets && target.target_time_seconds)
      return `${sets} × ${formatTime(target.target_time_seconds)}`;
    if (target.target_time_seconds) return formatTime(target.target_time_seconds);
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
  // Component is keyed on exercise.id, so initial values come from the
  // most recent set for that exercise — or fall back to the template target.
  const [weight, setWeight] = useState(() =>
    exercise.kind === "weight" && previous?.weight != null
      ? String(previous.weight)
      : ""
  );
  const [reps, setReps] = useState(() => {
    if (exercise.kind !== "weight" && exercise.kind !== "reps") return "";
    if (previous?.reps != null) return String(previous.reps);
    if (target?.target_reps != null) return String(target.target_reps);
    return "";
  });
  const [timeStr, setTimeStr] = useState(() => {
    if (exercise.kind !== "time") return "";
    if (previous?.time_seconds != null) return formatTime(previous.time_seconds);
    if (target?.target_time_seconds != null)
      return formatTime(target.target_time_seconds);
    return "";
  });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (exercise.kind === "weight") {
        await onAdd({
          exerciseId: exercise.id,
          weight: weight ? parseFloat(weight) : null,
          reps: reps ? parseInt(reps, 10) : null,
        });
      } else if (exercise.kind === "reps") {
        await onAdd({
          exerciseId: exercise.id,
          reps: reps ? parseInt(reps, 10) : null,
        });
      } else {
        const seconds = parseTimeInput(timeStr);
        await onAdd({ exerciseId: exercise.id, timeSeconds: seconds });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {exercise.kind === "weight" ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Weight</Label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.5"
              placeholder={previous?.weight != null ? String(previous.weight) : "kg / lb"}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div>
            <Label>Reps</Label>
            <Input
              type="number"
              inputMode="numeric"
              placeholder={
                previous?.reps != null
                  ? String(previous.reps)
                  : target?.target_reps
                  ? String(target.target_reps)
                  : "reps"
              }
              value={reps}
              onChange={(e) => setReps(e.target.value)}
            />
          </div>
        </div>
      ) : exercise.kind === "reps" ? (
        <div>
          <Label>Reps</Label>
          <Input
            type="number"
            inputMode="numeric"
            placeholder={
              previous?.reps != null
                ? String(previous.reps)
                : target?.target_reps
                ? String(target.target_reps)
                : "reps"
            }
            value={reps}
            onChange={(e) => setReps(e.target.value)}
          />
        </div>
      ) : (
        <div>
          <Label>Time (mm:ss or seconds)</Label>
          <Input
            inputMode="numeric"
            placeholder={
              target?.target_time_seconds
                ? formatTime(target.target_time_seconds)
                : "e.g. 1:30 or 90"
            }
            value={timeStr}
            onChange={(e) => setTimeStr(e.target.value)}
          />
        </div>
      )}
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Adding…" : "Log set"}
      </Button>
    </form>
  );
}
