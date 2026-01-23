-- ============================================
-- FIX: SECURITY DEFINER Views - Convert to SECURITY INVOKER
-- ============================================
-- By default, views inherit SECURITY DEFINER which bypasses RLS.
-- We need SECURITY INVOKER to respect the querying user's permissions.

-- Recreate profiles_user_view with SECURITY INVOKER
DROP VIEW IF EXISTS public.profiles_user_view;

CREATE VIEW public.profiles_user_view 
WITH (security_invoker = true) AS
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

-- Recreate profiles_admin_view with SECURITY INVOKER
DROP VIEW IF EXISTS public.profiles_admin_view;

CREATE VIEW public.profiles_admin_view 
WITH (security_invoker = true) AS
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

-- Add documentation comments
COMMENT ON VIEW public.profiles_user_view IS 
  'Safe view of profiles table that excludes security answer hashes. Uses SECURITY INVOKER to respect RLS.';

COMMENT ON VIEW public.profiles_admin_view IS 
  'Admin view of profiles table with redacted security answer hashes. Uses SECURITY INVOKER to respect RLS.';