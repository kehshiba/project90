# THE 90-DAY CUT

A private, local-first 90-day fitness and fat-loss tracker. Log daily weight,
calories, protein, steps, water, sleep, notes, and full workout set logs. The
calendar, streaks, insights, achievements, weekly summaries, CSV workout import,
and dark mode all work offline.

Data is saved instantly in the browser. Optionally, one private Supabase snapshot
keeps a phone and laptop in sync.

## Features

- 90-day calendar with daily status colors and streak tracking
- Weight, calories, protein, steps, water, sleep, and notes
- Workout set tables with CSV paste/import:
  `date,workout,exercise,muscle_group,set_number,planned_reps,actual_reps,weight_kg,assisted,rir,completed,notes`
- Insights, achievements, weekly summaries, and trend charts
- JSON backup export/import (older backups stay compatible)
- Full dark mode
- Optional Supabase magic-link login and cloud sync with a local `localStorage` cache
- Row Level Security: only the owner account can read or write the cloud row

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

Without environment variables the app runs in local-only mode. To enable cloud
sync, copy `.env.example` to `.env.local` and fill in the Supabase project URL and
public anon key. See [DEPLOY.md](DEPLOY.md) for the complete Supabase and Netlify
setup.

## Deploy

The app deploys free on Netlify with Supabase as the private cloud store.

Follow the step-by-step guide: **[DEPLOY.md](DEPLOY.md)**.

## Data and backups

- The browser copy is the instant/offline source of truth while you use the app.
- When signed in to cloud sync, changes upload after a short debounce.
- If this browser and the cloud both have different saved data, the app asks once
  which copy to keep. Export a JSON backup before choosing.
- Supabase Free has no automatic backups. Use **Settings → Export JSON backup**
  regularly and keep the file somewhere safe.
- Supabase Free projects pause after 7 days without activity. Open the project
  dashboard to restore it, then sync again.

## Scripts

```bash
npm run dev          # start development
npm run build        # production build
npm run start        # run the production build
npm run theme:dark   # regenerate app/dark-theme.css after style changes
npx tsc --noEmit     # typecheck
npx eslint .         # lint
```

## Security

- The public site URL only exposes the magic-link sign-in screen to visitors.
- Sign-ups are disabled; the owner account is created once in Supabase.
- The browser ships only the public anon/publishable Supabase key. The
  `service_role` key must never be used in this app.
- Every cloud row is protected by RLS policies that compare `auth.uid()` with
  `user_id`.
- `netlify.toml` sets CSP, HSTS, frame denial, MIME sniffing protection, a
  restrictive permissions policy, and `noindex` headers.

## Project structure

```text
app/                 Next.js app shell, metadata, global styles
components/          Tracker UI, auth screen, cloud conflict/status components
lib/challenge.ts     Challenge types, defaults, stats, calendar helpers
lib/storage.ts       Validated localStorage and JSON import/export
lib/supabase.ts      Lazy browser Supabase client
lib/cloud.ts         Cloud snapshot and auth helpers
lib/use-cloud-sync.ts  Auth state, hydration, conflict handling, autosave
supabase/schema.sql  Table, RLS policies, and grants
netlify.toml         Build settings and security headers
DEPLOY.md            Full free-tier deployment guide
```
