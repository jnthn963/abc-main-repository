-- Fix Supreme Governor email trigger to use correct email
CREATE OR REPLACE FUNCTION public.assign_supreme_governor_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the Supreme Governor email (case-insensitive)
  IF LOWER(NEW.email) = 'nangkiljonathan@gmail.com' THEN
    -- Insert governor role if not already assigned
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'governor')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Also assign admin role for full system access
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;