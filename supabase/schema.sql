-- ============================================
-- ApplyMaster Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Profiles (auto-created on signup via trigger)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'elite', 'lifetime')),
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Job Preferences
create table public.job_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  target_roles text[] not null default '{}',
  target_locations text[] not null default '{}',
  remote_preference text not null default 'any' check (remote_preference in ('remote', 'hybrid', 'onsite', 'any')),
  min_salary integer,
  max_salary integer,
  experience_level text not null default 'mid' check (experience_level in ('entry', 'mid', 'senior', 'lead', 'executive')),
  industries text[] not null default '{}',
  excluded_companies text[] not null default '{}',
  match_threshold integer not null default 80,
  auto_apply_mode text not null default 'off' check (auto_apply_mode in ('copilot', 'autopilot', 'off')),
  daily_apply_limit integer not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

alter table public.job_preferences enable row level security;
create policy "Users can manage own preferences" on public.job_preferences for all using (auth.uid() = user_id);

-- Resumes
create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  file_url text not null,
  parsed_data jsonb,
  ats_score integer,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.resumes enable row level security;
create policy "Users can manage own resumes" on public.resumes for all using (auth.uid() = user_id);

-- Jobs (shared across users)
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  source text not null,
  title text not null,
  company text not null,
  company_logo text,
  location text not null,
  remote_type text check (remote_type in ('remote', 'hybrid', 'onsite')),
  salary_min integer,
  salary_max integer,
  description text,
  url text not null,
  posted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.jobs enable row level security;
create policy "Anyone can view jobs" on public.jobs for select using (true);
create policy "Authenticated can insert jobs" on public.jobs for insert with check (auth.uid() is not null);

create index idx_jobs_source on public.jobs(source);
create index idx_jobs_title on public.jobs using gin(to_tsvector('english', title));
create unique index idx_jobs_external on public.jobs(external_id, source) where external_id is not null;

-- Applications
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  job_id uuid references public.jobs(id) on delete cascade not null,
  status text not null default 'saved' check (status in ('saved', 'queued', 'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn')),
  match_score integer,
  resume_id uuid references public.resumes(id) on delete set null,
  cover_letter_id uuid,
  applied_at timestamptz,
  notes text,
  follow_up_date date,
  interview_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, job_id)
);

alter table public.applications enable row level security;
create policy "Users can manage own applications" on public.applications for all using (auth.uid() = user_id);

create index idx_applications_user on public.applications(user_id);
create index idx_applications_status on public.applications(user_id, status);

-- Cover Letters
create table public.cover_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  job_id uuid references public.jobs(id) on delete set null,
  title text not null,
  content text not null,
  tone text not null default 'professional' check (tone in ('professional', 'casual', 'enthusiastic', 'confident')),
  created_at timestamptz not null default now()
);

alter table public.cover_letters enable row level security;
create policy "Users can manage own cover letters" on public.cover_letters for all using (auth.uid() = user_id);

-- Apply Log (activity feed)
create table public.apply_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  application_id uuid references public.applications(id) on delete set null,
  action text not null,
  details text,
  created_at timestamptz not null default now()
);

alter table public.apply_log enable row level security;
create policy "Users can view own logs" on public.apply_log for select using (auth.uid() = user_id);
create policy "Users can insert own logs" on public.apply_log for insert with check (auth.uid() = user_id);

create index idx_apply_log_user on public.apply_log(user_id, created_at desc);

