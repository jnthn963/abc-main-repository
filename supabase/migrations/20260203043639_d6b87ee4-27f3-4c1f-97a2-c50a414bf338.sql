-- ============================================
-- Fix pending_actions_queue view security
-- This view exposes sensitive financial data
-- ============================================

-- Drop and recreate with security_invoker = on
DROP VIEW IF EXISTS public.pending_actions_queue;

CREATE VIEW public.pending_actions_queue WITH (security_invoker = on) AS
SELECT 'ledger'::text AS source_table,
    l.id,
    l.user_id,
    p.display_name AS user_name,
    p.member_id,
    l.type::text AS action_type,
    l.amount,
    l.reference_number,
    l.description,
    l.approval_status,
    l.created_at,
    NULL::numeric AS interest_rate,
    NULL::bigint AS collateral_amount
   FROM ledger l
     LEFT JOIN profiles p ON l.user_id = p.id
  WHERE l.approval_status = 'pending_review'::text
UNION ALL
 SELECT 'p2p_loans'::text AS source_table,
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
     LEFT JOIN profiles p ON pl.borrower_id = p.id
  WHERE pl.approval_status = 'pending_review'::text
  ORDER BY 11 DESC;

-- Revoke all public/anon/authenticated access
REVOKE ALL ON public.pending_actions_queue FROM public;
REVOKE ALL ON public.pending_actions_queue FROM authenticated;
REVOKE ALL ON public.pending_actions_queue FROM anon;

-- Only service_role can access (for admin edge functions)
GRANT SELECT ON public.pending_actions_queue TO service_role;

-- Add comment
COMMENT ON VIEW public.pending_actions_queue IS 'Secure admin view for pending actions. Uses security_invoker=on and restricted to service_role only. Governors must use the get_pending_actions() function instead.';