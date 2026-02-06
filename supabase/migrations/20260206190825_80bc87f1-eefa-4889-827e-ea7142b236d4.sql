-- ABC System Finalization: Instant Deposit Completion
-- Update governor_approve_action to complete deposits instantly without clearing delay

CREATE OR REPLACE FUNCTION public.governor_approve_action(
  p_action_id UUID,
  p_action_type TEXT,
  p_approve BOOLEAN,
  p_governor_id UUID,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_user_id UUID;
  v_amount BIGINT;
  v_current_status TEXT;
  v_loan_record RECORD;
BEGIN
  -- Verify governor role
  IF NOT (
    auth.uid() IS NULL OR 
    has_role(auth.uid(), 'governor'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Governor access required');
  END IF;

  -- Handle different action types
  IF p_action_type = 'deposit' THEN
    -- Get deposit details
    SELECT user_id, amount, approval_status INTO v_user_id, v_amount, v_current_status
    FROM ledger
    WHERE id = p_action_id AND type = 'deposit';

    IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'Deposit not found');
    END IF;

    IF v_current_status NOT IN ('pending_review', 'approved') THEN
      RETURN json_build_object('success', false, 'error', 'Deposit already processed');
    END IF;

    IF p_approve THEN
      -- INSTANT COMPLETION: Update ledger to completed status immediately
      UPDATE ledger
      SET 
        approval_status = 'approved',
        approved_by = p_governor_id,
        approved_at = NOW(),
        status = 'completed',  -- Mark as completed immediately
        cleared_at = NOW(),    -- Set cleared timestamp
        clearing_ends_at = NOW(),  -- No clearing delay
        updated_at = NOW()
      WHERE id = p_action_id;

      -- INSTANT BALANCE UPDATE: Add to vault_balance immediately
      UPDATE profiles
      SET 
        vault_balance = vault_balance + v_amount,
        updated_at = NOW()
      WHERE id = v_user_id;

      v_result := json_build_object(
        'success', true, 
        'message', 'Deposit approved and credited instantly',
        'amount', v_amount,
        'user_id', v_user_id
      );
    ELSE
      -- Reject the deposit
      UPDATE ledger
      SET 
        approval_status = 'rejected',
        rejection_reason = COALESCE(p_rejection_reason, 'Rejected by governor'),
        approved_by = p_governor_id,
        approved_at = NOW(),
        status = 'reversed',
        updated_at = NOW()
      WHERE id = p_action_id;

      v_result := json_build_object('success', true, 'message', 'Deposit rejected');
    END IF;

  ELSIF p_action_type = 'withdrawal' THEN
    -- Get withdrawal details
    SELECT user_id, amount, approval_status INTO v_user_id, v_amount, v_current_status
    FROM ledger
    WHERE id = p_action_id AND type = 'withdrawal';

    IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'Withdrawal not found');
    END IF;

    IF v_current_status NOT IN ('pending_review') THEN
      RETURN json_build_object('success', false, 'error', 'Withdrawal already processed');
    END IF;

    IF p_approve THEN
      -- Approve withdrawal with 24-hour clearing
      UPDATE ledger
      SET 
        approval_status = 'approved',
        approved_by = p_governor_id,
        approved_at = NOW(),
        status = 'clearing',
        clearing_ends_at = NOW() + INTERVAL '24 hours',
        updated_at = NOW()
      WHERE id = p_action_id;

      v_result := json_build_object(
        'success', true, 
        'message', 'Withdrawal approved - 24hr clearing initiated'
      );
    ELSE
      -- Reject and refund
      UPDATE ledger
      SET 
        approval_status = 'rejected',
        rejection_reason = COALESCE(p_rejection_reason, 'Rejected by governor'),
        approved_by = p_governor_id,
        approved_at = NOW(),
        status = 'reversed',
        updated_at = NOW()
      WHERE id = p_action_id;

      -- Refund the frozen amount back to vault
      UPDATE profiles
      SET 
        vault_balance = vault_balance + v_amount,
        frozen_balance = frozen_balance - v_amount,
        updated_at = NOW()
      WHERE id = v_user_id;

      v_result := json_build_object('success', true, 'message', 'Withdrawal rejected and refunded');
    END IF;

  ELSIF p_action_type = 'loan_request' THEN
    -- Get loan details
    SELECT * INTO v_loan_record
    FROM p2p_loans
    WHERE id = p_action_id;

    IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'Loan request not found');
    END IF;

    IF v_loan_record.approval_status NOT IN ('pending_review') THEN
      RETURN json_build_object('success', false, 'error', 'Loan request already processed');
    END IF;

    IF p_approve THEN
      -- Approve loan request - make it available in marketplace
      UPDATE p2p_loans
      SET 
        approval_status = 'approved',
        approved_by = p_governor_id,
        approved_at = NOW(),
        status = 'open',
        updated_at = NOW()
      WHERE id = p_action_id;

      v_result := json_build_object(
        'success', true, 
        'message', 'Loan request approved and listed in marketplace'
      );
    ELSE
      -- Reject and release collateral
      UPDATE p2p_loans
      SET 
        approval_status = 'rejected',
        rejection_reason = COALESCE(p_rejection_reason, 'Rejected by governor'),
        approved_by = p_governor_id,
        approved_at = NOW(),
        updated_at = NOW()
      WHERE id = p_action_id;

      -- Release frozen collateral
      UPDATE profiles
      SET 
        frozen_balance = frozen_balance - v_loan_record.collateral_amount,
        vault_balance = vault_balance + v_loan_record.collateral_amount,
        updated_at = NOW()
      WHERE id = v_loan_record.borrower_id;

      v_result := json_build_object('success', true, 'message', 'Loan request rejected and collateral released');
    END IF;

  ELSE
    RETURN json_build_object('success', false, 'error', 'Unknown action type: ' || p_action_type);
  END IF;

  -- Log the action
  INSERT INTO admin_audit_log (admin_id, action, details)
  VALUES (
    p_governor_id,
    CASE WHEN p_approve THEN 'APPROVE' ELSE 'REJECT' END || '_' || UPPER(p_action_type),
    json_build_object(
      'action_id', p_action_id,
      'action_type', p_action_type,
      'approved', p_approve,
      'rejection_reason', p_rejection_reason
    )
  );

  RETURN v_result;
END;
$$;