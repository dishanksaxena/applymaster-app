-- Migration: application receipts
--
-- Records exactly what was submitted for each application: which resume
-- version, the cover letter text as sent, every screening question and the
-- answer given, the destination ATS, and the timestamp.
--
-- Why: when an agent applies on your behalf, "we applied" is not a claim a
-- user can check. A receipt makes it verifiable, which is the single biggest
-- trust gap against competitors.
--
-- Safe to run on a live database: additive only. No existing column, table
-- or row is altered.

create table if not exists public.application_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,

  -- what was sent
  resume_id uuid references public.resumes(id) on delete set null,
  resume_version_label text,           -- e.g. "Tailored for Stripe — v3"
  resume_file_url text,
  cover_letter_id uuid references public.cover_letters(id) on delete set null,
  cover_letter_text text,

  -- screening questions, stored as [{question, answer, source}]
  screening_answers jsonb not null default '[]'::jsonb,

  -- where it went
  destination text,                    -- 'greenhouse' | 'lever' | 'workday' | ...
  destination_url text,
  submission_method text not null default 'auto'
    check (submission_method in ('auto', 'assisted', 'manual')),

  -- outcome of the submission itself (not of the application)
  status text not null default 'submitted'
    check (status in ('submitted', 'failed', 'needs_review')),
  failure_reason text,

  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.application_receipts enable row level security;

create policy "Users can manage own receipts"
  on public.application_receipts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- One receipt per application is the common case; the index supports both the
-- per-application lookup and the reverse-chronological list.
create index if not exists idx_receipts_application
  on public.application_receipts(application_id);

create index if not exists idx_receipts_user_submitted
  on public.application_receipts(user_id, submitted_at desc);
