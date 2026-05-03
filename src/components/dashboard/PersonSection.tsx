import { Card } from "@/components/ui";
import { formatDateTime, formatTime } from "@/lib/format";
import type { Person, PersonStats } from "@/lib/dashboard";
import { ProgressChart } from "./ProgressChart";
import { WeeklyChart } from "./WeeklyChart";

export function PersonSection({
  person,
  stats,
  color,
}: {
  person: Person;
  stats: PersonStats;
  color: string;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-3 px-1">
        <h2 className="text-xl font-bold tracking-tight">{person.name}</h2>
        <span className="text-xs text-[var(--foreground-muted)]">
          {stats.totalCompleted} workout
          {stats.totalCompleted === 1 ? "" : "s"} all-time
        </span>
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="This week" value={String(stats.thisWeek)} color={color} />
          <Stat label="This month" value={String(stats.thisMonth)} />
          <Stat
            label="Streak"
            value={`${stats.streakWeeks}w`}
            color={stats.streakWeeks > 0 ? color : undefined}
          />
        </div>
        <div className="mt-5">
          <p className="text-[10px] uppercase tracking-wider text-[var(--foreground-muted)] font-semibold mb-2 px-1">
            Last 8 weeks
          </p>
          <WeeklyChart data={stats.weekly} color={color} />
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--foreground-muted)] mb-3">
          Recent
        </h3>
        {stats.recent.length === 0 ? (
          <p className="text-sm text-[var(--foreground-muted)]">
            No completed workouts yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {stats.recent.map((w) => (
              <li
                key={w.id}
                className="flex items-baseline justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold truncate text-sm">{w.name}</p>
                  <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">
                    {formatDateTime(w.startedAt)}
                  </p>
                </div>
                <p className="text-[11px] text-[var(--foreground-muted)] shrink-0 tabular-nums">
                  {w.setCount} sets
                  {w.durationSec ? ` · ${formatTime(w.durationSec)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {stats.topExercises.length > 0 ? (
        <Card className="p-5">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--foreground-muted)] mb-4">
            Top exercises · progress
          </h3>
          <div className="space-y-5">
            {stats.topExercises.map((ex) => (
              <ProgressChart key={ex.id} exercise={ex} color={color} />
            ))}
          </div>
        </Card>
      ) : null}
    </section>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div>
      <p
        className="text-3xl font-bold tabular-nums"
        style={color ? { color } : undefined}
      >
        {value}
      </p>
      <p className="text-[10px] mt-1 uppercase tracking-wider text-[var(--foreground-muted)] font-semibold">
        {label}
      </p>
    </div>
  );
}
