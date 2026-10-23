# MatTime

A Brazilian Jiu-Jitsu training tracker. Log classes and sparring rounds, track belt promotions and competition results, and see your training trends over time.

## Features

- **Session & sparring logs** — class type, duration, intensity, techniques drilled, submission/position outcomes
- **Belt Journey** — promotion history, current rank with stripe tracking
- **Combat Profile** — avatar, academy, training-since date, competition results ("Trophy Case"), and a radar chart of your sparring playstyle by position
- **Metrics** — lifetime/monthly training hours, submission rate, win/loss record, top submissions
- **Weekly class schedule** reminders on the dashboard
- Light/dark theme, built mobile-first with a responsive desktop layout

## Tech stack

- [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org) + [Vite](https://vite.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Supabase](https://supabase.com) (Postgres database, authentication, file storage), accessed directly from the client with row-level security

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

Create a free project at [supabase.com](https://supabase.com), then run the SQL migrations in `supabase/migrations/` **in order** via the Supabase dashboard's SQL Editor (or the Supabase CLI). They create the database schema, row-level security policies, and storage bucket this app depends on.

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in your Supabase project's URL and anon/publishable key (found in your Supabase project's API settings):

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

`.env` is gitignored and never committed — the anon key is safe to expose client-side (Supabase's row-level security is what actually protects data), but keep your own project's key out of version control regardless.

### 4. Run it

```bash
npm run dev
```

## Available scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the local dev server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run test` | Run the test suite (Vitest) |
| `npm run preview` | Preview a production build locally |

## Project structure

```
src/
  screens/        One component per bottom-nav tab (Combat, Log, Journey, History, Metrics, Profile)
  components/      Shared UI (Card, modals, toast/confirm providers, etc.)
  hooks/           Reusable hooks (theme, drag-to-scroll, toast/confirm context)
  *.tsx            Top-level forms and lists (SessionForm, SparringList, etc.)
supabase/
  migrations/      SQL schema migrations, applied in numeric order
```

## Deployment

This app deploys cleanly to [Vercel](https://vercel.com) or similar static hosts — it's a standard Vite build (`npm run build` → `dist/`). Set the two `VITE_SUPABASE_*` environment variables in your hosting provider's dashboard; nothing else is required.

A GitHub Actions workflow (`.github/workflows/keep-alive.yml`) pings the Supabase REST API daily so the free-tier database doesn't auto-pause from inactivity.

## CI

`.github/workflows/ci.yml` runs lint, tests, and a production build on every push and pull request to `main`.
