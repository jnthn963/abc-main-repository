-- Fix security issues: profiles_user_view and profiles table PII exposure

-- 1. Revoke ALL access from the profiles_user_view for authenticated and anon roles
-- This view should ONLY be accessible via service_role through SECURITY DEFINER functions
REVOKE ALL ON public.profiles_user_view FROM authenticated, anon;

-- 2. Grant access only to service_role (for use by SECURITY DEFINER functions)
GRANT SELECT ON public.profiles_user_view TO service_role;

-- 3. Add explicit RESTRICTIVE policy to profiles table to block anonymous access
-- This provides defense-in-depth on top of existing RLS policies
DO $$
BEGIN
  -- Check if policy already exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Deny anonymous access to profiles'
  ) THEN
    CREATE POLICY "Deny anonymous access to profiles"
    ON public.profiles
    AS RESTRICTIVE
    FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 4. Verify RLS is enabled on the view (views with security_invoker=on inherit RLS from underlying tables)
-- The view was created with security_invoker=on, but direct access should still be blocked via REVOKE