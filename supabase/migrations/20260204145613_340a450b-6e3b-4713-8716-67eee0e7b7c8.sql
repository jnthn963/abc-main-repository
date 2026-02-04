-- Security Hardening Migration: Address remaining security findings
-- Fix: Remove the invalid WHERE clause and use proper RLS syntax

-- =============================================
-- 1. PROFILES TABLE - Explicit public denial
-- =============================================

-- Add explicit policy to deny ALL access for anonymous (unauthenticated) users
-- This is defense-in-depth: RLS already blocks unauthenticated, but this makes it explicit
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- =============================================
-- 2. ADMIN_AUDIT_LOG - Immutability enforcement
-- =============================================

-- Explicit policy: No updates allowed on audit logs
CREATE POLICY "Audit log is immutable - no updates"
ON public.admin_audit_log
AS RESTRICTIVE
FOR UPDATE
USING (false);

-- Explicit policy: No deletes allowed on audit logs
CREATE POLICY "Audit log is immutable - no deletes"
ON public.admin_audit_log
AS RESTRICTIVE
FOR DELETE
USING (false);

-- Add trigger to enforce immutability at database level (defense-in-depth)
CREATE OR REPLACE FUNCTION public.protect_audit_log_immutable()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Audit log records are immutable and cannot be modified or deleted';
  RETURN NULL;
END;
$$;

-- Create triggers to block UPDATE and DELETE at trigger level
DROP TRIGGER IF EXISTS enforce_audit_log_immutable_update ON public.admin_audit_log;
CREATE TRIGGER enforce_audit_log_immutable_update
  BEFORE UPDATE ON public.admin_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_audit_log_immutable();

DROP TRIGGER IF EXISTS enforce_audit_log_immutable_delete ON public.admin_audit_log;
CREATE TRIGGER enforce_audit_log_immutable_delete
  BEFORE DELETE ON public.admin_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_audit_log_immutable();

-- =============================================
-- 3. LEDGER TABLE - Additional protections
-- =============================================

-- Add explicit policy to deny anonymous access (defense-in-depth)
CREATE POLICY "Deny anonymous access to ledger"
ON public.ledger
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- =============================================
-- 4. Add comments for security documentation
-- =============================================

COMMENT ON POLICY "Deny anonymous access to profiles" ON public.profiles IS 
'Defense-in-depth: Explicitly blocks all unauthenticated access to profiles table';

COMMENT ON POLICY "Audit log is immutable - no updates" ON public.admin_audit_log IS 
'Ensures audit trail integrity by preventing any modifications to existing records';

COMMENT ON POLICY "Audit log is immutable - no deletes" ON public.admin_audit_log IS 
'Ensures audit trail integrity by preventing deletion of any records';

COMMENT ON TRIGGER enforce_audit_log_immutable_update ON public.admin_audit_log IS 
'Trigger-level enforcement of audit log immutability (defense-in-depth)';

COMMENT ON TRIGGER enforce_audit_log_immutable_delete ON public.admin_audit_log IS 
'Trigger-level enforcement of audit log immutability (defense-in-depth)';

COMMENT ON POLICY "Deny anonymous access to ledger" ON public.ledger IS 
'Defense-in-depth: Explicitly blocks all unauthenticated access to ledger table';