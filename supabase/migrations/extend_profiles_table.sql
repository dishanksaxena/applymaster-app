-- Add detailed profile fields for resume-extracted data
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS professional_summary text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS work_experience jsonb DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education jsonb DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certifications jsonb DEFAULT '[]'::jsonb;
