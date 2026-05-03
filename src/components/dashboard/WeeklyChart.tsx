"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeeklyBucket } from "@/lib/dashboard";

export function WeeklyChart({
  data,
  color,
}: {
  data: WeeklyBucket[];
  color: string;
}) {
  return (
    <div className="h-32 -mx-1">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            stroke="var(--foreground-muted)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--foreground-muted)"
            fontSize={10}
            width={20}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 12,
            }}
            cursor={{ fill: "var(--surface-2)", opacity: 0.4 }}
            formatter={(v) => [
              `${v} workout${Number(v) === 1 ? "" : "s"}`,
              "",
            ]}
            labelFormatter={(l) => `Week of ${l}`}
          />
          <Bar dataKey="count" fill={color} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
