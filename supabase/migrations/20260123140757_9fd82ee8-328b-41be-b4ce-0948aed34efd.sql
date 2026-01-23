-- Drop and recreate the pending_actions_queue view with proper security
DROP VIEW IF EXISTS public.pending_actions_queue;

-- Recreate with SECURITY INVOKER to inherit RLS from base tables
-- Only admins/governors can access this via base table RLS policies
CREATE VIEW public.pending_actions_queue
WITH (security_invoker = on)
AS
SELECT 
  'ledger'::text as source_table,
  l.id,
  l.user_id,
  p.display_name as user_name,
  p.member_id,
  l.type::text as action_type,
  l.amount,
  l.reference_number,
  l.description,
  l.approval_status,
  l.created_at,
  NULL::numeric as interest_rate,
  NULL::bigint as collateral_amount
FROM public.ledger l
LEFT JOIN public.profiles p ON l.user_id = p.id
WHERE l.approval_status = 'pending_review'

UNION ALL

SELECT 
  'p2p_loans'::text as source_table,
  pl.id,
  pl.borrower_id as user_id,
  p.display_name as user_name,
  p.member_id,
  CASE 
    WHEN pl.status = 'open' THEN 'loan_request'
    ELSE 'loan_funding'
  END as action_type,
  pl.principal_amount as amount,
  pl.reference_number,
  NULL as description,
  pl.approval_status,
  COALESCE(pl.funded_at, pl.created_at) as created_at,
  pl.interest_rate,
  pl.collateral_amount
FROM public.p2p_loans pl
LEFT JOIN public.profiles p ON pl.borrower_id = p.id
WHERE pl.approval_status = 'pending_review'

ORDER BY created_at DESC;

-- Add comment for documentation
COMMENT ON VIEW public.pending_actions_queue IS 
'Aggregated view of pending financial actions requiring Governor approval. 
Uses SECURITY INVOKER to inherit RLS from ledger and p2p_loans tables.
Only accessible by admin/governor roles through base table policies.';

-- Create function to get pending action counts for dashboard widget
CREATE OR REPLACE FUNCTION public.get_pending_action_counts()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_deposits BIGINT;
  v_withdrawals BIGINT;
  v_transfers BIGINT;
  v_loans BIGINT;
BEGIN
  -- Verify caller is admin/governor
  IF NOT (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'governor')) THEN
    RAISE EXCEPTION 'Access denied: Governor role required';
  END IF;

  -- Count pending deposits
  SELECT COUNT(*) INTO v_deposits
  FROM public.ledger
  WHERE approval_status = 'pending_review' AND type = 'deposit';

  -- Count pending withdrawals
  SELECT COUNT(*) INTO v_withdrawals
  FROM public.ledger
  WHERE approval_status = 'pending_review' AND type = 'withdrawal';

  -- Count pending transfers
  SELECT COUNT(*) INTO v_transfers
  FROM public.ledger
  WHERE approval_status = 'pending_review' AND type = 'transfer';

  -- Count pending loans
  SELECT COUNT(*) INTO v_loans
  FROM public.p2p_loans
  WHERE approval_status = 'pending_review';

  v_result := jsonb_build_object(
    'deposits', v_deposits,
    'withdrawals', v_withdrawals,
    'transfers', v_transfers,
    'loans', v_loans,
    'total', v_deposits + v_withdrawals + v_transfers + v_loans
  );

  RETURN v_result;
END;
$$;