import type { ExerciseKind } from "./types";

export type CatalogExercise = {
  name: string;
  kind: ExerciseKind;
  category: ExerciseCategory;
};

export const CATEGORIES = [
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Legs",
  "Core",
  "Cardio",
] as const;

export type ExerciseCategory = (typeof CATEGORIES)[number];

/**
 * Curated catalog of common exercises shown in the "Add exercise" picker.
 * Each entry already knows whether it's logged as weight, reps, or time.
 */
export const POPULAR_EXERCISES: CatalogExercise[] = [
  // Chest
  { name: "Bench Press", kind: "weight", category: "Chest" },
  { name: "Incline DB Press", kind: "weight", category: "Chest" },
  { name: "Flat Chest Press", kind: "weight", category: "Chest" },
  { name: "Chest Press", kind: "weight", category: "Chest" },
  { name: "Decline Press", kind: "weight", category: "Chest" },
  { name: "Chest Fly", kind: "weight", category: "Chest" },
  { name: "Dumbbell Chest Fly", kind: "weight", category: "Chest" },
  { name: "Cable Crossover", kind: "weight", category: "Chest" },
  { name: "Push-ups", kind: "reps", category: "Chest" },

  // Back
  { name: "Deadlift", kind: "weight", category: "Back" },
  { name: "Lat Pulldown", kind: "weight", category: "Back" },
  { name: "Dumbbell Row", kind: "weight", category: "Back" },
  { name: "Barbell Row", kind: "weight", category: "Back" },
  { name: "Cable Row", kind: "weight", category: "Back" },
  { name: "Seated Row", kind: "weight", category: "Back" },
  { name: "Pull-ups", kind: "reps", category: "Back" },
  { name: "Chin-ups", kind: "reps", category: "Back" },
  { name: "Face Pull", kind: "weight", category: "Back" },
  { name: "Shrugs", kind: "weight", category: "Back" },

  // Shoulders
  { name: "Overhead Press", kind: "weight", category: "Shoulders" },
  { name: "Seated Shoulder Press", kind: "weight", category: "Shoulders" },
  { name: "Arnold Press", kind: "weight", category: "Shoulders" },
  { name: "Lateral Raises", kind: "weight", category: "Shoulders" },
  { name: "Front Raises", kind: "weight", category: "Shoulders" },
  { name: "Rear Delt Fly", kind: "weight", category: "Shoulders" },
  { name: "Upright Row", kind: "weight", category: "Shoulders" },

  // Arms (biceps + triceps)
  { name: "DB Curl", kind: "weight", category: "Arms" },
  { name: "Bicep Curl", kind: "weight", category: "Arms" },
  { name: "Barbell Curl", kind: "weight", category: "Arms" },
  { name: "Hammer Curl", kind: "weight", category: "Arms" },
  { name: "Cable Curl", kind: "weight", category: "Arms" },
  { name: "Preacher Curl", kind: "weight", category: "Arms" },
  { name: "Rope Pushdown", kind: "weight", category: "Arms" },
  { name: "Tricep Pushdown", kind: "weight", category: "Arms" },
  { name: "Overhead DB Extension", kind: "weight", category: "Arms" },
  { name: "Skull Crushers", kind: "weight", category: "Arms" },
  { name: "Tricep Kickback", kind: "weight", category: "Arms" },
  { name: "Dead Hang", kind: "time", category: "Arms" },
  { name: "Farmer's Carry", kind: "time", category: "Arms" },
  { name: "Dips", kind: "reps", category: "Arms" },

  // Legs
  { name: "Squat", kind: "weight", category: "Legs" },
  { name: "Goblet Squat", kind: "weight", category: "Legs" },
  { name: "Smith Machine Squat", kind: "weight", category: "Legs" },
  { name: "Leg Press", kind: "weight", category: "Legs" },
  { name: "Walking Lunges", kind: "weight", category: "Legs" },
  { name: "Reverse Lunges", kind: "reps", category: "Legs" },
  { name: "Step-Ups", kind: "weight", category: "Legs" },
  { name: "Leg Curl", kind: "weight", category: "Legs" },
  { name: "Leg Extension", kind: "weight", category: "Legs" },
  { name: "Romanian Deadlift", kind: "weight", category: "Legs" },
  { name: "Hip Thrust", kind: "weight", category: "Legs" },
  { name: "Calf Raises", kind: "weight", category: "Legs" },
  { name: "Standing Calf Raises", kind: "reps", category: "Legs" },
  { name: "Bulgarian Split Squat", kind: "weight", category: "Legs" },

  // Core
  { name: "Plank", kind: "time", category: "Core" },
  { name: "Side Plank", kind: "time", category: "Core" },
  { name: "Full Body Stretch", kind: "time", category: "Core" },
  { name: "Yoga", kind: "time", category: "Core" },
  { name: "Hanging Knee Raises", kind: "reps", category: "Core" },
  { name: "Hanging Leg Raises", kind: "reps", category: "Core" },
  { name: "Crunches", kind: "reps", category: "Core" },
  { name: "Bicycle Crunches", kind: "reps", category: "Core" },
  { name: "Russian Twists", kind: "reps", category: "Core" },
  { name: "Ab Rollout", kind: "reps", category: "Core" },

  // Cardio
  { name: "Elliptical", kind: "time", category: "Cardio" },
  { name: "Treadmill", kind: "time", category: "Cardio" },
  { name: "Treadmill Long Walk", kind: "time", category: "Cardio" },
  { name: "Recovery Walk", kind: "time", category: "Cardio" },
  { name: "Easy Walk", kind: "time", category: "Cardio" },
  { name: "Running", kind: "time", category: "Cardio" },
  { name: "Cycling", kind: "time", category: "Cardio" },
  { name: "Jump Rope", kind: "time", category: "Cardio" },
  { name: "Rowing Machine", kind: "time", category: "Cardio" },
  { name: "Stair Climber", kind: "time", category: "Cardio" },
  { name: "Burpees", kind: "reps", category: "Cardio" },
];

