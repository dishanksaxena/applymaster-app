-- Migration: the apply kit and the Chrome extension
--
-- 1. Receipts keep the employer's own proof. When an application is
--    submitted through the extension, the confirmation page's text and any
--    reference number it shows are stored with the receipt; the apply kit
--    lets people paste them from the employer's email.
--
-- 2. extension_tokens: how the Chrome extension acts for someone. Connecting
--    the extension on applymaster.ai/extension mints a random key; only its
--    SHA-256 hash is stored here. Each browser gets its own key, revocable
--    from the same page, and the extension never holds a password or the
--    web session itself.
--
-- Additive only. Safe to run on the live database, and safe to run twice.

alter table public.application_receipts
  add column if not exists confirmation_text text,
  add column if not exists confirmation_ref text;

create table if not exists public.extension_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  label text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

alter table public.extension_tokens enable row level security;

-- People can see and revoke their own connections. Keys are minted and
-- checked by the server with the service role, never from the browser.
drop policy if exists "Users can see own extension connections" on public.extension_tokens;
create policy "Users can see own extension connections"
  on public.extension_tokens for select using (auth.uid() = user_id);

drop policy if exists "Users can revoke own extension connections" on public.extension_tokens;
create policy "Users can revoke own extension connections"
  on public.extension_tokens for update using (auth.uid() = user_id);

create index if not exists idx_extension_tokens_user on public.extension_tokens(user_id);

notify pgrst, 'reload schema';
