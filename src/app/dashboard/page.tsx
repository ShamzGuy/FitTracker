import { Card, PageHeader } from "@/components/ui";
import { PersonSection } from "@/components/dashboard/PersonSection";
import {
  PERSON_COLORS,
  computePersonStats,
  loadDashboardData,
  type Person,
  type PersonStats,
} from "@/lib/dashboard";
import { signOutAction } from "./actions";
import { isAuthorized } from "./auth";
import { PinForm } from "./PinForm";

export const dynamic = "force-dynamic";

type Enriched = { person: Person; stats: PersonStats };

export default async function DashboardPage() {
  if (!(await isAuthorized())) {
    return <PinForm />;
  }

  let people: Person[] = [];
  let loadError: string | null = null;
  try {
    people = await loadDashboardData();
  } catch (e) {
    loadError =
      e instanceof Error
        ? e.message
        : "Could not load dashboard data. Check service-role key.";
  }

  const enriched: Enriched[] = people.map((p) => ({
    person: p,
    stats: computePersonStats(p),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Household dashboard"
        subtitle={subtitle()}
        action={
          <form action={signOutAction}>
            <button
              type="submit"
              className="text-xs font-semibold text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:underline"
            >
              Sign out
            </button>
          </form>
        }
      />

      {loadError ? (
        <Card className="p-5 border-[var(--danger)]/30 bg-[var(--danger)]/5">
          <p className="font-semibold text-sm">Couldn&rsquo;t load data</p>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            {loadError}
          </p>
        </Card>
      ) : null}

      {!loadError && enriched.length === 0 ? (
        <Card className="p-5">
          <p className="font-semibold">No household members found</p>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            Open the app on your phones first and enter your names — the
            dashboard recognizes &ldquo;Shameed&rdquo; and &ldquo;Sharu&rdquo;.
          </p>
        </Card>
      ) : null}

      {enriched.length >= 2 ? (
        <ComparisonStrip people={enriched} />
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 md:items-start">
        {enriched.map(({ person, stats }) => (
          <PersonSection
            key={person.name}
            person={person}
            stats={stats}
            color={PERSON_COLORS[person.name]}
          />
        ))}
      </div>
    </div>
  );
}

function ComparisonStrip({ people }: { people: Enriched[] }) {
  return (
    <Card className="p-5">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--foreground-muted)] mb-3">
        This week — head to head
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {people.map(({ person, stats }) => (
          <div key={person.name} className="text-center">
            <p
              className="text-4xl font-bold tabular-nums"
              style={{ color: PERSON_COLORS[person.name] }}
            >
              {stats.thisWeek}
            </p>
            <p className="text-xs text-[var(--foreground-muted)] mt-1 font-semibold uppercase tracking-wider">
              {person.name}
            </p>
            {stats.streakWeeks > 0 ? (
              <p className="text-[10px] text-[var(--foreground-subtle)] mt-1">
                {stats.streakWeeks}-week streak
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}

function subtitle() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
