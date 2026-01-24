-- Fix critical view access issues: Revoke authenticated access to admin views
-- These views should ONLY be accessible via SECURITY DEFINER functions or service_role

-- 1. Revoke all permissions from authenticated role on admin views
REVOKE ALL ON profiles_admin_view FROM authenticated;
REVOKE ALL ON profiles_admin_view FROM anon;
REVOKE ALL ON pending_actions_queue FROM authenticated;
REVOKE ALL ON pending_actions_queue FROM anon;

-- Grant only to service_role (used by edge functions)
GRANT SELECT ON profiles_admin_view TO service_role;
GRANT SELECT ON pending_actions_queue TO service_role;

-- 2. Add admin/governor SELECT policy for p2p_loans oversight
CREATE POLICY "Admins and governors can view all loans"
ON public.p2p_loans
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'governor'::app_role)
);

-- 3. Add comments for documentation
COMMENT ON VIEW profiles_admin_view IS 
  'Administrative view with customer PII. SELECT revoked from authenticated - access only via get_pending_actions() SECURITY DEFINER function or service_role.';

COMMENT ON VIEW pending_actions_queue IS 
  'Administrative queue for pending approvals. SELECT revoked from authenticated - access only via get_pending_actions() SECURITY DEFINER function or service_role.';