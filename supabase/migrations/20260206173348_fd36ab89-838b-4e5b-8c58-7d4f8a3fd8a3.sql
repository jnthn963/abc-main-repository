-- Security Fixes: warn-level security issues remediation

-- ==============================================================================
-- 1. MAKE qr-codes BUCKET PRIVATE (Storage Exposure Fix)
-- ==============================================================================

-- Make the qr-codes bucket private (no anonymous public access)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'qr-codes';

-- Add RLS policy for authenticated users to read QR codes via signed URLs
-- First, drop any existing conflicting SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view QR codes" ON storage.objects;

-- Create policy that allows authenticated users to read QR codes
CREATE POLICY "Authenticated users can view QR codes"
ON storage.objects
FOR SELECT
USING (bucket_id = 'qr-codes' AND auth.uid() IS NOT NULL);

-- ==============================================================================
-- 2. SECURITY ANSWER VALIDATION (Input Validation Fix)
-- ==============================================================================

-- Update set_security_credentials function to add server-side validation
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
DECLARE
  v_hashed_answer_1 TEXT;
  v_hashed_answer_2 TEXT;
  weak_answers TEXT[] := ARRAY['12345', 'password', 'admin', 'test', '123', 'abc', 'qwerty', 'letmein', 'welcome', 'iloveyou'];