/** Quick lookup helper. */
export function findInCatalog(name: string): CatalogExercise | undefined {
  const n = name.trim().toLowerCase();
  return POPULAR_EXERCISES.find((e) => e.name.toLowerCase() === n);
}

/**
 * Heuristic kind detection for custom exercises.
 * 1) Exact match in catalog.
 * 2) Keyword-based fallback (e.g. "plank" → time, "push-up" → reps).
 * 3) Default to weight × reps.
 */
export function guessKind(name: string): ExerciseKind {
  const cat = findInCatalog(name);
  if (cat) return cat.kind;

  const n = name.trim().toLowerCase();

  const timeKeywords = [
    "plank",
    "elliptical",
    "treadmill",
    "running",
    "run ",
    "cycling",
    "rowing",
    "jump rope",
    "stair",
    "hold",
    "stretch",
    "yoga",
    "walk",
    "swim",
    "bike",
    "cardio",
    "interval",
  ];
  const repsKeywords = [
    "push-up",
    "pushup",
    "pull-up",
    "pullup",
    "chin-up",
    "chinup",
    "dip",
    "burpee",
    "crunch",
    "sit-up",
    "situp",
    "knee raise",
    "leg raise",
    "mountain climber",
    "muscle up",
    "v-up",
    "vup",
    "handstand",
  ];

  if (timeKeywords.some((k) => n.includes(k))) return "time";
  if (repsKeywords.some((k) => n.includes(k))) return "reps";
  return "weight";
}

export function kindLabel(kind: ExerciseKind): string {
  if (kind === "weight") return "Weight × Reps";
  if (kind === "reps") return "Bodyweight reps";
  return "Time";
}

/** ===========================
 *  Seeded workout plans
 *  =========================== */

export type PlannedExercise = {
  name: string;
  sets: number | null;
  reps?: number | null;
  /** kg, used to pre-fill the first set */
  weight?: number | null;
  seconds?: number | null;
  /** human note shown in UI (e.g. "to failure", "20 min intervals") */
  note?: string;
};

export type WorkoutDay = {
  name: string;
  exercises: PlannedExercise[];
};

export type NamedPlan = {
  /** stable id, used as a dropdown key */
  id: string;
  /** display name for the seed CTA, e.g. "Import 4-day plan" */
  ctaLabel: string;
  /** short description shown in the seed card */
  description: string;
  days: WorkoutDay[];
};

/** Default 4-day plan — matches docs/4-day-plan.png. */
export const WORKOUT_PLAN: WorkoutDay[] = [
  {
    name: "Day 1 — Chest & Triceps",
    exercises: [
      { name: "Incline DB Press", sets: 4, reps: 10 },
      { name: "Flat Chest Press", sets: 3, reps: 12 },
      { name: "Push-ups", sets: 2, reps: null, note: "to failure" },
      { name: "Rope Pushdown", sets: 3, reps: 12 },
      { name: "Overhead DB Extension", sets: 3, reps: 12 },
      { name: "Plank", sets: 3, seconds: 45 },
    ],
  },
  {
    name: "Day 2 — Back & Biceps",
    exercises: [
      { name: "Lat Pulldown", sets: 4, reps: 10 },
      { name: "Dumbbell Row", sets: 3, reps: 10, note: "each side" },
      { name: "DB Curl", sets: 3, reps: 10 },
      { name: "Hammer Curl", sets: 3, reps: 12 },
      { name: "Cable Curl", sets: 2, reps: 15 },
      { name: "Hanging Knee Raises", sets: 3, reps: 15 },
    ],
  },
  {
    name: "Day 3 — Legs & Cardio",
    exercises: [
      { name: "Goblet Squat", sets: 4, reps: 12 },
      { name: "Walking Lunges", sets: 3, reps: 12, note: "each leg" },
      { name: "Leg Curl", sets: 3, reps: 12 },
      { name: "Elliptical", sets: 1, seconds: 20 * 60, note: "intervals" },
    ],
  },
  {
    name: "Day 4 — Shoulders & Arms",
    exercises: [
      { name: "Lateral Raises", sets: 4, reps: 15 },
      { name: "Arnold Press", sets: 3, reps: 10 },
      { name: "Rear Delt Fly", sets: 3, reps: 12 },
      { name: "DB Curl", sets: 3, reps: 12, note: "superset with Dips" },
      { name: "Dips", sets: 3, reps: 12, note: "superset with DB Curl" },
    ],
  },
];

