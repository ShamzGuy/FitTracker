import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, LinkButton, PageHeader, SectionTitle } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { StartWorkoutButton } from "@/components/StartWorkoutButton";
import { SeedPlanButton } from "@/components/SeedPlanButton";
import type { Template, Workout } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  const [templatesRes, workoutsRes, activeRes] = await Promise.all([
    supabase
      .from("templates")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("workouts")
      .select("*")
      .not("ended_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(5),
    supabase
      .from("workouts")
      .select("*")
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const templates = (templatesRes.data ?? []) as Template[];
  const recent = (workoutsRes.data ?? []) as Workout[];
  const active = activeRes.data as Workout | null;

  return (
    <div className="space-y-7">
      <PageHeader title={greeting()} subtitle={subtitle()} />

      {active ? (
        <Card className="p-5 border-[var(--primary)]/40 bg-[var(--primary-soft)]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
                <p className="text-[11px] uppercase tracking-wider text-[var(--primary)] font-bold">
                  In progress
                </p>
              </div>
              <p className="font-semibold text-lg truncate">
                {active.name ?? "Untitled workout"}
              </p>
              <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                Started {formatDateTime(active.started_at)}
              </p>
            </div>
            <LinkButton href={`/workout/${active.id}`} size="md">
              Resume
            </LinkButton>
          </div>
        </Card>
      ) : (
        <Card className="p-5">
          <p className="font-semibold text-lg">Start a workout</p>
          <p className="text-sm text-[var(--foreground-muted)] mt-1 mb-4">
            Begin an empty session, or pick a plan below.
          </p>
          <StartWorkoutButton />
        </Card>
      )}

      <section>
        <SectionTitle
          action={
            <Link
              href="/templates"
              className="text-sm text-[var(--primary)] font-semibold"
            >
              Manage
            </Link>
          }
        >
          Plans
        </SectionTitle>
        {templates.length === 0 ? (
          <Card className="p-5 border-[var(--primary)]/30 bg-[var(--primary-soft)]">
            <p className="font-semibold">Import the 4-day plan</p>
            <p className="text-sm text-[var(--foreground-muted)] mt-1 mb-4">
              Adds Chest &amp; Triceps, Back &amp; Biceps, Legs &amp; Cardio,
              and Shoulders &amp; Arms — pre-loaded with the right exercises
              and targets.
            </p>
            <SeedPlanButton label="Import 4-day plan" />
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {templates.slice(0, 6).map((t) => (
              <StartWorkoutButton
                key={t.id}
                templateId={t.id}
                label={t.name}
                variant="secondary"
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle
          action={
            <Link
              href="/history"
              className="text-sm text-[var(--primary)] font-semibold"
            >
              View all
            </Link>
          }
        >
          Recent
        </SectionTitle>
        {recent.length === 0 ? (
          <Card className="p-5 text-sm text-[var(--foreground-muted)]">
            No completed workouts yet — your history will show up here.
          </Card>
        ) : (
          <div className="space-y-2">
            {recent.map((w) => (
              <Link key={w.id} href={`/workout/${w.id}`} className="block">
                <Card className="p-4 hover:border-[var(--primary)]/50 transition">
                  <p className="font-semibold">{w.name ?? "Workout"}</p>
                  <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                    {formatDateTime(w.started_at)}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function subtitle() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
