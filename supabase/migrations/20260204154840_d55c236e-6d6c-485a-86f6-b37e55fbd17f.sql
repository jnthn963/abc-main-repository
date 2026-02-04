-- ============================================================
-- SECURITY FIX: Address 4 Error-Level Security Findings
-- ============================================================

-- ISSUE 1: marketplace_loans view - Recreate with security_invoker
-- This VIEW doesn't have RLS because views don't have RLS directly.
-- We ensure the underlying p2p_loans table RLS is respected via security_invoker.
DROP VIEW IF EXISTS public.marketplace_loans;

CREATE VIEW public.marketplace_loans
WITH (security_invoker = true) AS
SELECT 
  p.id,
  -- Only reveal borrower_id if the viewer is the borrower OR admin/governor
  CASE 
    WHEN p.borrower_id = auth.uid() THEN p.borrower_id
    WHEN has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'governor'::app_role) THEN p.borrower_id
    ELSE NULL 
  END AS borrower_id,
  p.lender_id,
  p.principal_amount,
  p.collateral_amount,
  p.interest_rate,
  p.duration_days,
  p.capital_lock_days,
  p.status,
  p.approval_status,
  p.approved_by,
  p.approved_at,
  p.funded_at,
  p.due_date,
  p.capital_unlock_date,
  p.repaid_at,
  p.auto_repay_triggered,
  p.reference_number,
  p.rejection_reason,
  p.created_at,
  p.updated_at,
  -- Generate masked alias for anonymity
  COALESCE(
    CASE 
      WHEN pr.member_id IS NOT NULL THEN 
        LEFT(pr.member_id, 1) || '***' || RIGHT(pr.member_id, 1)
      ELSE 'A***?'
    END,
    'A***?'
  ) AS borrower_alias
FROM public.p2p_loans p
LEFT JOIN public.profiles pr ON p.borrower_id = pr.id;

-- Revoke direct access - force use through RLS-protected queries
REVOKE ALL ON public.marketplace_loans FROM anon;
REVOKE ALL ON public.marketplace_loans FROM authenticated;
GRANT SELECT ON public.marketplace_loans TO authenticated;

-- ============================================================
-- ISSUE 2: ledger table - Fix SELECT policy to include related_user_id
-- ============================================================

-- Drop and recreate the user SELECT policy to include related_user_id
DROP POLICY IF EXISTS "Users can view own transactions" ON public.ledger;

CREATE POLICY "Users can view own transactions"
  ON public.ledger
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR related_user_id = auth.uid());

-- ============================================================
-- ISSUE 3: profiles_user_view - Recreate with strict security_invoker
-- Ensure view respects underlying RLS and prevents cross-user access
-- ============================================================

DROP VIEW IF EXISTS public.profiles_user_view;

CREATE VIEW public.profiles_user_view
WITH (security_invoker = true) AS
SELECT 
  id,
  member_id,
  display_name,
  email,
  phone,
  address_line1,
  address_line2,
  city,
  province,
  postal_code,
  vault_balance,
  frozen_balance,
  lending_balance,
  membership_tier,
  kyc_status,
  onboarding_completed,
  referral_code,
  referrer_id,
  total_referral_earnings,
  created_at,
  updated_at,
  last_login_at
FROM public.profiles
WHERE id = auth.uid();  -- CRITICAL: Only own profile accessible

-- Revoke and grant appropriate permissions
REVOKE ALL ON public.profiles_user_view FROM anon;
REVOKE ALL ON public.profiles_user_view FROM authenticated;
GRANT SELECT ON public.profiles_user_view TO authenticated;
-- Admin access via get_profiles_for_admin function instead

-- ============================================================
-- ISSUE 4: security_credentials - Strengthen function security
-- All functions already use SECURITY DEFINER with proper auth checks
-- Add explicit deny policy for any bypass attempts
-- ============================================================

-- Ensure the block policy is correctly applied (already exists but re-apply for clarity)
DROP POLICY IF EXISTS "Block all direct access to security credentials" ON public.security_credentials;

CREATE POLICY "Block all direct access to security credentials"
  ON public.security_credentials
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Additional: Add policy allowing service_role only (for SECURITY DEFINER functions)
-- Note: service_role bypasses RLS, so this is mainly documentation

-- ============================================================
-- Verify pending_actions_queue view also has security_invoker
-- ============================================================

DROP VIEW IF EXISTS public.pending_actions_queue;

CREATE VIEW public.pending_actions_queue
WITH (security_invoker = true) AS
SELECT 
  l.id,
  l.user_id,
  p.member_id,
  p.display_name as user_name,
  l.reference_number,
  l.amount,
  l.description,
  l.approval_status,
  l.created_at,
  l.type::text as action_type,
  'ledger' as source_table,
  NULL::numeric as interest_rate,
  NULL::bigint as collateral_amount
FROM public.ledger l
JOIN public.profiles p ON p.id = l.user_id
WHERE l.approval_status = 'pending_review'
  AND l.type IN ('deposit', 'withdrawal', 'transfer_out')
UNION ALL
SELECT 
  pl.id,
  pl.borrower_id as user_id,
  p.member_id,
  p.display_name as user_name,
  pl.reference_number,
  pl.principal_amount as amount,
  'Loan Request' as description,
  pl.approval_status,
  pl.created_at,
  'loan_request' as action_type,
  'p2p_loans' as source_table,
  pl.interest_rate,
  pl.collateral_amount
FROM public.p2p_loans pl
JOIN public.profiles p ON p.id = pl.borrower_id
WHERE pl.approval_status = 'pending_review' AND pl.status = 'open';

-- Restrict to admins/governors only
REVOKE ALL ON public.pending_actions_queue FROM anon;
REVOKE ALL ON public.pending_actions_queue FROM authenticated;
-- Access via get_pending_actions() function only for governors