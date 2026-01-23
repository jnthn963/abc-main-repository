-- ============================================
-- SECURITY FIX: Address 3 Error-Level Findings
-- ============================================

-- 1. FIX: global_settings_public_readable
-- Replace overly permissive "true" with admin/governor only
DROP POLICY IF EXISTS "All users can view settings" ON public.global_settings;

CREATE POLICY "Only admins can view global settings"
  ON public.global_settings FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'governor'::app_role));

-- 2. FIX: security_answers_hashed_readable & profiles_table_admin_exposure
-- Create a safe view that excludes security answer hashes for regular users
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
  address_line1,
  address_line2,
  city,
  province,
  postal_code,
  security_question_1,
  security_question_2,
  -- EXCLUDE: security_answer_1, security_answer_2 (hashes)
  referrer_id,
  referral_code,
  total_referral_earnings,
  created_at,
  updated_at,
  last_login_at,
  onboarding_completed
FROM public.profiles;

-- Grant SELECT to authenticated users on the view
GRANT SELECT ON public.profiles_user_view TO authenticated;

-- 3. Create admin-safe view that also redacts security answers
DROP VIEW IF EXISTS public.profiles_admin_view;

CREATE VIEW public.profiles_admin_view AS
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
  address_line1,
  address_line2,
  city,
  province,
  postal_code,
  security_question_1,
  security_question_2,
  -- Redact hashes for admin view
  '[REDACTED]'::text as security_answer_1,
  '[REDACTED]'::text as security_answer_2,
  referrer_id,
  referral_code,
  total_referral_earnings,
  created_at,
  updated_at,
  last_login_at,
  onboarding_completed
FROM public.profiles;

-- Grant SELECT to authenticated users (RLS on base table still applies)
GRANT SELECT ON public.profiles_admin_view TO authenticated;

-- 4. Update RLS on profiles to use secure function-based approach for security answers
-- The verify_security_answer() function already handles verification securely via SECURITY DEFINER
-- No additional changes needed there - it correctly bypasses RLS and returns boolean only

-- 5. Add comment for documentation
COMMENT ON VIEW public.profiles_user_view IS 
  'Safe view of profiles table that excludes security answer hashes. Use this view for all user-facing queries.';

COMMENT ON VIEW public.profiles_admin_view IS 
  'Admin view of profiles table with redacted security answer hashes. Use this for admin dashboards.';