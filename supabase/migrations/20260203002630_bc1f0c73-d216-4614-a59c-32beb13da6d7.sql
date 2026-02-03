-- Drop and recreate get_profiles_for_admin with user_roles column
DROP FUNCTION IF EXISTS public.get_profiles_for_admin();

CREATE OR REPLACE FUNCTION public.get_profiles_for_admin()
RETURNS TABLE (
  id uuid,
  member_id text,
  display_name text,
  email text,
  phone text,
  vault_balance bigint,
  frozen_balance bigint,
  lending_balance bigint,
  membership_tier membership_tier,
  kyc_status kyc_status,
  onboarding_completed boolean,
  created_at timestamptz,
  updated_at timestamptz,
  last_login_at timestamptz,
  address_line1 text,
  address_line2 text,
  city text,
  province text,
  postal_code text,
  referral_code text,
  referrer_id uuid,
  total_referral_earnings bigint,
  security_question_1 text,
  security_question_2 text,
  user_roles app_role[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller has admin or governor role
  IF NOT (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'governor')) THEN
    RAISE EXCEPTION 'Unauthorized: Admin or Governor role required';
  END IF;

  -- Log the access for audit purposes
  INSERT INTO public.admin_audit_log (admin_id, action, details)
  VALUES (
    auth.uid(),
    'PROFILES_ADMIN_VIEW_ACCESS',
    jsonb_build_object(
      'accessed_at', now(),
      'function', 'get_profiles_for_admin'
    )
  );

  RETURN QUERY
  SELECT 
    p.id,
    p.member_id,
    p.display_name,
    p.email,
    p.phone,
    p.vault_balance,
    p.frozen_balance,
    p.lending_balance,
    p.membership_tier,
    p.kyc_status,
    p.onboarding_completed,
    p.created_at,
    p.updated_at,
    p.last_login_at,
    p.address_line1,
    p.address_line2,
    p.city,
    p.province,
    p.postal_code,
    p.referral_code,
    p.referrer_id,
    p.total_referral_earnings,
    sc.security_question_1,
    sc.security_question_2,
    COALESCE(
      (SELECT array_agg(ur.role) FROM public.user_roles ur WHERE ur.user_id = p.id),
      ARRAY[]::app_role[]
    ) as user_roles
  FROM public.profiles p
  LEFT JOIN public.security_credentials sc ON p.id = sc.user_id
  ORDER BY p.created_at DESC;
END;
$$;

-- Create function to assign role to a user (for governors only)
CREATE OR REPLACE FUNCTION public.assign_user_role(
  p_user_id uuid,
  p_role app_role
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_member_id text;
BEGIN
  -- Verify caller has governor role
  IF NOT has_role(auth.uid(), 'governor') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Governor role required');
  END IF;

  -- Get target member ID for audit
  SELECT member_id INTO v_target_member_id FROM public.profiles WHERE id = p_user_id;
  
  IF v_target_member_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Insert the role (ON CONFLICT handles duplicates)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Log the action
  INSERT INTO public.admin_audit_log (admin_id, action, details)
  VALUES (
    auth.uid(),
    'ROLE_ASSIGNED',
    jsonb_build_object(
      'target_user_id', p_user_id,
      'target_member_id', v_target_member_id,
      'role_assigned', p_role::text,
      'assigned_at', now()
    )
  );

  RETURN jsonb_build_object(
    'success', true, 
    'message', format('Role %s assigned to member %s', p_role::text, v_target_member_id)
  );
END;
$$;

-- Create function to revoke role from a user (for governors only)
CREATE OR REPLACE FUNCTION public.revoke_user_role(
  p_user_id uuid,
  p_role app_role
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_member_id text;
  v_rows_deleted integer;
BEGIN
  -- Verify caller has governor role
  IF NOT has_role(auth.uid(), 'governor') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Governor role required');
  END IF;

  -- Prevent self-demotion from governor role
  IF p_user_id = auth.uid() AND p_role = 'governor' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot revoke your own governor role');
  END IF;

  -- Get target member ID for audit
  SELECT member_id INTO v_target_member_id FROM public.profiles WHERE id = p_user_id;
  
  IF v_target_member_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Delete the role
  DELETE FROM public.user_roles 
  WHERE user_id = p_user_id AND role = p_role;
  
  GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;

  -- Log the action
  INSERT INTO public.admin_audit_log (admin_id, action, details)
  VALUES (
    auth.uid(),
    'ROLE_REVOKED',
    jsonb_build_object(
      'target_user_id', p_user_id,
      'target_member_id', v_target_member_id,
      'role_revoked', p_role::text,
      'rows_affected', v_rows_deleted,
      'revoked_at', now()
    )
  );

  IF v_rows_deleted > 0 THEN
    RETURN jsonb_build_object(
      'success', true, 
      'message', format('Role %s revoked from member %s', p_role::text, v_target_member_id)
    );
  ELSE
    RETURN jsonb_build_object(
      'success', true, 
      'message', format('Member %s did not have role %s', v_target_member_id, p_role::text)
    );
  END IF;
END;
$$;