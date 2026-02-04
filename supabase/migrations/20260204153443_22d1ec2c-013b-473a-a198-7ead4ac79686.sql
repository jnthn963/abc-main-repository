-- ============================================================
-- COMPREHENSIVE SECURITY HARDENING MIGRATION
-- Fixes all RLS policy gaps identified in security scan
-- ============================================================

-- =====================================================
-- 1. FIX VIEWS - Add security_invoker and restrict access
-- =====================================================

-- Drop and recreate profiles_user_view with security_invoker
DROP VIEW IF EXISTS public.profiles_user_view CASCADE;

CREATE OR REPLACE VIEW public.profiles_user_view
WITH (security_invoker = true) AS
SELECT
  id,
  vault_balance,
  frozen_balance,
  lending_balance,
  member_id,
  display_name,
  email,
  phone,
  address_line1,
  address_line2,
  city,
  province,
  postal_code,
  referral_code,
  referrer_id,
  kyc_status,
  membership_tier,
  onboarding_completed,
  last_login_at,
  total_referral_earnings,
  created_at,
  updated_at
FROM public.profiles;

-- Drop and recreate marketplace_loans with security_invoker
DROP VIEW IF EXISTS public.marketplace_loans CASCADE;

CREATE OR REPLACE VIEW public.marketplace_loans
WITH (security_invoker = true) AS
SELECT
  l.id,
  l.borrower_id,
  l.lender_id,
  l.principal_amount,
  l.collateral_amount,
  l.interest_rate,
  l.duration_days,
  l.capital_lock_days,
  l.status,
  l.approval_status,
  l.approved_at,
  l.approved_by,
  l.rejection_reason,
  l.funded_at,
  l.due_date,
  l.capital_unlock_date,
  l.repaid_at,
  l.auto_repay_triggered,
  l.reference_number,
  l.created_at,
  l.updated_at,
  -- Anonymize borrower identity for marketplace display
  CASE 
    WHEN l.borrower_id = auth.uid() THEN p.display_name
    WHEN l.lender_id = auth.uid() THEN p.display_name
    WHEN has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'governor') THEN p.display_name
    ELSE 
      SUBSTRING(COALESCE(p.display_name, 'Anonymous'), 1, 1) || 
      '***' || 
      SUBSTRING(COALESCE(p.display_name, 'Anonymous'), LENGTH(COALESCE(p.display_name, 'Anonymous')), 1)
  END AS borrower_alias
FROM public.p2p_loans l
LEFT JOIN public.profiles p ON p.id = l.borrower_id;

-- Drop and recreate pending_actions_queue with security_invoker
DROP VIEW IF EXISTS public.pending_actions_queue CASCADE;

CREATE OR REPLACE VIEW public.pending_actions_queue
WITH (security_invoker = true) AS
SELECT * FROM get_pending_actions();

-- Revoke public access from views and grant only to service_role and admins
REVOKE ALL ON public.profiles_user_view FROM anon, authenticated;
REVOKE ALL ON public.marketplace_loans FROM anon, authenticated;
REVOKE ALL ON public.pending_actions_queue FROM anon, authenticated;

-- Grant to service_role (for edge functions)
GRANT SELECT ON public.profiles_user_view TO service_role;
GRANT SELECT ON public.marketplace_loans TO service_role;
GRANT SELECT ON public.pending_actions_queue TO service_role;

-- Grant marketplace_loans to authenticated for marketplace display
GRANT SELECT ON public.marketplace_loans TO authenticated;

-- =====================================================
-- 2. ADD MISSING DELETE POLICIES (Immutable Audit Trail)
-- =====================================================

-- Profiles: Block all deletes (accounts should never be deleted, only deactivated)
DROP POLICY IF EXISTS "Profiles are immutable - no deletes" ON public.profiles;
CREATE POLICY "Profiles are immutable - no deletes" 
  ON public.profiles FOR DELETE 
  USING (false);

-- P2P Loans: Block all deletes (loan records are immutable for audit)
DROP POLICY IF EXISTS "Loans are immutable - no deletes" ON public.p2p_loans;
CREATE POLICY "Loans are immutable - no deletes" 
  ON public.p2p_loans FOR DELETE 
  USING (false);

-- CDC Events: Block all deletes (audit trail must be preserved)
DROP POLICY IF EXISTS "CDC events are immutable - no deletes" ON public.cdc_events;
CREATE POLICY "CDC events are immutable - no deletes" 
  ON public.cdc_events FOR DELETE 
  USING (false);

-- =====================================================
-- 3. ADD ANONYMOUS DENIAL POLICIES (Defense in Depth)
-- =====================================================

