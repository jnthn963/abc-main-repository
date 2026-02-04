
-- Drop and recreate the view with pre-computed borrower alias
DROP VIEW IF EXISTS public.marketplace_loans;

CREATE VIEW public.marketplace_loans WITH (security_invoker = true) AS
SELECT 
  l.id,
  -- Only show borrower_id to the borrower themselves or the lender (for transaction purposes)
  CASE 
    WHEN l.borrower_id = auth.uid() OR l.lender_id = auth.uid() THEN l.borrower_id
    ELSE NULL
  END AS borrower_id,
  -- Pre-compute the masked alias for all users (safe to show)
  CASE
    WHEN l.borrower_id = auth.uid() THEN 'You'
    ELSE COALESCE(
      substring(p.member_id FROM 1 FOR 1) || '***' || substring(p.member_id FROM length(p.member_id) FOR 1),
      'A***?'
    )
  END AS borrower_alias,
  l.lender_id,
  l.principal_amount,
  l.collateral_amount,
  l.interest_rate,
  l.duration_days,
  l.capital_lock_days,
  l.status,
  l.auto_repay_triggered,
  l.created_at,
  l.funded_at,
  l.due_date,
  l.capital_unlock_date,
  l.repaid_at,
  l.updated_at,
  l.reference_number,
  l.approval_status,
  -- Only show rejection reason to involved parties
  CASE 
    WHEN l.borrower_id = auth.uid() OR l.lender_id = auth.uid() THEN l.rejection_reason
    ELSE NULL
  END AS rejection_reason,
  l.approved_by,
  l.approved_at
FROM public.p2p_loans l
LEFT JOIN public.profiles p ON p.id = l.borrower_id;

-- Comment for documentation
COMMENT ON VIEW public.marketplace_loans IS 'Secure view for P2P marketplace that anonymizes borrower identity. Only the borrower and lender can see the borrower_id. All users see a masked borrower_alias for display purposes.';

-- Grant access
GRANT SELECT ON public.marketplace_loans TO authenticated;
