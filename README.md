# assignment-5b
# Webinar Follow-Up & BDR Handoff — MVP

## What this app does

After a webinar wraps, marketing normally has to manually pull attendee data,
score leads by eye, and write BDR follow-up guidance from scratch. This app
automates the mechanical parts of that and hands the one genuine judgment
call — what a BDR should actually say to a given lead — to Claude.

A marketing user opens the **Dashboard**, sees a list of completed webinars
with registration and attendance counts, and selects one. On the
**Webinar Details** screen they see the webinar info and its engagement
score, then click **Generate BDR Guidance** to get Claude-written talking
points and follow-up messaging for the BDR team, which is saved to the
database for later reference.

## Live app

[live Vercel URL here]

## Tech stack

- **Frontend/Backend:** Next.js, deployed on Vercel
- **Database:** Supabase (Postgres)
- **AI:** Anthropic API (Claude) for the agentic BDR guidance step
- **Automation:** Vercel Cron (scheduled) + a serverless function (on-demand)

## Automation split

### Scheduled — runs once a day (Vercel Cron)
- Imports registration and attendance data for completed webinars
  *(simulated with seed data for this MVP — no live GoToWebinar integration)*
- Calculates each lead's engagement score from attendance and duration attended,
  using a fixed rule
- Stores the results in Supabase so they're ready before anyone opens the app

This runs without a user in the loop — it's rule-based, so no judgment call
is needed and nothing benefits from waiting on a person to trigger it.

### On-demand — triggered by a button click
- **Generate BDR Guidance** button on the Webinar Details screen calls a
  serverless function
- That function sends the webinar's topic, key details, and engagement data
  to Claude and asks it to produce BDR talking points and follow-up messaging
- Claude's response is displayed on screen and saved to the `bdr_guidance`
  table with a timestamp

This is the one step in the workflow that isn't a fixed rule — deciding what
messaging and talking points actually fit a given webinar and audience takes
judgment, which is why it's the agentic step and why it's user-triggered
rather than scheduled.

## Data model (Supabase)

| Table | Stores |
|---|---|
| `webinars` | title, date, description, presenter, recording link, slide deck link |
| `registrations` | registrant name, company, email, job title, registration date, attendance status, duration attended |
| `leads` | engagement score, priority status, flagged, date scored, assigned BDR |
| `bdr_guidance` | generated guidance text, date generated, linked webinar |

## Environment variables

Required in both `.env` (local) and the Vercel dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` *(backend only — never sent to the frontend)*
- `ANTHROPIC_API_KEY` *(backend only — never sent to the frontend)*

No keys are hardcoded anywhere in this repo.

## Out of scope for this MVP

Lead Management screen, Follow-Up Emails screen, exporting lead lists,
Dynamics 365 integration, live GoToWebinar integration, user accounts,
email sending, notifications, and outreach tracking. These are documented
in the original 5A design as candidates for a future version.
