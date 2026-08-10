-- Webinars table for the Webinar BDR Guidance App
create table if not exists public.webinars (
  id bigint generated always as identity primary key,

  -- Webinar Information
  webinar_name text not null,
  webinar_date date not null,
  registrations integer not null default 0,
  attendees integer not null default 0,

  -- Lead Information
  engagement_score text,
  lead_priority text,

  -- AI-Generated Content
  bdr_guidance text,
  guidance_generated_at timestamptz,

  -- System Information
  last_updated timestamptz not null default now()
);

-- Automatically bump last_updated whenever a row changes
create or replace function public.set_webinars_last_updated()
returns trigger
language plpgsql
as $$
begin
  new.last_updated = now();
  return new;
end;
$$;

drop trigger if exists trg_webinars_last_updated on public.webinars;
create trigger trg_webinars_last_updated
before update on public.webinars
for each row
execute function public.set_webinars_last_updated();

-- Row Level Security (Supabase exposes tables via the API by default)
alter table public.webinars enable row level security;

create policy "Authenticated users can read webinars"
on public.webinars for select
to authenticated
using (true);

create policy "Authenticated users can insert webinars"
on public.webinars for insert
to authenticated
with check (true);

create policy "Authenticated users can update webinars"
on public.webinars for update
to authenticated
using (true)
with check (true);

-- Sample record for testing
insert into public.webinars (
  webinar_name,
  webinar_date,
  registrations,
  attendees,
  engagement_score,
  lead_priority,
  bdr_guidance,
  guidance_generated_at
) values (
  'Scaling AI Workflows with Supabase',
  '2026-08-20',
  248,
  132,
  'High',
  'Hot',
  'This lead attended the full session and asked about enterprise pricing during Q&A. Recommend BDR follow-up within 24 hours referencing their interest in AI workflow automation and offering a personalized demo.',
  now()
);
