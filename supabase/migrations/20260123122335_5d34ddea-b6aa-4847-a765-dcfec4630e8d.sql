-- Create a trigger function to auto-assign governor role to the Supreme Governor account
CREATE OR REPLACE FUNCTION public.assign_supreme_governor_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the Supreme Governor email
  IF NEW.email = 'governor@alphaecosystem.com' THEN
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

-- Create trigger on profiles table (fires after a new profile is created)
DROP TRIGGER IF EXISTS assign_supreme_governor_trigger ON public.profiles;
CREATE TRIGGER assign_supreme_governor_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_supreme_governor_role();

-- Also check existing accounts and assign governor role if the Supreme Governor already exists
DO $$
DECLARE
  supreme_governor_id UUID;
BEGIN
  -- Find the Supreme Governor account by email
  SELECT id INTO supreme_governor_id
  FROM public.profiles
  WHERE email = 'governor@alphaecosystem.com'
  LIMIT 1;
  
  IF supreme_governor_id IS NOT NULL THEN
    -- Assign governor role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (supreme_governor_id, 'governor')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Assign admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (supreme_governor_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;