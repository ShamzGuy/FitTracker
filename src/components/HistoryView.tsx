"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, EmptyState, SectionTitle, Select } from "@/components/ui";
import { formatDateTime, formatTime } from "@/lib/format";
import type { Exercise, Workout, WorkoutSet } from "@/lib/types";

export function HistoryView({
  exercises,
  focused,
  sets,
  workouts,
}: {
  exercises: Exercise[];
  focused: Exercise | null;
  sets: WorkoutSet[];
  workouts: Workout[];
}) {
  const router = useRouter();

  const chartData = useMemo(() => {
    if (!focused) return [];
    const byDay = new Map<string, number>();
    for (const s of sets) {
      const day = s.completed_at.slice(0, 10);
      let value = 0;
      if (focused.kind === "weight") {
        value = (s.weight ?? 0) * (s.reps ?? 0);
      } else if (focused.kind === "reps") {
        value = s.reps ?? 0;
      } else {
        value = s.time_seconds ?? 0;
      }
      byDay.set(day, Math.max(byDay.get(day) ?? 0, value));
    }
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value }));
  }, [focused, sets]);

  const valueLabel =
    focused?.kind === "weight"
      ? "Volume (weight × reps)"
      : focused?.kind === "reps"
      ? "Max reps"
      : "Best time";

  if (exercises.length === 0) {
    return (
      <EmptyState
        title="No data yet"
        description="Log a workout to see your history and progress here."
      />
    );
  }

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)] mb-2">
          Exercise
        </p>
        <Select
          value={focused?.id ?? ""}
          onChange={(e) => router.push(`/history?exercise=${e.target.value}`)}
        >
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </Select>
      </Card>

      {focused ? (
        <Card className="p-4">
          <p className="font-semibold">{focused.name}</p>
          <p className="text-xs text-[var(--foreground-muted)] mt-0.5 mb-3">
            {valueLabel}
          </p>
          {chartData.length === 0 ? (
            <p className="text-sm text-[var(--foreground-muted)]">
              No sets logged yet.
            </p>
          ) : (
            <div className="h-56 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) =>
                      new Date(d).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })
                    }
                    stroke="var(--foreground-muted)"
                    fontSize={11}
                  />
                  <YAxis
                    stroke="var(--foreground-muted)"
                    fontSize={11}
                    width={40}
                    tickFormatter={(v) =>
                      focused.kind === "time" ? formatTime(v) : String(v)
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(v) => {
                      const num = typeof v === "number" ? v : Number(v);
                      return focused.kind === "time" ? formatTime(num) : num;
                    }}
                    labelFormatter={(d) =>
                      new Date(d as string).toLocaleDateString()
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "var(--primary)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      ) : null}

      <section>
        <SectionTitle>All workouts</SectionTitle>
        {workouts.length === 0 ? (
          <Card className="p-4 text-sm text-[var(--foreground-muted)]">
            No completed workouts yet.
          </Card>
        ) : (
          <ul className="space-y-2">
            {workouts.map((w) => (
              <li key={w.id}>
                <Link href={`/workout/${w.id}`}>
                  <Card className="p-3 hover:border-[var(--primary)]/50 transition">
                    <p className="font-semibold">{w.name ?? "Workout"}</p>
                    <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                      {formatDateTime(w.started_at)}
                    </p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
