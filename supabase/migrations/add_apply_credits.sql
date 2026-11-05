-- Migration: application credits and billing-field protection
--
-- Why: plans now carry real limits (Free 30/month, Pro 150/month at 10/day,
-- Elite and Lifetime unlimited behind a 50/day safety cap), and Pro can buy
-- 20 extra applications for $5. Two things need the database:
--
--   profiles.apply_credits   the credit balance, spent one per application
--                            once the monthly pool is used
--   credit_grants            one row per paid Stripe checkout session, so a
--                            webhook retry can never grant the same purchase
--                            twice
--
-- The trigger exists because profiles is user-updatable under RLS: without
-- it, anyone could PATCH their own row and set plan='lifetime' or a credit
-- balance. Billing fields may only change through the service role (the
-- Stripe webhook); direct SQL (no JWT) is also allowed so dashboard fixes
-- still work.
--
-- Additive only. Safe to run on the live database, and safe to run twice.

alter table public.profiles add column if not exists apply_credits integer not null default 0;

create table if not exists public.credit_grants (
  session_id text primary key,          -- Stripe checkout session id
  user_id    uuid not null references auth.users (id) on delete cascade,
  credits    integer not null,
  created_at timestamptz not null default now()
);

-- RLS on, no policies: only the service role reads or writes grants.
alter table public.credit_grants enable row level security;

create or replace function public.grant_apply_credits(p_user uuid, p_n integer)
returns void
language sql security definer set search_path = public as $$
  update public.profiles set apply_credits = apply_credits + greatest(p_n, 0) where id = p_user;
$$;

create or replace function public.consume_apply_credits(p_user uuid, p_n integer)
returns void
language sql security definer set search_path = public as $$
  update public.profiles set apply_credits = greatest(apply_credits - greatest(p_n, 0), 0) where id = p_user;
$$;

revoke execute on function public.grant_apply_credits(uuid, integer) from public, anon, authenticated;
revoke execute on function public.consume_apply_credits(uuid, integer) from public, anon, authenticated;
grant execute on function public.grant_apply_credits(uuid, integer) to service_role;
grant execute on function public.consume_apply_credits(uuid, integer) to service_role;

create or replace function public.protect_profile_billing()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- auth.role() is null for direct SQL (dashboard, migrations): allowed.
  -- 'service_role' is the server (webhook, admin client): allowed.
  -- 'authenticated' / 'anon' is a browser speaking PostgREST: billing
  -- fields silently keep their old values.
  if coalesce(auth.role(), 'service_role') <> 'service_role' then
    new.plan := old.plan;
    new.apply_credits := old.apply_credits;
  end if;
  return new;
end $$;

drop trigger if exists protect_profile_billing on public.profiles;
create trigger protect_profile_billing
  before update on public.profiles
  for each row execute function public.protect_profile_billing();
