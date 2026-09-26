-- Migration: sign-in / sign-up tracking and support messages
--
-- Why: a person whose Google sign-in fails, whose password is rejected, or
-- whose confirmation email never arrives leaves no trace anywhere. They never
-- become a row in auth.users, so there is no way to know they tried — or that
-- anyone is trying at all. And until now there was no way to reach support
-- from inside the product: the only mention of support@applymaster.ai was in
-- the Terms page text, and that mailbox has never received a message.
--
-- Two tables:
--   app_events        every auth attempt and its outcome, including failures
--   support_messages  messages sent from the in-app support form
--
-- Both are written only by the server with the service role. RLS is enabled
-- with no public policies on app_events, so no browser can read or write it
-- directly — the events contain email addresses.
--
-- Additive only. Safe to run on the live database, and safe to run twice.

-- 1. Auth and support events --------------------------------------------
create table if not exists public.app_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),

  event text not null,          -- e.g. 'login_failed', 'oauth_callback_success'
  outcome text,                 -- 'view' | 'attempt' | 'success' | 'failure'
  method text,                  -- 'password' | 'google' | 'email_link'

  email text,                   -- lowercased, as typed; null when unknown
  user_id uuid,                 -- set once we know who it is

  error_code text,
  error_message text,

  path text,
  referrer text,
  anon_id text,                 -- random per-browser id, stitches one visitor's attempts
  country text,                 -- from the edge; the IP itself is never stored
  user_agent text,

  meta jsonb not null default '{}'::jsonb
);

alter table public.app_events enable row level security;
-- Deliberately no policies: only the service role may read or write.

create index if not exists idx_app_events_created on public.app_events (created_at desc);
create index if not exists idx_app_events_event on public.app_events (event, created_at desc);
create index if not exists idx_app_events_email on public.app_events (email) where email is not null;
create index if not exists idx_app_events_anon on public.app_events (anon_id) where anon_id is not null;

-- 2. Support messages ----------------------------------------------------
create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  user_id uuid references auth.users(id) on delete set null,
  name text,
  email text not null,

  category text not null default 'other'
    check (category in ('sign_in', 'sign_up', 'billing', 'bug', 'feature', 'other')),
  message text not null,

  -- what the person was looking at and the last error they saw, so a
  -- "I can't log in" message arrives with the reason attached
  context jsonb not null default '{}'::jsonb,

  status text not null default 'open'
    check (status in ('open', 'replied', 'resolved')),
  emailed boolean not null default false,   -- forwarded to the support inbox
  admin_note text,
  resolved_at timestamptz
);

alter table public.support_messages enable row level security;

drop policy if exists "Users can read own support messages" on public.support_messages;
create policy "Users can read own support messages"
  on public.support_messages for select
  using (auth.uid() = user_id);

create index if not exists idx_support_status on public.support_messages (status, created_at desc);
create index if not exists idx_support_email on public.support_messages (email);
