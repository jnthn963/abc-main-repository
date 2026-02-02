-- Add INSERT policy for profiles table
-- This prevents attackers from creating fake profiles
-- Profile creation should only happen through the auth trigger (handle_new_user)

-- Policy 1: Allow users to insert their own profile (for auth trigger compatibility)
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 2: Allow service role to insert profiles (for system operations)
-- Note: service_role bypasses RLS, but this documents the intent