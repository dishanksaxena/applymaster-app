-- Migration: referral requests
--
-- Referrals convert at roughly 30% against 0.1-2% for a cold application, and
-- account for 30-50% of hires from about 7% of applicants. network_connections
-- already stores who the user knows; nothing yet connects a person to a
-- specific role, or tracks the ask.
--
-- This adds that link: for a given job, which contact could refer you, what
-- was sent, and what came back.
--
-- Additive only. network_connections is extended with nullable columns, so
-- existing rows stay valid.

-- 1. Referral request: one contact asked about one job.
create table if not exists public.referral_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references public.network_connections(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  application_id uuid references public.applications(id) on delete set null,

  -- denormalised so the request still reads correctly if the job row is purged
  job_title text,
  company text,

  -- why this person was suggested, e.g. "works at Stripe", "same university"
  match_reason text,
  -- 0-100, how strong the path looks
  match_strength integer check (match_strength between 0 and 100),

  message_draft text,          -- what we generated
  message_sent text,           -- what the user actually sent, if edited
  channel text check (channel in ('email', 'linkedin', 'other')),

  status text not null default 'suggested'
    check (status in ('suggested', 'drafted', 'sent', 'accepted', 'declined', 'no_response')),

  sent_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.referral_requests enable row level security;

create policy "Users can manage own referral requests"
  on public.referral_requests for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_referral_requests_user_status
  on public.referral_requests(user_id, status);

create index if not exists idx_referral_requests_job
  on public.referral_requests(job_id);

-- One live ask per contact per job; re-asking the same person for the same
-- role is almost always a mistake rather than an intent.
create unique index if not exists idx_referral_requests_unique_ask
  on public.referral_requests(user_id, connection_id, job_id)
  where job_id is not null;

-- 2. Extend network_connections so a path can actually be scored.
alter table public.network_connections
  add column if not exists company_domain text,
  add column if not exists seniority text,
  add column if not exists last_contacted_at timestamptz,
  add column if not exists can_refer boolean not null default true;

-- Matching a contact to a job is a company lookup, so index it.
create index if not exists idx_network_connections_company
  on public.network_connections(user_id, company);
