-- Fix get_pending_action_counts RPC: use correct enum value 'transfer_out'
CREATE OR REPLACE FUNCTION public.get_pending_action_counts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
  v_deposits BIGINT;
  v_withdrawals BIGINT;
  v_transfers BIGINT;
  v_loans BIGINT;
BEGIN
  -- Verify caller is admin/governor
  IF NOT (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'governor')) THEN
    RAISE EXCEPTION 'Access denied: Governor role required';
  END IF;

  -- Count pending deposits
  SELECT COUNT(*) INTO v_deposits
  FROM public.ledger
  WHERE approval_status = 'pending_review' AND type = 'deposit';

  -- Count pending withdrawals
  SELECT COUNT(*) INTO v_withdrawals
  FROM public.ledger
  WHERE approval_status = 'pending_review' AND type = 'withdrawal';

  -- Count pending transfers (correct enum: transfer_out)
  SELECT COUNT(*) INTO v_transfers
  FROM public.ledger
  WHERE approval_status = 'pending_review' AND type = 'transfer_out';

  -- Count pending loans
  SELECT COUNT(*) INTO v_loans
  FROM public.p2p_loans
  WHERE approval_status = 'pending_review';

  v_result := jsonb_build_object(
    'deposits', v_deposits,
    'withdrawals', v_withdrawals,
    'transfers', v_transfers,
    'loans', v_loans,
    'total', v_deposits + v_withdrawals + v_transfers + v_loans
  );

  RETURN v_result;
END;
$function$;