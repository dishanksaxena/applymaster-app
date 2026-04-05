-- Expand job_preferences table with comprehensive questionnaire fields
-- This migration adds fields for more detailed job matching

ALTER TABLE public.job_preferences ADD COLUMN IF NOT EXISTS work_authorization text;
ALTER TABLE public.job_preferences ADD COLUMN IF NOT EXISTS current_employment_status text;
ALTER TABLE public.job_preferences ADD COLUMN IF NOT EXISTS desired_job_title text;
ALTER TABLE public.job_preferences ADD COLUMN IF NOT EXISTS available_start_date text;
ALTER TABLE public.job_preferences ADD COLUMN IF NOT EXISTS willing_to_relocate boolean default false;
ALTER TABLE public.job_preferences ADD COLUMN IF NOT EXISTS country_preference text;
ALTER TABLE public.job_preferences ADD COLUMN IF NOT EXISTS city_preferences text[] default '{}';
ALTER TABLE public.job_preferences ADD COLUMN IF NOT EXISTS ethnicity text;
ALTER TABLE public.job_preferences ADD COLUMN IF NOT EXISTS key_skills text[] default '{}';
ALTER TABLE public.job_preferences ADD COLUMN IF NOT EXISTS company_size_preference text;
ALTER TABLE public.job_preferences ADD COLUMN IF NOT EXISTS employment_type text;
ALTER TABLE public.job_preferences ADD COLUMN IF NOT EXISTS interview_strength text;
ALTER TABLE public.job_preferences ADD COLUMN IF NOT EXISTS preferred_salary_range text;

-- Update timestamp
ALTER TABLE public.job_preferences ADD COLUMN IF NOT EXISTS updated_at timestamptz;
UPDATE public.job_preferences SET updated_at = now() WHERE updated_at IS NULL;
