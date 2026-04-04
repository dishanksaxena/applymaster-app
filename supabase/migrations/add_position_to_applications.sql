-- Migration: Add position column to applications table for drag-and-drop ordering
-- Run this in Supabase SQL Editor to update your existing database

-- Add position column to applications table
ALTER TABLE public.applications
ADD COLUMN position integer NOT NULL DEFAULT 0;

-- Create index for efficient ordering queries
CREATE INDEX idx_applications_position
ON public.applications(user_id, status, position);

-- Optional: Set unique positions within each (user_id, status) group
-- This ensures consistent ordering
UPDATE public.applications
SET position = row_number() OVER (PARTITION BY user_id, status ORDER BY created_at ASC) - 1;

-- Verify the migration
SELECT COUNT(*) as total_applications,
       COUNT(DISTINCT CASE WHEN position IS NOT NULL THEN 1 END) as applications_with_position
FROM public.applications;
