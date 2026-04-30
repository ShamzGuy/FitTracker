import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, LinkButton, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { StartWorkoutButton } from "@/components/StartWorkoutButton";
import { SeedPlanButton } from "@/components/SeedPlanButton";
import type { Template, Workout } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    <div className="space-y-6">
      <PageHeader
        title={greeting()}
        subtitle={user?.email ?? ""}
        action={
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Sign out
            </button>
          </form>
        }
      />

      {active ? (
        <Card className="p-4 border-[var(--primary)]/40 bg-[var(--primary)]/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">
                Workout in progress
              </p>
              <p className="font-medium mt-0.5">
                {active.name ?? "Untitled workout"}
              </p>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Started {formatDateTime(active.started_at)}
              </p>
            </div>
            <LinkButton href={`/workout/${active.id}`}>Resume</LinkButton>
          </div>
        </Card>
      ) : (
        <Card className="p-4">
          <p className="font-medium">Start a workout</p>
          <p className="text-sm text-[var(--muted)] mt-0.5 mb-4">
            Begin an empty session, or pick a template below.
          </p>
          <StartWorkoutButton />
        </Card>
      )}

      <section>
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">
            Templates
          </h2>
          <Link
            href="/templates"
            className="text-sm text-[var(--primary)] font-medium"
          >
            Manage
          </Link>
        </div>
        {templates.length === 0 ? (
          <Card className="p-4 bg-[var(--primary)]/5 border-[var(--primary)]/30">
            <p className="font-medium">Import the 4-day workout plan</p>
            <p className="text-sm text-[var(--muted)] mt-0.5 mb-3">
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
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">
            Recent
          </h2>
          <Link
            href="/history"
            className="text-sm text-[var(--primary)] font-medium"
          >
            All history
          </Link>
        </div>
        {recent.length === 0 ? (
          <Card className="p-4 text-sm text-[var(--muted)]">
            No completed workouts yet — your history will show up here.
          </Card>
        ) : (
          <div className="space-y-2">
            {recent.map((w) => (
              <Link key={w.id} href={`/workout/${w.id}`} className="block">
                <Card className="p-3 hover:border-[var(--primary)]/50 transition">
                  <p className="font-medium">{w.name ?? "Workout"}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
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
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
