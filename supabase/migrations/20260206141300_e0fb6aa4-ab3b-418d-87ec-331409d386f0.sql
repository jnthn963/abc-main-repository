-- ============================================
-- ABC AUTOMATION FUNCTIONS: LOAN DEFAULTS & CLEANUP
-- ============================================

-- 1. LOAN DEFAULT CHECKER (Daily at 01:00)
-- Marks overdue funded loans as defaulted and handles collateral
CREATE OR REPLACE FUNCTION public.check_loan_defaults()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_loan RECORD;
  v_loans_defaulted INT := 0;
  v_total_found INT := 0;
  v_errors TEXT[] := '{}';
BEGIN
  -- Check system status
  IF EXISTS(SELECT 1 FROM global_settings WHERE system_kill_switch = true OR maintenance_mode = true LIMIT 1) THEN
    RETURN jsonb_build_object('success', false, 'message', 'System is in maintenance or kill switch is active');
  END IF;

  -- Count overdue loans first
  SELECT COUNT(*) INTO v_total_found
  FROM p2p_loans
  WHERE status = 'funded'
    AND due_date < NOW()
    AND auto_repay_triggered = false;

  -- Process each overdue loan with FOR UPDATE locking
  FOR v_loan IN 
    SELECT l.*, 
           bp.vault_balance as borrower_vault,
           lp.vault_balance as lender_vault,
           lp.lending_balance as lender_lending
    FROM p2p_loans l
    JOIN profiles bp ON bp.id = l.borrower_id
    LEFT JOIN profiles lp ON lp.id = l.lender_id
    WHERE l.status = 'funded'
      AND l.due_date < NOW()
      AND l.auto_repay_triggered = false
    FOR UPDATE OF l, bp
  LOOP
    BEGIN
      -- Mark loan as defaulted
      UPDATE p2p_loans
      SET status = 'defaulted',
          auto_repay_triggered = true,
          updated_at = NOW()
      WHERE id = v_loan.id;

      -- Transfer collateral from borrower's frozen_balance to lender
      -- The collateral was already locked in frozen_balance
      UPDATE profiles
      SET frozen_balance = frozen_balance - v_loan.collateral_amount,
          updated_at = NOW()
      WHERE id = v_loan.borrower_id;

      -- Credit lender with collateral (partial recovery)
      IF v_loan.lender_id IS NOT NULL THEN
        UPDATE profiles
        SET vault_balance = vault_balance + v_loan.collateral_amount,
            lending_balance = lending_balance - v_loan.principal_amount,
            updated_at = NOW()
        WHERE id = v_loan.lender_id;
      END IF;

      -- Create ledger entry for default
      INSERT INTO ledger (
        user_id, type, amount, status, reference_number,
        related_loan_id, description, approval_status
      ) VALUES (
        v_loan.borrower_id,
        'collateral_release',
        v_loan.collateral_amount,
        'completed',
        v_loan.reference_number || '-DEF',
        v_loan.id,
        'Collateral seized due to loan default',
        'auto_approved'
      );

      -- Log to audit
      INSERT INTO admin_audit_log (admin_id, action, details)
      VALUES (
        '00000000-0000-0000-0000-000000000000'::UUID,
        'LOAN_AUTO_DEFAULTED',
        jsonb_build_object(
          'loan_id', v_loan.id,
          'reference_number', v_loan.reference_number,
          'borrower_id', v_loan.borrower_id,
          'lender_id', v_loan.lender_id,
          'principal_amount', v_loan.principal_amount,
          'collateral_seized', v_loan.collateral_amount,
          'due_date', v_loan.due_date,
          'defaulted_at', NOW()
        )
      );

      v_loans_defaulted := v_loans_defaulted + 1;
    EXCEPTION WHEN OTHERS THEN
      v_errors := array_append(v_errors, 'Loan ' || v_loan.reference_number || ': ' || SQLERRM);
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Loan default check completed',
    'loans_defaulted', v_loans_defaulted,
    'total_overdue_found', v_total_found,
    'errors_count', COALESCE(array_length(v_errors, 1), 0),
    'timestamp', NOW()
  );
END;
$$;

-- 2. SYSTEM CLEANUP (Weekly)
-- Cleans old CDC events, rate limits, and other transient data
CREATE OR REPLACE FUNCTION public.cleanup_system_logs()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cdc_deleted INT := 0;
  v_rate_limits_deleted INT := 0;
BEGIN
  -- Clean CDC events older than 7 days (keep errors for investigation)
  DELETE FROM cdc_events
  WHERE created_at < NOW() - INTERVAL '7 days'
    AND webhook_status != 'error';
  GET DIAGNOSTICS v_cdc_deleted = ROW_COUNT;

  -- Clean expired rate limit entries (older than 1 day)
  DELETE FROM rate_limits
  WHERE window_start < NOW() - INTERVAL '1 day';
  GET DIAGNOSTICS v_rate_limits_deleted = ROW_COUNT;

  -- Log cleanup action
  INSERT INTO admin_audit_log (admin_id, action, details)
  VALUES (
    '00000000-0000-0000-0000-000000000000'::UUID,
    'SYSTEM_CLEANUP',
    jsonb_build_object(
      'cdc_events_deleted', v_cdc_deleted,
      'rate_limits_deleted', v_rate_limits_deleted,
      'cleanup_timestamp', NOW()
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'System cleanup completed',
    'cdc_events_deleted', v_cdc_deleted,
    'rate_limits_deleted', v_rate_limits_deleted,
    'timestamp', NOW()
  );
END;
$$;

-- 3. FIX profiles_user_view with proper security
-- Drop and recreate with security_invoker to respect RLS
DROP VIEW IF EXISTS public.profiles_user_view;

CREATE VIEW public.profiles_user_view 
WITH (security_invoker = true)
AS
SELECT 
  id,
  member_id,
  display_name,
  email,
  phone,
  vault_balance,
  frozen_balance,
  lending_balance,
  membership_tier,
  kyc_status,
  onboarding_completed,
  created_at,
  updated_at,
  last_login_at,
  address_line1,
  address_line2,
  city,
  province,
  postal_code,
  referral_code,
  referrer_id,
  total_referral_earnings
FROM public.profiles
WHERE id = auth.uid();

-- Grant appropriate permissions
REVOKE ALL ON public.profiles_user_view FROM anon;
GRANT SELECT ON public.profiles_user_view TO authenticated;

COMMENT ON VIEW public.profiles_user_view IS 'Secure user profile view - only shows authenticated user own data via security_invoker';