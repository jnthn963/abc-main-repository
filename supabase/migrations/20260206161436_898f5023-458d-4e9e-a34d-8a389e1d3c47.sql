-- Update fund_loan_atomic to trust p_lender_id when called from service role context
CREATE OR REPLACE FUNCTION public.fund_loan_atomic(p_lender_id UUID, p_loan_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_loan p2p_loans%ROWTYPE;
  v_lender profiles%ROWTYPE;
  v_borrower profiles%ROWTYPE;
  v_settings global_settings%ROWTYPE;
  v_due_date TIMESTAMPTZ;
  v_capital_unlock_date TIMESTAMPTZ;
  v_reference_number TEXT;
BEGIN
  -- Authorization check: Allow service role (auth.uid() IS NULL) since edge function verified JWT
  -- For direct RPC calls with user JWT, verify user can only act on their own account
  IF auth.uid() IS NOT NULL THEN
    IF auth.uid() != p_lender_id 
       AND NOT has_role(auth.uid(), 'admin'::app_role) 
       AND NOT has_role(auth.uid(), 'governor'::app_role) 
    THEN
      RAISE EXCEPTION 'Unauthorized: Cannot perform actions for other users';
    END IF;
  END IF;

  -- Lock the loan row
  SELECT * INTO v_loan
  FROM p2p_loans
  WHERE id = p_loan_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found';
  END IF;

  -- Verify loan is open and approved
  IF v_loan.status != 'open' THEN
    RAISE EXCEPTION 'This loan is no longer available for funding';
  END IF;

  IF v_loan.approval_status != 'approved' THEN
    RAISE EXCEPTION 'This loan request is pending approval';
  END IF;

  -- Cannot fund your own loan
  IF v_loan.borrower_id = p_lender_id THEN
    RAISE EXCEPTION 'You cannot fund your own loan request';
  END IF;

  -- Lock lender profile
  SELECT * INTO v_lender
  FROM profiles
  WHERE id = p_lender_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lender profile not found';
  END IF;

  -- Lock borrower profile
  SELECT * INTO v_borrower
  FROM profiles
  WHERE id = v_loan.borrower_id
  FOR UPDATE;

  -- Check lender has sufficient balance
  IF v_lender.vault_balance < v_loan.principal_amount THEN
    RAISE EXCEPTION 'Insufficient funds to fund this loan';
  END IF;

  -- Get global settings
  SELECT * INTO v_settings FROM global_settings LIMIT 1;

  -- Calculate dates
  v_due_date := NOW() + (v_loan.duration_days || ' days')::INTERVAL;
  v_capital_unlock_date := NOW() + (v_loan.capital_lock_days || ' days')::INTERVAL;
  
  -- Generate reference number for funding
  SELECT generate_reference_number() INTO v_reference_number;

  -- Deduct from lender vault, add to lending balance
  UPDATE profiles
  SET vault_balance = vault_balance - v_loan.principal_amount,
      lending_balance = lending_balance + v_loan.principal_amount,
      updated_at = NOW()
  WHERE id = p_lender_id;

  -- Credit borrower with loan amount (goes to vault balance)
  UPDATE profiles
  SET vault_balance = vault_balance + v_loan.principal_amount,
      updated_at = NOW()
  WHERE id = v_loan.borrower_id;

  -- Update loan status
  UPDATE p2p_loans
  SET status = 'funded',
      lender_id = p_lender_id,
      funded_at = NOW(),
      due_date = v_due_date,
      capital_unlock_date = v_capital_unlock_date,
      approval_status = 'pending_review',
      updated_at = NOW()
  WHERE id = p_loan_id;

  -- Create ledger entry for loan funding (lender side)
  INSERT INTO ledger (
    user_id,
    type,
    amount,
    status,
    reference_number,
    related_loan_id,
    related_user_id,
    description,
    approval_status
  ) VALUES (
    p_lender_id,
    'loan_funding',
    v_loan.principal_amount,
    'completed',
    v_reference_number,
    p_loan_id,
    v_loan.borrower_id,
    'Loan funding to borrower',
    'pending_review'
  );

  RETURN jsonb_build_object(
    'success', true,
    'loan_id', p_loan_id,
    'reference_number', v_reference_number,
    'principal_amount', v_loan.principal_amount,
    'interest_rate', v_loan.interest_rate,
    'due_date', v_due_date,
    'capital_unlock_date', v_capital_unlock_date,
    'lender_new_vault_balance', v_lender.vault_balance - v_loan.principal_amount,
    'lender_new_lending_balance', v_lender.lending_balance + v_loan.principal_amount,
    'status', 'pending_review'
  );
END;
$$;

-- Update request_loan_atomic to trust p_user_id when called from service role context
CREATE OR REPLACE FUNCTION public.request_loan_atomic(p_user_id UUID, p_amount BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_settings global_settings%ROWTYPE;
  v_collateral_required BIGINT;
  v_reference_number TEXT;
  v_loan_id UUID;
  v_account_age_hours INTEGER;
BEGIN
  -- Authorization check: Allow service role (auth.uid() IS NULL) since edge function verified JWT
  IF auth.uid() IS NOT NULL THEN
    IF auth.uid() != p_user_id 
       AND NOT has_role(auth.uid(), 'admin'::app_role) 
       AND NOT has_role(auth.uid(), 'governor'::app_role) 
    THEN
      RAISE EXCEPTION 'Unauthorized: Cannot perform actions for other users';
    END IF;
  END IF;

  -- Lock the user's profile row
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Get global settings
  SELECT * INTO v_settings FROM global_settings LIMIT 1;

  -- Check 144-hour (6-day) account aging rule
  v_account_age_hours := EXTRACT(EPOCH FROM (NOW() - v_profile.created_at)) / 3600;
  IF v_account_age_hours < 144 THEN
    RAISE EXCEPTION 'Account must be at least 6 days old to request loans. Please wait % more hours.', 
      144 - v_account_age_hours;
  END IF;

  -- Calculate 200% collateral requirement
  v_collateral_required := p_amount * 2;
  
  IF v_profile.vault_balance < v_collateral_required THEN
    RAISE EXCEPTION 'Insufficient collateral. You need at least ₱% in your vault to request a ₱% loan (200%% collateral required).', 
      v_collateral_required, p_amount;
  END IF;

  -- Generate reference number
  SELECT generate_reference_number() INTO v_reference_number;

  -- Lock collateral in frozen balance
  UPDATE profiles
  SET vault_balance = vault_balance - v_collateral_required,
      frozen_balance = frozen_balance + v_collateral_required,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Create loan request with pending_review status
  INSERT INTO p2p_loans (
    borrower_id,
    principal_amount,
    collateral_amount,
    interest_rate,
    duration_days,
    capital_lock_days,
    status,
    reference_number,
    approval_status
  ) VALUES (
    p_user_id,
    p_amount,
    v_collateral_required,
    v_settings.borrower_cost_rate,
    30,
    28,
    'open',
    v_reference_number,
    'pending_review'
  )
  RETURNING id INTO v_loan_id;

  -- Create ledger entry for collateral lock
  INSERT INTO ledger (
    user_id,
    type,
    amount,
    status,
    reference_number,
    related_loan_id,
    description,
    approval_status
  ) VALUES (
    p_user_id,
    'collateral_lock',
    v_collateral_required,
    'completed',
    v_reference_number || '-COL',
    v_loan_id,
    'Collateral locked for loan request',
    'auto_approved'
  );

  RETURN jsonb_build_object(
    'success', true,
    'loan_id', v_loan_id,
    'reference_number', v_reference_number,
    'principal_amount', p_amount,
    'collateral_amount', v_collateral_required,
    'interest_rate', v_settings.borrower_cost_rate,
    'new_vault_balance', v_profile.vault_balance - v_collateral_required,
    'new_frozen_balance', v_profile.frozen_balance + v_collateral_required,
    'status', 'pending_review',
    'message', 'Loan request submitted for Governor approval'
  );
END;
$$;

-- Update process_repayment_atomic to trust p_borrower_id when called from service role context
CREATE OR REPLACE FUNCTION public.process_repayment_atomic(p_borrower_id UUID, p_loan_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_loan p2p_loans%ROWTYPE;
  v_borrower profiles%ROWTYPE;
  v_lender profiles%ROWTYPE;
  v_interest_amount BIGINT;
  v_total_repayment BIGINT;
  v_reference_number TEXT;
BEGIN
  -- Authorization check: Allow service role (auth.uid() IS NULL) since edge function verified JWT
  IF auth.uid() IS NOT NULL THEN
    IF auth.uid() != p_borrower_id 
       AND NOT has_role(auth.uid(), 'admin'::app_role) 
       AND NOT has_role(auth.uid(), 'governor'::app_role) 
    THEN
      RAISE EXCEPTION 'Unauthorized: Cannot perform actions for other users';
    END IF;
  END IF;

  -- Lock the loan row
  SELECT * INTO v_loan
  FROM p2p_loans
  WHERE id = p_loan_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found';
  END IF;

  -- Verify caller is the borrower
  IF v_loan.borrower_id != p_borrower_id THEN
    RAISE EXCEPTION 'Only the borrower can repay this loan';
  END IF;

  -- Verify loan is funded
  IF v_loan.status != 'funded' THEN
    RAISE EXCEPTION 'This loan cannot be repaid in its current status';
  END IF;

  -- Lock borrower profile
  SELECT * INTO v_borrower
  FROM profiles
  WHERE id = p_borrower_id
  FOR UPDATE;

  -- Lock lender profile
  SELECT * INTO v_lender
  FROM profiles
  WHERE id = v_loan.lender_id
  FOR UPDATE;

  -- Calculate repayment amounts using floor() for Integer Rule
  v_interest_amount := FLOOR(v_loan.principal_amount * (v_loan.interest_rate / 100));
  v_total_repayment := v_loan.principal_amount + v_interest_amount;

  -- Check borrower has sufficient balance
  IF v_borrower.vault_balance < v_total_repayment THEN
    RAISE EXCEPTION 'Insufficient funds to repay this loan. Need ₱%, have ₱%',
      v_total_repayment, v_borrower.vault_balance;
  END IF;

  -- Generate reference number
  SELECT generate_reference_number() INTO v_reference_number;

  -- Deduct repayment from borrower
  UPDATE profiles
  SET vault_balance = vault_balance - v_total_repayment,
      updated_at = NOW()
  WHERE id = p_borrower_id;

  -- Release collateral back to borrower
  UPDATE profiles
  SET frozen_balance = frozen_balance - v_loan.collateral_amount,
      vault_balance = vault_balance + v_loan.collateral_amount,
      updated_at = NOW()
  WHERE id = p_borrower_id;

  -- Credit lender (principal back to vault, interest to vault as profit)
  UPDATE profiles
  SET lending_balance = lending_balance - v_loan.principal_amount,
      vault_balance = vault_balance + v_total_repayment,
      updated_at = NOW()
  WHERE id = v_loan.lender_id;

  -- Update loan status
  UPDATE p2p_loans
  SET status = 'repaid',
      repaid_at = NOW(),
      updated_at = NOW()
  WHERE id = p_loan_id;

  -- Create ledger entries
  INSERT INTO ledger (
    user_id,
    type,
    amount,
    status,
    reference_number,
    related_loan_id,
    related_user_id,
    description,
    approval_status
  ) VALUES 
  -- Borrower repayment
  (p_borrower_id, 'loan_repayment', v_total_repayment, 'completed', v_reference_number, p_loan_id, v_loan.lender_id, 'Loan repayment', 'auto_approved'),
  -- Collateral release
  (p_borrower_id, 'collateral_release', v_loan.collateral_amount, 'completed', v_reference_number || '-REL', p_loan_id, NULL, 'Collateral released after repayment', 'auto_approved'),
  -- Lender profit
  (v_loan.lender_id, 'lending_profit', v_interest_amount, 'completed', v_reference_number || '-INT', p_loan_id, p_borrower_id, 'Interest earned from loan', 'auto_approved');

  RETURN jsonb_build_object(
    'success', true,
    'loan_id', p_loan_id,
    'reference_number', v_reference_number,
    'principal_amount', v_loan.principal_amount,
    'interest_amount', v_interest_amount,
    'total_repayment', v_total_repayment,
    'collateral_released', v_loan.collateral_amount,
    'borrower_new_vault_balance', v_borrower.vault_balance - v_total_repayment + v_loan.collateral_amount,
    'repaid_at', NOW()
  );
END;
$$;