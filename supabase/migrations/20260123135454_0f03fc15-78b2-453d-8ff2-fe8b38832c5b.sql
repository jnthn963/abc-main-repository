-- Update process_transfer_atomic to set pending_review status
CREATE OR REPLACE FUNCTION public.process_transfer_atomic(
  p_user_id UUID,
  p_amount BIGINT,
  p_destination TEXT,
  p_destination_type TEXT,
  p_recipient_member_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_recipient RECORD;
  v_reference TEXT;
  v_clearing_ends_at TIMESTAMPTZ;
  v_ledger_id UUID;
BEGIN
  -- Lock the user's profile row to prevent race conditions
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- Validate sufficient balance
  IF v_profile.vault_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds for this transaction';
  END IF;

  -- Generate reference number
  v_reference := 'TRF-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTR(gen_random_uuid()::TEXT, 1, 8));
  v_clearing_ends_at := NOW() + INTERVAL '24 hours';

  -- For internal transfers, validate recipient
  IF p_destination_type = 'internal' AND p_recipient_member_id IS NOT NULL THEN
    SELECT * INTO v_recipient
    FROM profiles
    WHERE member_id = p_recipient_member_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Recipient not found';
    END IF;

    IF v_recipient.id = p_user_id THEN
      RAISE EXCEPTION 'Cannot transfer to yourself';
    END IF;
  END IF;

  -- Deduct from vault, add to frozen (escrow until approval)
  UPDATE profiles
  SET vault_balance = vault_balance - p_amount,
      frozen_balance = frozen_balance + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Create ledger entry with PENDING_REVIEW status
  INSERT INTO ledger (
    user_id, type, amount, status, reference_number,
    destination, description, clearing_ends_at, approval_status, metadata
  ) VALUES (
    p_user_id, 'transfer_out', p_amount, 'clearing', v_reference,
    p_destination, 
    CASE 
      WHEN p_destination_type = 'internal' THEN 'Internal transfer to member ' || p_recipient_member_id
      ELSE 'Transfer to ' || p_destination_type || ': ' || p_destination
    END,
    v_clearing_ends_at,
    'pending_review',
    jsonb_build_object(
      'destination_type', p_destination_type,
      'recipient_member_id', p_recipient_member_id
    )
  )
  RETURNING id INTO v_ledger_id;

  RETURN jsonb_build_object(
    'success', true,
    'ledger_id', v_ledger_id,
    'reference_number', v_reference,
    'amount', p_amount,
    'clearing_ends_at', v_clearing_ends_at,
    'new_vault_balance', v_profile.vault_balance - p_amount,
    'new_frozen_balance', v_profile.frozen_balance + p_amount,
    'approval_status', 'pending_review'
  );
END;
$$;

-- Update request_loan_atomic to set pending_review status
CREATE OR REPLACE FUNCTION public.request_loan_atomic(
  p_user_id UUID,
  p_amount BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_reference TEXT;
  v_loan_id UUID;
  v_collateral BIGINT;
  v_interest_rate NUMERIC;
  v_account_age_hours NUMERIC;
BEGIN
  -- Lock the user's profile row
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- Check 144-hour (6-day) aging rule
  v_account_age_hours := EXTRACT(EPOCH FROM (NOW() - v_profile.created_at)) / 3600;
  IF v_account_age_hours < 144 THEN
    RAISE EXCEPTION 'Account aging requirement not met. Must be 6 days old.';
  END IF;

  -- Calculate 50% collateral requirement
  v_collateral := p_amount;  -- 100% of loan amount as collateral (50% rule means loan <= 50% of vault)
  
  -- Validate 50% collateral rule (loan cannot exceed 50% of vault balance)
  IF p_amount > (v_profile.vault_balance / 2) THEN
    RAISE EXCEPTION 'Insufficient collateral. Loan cannot exceed 50%% of vault balance.';
  END IF;

  -- Get current interest rate from global settings
  SELECT borrower_cost_rate INTO v_interest_rate
  FROM global_settings
  LIMIT 1;

  IF v_interest_rate IS NULL THEN
    v_interest_rate := 15.00;  -- Default 15% if not configured
  END IF;

  -- Generate reference number
  v_reference := 'LOAN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTR(gen_random_uuid()::TEXT, 1, 8));

  -- Lock collateral (move from vault to frozen)
  UPDATE profiles
  SET vault_balance = vault_balance - v_collateral,
      frozen_balance = frozen_balance + v_collateral,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Create loan request with PENDING_REVIEW status
  INSERT INTO p2p_loans (
    borrower_id, principal_amount, collateral_amount,
    interest_rate, duration_days, capital_lock_days,
    status, reference_number, approval_status
  ) VALUES (
    p_user_id, p_amount, v_collateral,
    v_interest_rate, 30, 28,
    'open', v_reference, 'pending_review'
  )
  RETURNING id INTO v_loan_id;

  -- Create collateral lock ledger entry
  INSERT INTO ledger (
    user_id, type, amount, status, reference_number,
    related_loan_id, description, approval_status
  ) VALUES (
    p_user_id, 'collateral_lock', v_collateral, 'completed', v_reference,
    v_loan_id, 'Collateral locked for loan request', 'pending_review'
  );

  RETURN jsonb_build_object(
    'success', true,
    'loan_id', v_loan_id,
    'reference_number', v_reference,
    'principal_amount', p_amount,
    'collateral_amount', v_collateral,
    'interest_rate', v_interest_rate,
    'approval_status', 'pending_review'
  );
END;
$$;

-- Update fund_loan_atomic to set pending_review status
CREATE OR REPLACE FUNCTION public.fund_loan_atomic(
  p_lender_id UUID,
  p_loan_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_loan RECORD;
  v_lender RECORD;
  v_borrower RECORD;
  v_due_date TIMESTAMPTZ;
  v_capital_unlock_date TIMESTAMPTZ;
  v_reference TEXT;
BEGIN
  -- Lock the loan row first
  SELECT * INTO v_loan
  FROM p2p_loans
  WHERE id = p_loan_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found';
  END IF;

  -- Check loan is approved and open
  IF v_loan.approval_status != 'approved' THEN
    RAISE EXCEPTION 'Loan request is still pending approval';
  END IF;

  IF v_loan.status != 'open' THEN
    RAISE EXCEPTION 'Loan is no longer available for funding';
  END IF;

  IF v_loan.borrower_id = p_lender_id THEN
    RAISE EXCEPTION 'Cannot fund your own loan request';
  END IF;

  -- Lock lender profile
  SELECT * INTO v_lender
  FROM profiles
  WHERE id = p_lender_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lender profile not found';
  END IF;

  -- Validate lender has sufficient funds
  IF v_lender.vault_balance < v_loan.principal_amount THEN
    RAISE EXCEPTION 'Insufficient funds to fund this loan';
  END IF;

  -- Lock borrower profile
  SELECT * INTO v_borrower
  FROM profiles
  WHERE id = v_loan.borrower_id
  FOR UPDATE;

  -- Calculate dates
  v_due_date := NOW() + INTERVAL '30 days';
  v_capital_unlock_date := NOW() + INTERVAL '28 days';

  -- Generate reference
  v_reference := 'FUND-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTR(gen_random_uuid()::TEXT, 1, 8));

  -- Deduct from lender vault, add to lending balance (frozen until approval)
  UPDATE profiles
  SET vault_balance = vault_balance - v_loan.principal_amount,
      lending_balance = lending_balance + v_loan.principal_amount,
      updated_at = NOW()
  WHERE id = p_lender_id;

  -- Update loan with pending_review for Governor verification of 200% collateral
  UPDATE p2p_loans
  SET lender_id = p_lender_id,
      status = 'funded',
      approval_status = 'pending_review',
      funded_at = NOW(),
      due_date = v_due_date,
      capital_unlock_date = v_capital_unlock_date,
      reference_number = v_reference,
      updated_at = NOW()
  WHERE id = p_loan_id;

  -- Create funding ledger entry with pending_review
  INSERT INTO ledger (
    user_id, type, amount, status, reference_number,
    related_loan_id, related_user_id, description, approval_status
  ) VALUES (
    p_lender_id, 'loan_funding', v_loan.principal_amount, 'clearing', v_reference,
    p_loan_id, v_loan.borrower_id, 'Loan funding - pending Governor approval', 'pending_review'
  );

  RETURN jsonb_build_object(
    'success', true,
    'loan_id', p_loan_id,
    'reference_number', v_reference,
    'principal_amount', v_loan.principal_amount,
    'interest_rate', v_loan.interest_rate,
    'due_date', v_due_date,
    'capital_unlock_date', v_capital_unlock_date,
    'lender_new_vault_balance', v_lender.vault_balance - v_loan.principal_amount,
    'lender_new_lending_balance', v_lender.lending_balance + v_loan.principal_amount,
    'approval_status', 'pending_review'
  );
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION process_transfer_atomic IS 'Atomic transfer processing with pending_review status for Governor approval';
COMMENT ON FUNCTION request_loan_atomic IS 'Atomic loan request with pending_review status for Governor approval';
COMMENT ON FUNCTION fund_loan_atomic IS 'Atomic loan funding with pending_review status for Governor 200% collateral verification';