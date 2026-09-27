-- Migration: relationship signals for imported networks
--
-- A LinkedIn connection list treats all 700 people as equal. These columns
-- hold what tells the real relationships apart, all derived from the
-- person's own LinkedIn archive in their browser:
--   message_count   how many messages you have exchanged (never the text)
--   endorsed_you    how many times this person endorsed your skills
--   would_help      you said this person would refer you or open a door
--   connected_on    when you connected on LinkedIn
--   source          where the contact came from ('linkedin', 'manual')
-- last_contacted_at (already present) holds the most recent message date.
--
-- Additive only. Safe to run on the live database, and safe to run twice.

alter table public.network_connections
  add column if not exists message_count integer not null default 0,
  add column if not exists endorsed_you integer not null default 0,
  add column if not exists would_help boolean not null default false,
  add column if not exists connected_on date,
  add column if not exists source text;

-- Imports match people on their LinkedIn profile URL.
create index if not exists idx_network_connections_user_url
  on public.network_connections (user_id, linkedin_url);

notify pgrst, 'reload schema';
