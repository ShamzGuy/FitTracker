import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Exercise,
  ExerciseKind,
  Workout,
  WorkoutSet,
} from "@/lib/types";

/**
 * Canonical household member. There may be more than one underlying
 * Supabase auth user per person (e.g. anon session lost on a reinstall),
 * which is why `userIds` is an array.
 */
export type Person = {
  name: "Shameed" | "Sharu";
  userIds: string[];
  workouts: Workout[];
  sets: WorkoutSet[];
  exercises: Exercise[];
};

export type WorkoutSummary = {
  id: string;
  name: string;
  startedAt: string;
  endedAt: string | null;
  setCount: number;
  durationSec: number | null;
};

export type WeeklyBucket = {
  weekStart: string;
  label: string;
  count: number;
};

export type TopExercise = {
  id: string;
  name: string;
  kind: ExerciseKind;
  sessionCount: number;
  totalSets: number;
  /** Per-day max value: volume for weight, reps for reps, seconds for time. */
  series: { date: string; value: number }[];
  /** Most recent peak value, used as a "current best" headline. */
  latest: number | null;
};

export type PersonStats = {
  totalCompleted: number;
  thisWeek: number;
  thisMonth: number;
  /** Consecutive completed weeks (Mon–Sun) ending with the current week. */
  streakWeeks: number;
  /** Last 8 ISO weeks, oldest first. */
  weekly: WeeklyBucket[];
  recent: WorkoutSummary[];
  topExercises: TopExercise[];
};

/** Map an arbitrary display name to one of the household canonicals. */
export function canonicalName(raw: string | null | undefined): Person["name"] | null {
  const n = (raw ?? "").trim().toLowerCase();
  if (!n) return null;
  if (["shameed", "shamz", "shameed sait"].includes(n)) return "Shameed";
  if (["sharu", "sharanya", "sharu sait"].includes(n)) return "Sharu";
  return null;
}

/**
 * Pull all data needed to render the dashboard, using the service-role
 * client so it can read across users (RLS bypassed). Returns one
 * `Person` entry per recognized household member that has at least one
 * underlying anon user.
 */
export async function loadDashboardData(): Promise<Person[]> {
  const admin = createAdminClient();

  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    perPage: 200,
  });
  if (listErr) throw listErr;

  const buckets = new Map<Person["name"], string[]>();
  for (const u of list.users) {
    const raw = (u.user_metadata?.name as string | undefined) ?? null;
    const c = canonicalName(raw);
    if (!c) continue;
    if (!buckets.has(c)) buckets.set(c, []);
    buckets.get(c)!.push(u.id);
  }

  const people: Person[] = [];
  for (const [name, userIds] of buckets.entries()) {
    if (userIds.length === 0) continue;

    const [workoutsRes, exercisesRes] = await Promise.all([
      admin
        .from("workouts")
        .select("*")
        .in("user_id", userIds)
        .order("started_at", { ascending: false }),
      admin.from("exercises").select("*").in("user_id", userIds),
    ]);

    const workouts = (workoutsRes.data ?? []) as Workout[];
    const exercises = (exercisesRes.data ?? []) as Exercise[];

    let sets: WorkoutSet[] = [];
    if (workouts.length > 0) {
      const { data: setsData } = await admin
        .from("sets")
        .select("*")
        .in(
          "workout_id",
          workouts.map((w) => w.id)
        );
      sets = (setsData ?? []) as WorkoutSet[];
    }

    people.push({ name, userIds, workouts, exercises, sets });
  }

  people.sort((a, b) => personOrder(a.name) - personOrder(b.name));
  return people;
}

function personOrder(name: Person["name"]): number {
  return name === "Shameed" ? 0 : 1;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

/** Monday at 00:00 UTC of the week containing `d`. */
function startOfWeekUTC(d: Date): Date {
  const day = d.getUTCDay(); // 0 (Sun) … 6 (Sat)
  const offset = (day + 6) % 7; // make Monday the start
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - offset)
  );
}

