-- Fix Security Definer View warning
-- The profiles_user_view was created without explicit security settings
-- Recreate as SECURITY INVOKER (default, safe) view

DROP VIEW IF EXISTS public.profiles_user_view;

-- Create view with SECURITY INVOKER (uses caller's permissions, not creator's)
CREATE VIEW public.profiles_user_view 
WITH (security_invoker = true)
AS
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
  -- Explicitly EXCLUDE security credentials
FROM profiles;

-- Grant select on view to authenticated users
GRANT SELECT ON public.profiles_user_view TO authenticated;

-- Also fix profiles_admin_view to be SECURITY INVOKER
DROP VIEW IF EXISTS public.profiles_admin_view;

CREATE VIEW public.profiles_admin_view
WITH (security_invoker = true)
AS
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
  security_question_1,
  security_question_2,
  '[REDACTED]'::TEXT as security_answer_1,
  '[REDACTED]'::TEXT as security_answer_2,
  referral_code,
  onboarding_completed,
  created_at,
  updated_at,
  last_login_at
FROM profiles;

-- Admin view only accessible via service role (already revoked from authenticated)
GRANT SELECT ON public.profiles_admin_view TO service_role;