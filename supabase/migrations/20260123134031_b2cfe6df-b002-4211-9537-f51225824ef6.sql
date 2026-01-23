-- Create function to log admin profile access
CREATE OR REPLACE FUNCTION public.log_admin_profile_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_profile_owner_id UUID;
BEGIN
  -- Check if current user is admin/governor
  SELECT (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'governor'))
  INTO v_is_admin;
  
  -- If admin is accessing someone else's profile, log it
  IF v_is_admin AND NEW.id != auth.uid() THEN
    INSERT INTO admin_audit_log (admin_id, action, details)
    VALUES (
      auth.uid(),
      'PROFILE_ACCESS',
      jsonb_build_object(
        'accessed_profile_id', NEW.id,
        'access_type', 'SELECT',
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create a dedicated function for explicit profile access logging
-- This can be called from edge functions when needed
CREATE OR REPLACE FUNCTION public.log_profile_access(
  p_accessed_profile_id UUID,
  p_access_reason TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins/governors should be able to log access
  IF NOT (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'governor')) THEN
    RAISE EXCEPTION 'Only administrators can log profile access';
  END IF;
  
  INSERT INTO admin_audit_log (admin_id, action, details)
  VALUES (
    auth.uid(),
    'PROFILE_ACCESS',
    jsonb_build_object(
      'accessed_profile_id', p_accessed_profile_id,
      'access_reason', COALESCE(p_access_reason, 'Administrative review'),
      'timestamp', now()
    )
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.log_profile_access(UUID, TEXT) TO authenticated;