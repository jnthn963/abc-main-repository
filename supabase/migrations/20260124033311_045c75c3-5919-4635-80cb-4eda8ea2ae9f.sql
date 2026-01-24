-- =====================================================
-- COMPREHENSIVE SECURITY HARDENING MIGRATION
-- =====================================================
-- This migration addresses:
-- 1. Security answer hash exposure via RLS policy
-- 2. Missing auth checks in SECURITY DEFINER functions
-- 3. Rate limit cleanup function
-- =====================================================

-- =====================================================
-- PART 1: ISOLATE SECURITY CREDENTIALS
-- Move security answers to a separate table with NO user SELECT access
-- =====================================================

-- Create isolated security credentials table
CREATE TABLE IF NOT EXISTS public.security_credentials (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  security_question_1 TEXT,
  security_answer_1 TEXT,
  security_question_2 TEXT,
  security_answer_2 TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS with NO user access - only via SECURITY DEFINER functions
ALTER TABLE public.security_credentials ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Block ALL direct user access - only service role and SECURITY DEFINER functions can access
CREATE POLICY "No direct user access to security credentials"
  ON public.security_credentials
  FOR ALL
  USING (false);

-- Migrate existing security data to new table
INSERT INTO public.security_credentials (
  user_id,
  security_question_1,
  security_answer_1,
  security_question_2,
  security_answer_2
)
SELECT
  id,
  security_question_1,
  security_answer_1,
  security_question_2,
  security_answer_2
FROM public.profiles
WHERE security_answer_1 IS NOT NULL OR security_answer_2 IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET
  security_question_1 = EXCLUDED.security_question_1,
  security_answer_1 = EXCLUDED.security_answer_1,
  security_question_2 = EXCLUDED.security_question_2,
  security_answer_2 = EXCLUDED.security_answer_2,
  updated_at = NOW();

-- Update verify_security_answer to use new table
CREATE OR REPLACE FUNCTION public.verify_security_answer(
  p_user_id UUID,
  p_question_num INTEGER,
  p_answer TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stored_hash TEXT;
BEGIN
  -- Get the stored hash from the isolated credentials table
  IF p_question_num = 1 THEN
    SELECT security_answer_1 INTO v_stored_hash
    FROM security_credentials
    WHERE user_id = p_user_id;
  ELSIF p_question_num = 2 THEN
    SELECT security_answer_2 INTO v_stored_hash
    FROM security_credentials
    WHERE user_id = p_user_id;
  ELSE
    RETURN FALSE;
  END IF;

  -- If no stored hash, return false
  IF v_stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Compare using crypt
  RETURN v_stored_hash = crypt(p_answer, v_stored_hash);
END;
$$;

-- Create function to get security questions (not answers) for recovery
CREATE OR REPLACE FUNCTION public.get_security_questions(p_user_id UUID)
RETURNS TABLE (question_1 TEXT, question_2 TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Users can only get their own questions
  SELECT security_question_1, security_question_2
  FROM security_credentials
  WHERE user_id = p_user_id AND p_user_id = auth.uid();
$$;

-- Create function to update security credentials (used during registration)
CREATE OR REPLACE FUNCTION public.set_security_credentials(
  p_user_id UUID,
  p_question_1 TEXT,
  p_answer_1 TEXT,
  p_question_2 TEXT,
  p_answer_2 TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- CRITICAL: Users can only set their own credentials
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify credentials for other users';
  END IF;

  INSERT INTO security_credentials (
    user_id,
    security_question_1,
    security_answer_1,
    security_question_2,
    security_answer_2
  ) VALUES (
    p_user_id,
    p_question_1,
    crypt(p_answer_1, gen_salt('bf', 10)),
    p_question_2,
    crypt(p_answer_2, gen_salt('bf', 10))
  )
  ON CONFLICT (user_id) DO UPDATE SET
    security_question_1 = EXCLUDED.security_question_1,
    security_answer_1 = EXCLUDED.security_answer_1,
    security_question_2 = EXCLUDED.security_question_2,
    security_answer_2 = EXCLUDED.security_answer_2,
    updated_at = NOW();

  RETURN TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.verify_security_answer TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_security_questions TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_security_credentials TO authenticated;

-- =====================================================
-- PART 2: ADD AUTHORIZATION CHECKS TO ATOMIC FUNCTIONS
-- Defense-in-depth: verify auth.uid() matches p_user_id
-- =====================================================

-- Update process_transfer_atomic with auth check
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
  v_profile profiles%ROWTYPE;
  v_recipient profiles%ROWTYPE;
  v_reference_number TEXT;
  v_clearing_ends_at TIMESTAMPTZ;
  v_ledger_id UUID;
BEGIN
  -- CRITICAL: Defense-in-depth authorization check
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF auth.uid() != p_user_id 
     AND NOT has_role(auth.uid(), 'admin'::app_role) 
     AND NOT has_role(auth.uid(), 'governor'::app_role) 
  THEN
    RAISE EXCEPTION 'Unauthorized: Cannot perform actions for other users';
  END IF;

  -- Lock the user's profile row to prevent race conditions
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Check sufficient balance (using vault_balance only)
  IF v_profile.vault_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds for this transfer';
  END IF;

  -- Generate reference number
  SELECT generate_reference_number() INTO v_reference_number;
  
  -- Set clearing time (24 hours from now)
  v_clearing_ends_at := NOW() + INTERVAL '24 hours';

  -- For internal transfers, verify recipient exists
  IF p_destination_type = 'internal' AND p_recipient_member_id IS NOT NULL THEN
    SELECT * INTO v_recipient
    FROM profiles
    WHERE member_id = p_recipient_member_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Recipient member not found';
    END IF;
    
    -- Cannot transfer to self
    IF v_recipient.id = p_user_id THEN
      RAISE EXCEPTION 'Cannot transfer to yourself';
    END IF;
  END IF;

  -- Deduct from sender's vault balance immediately
  UPDATE profiles
  SET vault_balance = vault_balance - p_amount,
      frozen_balance = frozen_balance + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Create ledger entry for the outgoing transfer (pending review)
  INSERT INTO ledger (
    user_id,
    type,
    amount,
    status,
    reference_number,
    clearing_ends_at,
    description,
    destination,
    related_user_id,
    approval_status
  ) VALUES (
    p_user_id,
    'transfer_out',
    p_amount,
    'clearing',
    v_reference_number,
    v_clearing_ends_at,
    'Transfer to ' || p_destination,
    p_destination,
    CASE WHEN p_destination_type = 'internal' THEN v_recipient.id ELSE NULL END,
    'pending_review'
  )
  RETURNING id INTO v_ledger_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_ledger_id,
    'reference_number', v_reference_number,
    'amount', p_amount,
    'destination', p_destination,
    'destination_type', p_destination_type,
    'new_vault_balance', v_profile.vault_balance - p_amount,
    'new_frozen_balance', v_profile.frozen_balance + p_amount,
    'clearing_ends_at', v_clearing_ends_at,
    'status', 'pending_review'
  );
END;
$$;

-- Update request_loan_atomic with auth check
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
  v_profile profiles%ROWTYPE;
  v_settings global_settings%ROWTYPE;
  v_collateral_required BIGINT;
  v_reference_number TEXT;
  v_loan_id UUID;
  v_account_age_hours INTEGER;
BEGIN
  -- CRITICAL: Defense-in-depth authorization check
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF auth.uid() != p_user_id 
     AND NOT has_role(auth.uid(), 'admin'::app_role) 
     AND NOT has_role(auth.uid(), 'governor'::app_role) 
  THEN
    RAISE EXCEPTION 'Unauthorized: Cannot perform actions for other users';
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

  -- Calculate 50% collateral requirement (uses vault_balance)
  v_collateral_required := p_amount * 2; -- 200% collateral = 2x the loan amount
  
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

-- Update fund_loan_atomic with auth check
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
  v_loan p2p_loans%ROWTYPE;
  v_lender profiles%ROWTYPE;
  v_borrower profiles%ROWTYPE;
  v_settings global_settings%ROWTYPE;
  v_due_date TIMESTAMPTZ;
  v_capital_unlock_date TIMESTAMPTZ;
  v_reference_number TEXT;
BEGIN
  -- CRITICAL: Defense-in-depth authorization check
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF auth.uid() != p_lender_id 
     AND NOT has_role(auth.uid(), 'admin'::app_role) 
     AND NOT has_role(auth.uid(), 'governor'::app_role) 
  THEN
    RAISE EXCEPTION 'Unauthorized: Cannot perform actions for other users';
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

-- Update process_repayment_atomic with auth check
CREATE OR REPLACE FUNCTION public.process_repayment_atomic(
  p_borrower_id UUID,
  p_loan_id UUID
)
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
  -- CRITICAL: Defense-in-depth authorization check
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF auth.uid() != p_borrower_id 
     AND NOT has_role(auth.uid(), 'admin'::app_role) 
     AND NOT has_role(auth.uid(), 'governor'::app_role) 
  THEN
    RAISE EXCEPTION 'Unauthorized: Cannot perform actions for other users';
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

-- =====================================================
-- PART 3: RATE LIMIT CLEANUP FUNCTION
-- =====================================================

-- Create cleanup function for expired rate limits
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete rate limit entries older than 24 hours
  DELETE FROM rate_limits
  WHERE window_start < NOW() - INTERVAL '24 hours';
END;
$$;

-- Grant execute only to service role (for cron jobs)
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits FROM PUBLIC;

-- =====================================================
-- PART 4: UPDATE PROFILES_USER_VIEW TO EXCLUDE SECURITY COLUMNS
-- (Already excludes security_answer_1/2, but ensure questions excluded too)
-- =====================================================

DROP VIEW IF EXISTS public.profiles_user_view;
CREATE VIEW public.profiles_user_view AS
SELECT 
  id,
  member_id,
  display_name,
  email,
  phone,
  vault_balance,
  frozen_balance,
  lending_balance,
  membership_tier,
  kyc_status,
  referrer_id,
  total_referral_earnings,
  address_line1,
  address_line2,
  city,
  province,
  postal_code,
  referral_code,
  onboarding_completed,
  created_at,
  updated_at,
  last_login_at
  -- Explicitly EXCLUDE: security_question_1, security_question_2, security_answer_1, security_answer_2
FROM profiles;

-- Grant select on view
GRANT SELECT ON public.profiles_user_view TO authenticated;

-- =====================================================
-- PART 5: ENSURE PROFILES TABLE TRIGGERS STILL WORK
-- Hash any security answers that come through the old flow
-- =====================================================

CREATE OR REPLACE FUNCTION public.hash_security_answers()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Also sync to security_credentials table
  IF NEW.security_answer_1 IS NOT NULL OR NEW.security_answer_2 IS NOT NULL THEN
    INSERT INTO security_credentials (
      user_id,
      security_question_1,
      security_answer_1,
      security_question_2,
      security_answer_2
    ) VALUES (
      NEW.id,
      NEW.security_question_1,
      CASE WHEN NEW.security_answer_1 IS NOT NULL AND NEW.security_answer_1 NOT LIKE '$2b$%' 
           THEN crypt(NEW.security_answer_1, gen_salt('bf', 10))
           ELSE NEW.security_answer_1 END,
      NEW.security_question_2,
      CASE WHEN NEW.security_answer_2 IS NOT NULL AND NEW.security_answer_2 NOT LIKE '$2b$%'
           THEN crypt(NEW.security_answer_2, gen_salt('bf', 10))
           ELSE NEW.security_answer_2 END
    )
    ON CONFLICT (user_id) DO UPDATE SET
      security_question_1 = EXCLUDED.security_question_1,
      security_answer_1 = EXCLUDED.security_answer_1,
      security_question_2 = EXCLUDED.security_question_2,
      security_answer_2 = EXCLUDED.security_answer_2,
      updated_at = NOW();
  END IF;

  -- Still hash on profiles table for backward compatibility
  IF NEW.security_answer_1 IS NOT NULL AND NEW.security_answer_1 NOT LIKE '$2b$%' THEN
    NEW.security_answer_1 := crypt(NEW.security_answer_1, gen_salt('bf', 10));
  END IF;
  
  IF NEW.security_answer_2 IS NOT NULL AND NEW.security_answer_2 NOT LIKE '$2b$%' THEN
    NEW.security_answer_2 := crypt(NEW.security_answer_2, gen_salt('bf', 10));
  END IF;
  
  RETURN NEW;
END;
$$;