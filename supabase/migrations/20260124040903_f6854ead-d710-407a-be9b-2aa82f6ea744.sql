-- Drop old trigger and function that was on the wrong email
DROP TRIGGER IF EXISTS assign_supreme_governor_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.assign_supreme_governor_role();

-- Create/replace the unified dual Supreme Governor trigger function
CREATE OR REPLACE FUNCTION public.auto_assign_supreme_governor_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for BOTH Supreme Governor emails
  IF LOWER(NEW.email) = 'nangkiljonathan@gmail.com' OR LOWER(NEW.email) = 'governor@alphaecosystem.com' THEN
    -- Assign both governor and admin roles
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (NEW.id, 'governor') 
    ON CONFLICT (user_id, role) DO NOTHING;
    
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (NEW.id, 'admin') 
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;