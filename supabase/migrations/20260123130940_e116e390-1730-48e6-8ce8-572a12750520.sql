-- Update the Supreme Governor trigger for the new email
CREATE OR REPLACE FUNCTION public.auto_assign_supreme_governor_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the Supreme Governor email (case-insensitive)
  IF LOWER(NEW.email) = 'nangkiljonathan@gmail.com' THEN
    -- Assign governor role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'governor')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Assign admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_supreme_governor ON auth.users;
CREATE TRIGGER on_auth_user_created_supreme_governor
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_supreme_governor_roles();

-- Also update existing user if they already registered
DO $$
DECLARE
  supreme_user_id UUID;
BEGIN
  -- Find the user with the Supreme Governor email
  SELECT id INTO supreme_user_id FROM auth.users WHERE LOWER(email) = 'nangkiljonathan@gmail.com';
  
  IF supreme_user_id IS NOT NULL THEN
    -- Assign governor role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (supreme_user_id, 'governor')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Assign admin role  
    INSERT INTO public.user_roles (user_id, role)
    VALUES (supreme_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;