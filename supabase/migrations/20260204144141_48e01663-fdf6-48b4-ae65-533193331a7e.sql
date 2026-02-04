
-- Create a secure view for marketplace loans that anonymizes borrower identity
-- Non-involved users will see masked borrower_id for privacy
CREATE OR REPLACE VIEW public.marketplace_loans WITH (security_invoker = true) AS
SELECT 
  id,
  -- Only show borrower_id to the borrower themselves or the lender
  CASE 
    WHEN borrower_id = auth.uid() OR lender_id = auth.uid() THEN borrower_id
    ELSE NULL
  END AS borrower_id,
  lender_id,
  principal_amount,
  collateral_amount,
  interest_rate,
  duration_days,
  capital_lock_days,
  status,
  auto_repay_triggered,
  created_at,
  funded_at,
  due_date,
  capital_unlock_date,
  repaid_at,
  updated_at,
  reference_number,
  -- Show approval status but not rejection reason for non-involved users
  approval_status,
  CASE 
    WHEN borrower_id = auth.uid() OR lender_id = auth.uid() THEN rejection_reason
    ELSE NULL
  END AS rejection_reason,
  approved_by,
  approved_at
FROM public.p2p_loans;

-- Add comment explaining the view purpose
COMMENT ON VIEW public.marketplace_loans IS 'Secure view for P2P marketplace that anonymizes borrower identity for non-involved users. Only the borrower and lender can see the borrower_id.';

-- Grant access to authenticated users
GRANT SELECT ON public.marketplace_loans TO authenticated;
