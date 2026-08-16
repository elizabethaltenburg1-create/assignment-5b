-- Replaces the earlier single-table "webinars" design (see
-- 20260809000000_create_webinars_table.sql) with a normalized schema:
-- webinars -> registrations -> leads, plus bdr_guidance keyed on webinars.
--
-- WARNING: this drops the old public.webinars table (and its data) before
-- recreating it with a different set of columns. Only run this against a
-- database where that's acceptable (e.g. a fresh/dev project, or one where
-- the earlier migration was never applied).
drop table if exists public.webinars cascade;

create table public.webinars (
  id bigint generated always as identity primary key,
  title text not null,
  date date not null,
  description text,
  presenter_name text,
  recording_link text,
  slide_deck_link text
);

create table public.registrations (
  id bigint generated always as identity primary key,
  webinar_id bigint not null references public.webinars (id) on delete cascade,
  registrant_name text not null,
  company text,
  email text not null,
  job_title text,
  registration_date timestamptz not null default now(),
  attendance_status text not null default 'registered',
  duration_attended integer not null default 0
);

create index if not exists registrations_webinar_id_idx
  on public.registrations (webinar_id);

create table public.leads (
  id bigint generated always as identity primary key,
  registration_id bigint not null references public.registrations (id) on delete cascade,
  engagement_score integer not null,
  priority_status text not null,
  flagged boolean not null default false,
  date_scored timestamptz not null default now(),
  assigned_bdr text
);

create unique index if not exists leads_registration_id_key
  on public.leads (registration_id);

create table public.bdr_guidance (
  id bigint generated always as identity primary key,
  webinar_id bigint not null references public.webinars (id) on delete cascade,
  generated_text text not null,
  date_generated timestamptz not null default now()
);

create index if not exists bdr_guidance_webinar_id_idx
  on public.bdr_guidance (webinar_id);

-- Row Level Security (Supabase exposes tables via the API by default). The
-- app itself never uses these policies directly — all reads/writes go
-- through server-side code using the service role key, which bypasses RLS.
-- These policies exist as a safety net against any future client-side use.
alter table public.webinars enable row level security;
alter table public.registrations enable row level security;
alter table public.leads enable row level security;
alter table public.bdr_guidance enable row level security;

create policy "Authenticated users can read webinars"
  on public.webinars for select to authenticated using (true);
create policy "Authenticated users can read registrations"
  on public.registrations for select to authenticated using (true);
create policy "Authenticated users can read leads"
  on public.leads for select to authenticated using (true);
create policy "Authenticated users can read bdr_guidance"
  on public.bdr_guidance for select to authenticated using (true);

-- Sample data for local testing
insert into public.webinars (title, date, description, presenter_name, recording_link, slide_deck_link)
values (
  'Scaling AI Workflows with Supabase',
  '2026-07-20',
  'A walkthrough of building AI-backed workflows on top of Supabase Postgres.',
  'Jordan Reyes',
  'https://example.com/recordings/scaling-ai-workflows',
  'https://example.com/slides/scaling-ai-workflows'
);

insert into public.registrations
  (webinar_id, registrant_name, company, email, job_title, registration_date, attendance_status, duration_attended)
values
  (1, 'Alex Chen', 'Northwind Traders', 'alex.chen@northwind.example', 'VP of Sales', '2026-07-15T14:00:00Z', 'attended', 52),
  (1, 'Priya Natarajan', 'Globex Corp', 'priya.n@globex.example', 'Director of Revenue Ops', '2026-07-16T09:30:00Z', 'attended', 38),
  (1, 'Sam Whitfield', 'Initech', 'sam.w@initech.example', 'BDR Manager', '2026-07-17T11:15:00Z', 'no_show', 0);

insert into public.leads
  (registration_id, engagement_score, priority_status, flagged, date_scored, assigned_bdr)
values
  (1, 87, 'Hot', true, now(), null),
  (2, 63, 'Warm', false, now(), null),
  (3, 0, 'Cold', false, now(), null);