-- User Roles: Deny anonymous access
DROP POLICY IF EXISTS "Deny anonymous access to user_roles" ON public.user_roles;
CREATE POLICY "Deny anonymous access to user_roles" 
  ON public.user_roles FOR ALL 
  TO anon
  USING (false)
  WITH CHECK (false);

-- Global Settings: Deny anonymous access
DROP POLICY IF EXISTS "Deny anonymous access to global_settings" ON public.global_settings;
CREATE POLICY "Deny anonymous access to global_settings" 
  ON public.global_settings FOR ALL 
  TO anon
  USING (false)
  WITH CHECK (false);

-- Public Config: Deny anonymous access (authenticated only)
DROP POLICY IF EXISTS "Deny anonymous access to public_config" ON public.public_config;
CREATE POLICY "Deny anonymous access to public_config" 
  ON public.public_config FOR ALL 
  TO anon
  USING (false)
  WITH CHECK (false);

-- Reserve Fund: Deny anonymous access
DROP POLICY IF EXISTS "Deny anonymous access to reserve_fund" ON public.reserve_fund;
CREATE POLICY "Deny anonymous access to reserve_fund" 
  ON public.reserve_fund FOR ALL 
  TO anon
  USING (false)
  WITH CHECK (false);

-- Liquidity Index History: Deny anonymous access
DROP POLICY IF EXISTS "Deny anonymous access to liquidity_index_history" ON public.liquidity_index_history;
CREATE POLICY "Deny anonymous access to liquidity_index_history" 
  ON public.liquidity_index_history FOR ALL 
  TO anon
  USING (false)
  WITH CHECK (false);

-- CDC Config: Deny anonymous access
DROP POLICY IF EXISTS "Deny anonymous access to cdc_config" ON public.cdc_config;
CREATE POLICY "Deny anonymous access to cdc_config" 
  ON public.cdc_config FOR ALL 
  TO anon
  USING (false)
  WITH CHECK (false);

-- CDC Events: Deny anonymous access
DROP POLICY IF EXISTS "Deny anonymous access to cdc_events" ON public.cdc_events;
CREATE POLICY "Deny anonymous access to cdc_events" 
  ON public.cdc_events FOR ALL 
  TO anon
  USING (false)
  WITH CHECK (false);

-- CMS Posts: Deny anonymous write access
DROP POLICY IF EXISTS "Deny anonymous write access to cms_posts" ON public.cms_posts;
CREATE POLICY "Deny anonymous write access to cms_posts" 
  ON public.cms_posts FOR INSERT 
  TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS "Deny anonymous update to cms_posts" ON public.cms_posts;
CREATE POLICY "Deny anonymous update to cms_posts" 
  ON public.cms_posts FOR UPDATE 
  TO anon
  USING (false);

DROP POLICY IF EXISTS "Deny anonymous delete to cms_posts" ON public.cms_posts;
CREATE POLICY "Deny anonymous delete to cms_posts" 
  ON public.cms_posts FOR DELETE 
  TO anon
  USING (false);

-- =====================================================
-- 4. ADD INSERT/DELETE PROTECTION FOR CONFIG TABLES
-- =====================================================

-- Global Settings: Block INSERT/DELETE (single row only)
DROP POLICY IF EXISTS "Global settings is singleton - no inserts" ON public.global_settings;
CREATE POLICY "Global settings is singleton - no inserts" 
  ON public.global_settings FOR INSERT 
  WITH CHECK (false);

DROP POLICY IF EXISTS "Global settings is singleton - no deletes" ON public.global_settings;
CREATE POLICY "Global settings is singleton - no deletes" 
  ON public.global_settings FOR DELETE 
  USING (false);

-- Public Config: Block INSERT/DELETE (single row only)
DROP POLICY IF EXISTS "Public config is singleton - no inserts" ON public.public_config;
CREATE POLICY "Public config is singleton - no inserts" 
  ON public.public_config FOR INSERT 
  WITH CHECK (false);

DROP POLICY IF EXISTS "Public config is singleton - no deletes" ON public.public_config;
CREATE POLICY "Public config is singleton - no deletes" 
  ON public.public_config FOR DELETE 
  USING (false);

-- Reserve Fund: Block INSERT/DELETE (single row only)
DROP POLICY IF EXISTS "Reserve fund is singleton - no inserts" ON public.reserve_fund;
CREATE POLICY "Reserve fund is singleton - no inserts" 
  ON public.reserve_fund FOR INSERT 
  WITH CHECK (false);

DROP POLICY IF EXISTS "Reserve fund is singleton - no deletes" ON public.reserve_fund;
CREATE POLICY "Reserve fund is singleton - no deletes" 
  ON public.reserve_fund FOR DELETE 
  USING (false);