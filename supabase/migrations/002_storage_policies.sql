-- =============================================================
-- RunningForm — Storage bucket + RLS policies
-- =============================================================
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- The `frames` bucket must be PUBLIC so the Inngest worker can
-- fetch frames without auth headers (CLAUDE.md rule P7).
-- =============================================================

-- ---------------------------------------------------------------
-- 1. Create the bucket (idempotent)
-- ---------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('frames', 'frames', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ---------------------------------------------------------------
-- 2. RLS on storage.objects
-- ---------------------------------------------------------------

-- Authenticated users may upload frames into their own folder.
-- Path structure inside the bucket: frames/{user_id}/{session_id}/{n}.jpg
-- split_part(name, '/', 2) extracts the user_id segment.
CREATE POLICY "Users can upload their own frames"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'frames'
  AND split_part(name, '/', 2) = auth.uid()::text
);

-- Anyone (including the Inngest worker using a public URL) may read frames.
CREATE POLICY "Public read access for frames"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'frames');

-- Users may delete only their own frames.
CREATE POLICY "Users can delete their own frames"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'frames'
  AND split_part(name, '/', 2) = auth.uid()::text
);
