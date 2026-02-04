
-- Fix: Recreate pending_actions_queue view with security_invoker
-- This ensures the view respects RLS policies of underlying tables
DROP VIEW IF EXISTS public.pending_actions_queue;

CREATE VIEW public.pending_actions_queue WITH (security_invoker = true) AS
SELECT 
  'ledger'::text AS source_table,
  l.id,
  l.user_id,
  p.display_name AS user_name,
  p.member_id,
  (l.type)::text AS action_type,
  l.amount,
  l.reference_number,
  l.description,
  l.approval_status,
  NULL::bigint AS collateral_amount,
  NULL::numeric AS interest_rate,
  l.created_at
FROM ledger l
LEFT JOIN profiles p ON l.user_id = p.id
WHERE l.approval_status = 'pending_review'
UNION ALL
SELECT 
  'p2p_loans'::text AS source_table,
  loan.id,
  loan.borrower_id AS user_id,
  bp.display_name AS user_name,
  bp.member_id,
  'loan_request'::text AS action_type,
  loan.principal_amount AS amount,
  loan.reference_number,
  'P2P Loan Request'::text AS description,
  loan.approval_status,
  loan.collateral_amount,
  loan.interest_rate,
  loan.created_at
FROM p2p_loans loan
LEFT JOIN profiles bp ON loan.borrower_id = bp.id
WHERE loan.approval_status = 'pending_review';

-- Restrict direct access - only service_role and admin functions should use this
REVOKE ALL ON public.pending_actions_queue FROM authenticated;
REVOKE ALL ON public.pending_actions_queue FROM anon;

-- Grant to service role for SECURITY DEFINER functions
GRANT SELECT ON public.pending_actions_queue TO service_role;

-- Add comment
COMMENT ON VIEW public.pending_actions_queue IS 'Secure view for pending administrative actions. Access restricted to service_role. Use get_pending_actions() RPC function which enforces admin/governor role checks.';
