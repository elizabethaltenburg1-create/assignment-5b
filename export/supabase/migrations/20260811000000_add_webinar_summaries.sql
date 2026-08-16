-- Adds webinar_summaries, populated by the "Generate Summary" button on the
-- Webinar Details page. Additive only — does not touch existing tables.
-- Mirrors bdr_guidance: each generation is a new row, keeping history; the
-- app always shows the most recent one.
create table public.webinar_summaries (
  id bigint generated always as identity primary key,
  webinar_id bigint not null references public.webinars (id) on delete cascade,
  summary_text text not null,
  date_generated timestamptz not null default now()
);

create index if not exists webinar_summaries_webinar_id_idx
  on public.webinar_summaries (webinar_id);

alter table public.webinar_summaries enable row level security;

create policy "Authenticated users can read webinar_summaries"
  on public.webinar_summaries for select to authenticated using (true);