export function computePersonStats(p: Person): PersonStats {
  const completed = p.workouts.filter((w) => w.ended_at);
  const now = new Date();
  const weekStart = startOfWeekUTC(now);
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );

  const thisWeek = completed.filter(
    (w) => new Date(w.started_at) >= weekStart
  ).length;
  const thisMonth = completed.filter(
    (w) => new Date(w.started_at) >= monthStart
  ).length;

  // Last 8 weeks, oldest first.
  const weekly: WeeklyBucket[] = [];
  for (let i = 7; i >= 0; i--) {
    const start = new Date(weekStart.getTime() - i * WEEK_MS);
    const end = new Date(start.getTime() + WEEK_MS);
    const count = completed.filter((w) => {
      const t = new Date(w.started_at).getTime();
      return t >= start.getTime() && t < end.getTime();
    }).length;
    weekly.push({
      weekStart: start.toISOString().slice(0, 10),
      label: start.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      count,
    });
  }

  // Streak = consecutive weeks ending with the current one that have ≥1
  // completed workout. If this week is empty, streak is 0.
  let streakWeeks = 0;
  for (let i = weekly.length - 1; i >= 0; i--) {
    if (weekly[i].count > 0) streakWeeks++;
    else break;
  }

  const setCountByWorkout = new Map<string, number>();
  for (const s of p.sets) {
    setCountByWorkout.set(
      s.workout_id,
      (setCountByWorkout.get(s.workout_id) ?? 0) + 1
    );
  }
  const recent: WorkoutSummary[] = completed.slice(0, 5).map((w) => ({
    id: w.id,
    name: w.name ?? "Workout",
    startedAt: w.started_at,
    endedAt: w.ended_at,
    setCount: setCountByWorkout.get(w.id) ?? 0,
    durationSec: w.ended_at
      ? Math.max(
          0,
          Math.round(
            (new Date(w.ended_at).getTime() -
              new Date(w.started_at).getTime()) /
              1000
          )
        )
      : null,
  }));

  const exById = new Map(p.exercises.map((e) => [e.id, e]));
  const setsByEx = new Map<string, WorkoutSet[]>();
  for (const s of p.sets) {
    if (!setsByEx.has(s.exercise_id)) setsByEx.set(s.exercise_id, []);
    setsByEx.get(s.exercise_id)!.push(s);
  }

  const topExercises: TopExercise[] = Array.from(setsByEx.entries())
    .map(([exId, exSets]): TopExercise | null => {
      const ex = exById.get(exId);
      if (!ex) return null;
      const sessionCount = new Set(exSets.map((s) => s.workout_id)).size;
      const valueByDay = new Map<string, number>();
      for (const s of exSets) {
        const day = s.completed_at.slice(0, 10);
        let v = 0;
        if (ex.kind === "weight") v = (s.weight ?? 0) * (s.reps ?? 0);
        else if (ex.kind === "reps") v = s.reps ?? 0;
        else v = s.time_seconds ?? 0;
        valueByDay.set(day, Math.max(valueByDay.get(day) ?? 0, v));
      }
      const series = Array.from(valueByDay.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, value]) => ({ date, value }));
      return {
        id: ex.id,
        name: ex.name,
        kind: ex.kind,
        sessionCount,
        totalSets: exSets.length,
        series,
        latest: series.length > 0 ? series[series.length - 1].value : null,
      };
    })
    .filter((x): x is TopExercise => x !== null)
    .sort((a, b) => b.totalSets - a.totalSets)
    .slice(0, 4);

  return {
    totalCompleted: completed.length,
    thisWeek,
    thisMonth,
    streakWeeks,
    weekly,
    recent,
    topExercises,
  };
}

export const PERSON_COLORS: Record<Person["name"], string> = {
  Shameed: "var(--primary)",
  Sharu: "var(--accent)",
};
