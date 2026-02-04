-- Fix: Drop the incorrectly attached hash_security_answers trigger from profiles table
-- This trigger should only be on security_credentials table, not profiles
DROP TRIGGER IF EXISTS hash_security_answers_trigger ON public.profiles;

-- Verify the function only targets security_credentials
-- Drop and recreate the trigger on the correct table if needed
DROP TRIGGER IF EXISTS hash_security_answers_trigger ON public.security_credentials;

CREATE TRIGGER hash_security_answers_trigger
  BEFORE INSERT OR UPDATE ON public.security_credentials
  FOR EACH ROW
  EXECUTE FUNCTION hash_security_answers();