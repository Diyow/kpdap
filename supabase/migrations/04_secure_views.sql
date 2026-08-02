-- ==============================================================================
-- 04_secure_views.sql
-- Description: Secure public views (e.g. customers_summary) by enforcing 
-- security_invoker = true and revoking public/anon access.
-- ==============================================================================

-- 1. Enable security_invoker on customers_summary view
-- This ensures the view enforces the Row Level Security (RLS) policies 
-- of the underlying 'orders' table rather than bypassing them as SECURITY DEFINER.
ALTER VIEW public.customers_summary SET (security_invoker = true);

-- 2. Revoke public/anon read access on the customer summary view
REVOKE ALL ON public.customers_summary FROM anon, public;

-- 3. Grant SELECT access to authenticated users only (subject to orders RLS)
GRANT SELECT ON public.customers_summary TO authenticated;
