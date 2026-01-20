-- Fix: Add policy to explicitly deny anonymous access to profiles table
-- This prevents unauthenticated users from reading any profile data

-- First, let's ensure we have the restrictive RLS by adding a deny policy for anonymous users
-- The current policies use RESTRICTIVE which requires ALL policies to pass
-- We need to ensure that anonymous users (auth.uid() IS NULL) cannot access any data

-- Create a policy that explicitly blocks anonymous access
-- Since existing policies already check auth.uid() = id for users,
-- we just need to ensure the table has proper protection

-- Drop and recreate policies to ensure proper anonymous denial
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Recreate with explicit authenticated user check
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'governor'::app_role)
);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Also add similar protection to other sensitive tables
DROP POLICY IF EXISTS "Users can view own transactions" ON public.ledger;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.ledger;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.ledger;

CREATE POLICY "Users can view own transactions"
ON public.ledger
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all transactions"
ON public.ledger
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'governor'::app_role)
);

CREATE POLICY "Users can insert own transactions"
ON public.ledger
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Protect interest_history from anonymous access
DROP POLICY IF EXISTS "Users can view own interest history" ON public.interest_history;

CREATE POLICY "Users can view own interest history"
ON public.interest_history
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;