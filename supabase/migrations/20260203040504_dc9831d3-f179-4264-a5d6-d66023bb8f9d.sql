-- Fix profiles_user_view to use security_invoker = on and revoke public access
-- This ensures the view respects the underlying table's RLS policies

-- Drop and recreate the view with security_invoker = on
DROP VIEW IF EXISTS public.profiles_user_view;

CREATE VIEW public.profiles_user_view WITH (security_invoker = on) AS
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
  referral_code,
  referrer_id,
  total_referral_earnings,
  onboarding_completed,
  created_at,
  updated_at,
  last_login_at
FROM public.profiles;

-- Revoke all access from public and authenticated roles
REVOKE ALL ON public.profiles_user_view FROM public;
REVOKE ALL ON public.profiles_user_view FROM authenticated;
REVOKE ALL ON public.profiles_user_view FROM anon;

-- Only service_role can access this view (for admin functions)
GRANT SELECT ON public.profiles_user_view TO service_role;

-- Add comment explaining the security configuration
COMMENT ON VIEW public.profiles_user_view IS 'Secure user view with security_invoker=on. Access restricted to service_role only. Regular users should query the profiles table directly which has proper RLS.';