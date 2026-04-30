import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { TemplateEditor } from "@/components/TemplateEditor";
import type { Template, TemplateExercise, Exercise } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [tplRes, teRes, exRes] = await Promise.all([
    supabase.from("templates").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("template_exercises")
      .select("*")
      .eq("template_id", id)
      .order("position", { ascending: true }),
    supabase.from("exercises").select("*").order("name", { ascending: true }),
  ]);

  if (!tplRes.data) notFound();

  const template = tplRes.data as Template;
  const items = (teRes.data ?? []) as TemplateExercise[];
  const exercises = (exRes.data ?? []) as Exercise[];

  return (
    <div>
      <PageHeader title={template.name} subtitle="Template" />
      <TemplateEditor
        template={template}
        initialItems={items}
        exercises={exercises}
      />
    </div>
  );
}
