import { createClient } from "@/lib/supabase/server";
import { Card, LinkButton, PageHeader } from "@/components/ui";
import { TemplatesList } from "@/components/TemplatesList";
import { SeedPlanButton } from "@/components/SeedPlanButton";
import { getPlanForName } from "@/lib/exerciseCatalog";
import type { Template, TemplateExercise, Exercise } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const supabase = await createClient();

  const [tplRes, teRes, exRes, userRes] = await Promise.all([
    supabase.from("templates").select("*").order("created_at", { ascending: false }),
    supabase.from("template_exercises").select("*"),
    supabase.from("exercises").select("*"),
    supabase.auth.getUser(),
  ]);

  const templates = (tplRes.data ?? []) as Template[];
  const tplExercises = (teRes.data ?? []) as TemplateExercise[];
  const exercises = (exRes.data ?? []) as Exercise[];
  const userName =
    (userRes.data?.user?.user_metadata?.name as string | undefined)?.trim() ??
    "";
  const plan = getPlanForName(userName);

  const exById = new Map(exercises.map((e) => [e.id, e]));

  const enriched = templates.map((t) => {
    const items = tplExercises
      .filter((te) => te.template_id === t.id)
      .sort((a, b) => a.position - b.position)
      .map((te) => exById.get(te.exercise_id)?.name ?? "Unknown")
      .filter(Boolean);
    return { ...t, exercises: items };
  });

  // Show the seed CTA whenever any day-template from the user's plan is missing.
  const tplNames = new Set(templates.map((t) => t.name.toLowerCase()));
  const planMissing = plan.days.some(
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
          <p className="font-semibold">{plan.ctaLabel}</p>
          <p className="text-sm text-[var(--foreground-muted)] mt-1 mb-4">
            {plan.description}
          </p>
          <SeedPlanButton label={plan.ctaLabel} plan={plan.days} />
        </Card>
      ) : null}

      <TemplatesList templates={enriched} />
    </div>
  );
}
