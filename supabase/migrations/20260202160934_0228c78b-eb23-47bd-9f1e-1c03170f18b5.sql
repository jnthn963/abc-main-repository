-- ABC Master Build: Lend Capital Atomic Function
-- Moves funds from vault_balance to lending_balance
-- Enforces: 50% limit, whole peso amounts, minimum ₱100

CREATE OR REPLACE FUNCTION public.lend_capital_atomic(
  p_user_id UUID,
  p_amount BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_reference_number TEXT;
  v_max_lend_amount BIGINT;
  v_amount_pesos BIGINT;
BEGIN
  -- Convert to pesos for validation display
  v_amount_pesos := p_amount / 100;
  
  -- Validate minimum amount (₱100 = 10000 centavos)
  IF p_amount < 10000 THEN
    RAISE EXCEPTION 'Minimum lend amount is ₱100';
  END IF;
  
  -- Lock profile row for update (prevent race conditions)
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  
  -- Calculate 50% max lend limit
  v_max_lend_amount := FLOOR(v_profile.vault_balance * 0.5);
  
  -- Validate 50% limit
  IF p_amount > v_max_lend_amount THEN
    RAISE EXCEPTION 'Amount exceeds 50%% vault limit. Maximum: ₱%', v_max_lend_amount / 100;
  END IF;
  
  -- Validate sufficient balance
  IF p_amount > v_profile.vault_balance THEN
    RAISE EXCEPTION 'Insufficient E-Wallet balance';
  END IF;
  
  -- Generate reference number
  v_reference_number := generate_reference_number();
  
  -- Update balances atomically (whole peso mandate via floor)
  UPDATE profiles
  SET 
    vault_balance = vault_balance - p_amount,
    lending_balance = lending_balance + p_amount,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Record in ledger (transfer out from vault)
  INSERT INTO ledger (
    user_id,
    type,
    amount,
    status,
    reference_number,
    description,
    destination,
    approval_status,
    metadata
  ) VALUES (
    p_user_id,
    'lending_profit',
    p_amount,
    'completed',
    v_reference_number,
    'Moved to Lend Capital for +0.7% daily yield',
    'LEND_CAPITAL',
    'auto_approved',
    jsonb_build_object(
      'action', 'LEND_CAPITAL',
      'yield_rate', 0.7,
      'vault_before', v_profile.vault_balance,
      'vault_after', v_profile.vault_balance - p_amount,
      'lending_before', v_profile.lending_balance,
      'lending_after', v_profile.lending_balance + p_amount
    )
  );
  
  -- Return success with updated balances (in pesos for UI)
  RETURN jsonb_build_object(
    'success', true,
    'amount_lended', v_amount_pesos,
    'new_vault_balance', FLOOR((v_profile.vault_balance - p_amount) / 100),
    'new_lending_balance', FLOOR((v_profile.lending_balance + p_amount) / 100),
    'reference_number', v_reference_number
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.lend_capital_atomic(UUID, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lend_capital_atomic(UUID, BIGINT) TO service_role;