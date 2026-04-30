import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkoutScreen } from "@/components/WorkoutScreen";
import type {
  Exercise,
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

  return (
    <WorkoutScreen
      workout={workout}
      initialSets={sets}
      exercises={exercises}
      templateItems={templateItems}
    />
  );
}
