-- Secure profiles_admin_view by revoking all public access
-- This view should only be accessible via SECURITY DEFINER functions

REVOKE ALL ON public.profiles_admin_view FROM public;
REVOKE ALL ON public.profiles_admin_view FROM authenticated;
REVOKE ALL ON public.profiles_admin_view FROM anon;

-- Only service_role can access (used by SECURITY DEFINER functions with explicit role checks)
GRANT SELECT ON public.profiles_admin_view TO service_role;