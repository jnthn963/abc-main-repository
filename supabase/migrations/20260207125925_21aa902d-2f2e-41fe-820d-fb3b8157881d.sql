-- =====================================================
-- SECURITY FIX: Enable RLS on exposed database views
-- Fixes: profiles_user_view, pending_actions_queue, marketplace_loans
-- =====================================================

-- 1. PROFILES_USER_VIEW: Restrict to own data + admins/governors
-- Enable RLS on the view
ALTER VIEW public.profiles_user_view SET (security_invoker = on);

-- Revoke direct access from authenticated and anon roles
REVOKE SELECT ON public.profiles_user_view FROM authenticated;
REVOKE SELECT ON public.profiles_user_view FROM anon;

-- 2. PENDING_ACTIONS_QUEUE: Restrict to admins/governors only
-- Enable security invoker on the view
ALTER VIEW public.pending_actions_queue SET (security_invoker = on);

-- Revoke direct access from authenticated and anon roles
REVOKE SELECT ON public.pending_actions_queue FROM authenticated;
REVOKE SELECT ON public.pending_actions_queue FROM anon;

-- 3. MARKETPLACE_LOANS: Restrict to authenticated users with proper filtering
-- Enable security invoker on the view
ALTER VIEW public.marketplace_loans SET (security_invoker = on);

-- Revoke direct access from anon role (authenticated can still use via p2p_loans RLS)
REVOKE SELECT ON public.marketplace_loans FROM anon;

-- Note: Views with security_invoker = on inherit RLS from underlying tables
-- profiles_user_view inherits from profiles (owner-only RLS)
-- pending_actions_queue inherits from ledger and p2p_loans (admin-only RLS)
-- marketplace_loans inherits from p2p_loans (open loans or own loans RLS)