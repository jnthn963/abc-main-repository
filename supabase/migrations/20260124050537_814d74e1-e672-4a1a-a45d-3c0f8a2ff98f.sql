-- Drop and recreate the get_pending_actions function with correct signature
DROP FUNCTION IF EXISTS get_pending_actions();

-- Recreate with the updated return type
CREATE OR REPLACE FUNCTION get_pending_actions()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  member_id text,
  user_name text,
  reference_number text,
  amount bigint,
  description text,
  approval_status text,
  created_at timestamptz,
  action_type text,
  source_table text,
  interest_rate numeric,
  collateral_amount bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller has admin or governor role
  IF NOT has_role(auth.uid(), 'admin'::app_role) AND NOT has_role(auth.uid(), 'governor'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Admin or Governor role required';
  END IF;
  
  -- Log the access for audit
  INSERT INTO admin_audit_log (admin_id, action, details, ip_address)
  VALUES (auth.uid(), 'VIEW_PENDING_ACTIONS', jsonb_build_object('action', 'accessed pending actions queue'), 'system');
  
  -- Return pending actions from both sources
  RETURN QUERY
  -- Pending deposits
  SELECT 
    l.id,
    l.user_id,
    p.member_id,
    p.display_name,
    l.reference_number,
    l.amount,
    l.description,
    l.approval_status,
    l.created_at,
    'deposit'::text as action_type,
    'ledger'::text as source_table,
    NULL::numeric as interest_rate,
    NULL::bigint as collateral_amount
  FROM ledger l
  JOIN profiles p ON p.id = l.user_id
  WHERE l.type = 'deposit' AND l.approval_status = 'pending_review'
  UNION ALL
  -- Pending loan requests
  SELECT 
    pl.id,
    pl.borrower_id,
    p.member_id,
    p.display_name,
    pl.reference_number,
    pl.principal_amount,
    'Loan Request'::text,
    pl.approval_status,
    pl.created_at,
    'loan_request'::text,
    'p2p_loans'::text,
    pl.interest_rate,
    pl.collateral_amount
  FROM p2p_loans pl
  JOIN profiles p ON p.id = pl.borrower_id
  WHERE pl.approval_status = 'pending_review'
  ORDER BY created_at ASC;
END;
$$;

-- Add comment
COMMENT ON FUNCTION get_pending_actions() IS 
  'Secure function to retrieve pending administrative actions. Requires admin/governor role. Logs all access for audit compliance.';