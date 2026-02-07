-- Fix profiles_user_view to enforce user-only access at view level
-- Drop existing view and recreate with row-level filter

DROP VIEW IF EXISTS public.profiles_user_view;

-- Recreate view WITH security_invoker AND built-in row filter
-- This ensures users can ONLY see their own profile data
CREATE VIEW public.profiles_user_view
WITH (security_invoker = on) AS
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
    onboarding_completed,
    referral_code,
    referrer_id,
    total_referral_earnings,
    created_at,
    updated_at,
    last_login_at
  FROM public.profiles
  WHERE id = auth.uid();  -- CRITICAL: Built-in row filter ensures users only see their own data

-- Revoke direct access from public roles - force use of base table RLS
REVOKE SELECT ON public.profiles_user_view FROM anon;
REVOKE SELECT ON public.profiles_user_view FROM authenticated;

-- Grant access only through service_role (for admin functions)
GRANT SELECT ON public.profiles_user_view TO service_role;

-- Add comment for documentation
COMMENT ON VIEW public.profiles_user_view IS 'Secure view of profiles table. Built-in WHERE clause restricts to auth.uid() only. No sensitive fields like avatar_url exposed. Access revoked from anon/authenticated roles.';