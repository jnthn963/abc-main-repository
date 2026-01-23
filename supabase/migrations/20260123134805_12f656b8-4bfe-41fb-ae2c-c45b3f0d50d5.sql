-- Fix the view to use SECURITY INVOKER (inherits caller's permissions)
ALTER VIEW public.pending_actions_queue SET (security_invoker = on);

-- Create atomic function for governor approval
CREATE OR REPLACE FUNCTION public.governor_approve_action(
  p_governor_id UUID,
  p_action_type TEXT,
  p_action_id UUID,
  p_approve BOOLEAN,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_ledger_record RECORD;
  v_loan_record RECORD;
BEGIN
  -- Verify governor role
  IF NOT (has_role(p_governor_id, 'admin') OR has_role(p_governor_id, 'governor')) THEN
    RAISE EXCEPTION 'Unauthorized: Governor role required';
  END IF;

  -- Handle ledger-based actions
  IF p_action_type IN ('deposit', 'withdrawal', 'transfer') THEN
    SELECT * INTO v_ledger_record FROM ledger WHERE id = p_action_id FOR UPDATE;
    
    IF NOT FOUND THEN RAISE EXCEPTION 'Transaction not found'; END IF;
    IF v_ledger_record.approval_status != 'pending_review' THEN RAISE EXCEPTION 'Transaction already processed'; END IF;
    
    IF p_approve THEN
      -- APPROVE
      IF p_action_type = 'deposit' THEN
        UPDATE profiles SET vault_balance = vault_balance + v_ledger_record.amount, updated_at = now() WHERE id = v_ledger_record.user_id;
      ELSIF p_action_type = 'withdrawal' THEN
        UPDATE profiles SET frozen_balance = frozen_balance - v_ledger_record.amount, updated_at = now() WHERE id = v_ledger_record.user_id;
      ELSIF p_action_type = 'transfer' THEN
        UPDATE profiles SET frozen_balance = frozen_balance - v_ledger_record.amount, updated_at = now() WHERE id = v_ledger_record.user_id;
        IF v_ledger_record.related_user_id IS NOT NULL THEN
          UPDATE profiles SET vault_balance = vault_balance + v_ledger_record.amount, updated_at = now() WHERE id = v_ledger_record.related_user_id;
        END IF;
      END IF;
      
      UPDATE ledger SET approval_status = 'approved', approved_by = p_governor_id, approved_at = now(), status = 'completed', cleared_at = now(),
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('approved_by_gov', true, 'gov_id', p_governor_id::text) WHERE id = p_action_id;
      
      v_result := jsonb_build_object('success', true, 'action', 'approved', 'action_type', p_action_type, 'amount', v_ledger_record.amount);
    ELSE
      -- REJECT
      IF p_action_type IN ('withdrawal', 'transfer') THEN
        UPDATE profiles SET vault_balance = vault_balance + v_ledger_record.amount, frozen_balance = frozen_balance - v_ledger_record.amount, updated_at = now() WHERE id = v_ledger_record.user_id;
      END IF;
      
      UPDATE ledger SET approval_status = 'rejected', approved_by = p_governor_id, approved_at = now(), status = 'reversed', rejection_reason = p_rejection_reason,
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('rejected_by_gov', true, 'gov_id', p_governor_id::text, 'reason', p_rejection_reason) WHERE id = p_action_id;
      
      v_result := jsonb_build_object('success', true, 'action', 'rejected', 'action_type', p_action_type, 'amount', v_ledger_record.amount, 'reason', p_rejection_reason);
    END IF;
    
  ELSIF p_action_type IN ('loan_request', 'loan_funding') THEN
    SELECT * INTO v_loan_record FROM p2p_loans WHERE id = p_action_id FOR UPDATE;
    
    IF NOT FOUND THEN RAISE EXCEPTION 'Loan not found'; END IF;
    IF v_loan_record.approval_status != 'pending_review' THEN RAISE EXCEPTION 'Loan already processed'; END IF;
    
    IF p_approve THEN
      UPDATE p2p_loans SET approval_status = 'approved', approved_by = p_governor_id, approved_at = now() WHERE id = p_action_id;
      v_result := jsonb_build_object('success', true, 'action', 'approved', 'action_type', p_action_type, 'amount', v_loan_record.principal_amount);
    ELSE
      IF p_action_type = 'loan_request' THEN
        UPDATE profiles SET vault_balance = vault_balance + v_loan_record.collateral_amount, frozen_balance = frozen_balance - v_loan_record.collateral_amount, updated_at = now() WHERE id = v_loan_record.borrower_id;
      ELSIF p_action_type = 'loan_funding' THEN
        UPDATE profiles SET vault_balance = vault_balance + v_loan_record.principal_amount, lending_balance = lending_balance - v_loan_record.principal_amount, updated_at = now() WHERE id = v_loan_record.lender_id;
        UPDATE profiles SET vault_balance = vault_balance + v_loan_record.collateral_amount, frozen_balance = frozen_balance - v_loan_record.collateral_amount, updated_at = now() WHERE id = v_loan_record.borrower_id;
      END IF;
      
      UPDATE p2p_loans SET approval_status = 'rejected', approved_by = p_governor_id, approved_at = now(), status = 'defaulted', rejection_reason = p_rejection_reason WHERE id = p_action_id;
      v_result := jsonb_build_object('success', true, 'action', 'rejected', 'action_type', p_action_type, 'amount', v_loan_record.principal_amount, 'reason', p_rejection_reason);
    END IF;
  ELSE
    RAISE EXCEPTION 'Unknown action type: %', p_action_type;
  END IF;
  
  -- Audit log
  INSERT INTO admin_audit_log (admin_id, action, details) VALUES (p_governor_id, CASE WHEN p_approve THEN 'GOVERNOR_APPROVED' ELSE 'GOVERNOR_REJECTED' END,
    jsonb_build_object('action_type', p_action_type, 'action_id', p_action_id::text, 'result', v_result));
  
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.governor_approve_action(UUID, TEXT, UUID, BOOLEAN, TEXT) TO authenticated;