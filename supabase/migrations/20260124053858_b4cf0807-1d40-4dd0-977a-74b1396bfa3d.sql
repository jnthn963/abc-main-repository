
-- Fix profiles_user_view: Recreate with security_invoker to respect underlying table RLS
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
    referrer_id,
    referral_code,
    total_referral_earnings,
    onboarding_completed,
    created_at,
    updated_at,
    last_login_at
FROM public.profiles;

-- Comment explaining the security model
COMMENT ON VIEW public.profiles_user_view IS 
'Secure user profile view. Uses security_invoker=on to respect profiles table RLS policies. 
Users can only see their own profile via the underlying "Users can view own profile" RLS policy.
Excludes security credentials for privacy.';

-- Fix profiles_admin_view: Recreate with security_invoker
DROP VIEW IF EXISTS public.profiles_admin_view;

CREATE VIEW public.profiles_admin_view
WITH (security_invoker = on) AS
SELECT 
    p.id,
    p.member_id,
    p.display_name,
    p.email,
    p.phone,
    p.address_line1,
    p.address_line2,
    p.city,
    p.province,
    p.postal_code,
    p.vault_balance,
    p.frozen_balance,
    p.lending_balance,
    p.membership_tier,
    p.kyc_status,
    p.referrer_id,
    p.referral_code,
    p.total_referral_earnings,
    p.onboarding_completed,
    p.created_at,
    p.updated_at,
    p.last_login_at,
    sc.security_question_1,
    sc.security_question_2
    -- Note: Security answers are intentionally excluded for privacy
FROM public.profiles p
LEFT JOIN public.security_credentials sc ON sc.user_id = p.id;

-- Comment explaining the security model  
COMMENT ON VIEW public.profiles_admin_view IS 
'Admin-only profile view with security questions visible (but not answers).
Uses security_invoker=on so only users with admin/governor role RLS access can query.
Security answer hashes are intentionally excluded to prevent credential exposure.';

-- Fix pending_actions_queue: Recreate with security_invoker
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
FROM public.ledger l
LEFT JOIN public.profiles p ON l.user_id = p.id
WHERE l.approval_status = 'pending_review'

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
FROM public.p2p_loans pl
LEFT JOIN public.profiles p ON pl.borrower_id = p.id
WHERE pl.approval_status = 'pending_review'

ORDER BY created_at DESC;

-- Comment explaining the security model
COMMENT ON VIEW public.pending_actions_queue IS 
'Governor action queue for pending approvals. Uses security_invoker=on so only 
admin/governor roles with RLS access to ledger and p2p_loans can see pending items.
Access should be through get_pending_actions() function which also logs access.';

-- Ensure no direct grants exist on these views (defense in depth)
REVOKE ALL ON public.profiles_user_view FROM anon, authenticated;
REVOKE ALL ON public.profiles_admin_view FROM anon, authenticated;
REVOKE ALL ON public.pending_actions_queue FROM anon, authenticated;
