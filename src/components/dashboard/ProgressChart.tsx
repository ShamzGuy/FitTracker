"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatTime } from "@/lib/format";
import type { TopExercise } from "@/lib/dashboard";

export function ProgressChart({
  exercise,
  color,
}: {
  exercise: TopExercise;
  color: string;
}) {
  const isTime = exercise.kind === "time";
  const unitLabel =
    exercise.kind === "weight"
      ? "Volume (kg×reps)"
      : exercise.kind === "reps"
      ? "Max reps"
      : "Best time";
  const headlineValue =
    exercise.latest != null
      ? isTime
        ? formatTime(exercise.latest)
        : String(exercise.latest)
      : "—";

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5 gap-2">
        <p className="font-semibold text-sm truncate">{exercise.name}</p>
        <p className="text-xs text-[var(--foreground-muted)] tabular-nums shrink-0">
          {headlineValue}
          <span className="ml-1.5 text-[10px] uppercase tracking-wider">
            {unitLabel}
          </span>
        </p>
      </div>
      <p className="text-[10px] text-[var(--foreground-subtle)] mb-1">
        {exercise.sessionCount} session
        {exercise.sessionCount === 1 ? "" : "s"} · {exercise.totalSets} sets
      </p>
      {exercise.series.length === 0 ? (
        <p className="text-xs text-[var(--foreground-muted)]">No data yet.</p>
      ) : (
        <div className="h-24 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={exercise.series}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id={`pg-${exercise.id}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={color} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis dataKey="date" hide />
              <YAxis
                stroke="var(--foreground-muted)"
                fontSize={10}
                width={32}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (isTime ? formatTime(v) : String(v))}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v) => [
                  isTime ? formatTime(Number(v)) : v,
                  unitLabel,
                ]}
                labelFormatter={(l) =>
                  new Date(l as string).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill={`url(#pg-${exercise.id})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
