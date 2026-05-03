import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, LinkButton, PageHeader, SectionTitle } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { StartWorkoutButton } from "@/components/StartWorkoutButton";
import { SeedPlanButton } from "@/components/SeedPlanButton";
import { EditNameButton } from "@/components/EditNameButton";
import { getPlanForName } from "@/lib/exerciseCatalog";
import type { Template, Workout } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  const [templatesRes, workoutsRes, activeRes, userRes] = await Promise.all([
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
    supabase.auth.getUser(),
  ]);

  const templates = (templatesRes.data ?? []) as Template[];
  const recent = (workoutsRes.data ?? []) as Workout[];
  const active = activeRes.data as Workout | null;
  const userName =
    (userRes.data?.user?.user_metadata?.name as string | undefined)?.trim() ??
    "";
  const plan = getPlanForName(userName);

  return (
    <div className="space-y-7">
      <PageHeader
        title={userName ? `${greeting()}, ${userName}` : greeting()}
        subtitle={subtitle()}
      />

      {userName ? (
        <div className="-mt-4 flex justify-end items-center gap-3">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-[var(--foreground-muted)] hover:text-[var(--primary)] hover:underline"
          >
            Household dashboard →
          </Link>
          <span className="text-[var(--foreground-subtle)] text-[10px]">·</span>
          <EditNameButton currentName={userName} />
        </div>
      ) : null}

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
            <p className="font-semibold">{plan.ctaLabel}</p>
            <p className="text-sm text-[var(--foreground-muted)] mt-1 mb-4">
              {plan.description}
            </p>
            <SeedPlanButton label={plan.ctaLabel} plan={plan.days} />
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {templates.slice(0, 8).map((t) => (
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
