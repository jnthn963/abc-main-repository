-- Create view for governor pending actions queue
CREATE OR REPLACE VIEW public.pending_actions_queue AS
SELECT 
  'deposit' as action_type,
  l.id,
  l.user_id,
  p.display_name as user_name,
  p.member_id,
  l.amount,
  l.reference_number,
  l.created_at,
  l.approval_status,
  l.description,
  NULL::numeric as interest_rate,
  NULL::bigint as collateral_amount
FROM public.ledger l
JOIN public.profiles p ON l.user_id = p.id
WHERE l.type = 'deposit' AND l.approval_status = 'pending_review'

UNION ALL

SELECT 
  'withdrawal' as action_type,
  l.id,
  l.user_id,
  p.display_name as user_name,
  p.member_id,
  l.amount,
  l.reference_number,
  l.created_at,
  l.approval_status,
  l.destination as description,
  NULL::numeric as interest_rate,
  NULL::bigint as collateral_amount
FROM public.ledger l
JOIN public.profiles p ON l.user_id = p.id
WHERE l.type = 'withdrawal' AND l.approval_status = 'pending_review'

UNION ALL

SELECT 
  'transfer' as action_type,
  l.id,
  l.user_id,
  p.display_name as user_name,
  p.member_id,
  l.amount,
  l.reference_number,
  l.created_at,
  l.approval_status,
  l.destination as description,
  NULL::numeric as interest_rate,
  NULL::bigint as collateral_amount
FROM public.ledger l
JOIN public.profiles p ON l.user_id = p.id
WHERE l.type = 'transfer_out' AND l.approval_status = 'pending_review'

UNION ALL

SELECT 
  'loan_request' as action_type,
  loan.id,
  loan.borrower_id as user_id,
  p.display_name as user_name,
  p.member_id,
  loan.principal_amount as amount,
  loan.reference_number,
  loan.created_at,
  loan.approval_status,
  NULL as description,
  loan.interest_rate,
  loan.collateral_amount
FROM public.p2p_loans loan
JOIN public.profiles p ON loan.borrower_id = p.id
WHERE loan.status = 'open' AND loan.approval_status = 'pending_review'

UNION ALL

SELECT 
  'loan_funding' as action_type,
  loan.id,
  loan.lender_id as user_id,
  p.display_name as user_name,
  p.member_id,
  loan.principal_amount as amount,
  loan.reference_number,
  loan.funded_at as created_at,
  loan.approval_status,
  NULL as description,
  loan.interest_rate,
  loan.collateral_amount
FROM public.p2p_loans loan
JOIN public.profiles p ON loan.lender_id = p.id
WHERE loan.status = 'funded' AND loan.approval_status = 'pending_review'

ORDER BY created_at DESC;

-- Grant select to authenticated users (RLS on base tables restricts access)
GRANT SELECT ON public.pending_actions_queue TO authenticated;