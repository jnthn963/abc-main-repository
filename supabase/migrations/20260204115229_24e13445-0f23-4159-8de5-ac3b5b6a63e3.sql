-- =====================================================
-- CRITICAL SECURITY FIX: Secure profiles_user_view
-- Recreate with security_invoker to enforce RLS
-- =====================================================

-- Drop the existing unsecured view
DROP VIEW IF EXISTS public.profiles_user_view;

-- Recreate with security_invoker = on to inherit RLS from profiles table
CREATE VIEW public.profiles_user_view
WITH (security_invoker = on)
AS
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
    total_referral_earnings,
    referral_code,
    referrer_id,
    kyc_status,
    membership_tier,
    onboarding_completed,
    last_login_at,
    created_at,
    updated_at
FROM public.profiles;

-- Add comment documenting security
COMMENT ON VIEW public.profiles_user_view IS 
'Secure user profile view - inherits RLS from profiles table via security_invoker. 
Users can only view their own data. Admins/Governors have full access.';

-- =====================================================
-- CRITICAL SECURITY FIX: Secure pending_actions_queue
-- Already fixed in previous migration, but ensure it has proper security
-- =====================================================

-- Drop and recreate to ensure security_invoker is properly set
DROP VIEW IF EXISTS public.pending_actions_queue;

-- Recreate with security_invoker = on
CREATE VIEW public.pending_actions_queue
WITH (security_invoker = on)
AS
SELECT 
    'ledger'::text AS source_table,
    l.id,
    l.user_id,
    p.display_name AS user_name,
    p.member_id,
    l.type::text AS action_type,
    l.amount,
    l.reference_number,
    l.description,
    l.approval_status,
    NULL::bigint AS collateral_amount,
    NULL::numeric AS interest_rate,
    l.created_at
FROM ledger l
LEFT JOIN profiles p ON (l.user_id = p.id)
WHERE l.approval_status = 'pending_review'::text

UNION ALL

SELECT 
    'p2p_loans'::text AS source_table,
    loan.id,
    loan.borrower_id AS user_id,
    bp.display_name AS user_name,
    bp.member_id,
    'loan_request'::text AS action_type,
    loan.principal_amount AS amount,
    loan.reference_number,
    'P2P Loan Request'::text AS description,
    loan.approval_status,
    loan.collateral_amount,
    loan.interest_rate,
    loan.created_at
FROM p2p_loans loan
LEFT JOIN profiles bp ON (loan.borrower_id = bp.id)
WHERE loan.approval_status = 'pending_review'::text;

-- Add comment documenting security and transparency model
COMMENT ON VIEW public.pending_actions_queue IS 
'Transparent pending actions queue - inherits RLS via security_invoker.
- Regular users: Can view ONLY their own pending transactions (promotes transparency)
- Admins/Governors: Full access for approval workflow
This enables members to track their own transaction status while protecting other users data.';