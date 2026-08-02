-- ==============================================================================
-- 03_storage_and_audit_security.sql
-- Description: Enforce storage bucket security, Storage RLS policies, 
-- and immutable admin audit logging protections.
-- ==============================================================================

-- 1. STORAGE BUCKET CONFIGURATION & SECURITY
-- Configure buckets with public read, 5MB file size limit, and strict image MIME types.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('articles', 'articles', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('article-images', 'article-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Note: storage.objects already has Row Level Security enabled by default in Supabase.

-- Clean up any existing policies with conflicting names
DROP POLICY IF EXISTS "Public Access for Image Buckets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Insert on Image Buckets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update on Image Buckets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete on Image Buckets" ON storage.objects;

-- Storage Policy: Public Read for images
CREATE POLICY "Public Access for Image Buckets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id IN ('product-images', 'articles', 'article-images'));

-- Storage Policy: Only Admins can upload (INSERT)
CREATE POLICY "Admin Insert on Image Buckets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('product-images', 'articles', 'article-images')
  AND (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (SELECT 1 FROM public.admin_roles WHERE id = (SELECT auth.uid()))
  )
);

-- Storage Policy: Only Admins can update/upsert (UPDATE)
CREATE POLICY "Admin Update on Image Buckets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('product-images', 'articles', 'article-images')
  AND (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (SELECT 1 FROM public.admin_roles WHERE id = (SELECT auth.uid()))
  )
)
WITH CHECK (
  bucket_id IN ('product-images', 'articles', 'article-images')
  AND (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (SELECT 1 FROM public.admin_roles WHERE id = (SELECT auth.uid()))
  )
);

-- Storage Policy: Only Admins can delete (DELETE)
CREATE POLICY "Admin Delete on Image Buckets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('product-images', 'articles', 'article-images')
  AND (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (SELECT 1 FROM public.admin_roles WHERE id = (SELECT auth.uid()))
  )
);


-- 2. IMMUTABLE ADMIN AUDIT LOGS (public.admin_logs)
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster querying in AdminLogsManager
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_email ON public.admin_logs (admin_email);

-- Enable RLS on admin_logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Clean up any existing policies
DROP POLICY IF EXISTS "Admin Select on admin_logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Admin Insert on admin_logs" ON public.admin_logs;

-- Audit Log Policy: Only Admins can view logs
CREATE POLICY "Admin Select on admin_logs"
ON public.admin_logs FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  OR EXISTS (SELECT 1 FROM public.admin_roles WHERE id = (SELECT auth.uid()))
);

-- Audit Log Policy: Only Admins can insert logs
CREATE POLICY "Admin Insert on admin_logs"
ON public.admin_logs FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  OR EXISTS (SELECT 1 FROM public.admin_roles WHERE id = (SELECT auth.uid()))
);

-- NOTE: No UPDATE or DELETE policy is defined for admin_logs.
-- In PostgreSQL, omitting UPDATE and DELETE policies under RLS ensures that 
-- audit logs are 100% append-only and IMMUTABLE (cannot be modified or erased).
