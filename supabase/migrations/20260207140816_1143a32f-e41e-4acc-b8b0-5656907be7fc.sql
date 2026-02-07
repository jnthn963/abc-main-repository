-- Tighten access controls flagged by security scan (error-level findings)

BEGIN;

-- ---------------------------------------------------------------------
-- 1) PROFILES: ensure only admins/governors can view all profiles
--    (replace has_role() usage with explicit user_roles EXISTS check)
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin'::public.app_role, 'governor'::public.app_role)
  )
);

-- ---------------------------------------------------------------------
-- 2) PROFILES_USER_VIEW: recreate as security-invoker and self-filtered,
--    and lock down privileges to SELECT-only for authenticated.
-- ---------------------------------------------------------------------

DROP VIEW IF EXISTS public.profiles_user_view;

CREATE VIEW public.profiles_user_view
WITH (security_invoker = on) AS
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
WHERE id = auth.uid();

-- Explicitly restrict view privileges (defense-in-depth)
REVOKE ALL ON public.profiles_user_view FROM PUBLIC;
REVOKE ALL ON public.profiles_user_view FROM anon;
REVOKE ALL ON public.profiles_user_view FROM authenticated;

GRANT SELECT ON public.profiles_user_view TO authenticated;
GRANT SELECT ON public.profiles_user_view TO service_role;

COMMENT ON VIEW public.profiles_user_view IS
  'User-facing profile view filtered to auth.uid() only. Privileges: authenticated SELECT only.';

-- ---------------------------------------------------------------------
-- 3) LEDGER: restrict counterparty visibility to only the transaction
--    types where counterparties must see the record.
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own transactions" ON public.ledger;

CREATE POLICY "Users can view own transactions"
ON public.ledger
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR (
    related_user_id = auth.uid()
    AND type IN (
      'transfer_out'::public.transaction_type,
      'loan_funding'::public.transaction_type,
      'loan_repayment'::public.transaction_type
    )
  )
);

-- Also tighten the admin ledger read policy to an explicit EXISTS check
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.ledger;

CREATE POLICY "Admins can view all transactions"
ON public.ledger
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin'::public.app_role, 'governor'::public.app_role)
  )
);

COMMIT;