BEGIN
  -- Authorization check: user can only set their own credentials
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Validate questions are not empty
  IF TRIM(p_question_1) = '' OR TRIM(p_question_2) = '' THEN
    RAISE EXCEPTION 'Questions cannot be empty';
  END IF;

  -- Validate answer minimum length (5 characters)
  IF LENGTH(TRIM(p_answer_1)) < 5 OR LENGTH(TRIM(p_answer_2)) < 5 THEN
    RAISE EXCEPTION 'Answers must be at least 5 characters';
  END IF;

  -- Validate answer maximum length (100 characters)
  IF LENGTH(p_answer_1) > 100 OR LENGTH(p_answer_2) > 100 THEN
    RAISE EXCEPTION 'Answers cannot exceed 100 characters';
  END IF;

  -- Reject purely numeric answers (weak security)
  IF p_answer_1 ~ '^[0-9]+$' OR p_answer_2 ~ '^[0-9]+$' THEN
    RAISE EXCEPTION 'Answers cannot be purely numeric';
  END IF;

  -- Reject common weak answers (blacklist)
  IF LOWER(TRIM(p_answer_1)) = ANY(weak_answers) OR LOWER(TRIM(p_answer_2)) = ANY(weak_answers) THEN
    RAISE EXCEPTION 'Answer too common, please choose a more unique answer';
  END IF;

  -- Answers must be different from each other
  IF LOWER(TRIM(p_answer_1)) = LOWER(TRIM(p_answer_2)) THEN
    RAISE EXCEPTION 'Security answers must be different';
  END IF;

  -- Hash the answers using bcrypt
  v_hashed_answer_1 := crypt(LOWER(TRIM(p_answer_1)), gen_salt('bf', 10));
  v_hashed_answer_2 := crypt(LOWER(TRIM(p_answer_2)), gen_salt('bf', 10));

  -- Upsert security credentials
  INSERT INTO security_credentials (
    user_id,
    security_question_1,
    security_answer_1,
    security_question_2,
    security_answer_2,
    updated_at
  )
  VALUES (
    p_user_id,
    TRIM(p_question_1),
    v_hashed_answer_1,
    TRIM(p_question_2),
    v_hashed_answer_2,
    NOW()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    security_question_1 = TRIM(p_question_1),
    security_answer_1 = v_hashed_answer_1,
    security_question_2 = TRIM(p_question_2),
    security_answer_2 = v_hashed_answer_2,
    updated_at = NOW();

  RETURN TRUE;
END;
$$;

-- ==============================================================================
-- 3. ERROR MESSAGE SANITIZATION (Info Leakage Fix)
-- ==============================================================================

-- Update request_loan_atomic to use generic error messages
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
  v_settings RECORD;
  v_loan_id UUID;
  v_reference TEXT;
  v_collateral BIGINT;
  v_rate NUMERIC;
  v_due_date TIMESTAMP WITH TIME ZONE;
  v_capital_unlock_date TIMESTAMP WITH TIME ZONE;
  v_hours_remaining INTEGER;
BEGIN
  -- Allow service role (auth.uid() IS NULL) since edge function verified JWT
  -- For direct RPC calls with user JWT, verify user can only act on their own account
  IF auth.uid() IS NOT NULL THEN
    IF auth.uid() != p_user_id 
       AND NOT has_role(auth.uid(), 'admin'::app_role) 
       AND NOT has_role(auth.uid(), 'governor'::app_role) 
    THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;
  END IF;

  -- Get profile with row lock
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Resource not found';
  END IF;

  -- Get global settings
  SELECT * INTO v_settings
  FROM global_settings
  LIMIT 1;

  IF v_settings.system_kill_switch THEN
    RAISE EXCEPTION 'System temporarily unavailable';
  END IF;

  -- Check 144-hour aging rule (6 days) - generic error message
  IF v_profile.created_at > NOW() - INTERVAL '144 hours' THEN
    v_hours_remaining := EXTRACT(EPOCH FROM ((v_profile.created_at + INTERVAL '144 hours') - NOW())) / 3600;
    -- Log specific details server-side for debugging
    RAISE NOTICE 'Loan request denied: account age insufficient. Hours remaining: %', v_hours_remaining;
    RAISE EXCEPTION 'Account does not meet eligibility requirements';
  END IF;

  -- Validate amount
  IF p_amount < 100 THEN
    RAISE EXCEPTION 'Amount below minimum threshold';
  END IF;

  IF p_amount > 10000000 THEN
    RAISE EXCEPTION 'Amount exceeds maximum limit';
  END IF;

  -- Calculate 50% collateral
  v_collateral := CEIL(p_amount * 0.5);

  -- Check sufficient available balance for collateral
  IF v_profile.vault_balance < v_collateral THEN
    RAISE EXCEPTION 'Insufficient funds for collateral';
  END IF;

  -- Get borrower cost rate
  v_rate := COALESCE(v_settings.borrower_cost_rate, 15.00);

  -- Generate reference number
  v_reference := 'LOAN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                 UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8));

  -- Calculate dates (28-day cycle)
  v_due_date := NOW() + INTERVAL '28 days';
  v_capital_unlock_date := NOW() + INTERVAL '28 days';

  -- Lock collateral: move from vault to frozen
  UPDATE profiles
  SET 
    vault_balance = vault_balance - v_collateral,
    frozen_balance = frozen_balance + v_collateral,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Create loan record (pending approval)
  INSERT INTO p2p_loans (
    id,
    borrower_id,
    principal_amount,
    collateral_amount,
    interest_rate,
    duration_days,
    capital_lock_days,
    due_date,
    capital_unlock_date,
    status,
    approval_status,
    reference_number,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    p_user_id,
    p_amount,
    v_collateral,
    v_rate,
    28,
    28,
    v_due_date,
    v_capital_unlock_date,
    'open'::loan_status,
    'pending',
    v_reference,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_loan_id;

  -- Record collateral lock in ledger
  INSERT INTO ledger (
    user_id,
    type,
    amount,
    status,
    reference_number,
    description,
    related_loan_id,
    metadata,
    approval_status,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    'collateral_lock'::transaction_type,
    v_collateral,
    'completed'::transaction_status,
    v_reference || '-COL',
    'Collateral locked for loan request',
    v_loan_id,
    jsonb_build_object('loan_amount', p_amount, 'collateral_rate', 0.5),
    'approved',
    NOW(),
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'loan_id', v_loan_id,
    'reference_number', v_reference,
    'principal_amount', p_amount,
    'collateral_amount', v_collateral,
    'interest_rate', v_rate,
    'due_date', v_due_date
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log full error server-side for debugging
    RAISE NOTICE 'request_loan_atomic error for user %: %', p_user_id, SQLERRM;
    RAISE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.set_security_credentials TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_loan_atomic TO authenticated;