-- Subscriptions
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'elite', 'lifetime')),
  status text not null default 'active' check (status in ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

alter table public.subscriptions enable row level security;
create policy "Users can view own subscription" on public.subscriptions for select using (auth.uid() = user_id);

-- Usage tracking
create table public.usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  period_start date not null,
  period_end date not null,
  applications_sent integer not null default 0,
  resumes_optimized integer not null default 0,
  cover_letters_generated integer not null default 0,
  ai_tokens_used integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.usage enable row level security;
create policy "Users can view own usage" on public.usage for select using (auth.uid() = user_id);
create policy "Users can insert own usage" on public.usage for insert with check (auth.uid() = user_id);
create policy "Users can update own usage" on public.usage for update using (auth.uid() = user_id);

create unique index idx_usage_period on public.usage(user_id, period_start, period_end);

-- Updated_at trigger
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.update_updated_at();
create trigger job_preferences_updated_at before update on public.job_preferences for each row execute function public.update_updated_at();
create trigger resumes_updated_at before update on public.resumes for each row execute function public.update_updated_at();
create trigger applications_updated_at before update on public.applications for each row execute function public.update_updated_at();
create trigger subscriptions_updated_at before update on public.subscriptions for each row execute function public.update_updated_at();

-- Storage bucket for resumes
insert into storage.buckets (id, name, public) values ('resumes', 'resumes', false);

create policy "Users can upload own resumes" on storage.objects for insert with check (
  bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "Users can view own resumes" on storage.objects for select using (
  bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "Users can delete own resumes" on storage.objects for delete using (
  bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- New Tables: AI Features & Extended Functionality
-- ============================================

-- Parsed resume data (structured from Claude AI)
create table if not exists public.parsed_resumes (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references public.resumes(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  full_name text,
  email text,
  phone text,
  location text,
  summary text,
  skills text[] not null default '{}',
  experience jsonb not null default '[]',
  education jsonb not null default '[]',
  certifications text[] not null default '{}',
  languages text[] not null default '{}',
  raw_text text,
  created_at timestamptz not null default now(),
  unique(resume_id)
);

-- Job match scores
create table if not exists public.job_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  job_id uuid references public.jobs(id) on delete cascade not null,
  resume_id uuid references public.resumes(id) on delete set null,
  overall_score integer not null,
  skills_score integer,
  experience_score integer,
  education_score integer,
  match_reasons text[] not null default '{}',
  missing_skills text[] not null default '{}',
  tailored_summary text,
  created_at timestamptz not null default now(),
  unique(user_id, job_id)
);

-- Optimized resumes per job
create table if not exists public.optimized_resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  resume_id uuid references public.resumes(id) on delete cascade not null,
  job_id uuid references public.jobs(id) on delete cascade not null,
  optimized_text text not null,
  optimized_data jsonb,
  ats_score integer,
  changes_made text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Auto-apply task queue
create table if not exists public.auto_apply_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  application_id uuid references public.applications(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete cascade not null,
  status text not null default 'pending',
  mode text not null default 'copilot',
  portal_type text,
  form_data jsonb,
  resume_url text,
  cover_letter_text text,
  error_message text,
  estimated_time_seconds integer,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Network connections for referral feature
create table if not exists public.network_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  email text,
  linkedin_url text,
  company text,
  title text,
  relationship text not null default 'direct',
  connected_via uuid references public.network_connections(id),
  notes text,
  created_at timestamptz not null default now()
);

-- Interview prep sessions
create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  job_id uuid references public.jobs(id),
  interview_type text not null default 'behavioral',
  questions jsonb not null default '[]',
  answers jsonb not null default '[]',
  feedback jsonb not null default '[]',
  overall_score integer,
  duration_seconds integer,
  created_at timestamptz not null default now()
);

-- RLS for all new tables
alter table public.parsed_resumes enable row level security;
alter table public.job_matches enable row level security;
alter table public.optimized_resumes enable row level security;
alter table public.auto_apply_tasks enable row level security;
alter table public.network_connections enable row level security;
alter table public.interview_sessions enable row level security;

create policy "Users can manage own parsed_resumes" on public.parsed_resumes for all using (auth.uid() = user_id);
create policy "Users can manage own job_matches" on public.job_matches for all using (auth.uid() = user_id);
create policy "Users can manage own optimized_resumes" on public.optimized_resumes for all using (auth.uid() = user_id);
create policy "Users can manage own auto_apply_tasks" on public.auto_apply_tasks for all using (auth.uid() = user_id);
create policy "Users can manage own network_connections" on public.network_connections for all using (auth.uid() = user_id);
create policy "Users can manage own interview_sessions" on public.interview_sessions for all using (auth.uid() = user_id);
