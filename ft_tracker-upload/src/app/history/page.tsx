import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { HistoryView } from "@/components/HistoryView";
import type { Exercise, Workout, WorkoutSet } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ exercise?: string }>;
}) {
  const supabase = await createClient();
  const { exercise: selectedId } = await searchParams;

  const [exRes, workoutsRes] = await Promise.all([
    supabase.from("exercises").select("*").order("name", { ascending: true }),
    supabase
      .from("workouts")
      .select("*")
      .not("ended_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(50),
  ]);

  const exercises = (exRes.data ?? []) as Exercise[];
  const workouts = (workoutsRes.data ?? []) as Workout[];

  let setsForExercise: WorkoutSet[] = [];
  const focused = selectedId
    ? exercises.find((e) => e.id === selectedId)
    : exercises[0];

  if (focused) {
    const { data } = await supabase
      .from("sets")
      .select("*")
      .eq("exercise_id", focused.id)
      .order("completed_at", { ascending: true });
    setsForExercise = (data ?? []) as WorkoutSet[];
  }

  return (
    <div>
      <PageHeader
        title="History"
        subtitle="Your progress over time."
      />
      <HistoryView
        exercises={exercises}
        focused={focused ?? null}
        sets={setsForExercise}
        workouts={workouts}
      />
    </div>
  );
}
