-- Add equipment column to students table
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS equipment text;