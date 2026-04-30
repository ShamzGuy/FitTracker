import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { ExerciseManager } from "@/components/ExerciseManager";
import type { Exercise } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ExercisesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercises")
    .select("*")
    .order("name", { ascending: true });

  const exercises = (data ?? []) as Exercise[];

  return (
    <div>
      <PageHeader
        title="Exercises"
        subtitle="Your library of exercises and how they're measured."
      />
      <ExerciseManager initial={exercises} />
    </div>
  );
}
