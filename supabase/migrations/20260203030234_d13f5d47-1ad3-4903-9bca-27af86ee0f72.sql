-- Drop ALL existing triggers related to supreme governor on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_supreme_governor ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_assign_supreme_roles ON auth.users;

-- Now drop the function with CASCADE to clean up any remaining dependencies
DROP FUNCTION IF EXISTS public.auto_assign_supreme_governor_roles() CASCADE;

-- Create new function that reads from global_settings instead of hardcoding emails
CREATE OR REPLACE FUNCTION public.auto_assign_supreme_governor_roles()
RETURNS TRIGGER AS $$
DECLARE
  v_supreme_emails TEXT[];
BEGIN
  -- Load supreme governor emails from global_settings table
  SELECT supreme_governor_emails INTO v_supreme_emails
  FROM public.global_settings
  LIMIT 1;
  
  -- Fallback if no config exists (generic email only, no personal info)
  IF v_supreme_emails IS NULL OR array_length(v_supreme_emails, 1) IS NULL THEN
    v_supreme_emails := ARRAY['governor@alphaecosystem.com']::TEXT[];
  END IF;
  
  -- Check if the new user's email matches any supreme governor email
  IF LOWER(NEW.email) = ANY(SELECT LOWER(unnest(v_supreme_emails))) THEN
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (NEW.id, 'governor'), (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger on auth.users with consistent naming
CREATE TRIGGER on_auth_user_created_assign_supreme_roles
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_supreme_governor_roles();