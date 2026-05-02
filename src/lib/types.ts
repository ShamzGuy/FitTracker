export type ExerciseKind = "weight" | "time" | "reps";

export type Exercise = {
  id: string;
  user_id: string;
  name: string;
  kind: ExerciseKind;
  notes: string | null;
  created_at: string;
};

export type Template = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type TemplateExercise = {
  id: string;
  template_id: string;
  exercise_id: string;
  position: number;
  target_sets: number | null;
  target_reps: number | null;
  target_weight: number | null;
  target_time_seconds: number | null;
};

export type Workout = {
  id: string;
  user_id: string;
  template_id: string | null;
  name: string | null;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
};

export type WorkoutSet = {
  id: string;
  workout_id: string;
  exercise_id: string;
  set_number: number;
  reps: number | null;
  weight: number | null;
  time_seconds: number | null;
  completed_at: string;
};

/**
 * Per-exercise "best from the last time" snapshot used to pre-fill
 * defaults so the user has something concrete to beat.
 * Populated server-side from the most recent prior workout that
 * touched the exercise; each field is the max across that workout.
 */
export type LastBest = {
  weight: number | null;
  reps: number | null;
  time_seconds: number | null;
};
