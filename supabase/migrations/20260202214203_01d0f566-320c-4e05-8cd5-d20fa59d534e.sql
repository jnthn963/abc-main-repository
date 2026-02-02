-- =====================================================
-- Replace profiles_admin_view with SECURITY DEFINER function
-- to properly access security_credentials through RLS
-- =====================================================

-- Drop the existing view (which is broken due to security_invoker + RLS conflict)
DROP VIEW IF EXISTS public.profiles_admin_view CASCADE;

-- Create the SECURITY DEFINER function that properly bypasses RLS
-- while still enforcing admin/governor role checks
CREATE OR REPLACE FUNCTION public.get_profiles_for_admin()
RETURNS TABLE (
  id uuid,
  member_id text,
  display_name text,
  email text,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  province text,
  postal_code text,
  vault_balance bigint,
  frozen_balance bigint,
  lending_balance bigint,
  membership_tier public.membership_tier,
  kyc_status public.kyc_status,
  referrer_id uuid,
  referral_code text,
  total_referral_earnings bigint,
  onboarding_completed boolean,
  last_login_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  security_question_1 text,
  security_question_2 text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Explicit admin/governor role check - prevents unauthorized access
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'governor'::app_role)) THEN
    RAISE EXCEPTION 'Unauthorized: Admin or Governor role required';
  END IF;
  
  -- Log access for audit trail
  INSERT INTO public.admin_audit_log (admin_id, action, details, ip_address)
  VALUES (
    auth.uid(),
    'PROFILES_ADMIN_VIEW_ACCESS',
    jsonb_build_object('description', 'Admin accessed profiles with security questions'),
    NULL
  );
  
  -- Return profiles with security questions (SECURITY DEFINER bypasses RLS)
  RETURN QUERY
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
    p.last_login_at,
    p.created_at,
    p.updated_at,
    sc.security_question_1,
    sc.security_question_2
  FROM public.profiles p
  LEFT JOIN public.security_credentials sc ON p.id = sc.user_id;
END;
$$;

-- Grant execute permission to authenticated users (role check happens inside function)
GRANT EXECUTE ON FUNCTION public.get_profiles_for_admin() TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION public.get_profiles_for_admin() IS 
  'SECURITY DEFINER function to get profiles with security questions. Enforces admin/governor role check internally and logs all access. Replaces broken profiles_admin_view.';