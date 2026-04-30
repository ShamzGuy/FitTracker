import { createClient } from "@/lib/supabase/server";
import { Card, LinkButton, PageHeader } from "@/components/ui";
import { TemplatesList } from "@/components/TemplatesList";
import { SeedPlanButton } from "@/components/SeedPlanButton";
import { WORKOUT_PLAN } from "@/lib/exerciseCatalog";
import type { Template, TemplateExercise, Exercise } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const supabase = await createClient();

  const [tplRes, teRes, exRes] = await Promise.all([
    supabase.from("templates").select("*").order("created_at", { ascending: false }),
    supabase.from("template_exercises").select("*"),
    supabase.from("exercises").select("*"),
  ]);

  const templates = (tplRes.data ?? []) as Template[];
  const tplExercises = (teRes.data ?? []) as TemplateExercise[];
  const exercises = (exRes.data ?? []) as Exercise[];

  const exById = new Map(exercises.map((e) => [e.id, e]));

  const enriched = templates.map((t) => {
    const items = tplExercises
      .filter((te) => te.template_id === t.id)
      .sort((a, b) => a.position - b.position)
      .map((te) => exById.get(te.exercise_id)?.name ?? "Unknown")
      .filter(Boolean);
    return { ...t, exercises: items };
  });

  // Show the seed CTA whenever any of the four day-templates is missing.
  const tplNames = new Set(templates.map((t) => t.name.toLowerCase()));
  const planMissing = WORKOUT_PLAN.some(
    (d) => !tplNames.has(d.name.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Templates"
        subtitle="Reusable workouts you run often."
        action={
          <LinkButton href="/templates/new" variant="secondary">
            New
          </LinkButton>
        }
      />

      {planMissing ? (
        <Card className="p-5 border-[var(--primary)]/30 bg-[var(--primary-soft)]">
          <p className="font-semibold">Import the 4-day plan</p>
          <p className="text-sm text-[var(--foreground-muted)] mt-1 mb-4">
            Adds Chest &amp; Triceps, Back &amp; Biceps, Legs &amp; Cardio,
            and Shoulders &amp; Arms — pre-loaded with the right exercises
            and targets.
          </p>
          <SeedPlanButton label="Import 4-day plan" />
        </Card>
      ) : null}

      <TemplatesList templates={enriched} />
    </div>
  );
}
