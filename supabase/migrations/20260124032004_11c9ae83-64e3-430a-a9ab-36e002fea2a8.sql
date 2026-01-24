-- Fix pending_actions_queue view - add RLS protection
-- The view needs to be accessible only to admins/governors

-- First, revoke any existing public grants
REVOKE SELECT ON public.pending_actions_queue FROM authenticated;
REVOKE SELECT ON public.pending_actions_queue FROM anon;

-- Grant only to service_role (for edge functions) and create a function for admin access
GRANT SELECT ON public.pending_actions_queue TO service_role;

-- Create a secure function for governors to access pending actions
CREATE OR REPLACE FUNCTION public.get_pending_actions()
RETURNS TABLE (
  id uuid,
  source_table text,
  action_type text,
  user_id uuid,
  member_id text,
  user_name text,
  amount bigint,
  description text,
  reference_number text,
  approval_status text,
  created_at timestamptz,
  collateral_amount bigint,
  interest_rate numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    source_table,
    action_type,
    user_id,
    member_id,
    user_name,
    amount,
    description,
    reference_number,
    approval_status,
    created_at,
    collateral_amount,
    interest_rate
  FROM pending_actions_queue
  WHERE has_role(auth.uid(), 'governor'::app_role) 
     OR has_role(auth.uid(), 'admin'::app_role);
$$;

-- Grant execute to authenticated users (function handles authorization)
GRANT EXECUTE ON FUNCTION public.get_pending_actions TO authenticated;