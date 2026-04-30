# ft_tracker

A simple, fast workout tracker — built as an installable PWA so it lives on
your iPhone home screen and works like a native app.

- Log **weight × reps**, **bodyweight reps**, or **time-based** exercises.
  The form auto-switches based on the exercise type, so you only see the
  fields you need.
- **One-tap import** of a 4-day workout plan (Chest & Triceps, Back &
  Biceps, Legs & Cardio, Shoulders & Arms) — see [`docs/4-day-plan.png`](docs/4-day-plan.png).
- Reusable **workout templates** with target sets/reps/time per exercise.
- **Smart "Add exercise" picker**: search ~50 popular exercises grouped by
  muscle group, or type a custom name and the type is auto-detected.
- Per-exercise **history** and **progress chart**.
- Cloud-synced with **Supabase** (free tier).
- Magic-link sign-in — no passwords.

---

## Setup (10 minutes, one-time)

### 1. Create a Supabase project (free)

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Pick a name + password, choose the closest region.
3. Wait ~1 min for it to provision.

### 2. Run the schema

1. In your Supabase dashboard, open **SQL Editor → New query**.
2. Paste the contents of [`supabase/schema.sql`](supabase/schema.sql).
3. Click **Run**. You should see "Success".

### 3. Get your API keys

1. In Supabase, go to **Project Settings → API**.
2. Copy the **Project URL** and **anon public** key.
3. Create `.env.local` in this repo:

   ```bash
   cp .env.example .env.local
   ```

   Then paste your values:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```

### 4. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with your email,
click the magic link in your inbox, and you're in.

---

## Deploy to Vercel (free, ~2 min)

So you can use it on your iPhone from anywhere.

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new), import the repo.
3. Add the two env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Deploy. You'll get a URL like `https://ft-tracker-xyz.vercel.app`.

### One Supabase tweak for production

In Supabase → **Authentication → URL Configuration**:

- Set **Site URL** to your Vercel URL.
- Add `https://YOUR-VERCEL-URL/auth/callback` to **Redirect URLs**.

---

## Install on your iPhone

1. Open your Vercel URL in **Safari** (must be Safari for "Add to Home Screen").
2. Tap the **Share** button → **Add to Home Screen** → **Add**.
3. The app now lives on your home screen, opens fullscreen, and feels native.

---

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** for styling
- **Supabase** for Postgres, auth, and row-level security
- **Recharts** for the progress chart
- PWA via web manifest + iOS meta tags

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run icons` — regenerate PNG icons from `public/icons/icon.svg`
- `npm run lint` — ESLint

## Project layout

```
src/
  app/
    page.tsx              # Home (start workout, recent, templates)
    login/                # Magic-link auth
    auth/                 # OAuth callback + signout routes
    exercises/            # Exercise library
    templates/            # Template list / new / edit
    workout/[id]/         # Active workout (set logging)
    history/              # Per-exercise progress chart + history
  components/             # UI primitives + feature components
  lib/
    supabase/             # Client + server + middleware Supabase factories
    types.ts              # DB row types
    format.ts             # time/date helpers
supabase/schema.sql       # Run once in Supabase SQL editor
```
