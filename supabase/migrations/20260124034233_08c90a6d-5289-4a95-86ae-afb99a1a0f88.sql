-- =====================================================
-- SECURITY REMEDIATION: Remove security columns from profiles
-- Columns are now isolated in security_credentials table
-- =====================================================

-- Step 1: Drop dependent views FIRST
DROP VIEW IF EXISTS public.profiles_user_view CASCADE;
DROP VIEW IF EXISTS public.profiles_admin_view CASCADE;

-- Step 2: Drop security columns from profiles table
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS security_question_1,
  DROP COLUMN IF EXISTS security_answer_1,
  DROP COLUMN IF EXISTS security_question_2,
  DROP COLUMN IF EXISTS security_answer_2;

-- Step 3: Recreate profiles_user_view WITHOUT security columns
CREATE VIEW public.profiles_user_view WITH (security_invoker = true) AS
SELECT 
  id,
  member_id,
  display_name,
  email,
  phone,
  address_line1,
  address_line2,
  city,
  province,
  postal_code,
  vault_balance,
  frozen_balance,
  lending_balance,
  membership_tier,
  kyc_status,
  referrer_id,
  referral_code,
  total_referral_earnings,
  onboarding_completed,
  created_at,
  updated_at,
  last_login_at
FROM public.profiles;

-- Step 4: Recreate profiles_admin_view - join security_credentials for questions only (not answers!)
CREATE VIEW public.profiles_admin_view WITH (security_invoker = true) AS
SELECT 
  p.id,
  p.member_id,
  p.display_name,
  p.email,
  p.phone,
  p.address_line1,
  p.address_line2,
  p.city,
  p.province,
  p.postal_code,
  p.vault_balance,
  p.frozen_balance,
  p.lending_balance,
  p.membership_tier,
  p.kyc_status,
  p.referrer_id,
  p.referral_code,
  p.total_referral_earnings,
  p.onboarding_completed,
  p.created_at,
  p.updated_at,
  p.last_login_at,
  sc.security_question_1,
  sc.security_question_2
  -- NOTE: security_answer_1 and security_answer_2 are INTENTIONALLY excluded
FROM public.profiles p
LEFT JOIN public.security_credentials sc ON sc.user_id = p.id;

-- Step 5: Ensure RLS is enabled and properly restricted for security_credentials
ALTER TABLE public.security_credentials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate with strict blocking
DROP POLICY IF EXISTS "No direct user access to security credentials" ON public.security_credentials;
DROP POLICY IF EXISTS "No direct access to security credentials" ON public.security_credentials;
CREATE POLICY "Block all direct access to security credentials"
  ON public.security_credentials
  FOR ALL
  USING (false);

-- Step 6: Update get_security_questions to use the isolated table with proper auth
CREATE OR REPLACE FUNCTION public.get_security_questions(p_user_id UUID)
RETURNS TABLE(question_1 TEXT, question_2 TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow users to get their own questions or admins/governors
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF auth.uid() != p_user_id 
     AND NOT has_role(auth.uid(), 'admin'::app_role)
     AND NOT has_role(auth.uid(), 'governor'::app_role) 
  THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access other users security questions';
  END IF;

  RETURN QUERY
  SELECT sc.security_question_1, sc.security_question_2
  FROM public.security_credentials sc
  WHERE sc.user_id = p_user_id;
END;
$$;

-- Step 7: Create password recovery initiation function (anonymous access allowed)
CREATE OR REPLACE FUNCTION public.initiate_account_recovery(p_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_member_id TEXT;
  v_questions JSON;
BEGIN
  -- Rate limiting check (3 attempts per hour per email)
  IF NOT check_rate_limit('recovery:' || LOWER(p_email), 3, 3600) THEN
    RETURN json_build_object('success', false, 'error', 'Too many recovery attempts. Try again in 1 hour.');
  END IF;

  -- Find user by email (case-insensitive)
  SELECT p.id, p.member_id INTO v_user_id, v_member_id
  FROM public.profiles p
  WHERE LOWER(p.email) = LOWER(p_email);

  IF v_user_id IS NULL THEN
    -- Return generic message to prevent email enumeration
    RETURN json_build_object(
      'success', true, 
      'message', 'If an account exists, recovery options will be displayed.',
      'has_security_questions', false
    );
  END IF;

  -- Get security questions (NOT answers!)
  SELECT json_build_object(
    'question_1', sc.security_question_1,
    'question_2', sc.security_question_2
  ) INTO v_questions
  FROM public.security_credentials sc
  WHERE sc.user_id = v_user_id;

  IF v_questions IS NULL OR v_questions->>'question_1' IS NULL THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Security questions not configured. Contact support.',
      'has_security_questions', false
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'has_security_questions', true,
    'user_id', v_user_id,
    'masked_member_id', SUBSTRING(v_member_id, 1, 8) || '****',
    'questions', v_questions
  );
END;
$$;

-- Step 8: Create answer verification for recovery with rate limiting
CREATE OR REPLACE FUNCTION public.verify_recovery_answers(
  p_user_id UUID,
  p_answer_1 TEXT,
  p_answer_2 TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stored_hash_1 TEXT;
  v_stored_hash_2 TEXT;
  v_answer_1_valid BOOLEAN;
  v_answer_2_valid BOOLEAN;
BEGIN
  -- Rate limiting for brute force protection (5 attempts per 15 min)
  IF NOT check_rate_limit('verify_recovery:' || p_user_id::TEXT, 5, 900) THEN
    RETURN json_build_object('success', false, 'error', 'Too many verification attempts. Try again in 15 minutes.');
  END IF;

  -- Get stored hashes
  SELECT sc.security_answer_1, sc.security_answer_2 
  INTO v_stored_hash_1, v_stored_hash_2
  FROM public.security_credentials sc
  WHERE sc.user_id = p_user_id;

  IF v_stored_hash_1 IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Security credentials not found.');
  END IF;

  -- Verify both answers using pgcrypto crypt function for bcrypt comparison
  SELECT 
    v_stored_hash_1 = crypt(LOWER(TRIM(p_answer_1)), v_stored_hash_1),
    v_stored_hash_2 = crypt(LOWER(TRIM(p_answer_2)), v_stored_hash_2)
  INTO v_answer_1_valid, v_answer_2_valid;

  IF v_answer_1_valid AND v_answer_2_valid THEN
    RETURN json_build_object(
      'success', true,
      'verified', true,
      'message', 'Security answers verified. You may now reset your password.'
    );
  ELSE
    RETURN json_build_object(
      'success', true,
      'verified', false,
      'message', 'One or more security answers are incorrect.'
    );
  END IF;
END;
$$;

-- Step 9: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.initiate_account_recovery(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.initiate_account_recovery(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_recovery_answers(UUID, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_recovery_answers(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_security_questions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_security_credentials(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;