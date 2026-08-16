# Webinar BDR Guidance App

A dashboard for reviewing webinar lead engagement and generating AI-backed
BDR (Business Development Rep) follow-up guidance with Claude.

## Stack

- Next.js (App Router, TypeScript, Tailwind CSS)
- Supabase (Postgres) for storage
- Anthropic API (Claude) for BDR guidance generation
- Vercel for hosting + daily cron job

## Data model

Four normalized tables (see
`supabase/migrations/20260810000000_webinar_followup_schema.sql`):

- **webinars** — title, date, description, presenter_name, recording_link,
  slide_deck_link
- **registrations** — one row per registrant, fk to `webinars`:
  registrant_name, company, email, job_title, registration_date,
  attendance_status, duration_attended
- **leads** — one row per registration, fk to `registrations`:
  engagement_score, priority_status, flagged, date_scored, assigned_bdr
- **bdr_guidance** — one row per generated guidance run, fk to `webinars`:
  generated_text, date_generated. A webinar can accumulate multiple rows
  over time (regenerating doesn't overwrite history); the app always shows
  the most recent one.
- **webinar_summaries** (see
  `supabase/migrations/20260811000000_add_webinar_summaries.sql`) — one row
  per generated summary run, fk to `webinars`: summary_text, date_generated.
  Same history-preserving pattern as `bdr_guidance`.

`supabase/migrations/20260809000000_create_webinars_table.sql` is the
earlier single-table design this replaces — it's superseded by the
2026-08-10 migration and only kept for history. **The new migration drops
and recreates `public.webinars`, so only run it against a project where
losing the old table's data is fine.**

## How it works

- All Supabase access happens server-side (route handlers / server
  components) using the **service role key**, which bypasses row-level
  security. The browser never talks to Supabase directly — it only calls
  this app's own API routes. There is no login system; treat the deployed
  URL as an internal tool. The anon key is documented in `.env.example` for
  completeness but isn't currently used by any code path, since nothing
  queries Supabase from the browser.
- **Dashboard** (`/`) — lists completed webinars (date in the past) with
  registration and attendance counts, linking to each webinar's details
  page.
- **Webinar Details** (`/webinars/:id`) — webinar info, the **Generate
  Summary** button (a plain-language overview of the webinar, saved to
  `webinar_summaries`), an aggregate engagement score (average +
  hot/warm/cold/flagged breakdown across that webinar's leads), the
  **Generate BDR Guidance** button, and the most recently generated
  guidance text.
- `GET /api/cron/import-and-score` — runs daily via Vercel Cron
  (`vercel.json`), protected by `CRON_SECRET`. Fixed-rule logic, no AI:
  1. Simulates importing GoToWebinar registration/attendance data (mock
     data — see `lib/mockImport.ts`) for completed webinars that don't have
     registrations yet.
  2. Scores every registration that doesn't have a lead yet using the fixed
     rule in `lib/scoring.ts` (engagement score from `duration_attended`,
     `priority_status` from score thresholds, `flagged` above 80).
- `POST /api/webinars/:id/generate-guidance` — the on-demand, judgment-call
  path. Fetches the webinar and its engagement summary, sends both to
  Claude, and saves the response into `bdr_guidance`. This route sets
  `export const maxDuration = 60` since Claude responses can be slow;
  Vercel Hobby plans still cap functions at 60s regardless, so raise your
  plan if you see timeouts.
- `POST /api/webinars/:id/generate-summary` — same shape, for the
  **Generate Summary** button: sends the webinar's title/date/presenter/
  description to Claude for a short plain-language overview and saves it
  into `webinar_summaries`. Also sets `maxDuration = 60`.

## Environment variables

| Variable | Used where | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | server | Supabase Project Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | not used yet | client-safe key, documented for completeness |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | never sent to the browser — used by `lib/supabase.ts` for all reads/writes |
| `ANTHROPIC_API_KEY` | server only | never sent to the browser — used by `lib/guidance.ts` |
| `CLAUDE_MODEL` | server only | optional, defaults to `claude-sonnet-5` |
| `CRON_SECRET` | server only | any random string, e.g. `openssl rand -hex 32`; checked against the `Authorization` header on cron requests |

None of these are hardcoded anywhere in the code — every value is read from
`process.env` at request time. `.env.local` holds your local values and is
excluded by `.gitignore` (`.env*` is ignored, with an explicit exception for
`.env.example`, which has no real values).

## Local development

1. Copy the env template and fill in real values:

   ```bash
   cp .env.example .env.local
   ```

2. Run the migration in your Supabase project's SQL Editor (see Data model
   above).

3. Install dependencies and run the dev server:

   ```bash
   npm install
   npm run dev
   ```

4. Open http://localhost:3000 — you should see the sample completed webinar.
   Click into it, then **Generate BDR Guidance** to test the Claude
   integration end to end. (The sample data ships with leads already
   scored; the cron route only backfills webinars that don't have
   registrations yet.)

## Deploying to Vercel

1. Import this repository into Vercel.
2. In the Vercel project's Environment Variables settings, add all six
   variables from the table above.
3. Deploy. `vercel.json` registers the daily cron job automatically
   (`/api/cron/import-and-score`, currently scheduled for 13:00 UTC — edit
   the `schedule` field to change it).
4. Manually trigger the cron once after deploying to confirm it's wired up:

   ```bash
   curl -H "Authorization: Bearer <CRON_SECRET>" https://<your-app>.vercel.app/api/cron/import-and-score
   ```