/**
 * Sharu's 7-day plan — revised schedule with 3 gym days, 1 home day,
 * and 3 rest/walk days. Source: workout-plan-v2.pdf
 */
export const SHARU_PLAN: WorkoutDay[] = [
  {
    name: "Day 1 — Chest & Push (Gym)",
    exercises: [
      { name: "Elliptical", sets: 1, seconds: 20 * 60, note: "L2 / L1 / L2" },
      { name: "Chest Press", sets: 3, reps: 12, weight: 25, note: "machine or dumbbell" },
      { name: "Dumbbell Chest Fly", sets: 3, reps: 12, weight: 8 },
      { name: "Incline DB Press", sets: 3, reps: 12, weight: 8 },
      { name: "Seated Shoulder Press", sets: 3, reps: 12, weight: 20, note: "neutral grip" },
      { name: "Push-ups", sets: 3, reps: 10, note: "wall or knee" },
    ],
  },
  {
    name: "Day 2 — Recovery Walk",
    exercises: [
      { name: "Recovery Walk", sets: 1, seconds: null, note: "10K steps · easy pace" },
    ],
  },
  {
    name: "Day 3 — Back & Arms (Gym)",
    exercises: [
      { name: "Elliptical", sets: 1, seconds: 20 * 60, note: "intervals L1/L2" },
      { name: "Lat Pulldown", sets: 3, reps: 12, weight: 30 },
      { name: "Seated Row", sets: 3, reps: 12, weight: 25 },
      { name: "Bicep Curl", sets: 3, reps: 12, weight: 6, note: "hammer grip" },
      { name: "Tricep Pushdown", sets: 3, reps: 12, weight: 12.5, note: "rope" },
      { name: "Dead Hang", sets: 2, seconds: 25, note: "or Farmer's Carry 8–10 kg" },
      { name: "Standing Calf Raises", sets: 2, reps: 12, note: "slow" },
      { name: "Leg Press", sets: 3, reps: 12, weight: 25, note: "3–4 sec descent" },
    ],
  },
  {
    name: "Day 4 — Recovery Walk",
    exercises: [
      { name: "Recovery Walk", sets: 1, seconds: null, note: "10K steps · easy pace" },
    ],
  },
  {
    name: "Day 5 — Lower Body (Gym · Key Day)",
    exercises: [
      { name: "Elliptical", sets: 1, seconds: 20 * 60, note: "L1 / L3 / L1" },
      { name: "Smith Machine Squat", sets: 3, reps: 10, weight: 20, note: "10 kg each side" },
      { name: "Step-Ups", sets: 3, reps: 8, weight: 6, note: "each leg · knee height" },
      { name: "Leg Curl", sets: 3, reps: 12, weight: 15 },
      { name: "Reverse Lunges", sets: 2, reps: 8, note: "each leg · slow & controlled" },
    ],
  },
  {
    name: "Day 6 — Core & Yoga (Home)",
    exercises: [
      { name: "Full Body Stretch", sets: 1, seconds: 20 * 60, note: "Caroline Girvan" },
      { name: "Treadmill Long Walk", sets: 1, seconds: 60 * 60, note: "5 km/h · 1% incline" },
    ],
  },
  {
    name: "Day 7 — Easy Walk",
    exercises: [
      { name: "Easy Walk", sets: 1, seconds: null, note: "10K steps · full reset" },
    ],
  },
];

export const PLANS: Record<string, NamedPlan> = {
  default: {
    id: "default",
    ctaLabel: "Import 4-day plan",
    description:
      "Adds Chest & Triceps, Back & Biceps, Legs & Cardio, and Shoulders & Arms — pre-loaded with the right exercises and targets.",
    days: WORKOUT_PLAN,
  },
  sharu: {
    id: "sharu",
    ctaLabel: "Import Sharu's plan",
    description:
      "Your 7-day schedule: 3 gym days (Chest & Push, Back & Arms, Lower Body), 1 home stretch day, and 3 walking rest days.",
    days: SHARU_PLAN,
  },
};

/**
 * Picks the seeded plan for a given display name.
 * Sharu (and minor variants) get her dedicated plan; everyone else gets
 * the default 4-day plan.
 */
export function getPlanForName(name: string | null | undefined): NamedPlan {
  const n = (name ?? "").trim().toLowerCase();
  if (n === "sharu" || n === "sharanya" || n === "sharu sait") {
    return PLANS.sharu;
  }
  return PLANS.default;
}

export function planExerciseNames(plan: WorkoutDay[] = WORKOUT_PLAN): string[] {
  const set = new Set<string>();
  for (const day of plan) {
    for (const ex of day.exercises) set.add(ex.name);
  }
  return [...set];
}
