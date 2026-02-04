-- ============================================================
-- ADDITIONAL SECURITY HARDENING
-- Interest history INSERT restriction + view privilege grants
-- ============================================================

-- Restrict interest_history INSERT to service role only (via service role bypass)
-- Regular users and authenticated users should never INSERT directly
DROP POLICY IF EXISTS "Interest history insert blocked for users" ON public.interest_history;
CREATE POLICY "Interest history insert blocked for users" 
  ON public.interest_history FOR INSERT 
  TO authenticated
  WITH CHECK (false);

-- Ensure anon cannot insert to interest_history
DROP POLICY IF EXISTS "Deny anonymous insert to interest_history" ON public.interest_history;
CREATE POLICY "Deny anonymous insert to interest_history" 
  ON public.interest_history FOR INSERT 
  TO anon
  WITH CHECK (false);

-- Ensure proper grants on views for authenticated users to access marketplace
GRANT SELECT ON public.marketplace_loans TO authenticated;