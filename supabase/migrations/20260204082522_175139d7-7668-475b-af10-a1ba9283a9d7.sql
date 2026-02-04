-- ============================================
-- SECURITY FIX: Properly secure views with security_invoker
-- ============================================

-- 1. Drop and recreate pending_actions_queue with security_invoker
DROP VIEW IF EXISTS public.pending_actions_queue;

CREATE VIEW public.pending_actions_queue
WITH (security_invoker = on) AS
SELECT 
    'ledger'::text AS source_table,
    l.id,
    l.user_id,
    p.display_name AS user_name,
    p.member_id,
    (l.type)::text AS action_type,
    l.amount,
    l.reference_number,
    l.description,
    l.approval_status,
    l.created_at,
    NULL::numeric AS interest_rate,
    NULL::bigint AS collateral_amount
FROM ledger l
LEFT JOIN profiles p ON (l.user_id = p.id)
WHERE l.approval_status = 'pending_review'::text
UNION ALL
SELECT 
    'p2p_loans'::text AS source_table,
    pl.id,
    pl.borrower_id AS user_id,
    p.display_name AS user_name,
    p.member_id,
    CASE
        WHEN pl.status = 'open'::loan_status THEN 'loan_request'::text
        ELSE 'loan_funding'::text
    END AS action_type,
    pl.principal_amount AS amount,
    pl.reference_number,
    NULL::text AS description,
    pl.approval_status,
    COALESCE(pl.funded_at, pl.created_at) AS created_at,
    pl.interest_rate,
    pl.collateral_amount
FROM p2p_loans pl
LEFT JOIN profiles p ON (pl.borrower_id = p.id)
WHERE pl.approval_status = 'pending_review'::text
ORDER BY 11 DESC;

-- Revoke all direct access to pending_actions_queue
REVOKE ALL ON public.pending_actions_queue FROM public;
REVOKE ALL ON public.pending_actions_queue FROM anon;
REVOKE ALL ON public.pending_actions_queue FROM authenticated;

-- Grant access only to service_role (for get_pending_actions RPC)
GRANT SELECT ON public.pending_actions_queue TO service_role;

-- 2. Drop and recreate profiles_user_view with security_invoker
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
    referral_code,
    referrer_id,
    total_referral_earnings,
    onboarding_completed,
    created_at,
    updated_at,
    last_login_at
FROM profiles;

-- Revoke all direct access to profiles_user_view
REVOKE ALL ON public.profiles_user_view FROM public;
REVOKE ALL ON public.profiles_user_view FROM anon;
REVOKE ALL ON public.profiles_user_view FROM authenticated;

-- Grant access only to service_role (for admin functions)
GRANT SELECT ON public.profiles_user_view TO service_role;

-- Add comment explaining security design
COMMENT ON VIEW public.pending_actions_queue IS 'Secured admin view - access only via get_pending_actions() RPC with governor role check. Direct access revoked.';
COMMENT ON VIEW public.profiles_user_view IS 'Secured admin view - access only via get_profiles_for_admin() RPC with admin/governor role check. Direct access revoked.';