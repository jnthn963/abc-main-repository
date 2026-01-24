-- Enable RLS on pending_actions_queue view (it's actually a view, need to handle differently)
-- First, let's check if it's a view and revoke public access, then ensure only governors can access via the RPC

-- Revoke all direct access from authenticated role on the view
REVOKE ALL ON public.pending_actions_queue FROM authenticated;
REVOKE ALL ON public.pending_actions_queue FROM anon;

-- Grant access only to service_role (used by SECURITY DEFINER functions)
GRANT SELECT ON public.pending_actions_queue TO service_role;

-- Also secure the profiles_admin_view
REVOKE ALL ON public.profiles_admin_view FROM authenticated;
REVOKE ALL ON public.profiles_admin_view FROM anon;
GRANT SELECT ON public.profiles_admin_view TO service_role;

-- Secure profiles_user_view - only allow authenticated users to see their own
REVOKE ALL ON public.profiles_user_view FROM anon;