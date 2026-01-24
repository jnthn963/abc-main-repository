-- Fix profiles_admin_view exposure by revoking public grant
-- The view should only be accessible by service_role, not all authenticated users

-- Revoke SELECT from authenticated users
REVOKE SELECT ON public.profiles_admin_view FROM authenticated;

-- Ensure only service_role can access admin views
GRANT SELECT ON public.profiles_admin_view TO service_role;