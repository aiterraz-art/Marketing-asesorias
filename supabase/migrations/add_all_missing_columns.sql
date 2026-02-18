-- Add all potential missing columns to students table
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS experience text,
    ADD COLUMN IF NOT EXISTS injuries text,
    ADD COLUMN IF NOT EXISTS main_motivation text,
    ADD COLUMN IF NOT EXISTS sex text DEFAULT 'male',
    ADD COLUMN IF NOT EXISTS sleep_hours numeric,
    ADD COLUMN IF NOT EXISTS stress_level text;