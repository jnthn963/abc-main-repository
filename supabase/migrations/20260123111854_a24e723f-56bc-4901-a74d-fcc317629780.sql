-- ============================================================
-- SECURITY FIX 1: Atomic Transaction Functions with FOR UPDATE Locking
-- Prevents race conditions and double-spending attacks
-- ============================================================

-- Atomic Transfer Function with Row Locking
CREATE OR REPLACE FUNCTION public.process_transfer_atomic(
  p_user_id UUID,
  p_amount BIGINT,
  p_destination TEXT,
  p_destination_type TEXT,
  p_recipient_member_id TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_vault_balance BIGINT;
  v_frozen_balance BIGINT;
  v_ref_number TEXT;
  v_recipient_id UUID := NULL;
  v_clearing_ends_at TIMESTAMPTZ;
BEGIN
  -- Check system status first
  IF EXISTS(SELECT 1 FROM global_settings WHERE system_kill_switch = true LIMIT 1) THEN
    RAISE EXCEPTION 'System is currently frozen. Withdrawals are disabled.';
  END IF;
  
  IF EXISTS(SELECT 1 FROM global_settings WHERE maintenance_mode = true LIMIT 1) THEN
    RAISE EXCEPTION 'System is under maintenance. Please try again later.';
  END IF;

  -- Validate amount (Integer Rule: whole pesos only, min 100, max 10M)
  IF p_amount < 100 OR p_amount > 10000000 THEN
    RAISE EXCEPTION 'Invalid amount. Must be between ₱100 and ₱10,000,000';
  END IF;

  -- Critical: Lock user row to prevent concurrent modifications
  SELECT vault_balance, frozen_balance
  INTO v_vault_balance, v_frozen_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  
  -- Validate balance atomically
  IF v_vault_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance. Available: ₱%', v_vault_balance;
  END IF;
  
  -- For internal ABC transfers, find recipient
  IF p_destination_type = 'internal' AND p_recipient_member_id IS NOT NULL THEN
    SELECT id INTO v_recipient_id
    FROM profiles
    WHERE member_id = p_recipient_member_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Recipient member not found';
    END IF;
    
    IF v_recipient_id = p_user_id THEN
      RAISE EXCEPTION 'Cannot transfer to yourself';
    END IF;
  END IF;
  
  -- Generate reference number
  v_ref_number := 'TRF-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' ||
                  UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 6));
  
  -- Calculate clearing end time (24 hours from now)
  v_clearing_ends_at := NOW() + INTERVAL '24 hours';
  
  -- Update balances atomically
  UPDATE profiles
  SET vault_balance = vault_balance - p_amount,
      frozen_balance = frozen_balance + p_amount
  WHERE id = p_user_id;
  
  -- Create ledger entry
  INSERT INTO ledger (
    user_id, type, amount, status, reference_number,
    destination, related_user_id, clearing_ends_at, description, metadata
  ) VALUES (
    p_user_id,
    CASE WHEN p_destination_type = 'internal' THEN 'transfer_out'::transaction_type ELSE 'withdrawal'::transaction_type END,
    p_amount,
    'clearing'::transaction_status,
    v_ref_number,
    p_destination,
    v_recipient_id,
    v_clearing_ends_at,
    'Transfer to ' || p_destination,
    jsonb_build_object('destination_type', p_destination_type, 'recipient_member_id', p_recipient_member_id)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'reference_number', v_ref_number,
    'amount', p_amount,
    'new_vault_balance', v_vault_balance - p_amount,
    'new_frozen_balance', v_frozen_balance + p_amount,
    'clearing_ends_at', v_clearing_ends_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Atomic Loan Request Function with Row Locking
CREATE OR REPLACE FUNCTION public.request_loan_atomic(
  p_user_id UUID,
  p_amount BIGINT
) RETURNS JSONB AS $$
DECLARE
  v_vault_balance BIGINT;
  v_frozen_balance BIGINT;
  v_created_at TIMESTAMPTZ;
  v_ref_number TEXT;
  v_loan_id UUID;
  v_lending_rate NUMERIC;
  v_max_loan BIGINT;
  v_collateral_amount BIGINT;
  v_account_age_ms BIGINT;
  v_six_days_ms BIGINT := 6 * 24 * 60 * 60 * 1000;
BEGIN
  -- Check system status first
  IF EXISTS(SELECT 1 FROM global_settings WHERE system_kill_switch = true OR maintenance_mode = true LIMIT 1) THEN
    RAISE EXCEPTION 'System is currently unavailable';
  END IF;

  -- Validate amount
  IF p_amount < 100 OR p_amount > 5000000 THEN
    RAISE EXCEPTION 'Invalid amount. Must be between ₱100 and ₱5,000,000';
  END IF;

  -- Get lending rate
  SELECT lending_yield_rate INTO v_lending_rate FROM global_settings LIMIT 1;
  v_lending_rate := COALESCE(v_lending_rate, 15);

  -- Critical: Lock user row to prevent concurrent modifications
  SELECT vault_balance, frozen_balance, created_at
  INTO v_vault_balance, v_frozen_balance, v_created_at
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  
  -- Check 6-day aging requirement
  v_account_age_ms := EXTRACT(EPOCH FROM (NOW() - v_created_at)) * 1000;
  IF v_account_age_ms < v_six_days_ms THEN
    RAISE EXCEPTION 'Your account must be at least 6 days old to request a loan';
  END IF;
  
  -- Check 50% collateral rule
  v_max_loan := FLOOR(v_vault_balance * 0.5);
  IF p_amount > v_max_loan THEN
    RAISE EXCEPTION 'Loan amount exceeds maximum. Based on 50%% collateral rule, your maximum loan is ₱%', v_max_loan;
  END IF;
  
  -- Collateral = 100% of loan amount
  v_collateral_amount := p_amount;
  
  IF v_vault_balance < v_collateral_amount THEN
    RAISE EXCEPTION 'Insufficient vault balance for collateral';
  END IF;
  
  -- Generate reference number
  v_ref_number := 'LOAN-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' ||
                  UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 6));
  
  -- Lock collateral atomically
  UPDATE profiles
  SET vault_balance = vault_balance - v_collateral_amount,
      frozen_balance = frozen_balance + v_collateral_amount
  WHERE id = p_user_id;
  
  -- Create loan request
  INSERT INTO p2p_loans (
    borrower_id, principal_amount, interest_rate, collateral_amount,
    duration_days, capital_lock_days, status, reference_number
  ) VALUES (
    p_user_id, p_amount, v_lending_rate, v_collateral_amount,
    30, 28, 'open'::loan_status, v_ref_number
  ) RETURNING id INTO v_loan_id;
  
  -- Create collateral lock ledger entry
  INSERT INTO ledger (
    user_id, type, amount, status, reference_number, related_loan_id, description
  ) VALUES (
    p_user_id, 'collateral_lock'::transaction_type, v_collateral_amount, 'completed'::transaction_status,
    'COL-' || v_ref_number, v_loan_id, 'Collateral locked for loan ' || v_ref_number
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'loan_id', v_loan_id,
    'reference_number', v_ref_number,
    'principal_amount', p_amount,
    'collateral_amount', v_collateral_amount,
    'interest_rate', v_lending_rate
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Atomic Fund Loan Function with Row Locking
CREATE OR REPLACE FUNCTION public.fund_loan_atomic(
  p_lender_id UUID,
  p_loan_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_loan RECORD;
  v_lender_vault BIGINT;
  v_lender_lending BIGINT;
  v_borrower_vault BIGINT;
  v_now TIMESTAMPTZ := NOW();
  v_due_date TIMESTAMPTZ;
  v_capital_unlock_date TIMESTAMPTZ;
BEGIN
  -- Check system status
  IF EXISTS(SELECT 1 FROM global_settings WHERE system_kill_switch = true OR maintenance_mode = true LIMIT 1) THEN
    RAISE EXCEPTION 'System is currently unavailable';
  END IF;

  -- Lock the loan row first
  SELECT * INTO v_loan FROM p2p_loans WHERE id = p_loan_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found';
  END IF;
  
  IF v_loan.status != 'open' THEN
    RAISE EXCEPTION 'Loan is no longer available for funding';
  END IF;
  
  IF v_loan.borrower_id = p_lender_id THEN
    RAISE EXCEPTION 'You cannot fund your own loan';
  END IF;
  
  -- Lock lender's profile
  SELECT vault_balance, lending_balance
  INTO v_lender_vault, v_lender_lending
  FROM profiles
  WHERE id = p_lender_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lender profile not found';
  END IF;
  
  IF v_lender_vault < v_loan.principal_amount THEN
    RAISE EXCEPTION 'Insufficient balance. You need ₱% to fund this loan.', v_loan.principal_amount;
  END IF;
  
  -- Lock borrower's profile
  SELECT vault_balance INTO v_borrower_vault
  FROM profiles
  WHERE id = v_loan.borrower_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Borrower profile not found';
  END IF;
  
  -- Calculate dates
  v_due_date := v_now + INTERVAL '30 days';
  v_capital_unlock_date := v_now + INTERVAL '28 days';
  
  -- Update loan status
  UPDATE p2p_loans
  SET lender_id = p_lender_id,
      status = 'funded'::loan_status,
      funded_at = v_now,
      due_date = v_due_date,
      capital_unlock_date = v_capital_unlock_date
  WHERE id = p_loan_id;
  
  -- Update lender: deduct from vault, add to lending_balance
  UPDATE profiles
  SET vault_balance = vault_balance - v_loan.principal_amount,
      lending_balance = lending_balance + v_loan.principal_amount
  WHERE id = p_lender_id;
  
  -- Update borrower: add principal to vault
  UPDATE profiles
  SET vault_balance = vault_balance + v_loan.principal_amount
  WHERE id = v_loan.borrower_id;
  
  -- Create ledger entries
  INSERT INTO ledger (user_id, type, amount, status, reference_number, related_loan_id, related_user_id, description)
  VALUES 
    (p_lender_id, 'loan_funding'::transaction_type, v_loan.principal_amount, 'completed'::transaction_status,
     'FUND-' || v_loan.reference_number, p_loan_id, v_loan.borrower_id, 'Funded loan ' || v_loan.reference_number),
    (v_loan.borrower_id, 'loan_funding'::transaction_type, v_loan.principal_amount, 'completed'::transaction_status,
     'RECV-' || v_loan.reference_number, p_loan_id, p_lender_id, 'Received loan funding from lender');
  
  RETURN jsonb_build_object(
    'success', true,
    'loan_id', p_loan_id,
    'reference_number', v_loan.reference_number,
    'principal_amount', v_loan.principal_amount,
    'interest_rate', v_loan.interest_rate,
    'due_date', v_due_date,
    'capital_unlock_date', v_capital_unlock_date,
    'lender_new_vault_balance', v_lender_vault - v_loan.principal_amount,
    'lender_new_lending_balance', v_lender_lending + v_loan.principal_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Atomic Repayment Function with Row Locking
CREATE OR REPLACE FUNCTION public.process_repayment_atomic(
  p_borrower_id UUID,
  p_loan_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_loan RECORD;
  v_borrower_vault BIGINT;
  v_borrower_frozen BIGINT;
  v_lender_vault BIGINT;
  v_lender_lending BIGINT;
  v_interest_amount BIGINT;
  v_total_repayment BIGINT;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Lock the loan row first
  SELECT * INTO v_loan FROM p2p_loans WHERE id = p_loan_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found';
  END IF;
  
  IF v_loan.status != 'funded' THEN
    RAISE EXCEPTION 'Loan is not in funded status';
  END IF;
  
  IF v_loan.borrower_id != p_borrower_id THEN
    RAISE EXCEPTION 'Only the borrower can repay this loan';
  END IF;
  
  -- Calculate repayment amount
  v_interest_amount := FLOOR(v_loan.principal_amount * (v_loan.interest_rate / 100));
  v_total_repayment := v_loan.principal_amount + v_interest_amount;
  
  -- Lock borrower's profile
  SELECT vault_balance, frozen_balance
  INTO v_borrower_vault, v_borrower_frozen
  FROM profiles
  WHERE id = p_borrower_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Borrower profile not found';
  END IF;
  
  IF v_borrower_vault < v_total_repayment THEN
    RAISE EXCEPTION 'Insufficient balance. Repayment amount: ₱%', v_total_repayment;
  END IF;
  
  -- Lock lender's profile
  SELECT vault_balance, lending_balance
  INTO v_lender_vault, v_lender_lending
  FROM profiles
  WHERE id = v_loan.lender_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lender profile not found';
  END IF;
  
  -- Update loan status
  UPDATE p2p_loans
  SET status = 'repaid'::loan_status, repaid_at = v_now
  WHERE id = p_loan_id;
  
  -- Update borrower: deduct repayment, release collateral
  UPDATE profiles
  SET vault_balance = vault_balance - v_total_repayment,
      frozen_balance = GREATEST(0, frozen_balance - v_loan.collateral_amount)
  WHERE id = p_borrower_id;
  
  -- Update lender: receive repayment, release lending balance
  UPDATE profiles
  SET vault_balance = vault_balance + v_total_repayment,
      lending_balance = GREATEST(0, lending_balance - v_loan.principal_amount)
  WHERE id = v_loan.lender_id;
  
  -- Create ledger entries
  INSERT INTO ledger (user_id, type, amount, status, reference_number, related_loan_id, related_user_id, description)
  VALUES 
    (p_borrower_id, 'loan_repayment'::transaction_type, v_total_repayment, 'completed'::transaction_status,
     'REPAY-' || v_loan.reference_number, p_loan_id, v_loan.lender_id, 
     format('Loan repayment (Principal: ₱%s + Interest: ₱%s)', v_loan.principal_amount, v_interest_amount)),
    (p_borrower_id, 'collateral_release'::transaction_type, v_loan.collateral_amount, 'completed'::transaction_status,
     'COLREL-' || v_loan.reference_number, p_loan_id, NULL, 'Collateral released after loan repayment'),
    (v_loan.lender_id, 'loan_repayment'::transaction_type, v_total_repayment, 'completed'::transaction_status,
     'RECV-REPAY-' || v_loan.reference_number, p_loan_id, p_borrower_id, 'Received loan repayment'),
    (v_loan.lender_id, 'lending_profit'::transaction_type, v_interest_amount, 'completed'::transaction_status,
     'PROFIT-' || v_loan.reference_number, p_loan_id, NULL, 'Lending profit from loan ' || v_loan.reference_number);
  
  RETURN jsonb_build_object(
    'success', true,
    'loan_id', p_loan_id,
    'reference_number', v_loan.reference_number,
    'principal_amount', v_loan.principal_amount,
    'interest_amount', v_interest_amount,
    'total_repayment', v_total_repayment,
    'collateral_released', v_loan.collateral_amount,
    'borrower_new_vault_balance', v_borrower_vault - v_total_repayment,
    'repaid_at', v_now
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Atomic Clearing Release Function with Row Locking
CREATE OR REPLACE FUNCTION public.release_clearing_atomic()
RETURNS JSONB AS $$
DECLARE
  v_tx RECORD;
  v_transactions_cleared INT := 0;
  v_total_found INT := 0;
  v_errors TEXT[] := '{}';
BEGIN
  -- Check system status
  IF EXISTS(SELECT 1 FROM global_settings WHERE system_kill_switch = true OR maintenance_mode = true LIMIT 1) THEN
    RETURN jsonb_build_object('success', false, 'message', 'System is in maintenance or kill switch is active');
  END IF;

  -- Get count first
  SELECT COUNT(*) INTO v_total_found
  FROM ledger
  WHERE status = 'clearing' AND clearing_ends_at < NOW();

  -- Process each clearing transaction
  FOR v_tx IN 
    SELECT l.*, p.vault_balance, p.frozen_balance
    FROM ledger l
    JOIN profiles p ON p.id = l.user_id
    WHERE l.status = 'clearing' AND l.clearing_ends_at < NOW()
    FOR UPDATE OF l, p
  LOOP
    BEGIN
      -- Update transaction status
      UPDATE ledger
      SET status = 'completed'::transaction_status, cleared_at = NOW()
      WHERE id = v_tx.id;

      -- For deposits, move from frozen to vault
      IF v_tx.type = 'deposit' THEN
        UPDATE profiles
        SET vault_balance = vault_balance + v_tx.amount,
            frozen_balance = GREATEST(0, frozen_balance - v_tx.amount)
        WHERE id = v_tx.user_id;
      END IF;

      v_transactions_cleared := v_transactions_cleared + 1;
    EXCEPTION WHEN OTHERS THEN
      v_errors := array_append(v_errors, 'Transaction ' || v_tx.reference_number || ': ' || SQLERRM);
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Clearing release completed',
    'transactions_cleared', v_transactions_cleared,
    'total_found', v_total_found,
    'errors_count', array_length(v_errors, 1),
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Atomic Daily Interest Function with Row Locking
CREATE OR REPLACE FUNCTION public.apply_daily_interest_atomic()
RETURNS JSONB AS $$
DECLARE
  v_profile RECORD;
  v_interest_rate NUMERIC;
  v_interest_amount BIGINT;
  v_new_balance BIGINT;
  v_ref_number TEXT;
  v_members_processed INT := 0;
  v_total_interest BIGINT := 0;
  v_errors TEXT[] := '{}';
BEGIN
  -- Check system status
  IF EXISTS(SELECT 1 FROM global_settings WHERE system_kill_switch = true OR maintenance_mode = true LIMIT 1) THEN
    RETURN jsonb_build_object('success', false, 'message', 'System is in maintenance or kill switch is active');
  END IF;

  -- Get interest rate
  SELECT vault_interest_rate / 100 INTO v_interest_rate FROM global_settings LIMIT 1;
  v_interest_rate := COALESCE(v_interest_rate, 0.005);

  -- Process each profile with positive vault balance
  FOR v_profile IN 
    SELECT id, vault_balance, member_id
    FROM profiles
    WHERE vault_balance > 0
    FOR UPDATE
  LOOP
    BEGIN
      -- Calculate interest using floor() for Integer Rule
      v_interest_amount := FLOOR(v_profile.vault_balance * v_interest_rate);
      
      IF v_interest_amount > 0 THEN
        v_new_balance := v_profile.vault_balance + v_interest_amount;
        v_ref_number := 'INT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || RIGHT(v_profile.member_id, 4);
        
        -- Update vault balance
        UPDATE profiles SET vault_balance = v_new_balance WHERE id = v_profile.id;
        
        -- Record in ledger
        INSERT INTO ledger (user_id, type, amount, status, reference_number, description, metadata)
        VALUES (
          v_profile.id, 'vault_interest'::transaction_type, v_interest_amount, 
          'completed'::transaction_status, v_ref_number,
          format('Daily vault interest at %s%%', v_interest_rate * 100),
          jsonb_build_object('previous_balance', v_profile.vault_balance, 'interest_rate', v_interest_rate * 100, 'new_balance', v_new_balance)
        );
        
        -- Record in interest history
        INSERT INTO interest_history (user_id, previous_balance, interest_rate, interest_amount, new_balance, reference_number)
        VALUES (v_profile.id, v_profile.vault_balance, v_interest_rate * 100, v_interest_amount, v_new_balance, v_ref_number);
        
        v_total_interest := v_total_interest + v_interest_amount;
        v_members_processed := v_members_processed + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_errors := array_append(v_errors, 'Profile ' || v_profile.member_id || ': ' || SQLERRM);
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Daily interest calculation completed',
    'members_processed', v_members_processed,
    'total_interest_distributed', v_total_interest,
    'interest_rate', v_interest_rate * 100,
    'errors_count', array_length(v_errors, 1),
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================================
-- SECURITY FIX 3: Hash Security Answers with bcrypt
-- ============================================================

-- Enable pgcrypto extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to hash security answers on insert/update
CREATE OR REPLACE FUNCTION public.hash_security_answers()
RETURNS TRIGGER AS $$
BEGIN
  -- Hash security_answer_1 if it's being set or changed
  IF NEW.security_answer_1 IS NOT NULL AND 
     (TG_OP = 'INSERT' OR NEW.security_answer_1 IS DISTINCT FROM OLD.security_answer_1) THEN
    -- Only hash if not already hashed (bcrypt hashes start with $2)
    IF LEFT(NEW.security_answer_1, 2) != '$2' THEN
      NEW.security_answer_1 = crypt(lower(trim(NEW.security_answer_1)), gen_salt('bf'));
    END IF;
  END IF;
  
  -- Hash security_answer_2 if it's being set or changed
  IF NEW.security_answer_2 IS NOT NULL AND
     (TG_OP = 'INSERT' OR NEW.security_answer_2 IS DISTINCT FROM OLD.security_answer_2) THEN
    -- Only hash if not already hashed
    IF LEFT(NEW.security_answer_2, 2) != '$2' THEN
      NEW.security_answer_2 = crypt(lower(trim(NEW.security_answer_2)), gen_salt('bf'));
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Create trigger for hashing security answers
DROP TRIGGER IF EXISTS hash_security_answers_trigger ON profiles;
CREATE TRIGGER hash_security_answers_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION hash_security_answers();

-- Function to verify security answers (for account recovery)
CREATE OR REPLACE FUNCTION public.verify_security_answer(
  p_user_id UUID,
  p_question_num INT,
  p_answer TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_stored_hash TEXT;
BEGIN
  IF p_question_num = 1 THEN
    SELECT security_answer_1 INTO v_stored_hash FROM profiles WHERE id = p_user_id;
  ELSE
    SELECT security_answer_2 INTO v_stored_hash FROM profiles WHERE id = p_user_id;
  END IF;
  
  IF v_stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN crypt(lower(trim(p_answer)), v_stored_hash) = v_stored_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;