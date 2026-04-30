-- ft_tracker schema
-- Run this once in the Supabase SQL editor (Project → SQL → New query → paste → Run).

-- =========
-- Tables
-- =========

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  -- 'weight' = weight + reps, 'time' = duration in seconds, 'reps' = bodyweight reps only
  kind text not null check (kind in ('weight', 'time', 'reps')),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists exercises_user_idx on public.exercises(user_id);
create unique index if not exists exercises_user_name_uniq
  on public.exercises(user_id, lower(name));

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index if not exists templates_user_idx on public.templates(user_id);

create table if not exists public.template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  position int not null default 0,
  target_sets int,
  target_reps int,
  target_weight numeric,
  target_time_seconds int
);
create index if not exists template_exercises_template_idx
  on public.template_exercises(template_id);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid references public.templates(id) on delete set null,
  name text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  notes text
);
create index if not exists workouts_user_started_idx
  on public.workouts(user_id, started_at desc);

create table if not exists public.sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  set_number int not null,
  reps int,
  weight numeric,
  time_seconds int,
  completed_at timestamptz not null default now()
);
create index if not exists sets_workout_idx on public.sets(workout_id);
create index if not exists sets_exercise_completed_idx
  on public.sets(exercise_id, completed_at desc);

-- =========
-- Row Level Security
-- =========

alter table public.exercises          enable row level security;
alter table public.templates          enable row level security;
alter table public.template_exercises enable row level security;
alter table public.workouts           enable row level security;
alter table public.sets               enable row level security;

-- exercises: owner-only
drop policy if exists "exercises owner all" on public.exercises;
create policy "exercises owner all" on public.exercises
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- templates: owner-only
drop policy if exists "templates owner all" on public.templates;
create policy "templates owner all" on public.templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- template_exercises: through parent template
drop policy if exists "template_exercises owner all" on public.template_exercises;
create policy "template_exercises owner all" on public.template_exercises
  for all using (
    exists (
      select 1 from public.templates t
      where t.id = template_exercises.template_id and t.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.templates t
      where t.id = template_exercises.template_id and t.user_id = auth.uid()
    )
  );

-- workouts: owner-only
drop policy if exists "workouts owner all" on public.workouts;
create policy "workouts owner all" on public.workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- sets: through parent workout
drop policy if exists "sets owner all" on public.sets;
create policy "sets owner all" on public.sets
  for all using (
    exists (
      select 1 from public.workouts w
      where w.id = sets.workout_id and w.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.workouts w
      where w.id = sets.workout_id and w.user_id = auth.uid()
    )
  );
