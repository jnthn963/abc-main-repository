
-- Drop the existing view
DROP VIEW IF EXISTS public.pending_actions_queue;

-- Recreate with security_invoker = on to enforce RLS from underlying tables
-- This promotes TRANSPARENCY: users see their own pending actions, admins see all
CREATE VIEW public.pending_actions_queue
WITH (security_invoker = on)
AS
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

-- Add comment explaining the transparency design
COMMENT ON VIEW public.pending_actions_queue IS 
'Transparent pending actions queue: Users see their own pending transactions (promoting trust), Admins/Governors see all for approval workflow. Security enforced via underlying table RLS with security_invoker.';
