# Webinar BDR Guidance App

A dashboard for reviewing webinar lead engagement and generating AI-backed
BDR (Business Development Rep) follow-up guidance with Claude.

## Stack

- Next.js (App Router, TypeScript, Tailwind CSS)
- Supabase (Postgres) for storage
- Anthropic API (Claude) for BDR guidance generation
- Vercel for hosting + daily cron job

## How it works

- All Supabase access happens server-side (route handlers / server
  components) using the **secret key**, which bypasses row-level security.
  The browser never talks to Supabase directly — it only calls this app's
  own API routes. There is no login system; treat the deployed URL as an
  internal tool. The publishable key is documented in `.env.example` for
  completeness but isn't currently used by any code path.
- `GET /api/webinars` — lists all webinars.
- `POST /api/webinars/:id/generate-guidance` — calls Claude to generate BDR
  guidance for one webinar and saves it. Used by the dashboard's
  **Generate BDR Guidance** button.
- `GET /api/cron/generate-guidance` — finds webinars with no guidance yet
  and generates it for all of them. Runs daily via Vercel Cron
  (`vercel.json`), protected by `CRON_SECRET`.

## Database setup

Run `supabase/migrations/20260809000000_create_webinars_table.sql` in the
Supabase SQL Editor (Project > SQL Editor) for your project. It creates the
`webinars` table, a trigger that keeps `last_updated` current, RLS
policies, and one sample row.

## Local development

1. Copy the env template and fill in real values:

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Where to find it |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project Settings > API > Project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Project Settings > API > Publishable key (not currently used, documented for completeness) |
   | `SUPABASE_SECRET_KEY` | Supabase Project Settings > API > Secret key |
   | `ANTHROPIC_API_KEY` | console.anthropic.com |
   | `CLAUDE_MODEL` | optional, defaults to `claude-sonnet-5` |
   | `CRON_SECRET` | any random string, e.g. `openssl rand -hex 32` |

2. Install dependencies and run the dev server:

   ```bash
   npm install
   npm run dev
   ```

3. Open http://localhost:3000 — you should see the webinar table with the
   sample record, and can click **Generate BDR Guidance** to test the
   Claude integration end to end.

## Deploying to Vercel

1. Import this repository into Vercel.
2. In the Vercel project's Environment Variables settings, add the same
   variables listed above (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
   `ANTHROPIC_API_KEY`, `CRON_SECRET`, and optionally `CLAUDE_MODEL`).
3. Deploy. `vercel.json` registers the daily cron job automatically
   (`/api/cron/generate-guidance`, currently scheduled for 13:00 UTC —
   edit the `schedule` field to change it).
4. Vercel automatically sends `Authorization: Bearer $CRON_SECRET` on cron
   requests, which the cron route checks against `CRON_SECRET`.
