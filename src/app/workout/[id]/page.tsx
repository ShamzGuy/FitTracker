import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkoutScreen } from "@/components/WorkoutScreen";
import type {
  Exercise,
  LastBest,
  TemplateExercise,
  Workout,
  WorkoutSet,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [wRes, setsRes, exRes] = await Promise.all([
    supabase.from("workouts").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("sets")
      .select("*")
      .eq("workout_id", id)
      .order("completed_at", { ascending: true }),
    supabase.from("exercises").select("*").order("name", { ascending: true }),
  ]);

  if (!wRes.data) notFound();

  const workout = wRes.data as Workout;
  const sets = (setsRes.data ?? []) as WorkoutSet[];
  const exercises = (exRes.data ?? []) as Exercise[];

  let templateItems: TemplateExercise[] = [];
  if (workout.template_id) {
    const { data } = await supabase
      .from("template_exercises")
      .select("*")
      .eq("template_id", workout.template_id)
      .order("position", { ascending: true });
    templateItems = (data ?? []) as TemplateExercise[];
  }

  // For every exercise that may appear in this workout, look up the
  // most recent prior workout that touched it and capture the best
  // weight / reps / time across that session. Used to pre-fill defaults
  // so the user always has something to beat.
  const exerciseIds = new Set<string>();
  for (const t of templateItems) exerciseIds.add(t.exercise_id);
  for (const s of sets) exerciseIds.add(s.exercise_id);

  const lastByExercise: Record<string, LastBest> = {};
  await Promise.all(
    Array.from(exerciseIds).map(async (exId) => {
      // RLS scopes this to the current user's sets.
      const { data } = await supabase
        .from("sets")
        .select("workout_id, weight, reps, time_seconds")
        .eq("exercise_id", exId)
        .neq("workout_id", id)
        .order("completed_at", { ascending: false })
        .limit(40);
      if (!data || data.length === 0) return;
      const lastWorkoutId = data[0].workout_id;
      const lastSets = data.filter((s) => s.workout_id === lastWorkoutId);
      lastByExercise[exId] = {
        weight: maxOrNull(lastSets.map((s) => s.weight)),
        reps: maxOrNull(lastSets.map((s) => s.reps)),
        time_seconds: maxOrNull(lastSets.map((s) => s.time_seconds)),
      };
    })
  );

  return (
    <WorkoutScreen
      workout={workout}
      initialSets={sets}
      exercises={exercises}
      templateItems={templateItems}
      lastByExercise={lastByExercise}
    />
  );
}

function maxOrNull(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => typeof v === "number");
  return nums.length ? Math.max(...nums) : null;
}
