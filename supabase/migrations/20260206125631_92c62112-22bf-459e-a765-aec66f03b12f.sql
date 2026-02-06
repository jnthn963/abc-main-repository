-- Fix stuck deposits: Update release_clearing_atomic to also check approval_status
-- AND manually process stuck approved deposits

-- First, manually credit the stuck deposits to user accounts
-- These deposits were approved but never cleared due to cron job not running

-- Process stuck deposit for user dfd71bb4-2f12-4002-be4c-95ad78bdd0a8
-- Total approved deposits still in clearing: 10,000,000 + 1,234 + 500 + 10 = 10,001,744 pesos = 1,000,174,400 centavos

-- Update user vault balances for stuck deposits
DO $$
DECLARE
  v_tx RECORD;
BEGIN
  -- Process each stuck approved deposit
  FOR v_tx IN 
    SELECT l.id, l.user_id, l.amount, l.reference_number
    FROM ledger l
    WHERE l.status = 'clearing' 
      AND l.approval_status = 'approved'
      AND l.clearing_ends_at < NOW()
      AND l.type = 'deposit'
  LOOP
    -- Credit vault balance
    UPDATE profiles
    SET vault_balance = vault_balance + v_tx.amount,
        updated_at = NOW()
    WHERE id = v_tx.user_id;
    
    -- Mark as completed
    UPDATE ledger
    SET status = 'completed'::transaction_status,
        cleared_at = NOW(),
        updated_at = NOW()
    WHERE id = v_tx.id;
    
    RAISE NOTICE 'Processed deposit % for amount % (ref: %)', v_tx.id, v_tx.amount, v_tx.reference_number;
  END LOOP;
END $$;

-- Update the release_clearing_atomic function to also check approval_status
CREATE OR REPLACE FUNCTION release_clearing_atomic()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx RECORD;
  v_transactions_cleared INT := 0;
  v_total_found INT := 0;
  v_errors TEXT[] := '{}';
BEGIN
  -- Check system status
  IF EXISTS(SELECT 1 FROM global_settings WHERE system_kill_switch = true OR maintenance_mode = true LIMIT 1) THEN
    RETURN jsonb_build_object('success', false, 'message', 'System is in maintenance or kill switch is active');
  END IF;

  -- Get count first - MUST check approval_status = 'approved'
  SELECT COUNT(*) INTO v_total_found
  FROM ledger
  WHERE status = 'clearing' 
    AND approval_status = 'approved'
    AND clearing_ends_at < NOW();

  -- Process each clearing transaction with FOR UPDATE locking
  FOR v_tx IN 
    SELECT l.*, p.vault_balance, p.frozen_balance
    FROM ledger l
    JOIN profiles p ON p.id = l.user_id
    WHERE l.status = 'clearing' 
      AND l.approval_status = 'approved'
      AND l.clearing_ends_at < NOW()
    FOR UPDATE OF l, p
  LOOP
    BEGIN
      -- Update transaction status
      UPDATE ledger
      SET status = 'completed'::transaction_status, 
          cleared_at = NOW(),
          updated_at = NOW()
      WHERE id = v_tx.id;

      -- For deposits, add to vault_balance (already in centavos)
      IF v_tx.type = 'deposit' THEN
        UPDATE profiles
        SET vault_balance = vault_balance + v_tx.amount,
            updated_at = NOW()
        WHERE id = v_tx.user_id;
      END IF;
      
      -- For withdrawals/transfers, the amount was already deducted at request time
      -- No additional balance change needed at clearing

      v_transactions_cleared := v_transactions_cleared + 1;
    EXCEPTION WHEN OTHERS THEN
      v_errors := array_append(v_errors, 'Transaction ' || v_tx.reference_number || ': ' || SQLERRM);
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Clearing release completed',
    'transactions_cleared', v_transactions_cleared,
    'total_found', v_total_found,
    'errors_count', COALESCE(array_length(v_errors, 1), 0),
    'timestamp', NOW()
  );
END;
$$;