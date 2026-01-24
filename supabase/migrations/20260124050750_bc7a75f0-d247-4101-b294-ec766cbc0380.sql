-- Add column-level protection for financial balance fields on profiles
-- Prevents users from modifying vault_balance, frozen_balance, lending_balance, and total_referral_earnings directly

CREATE OR REPLACE FUNCTION protect_profile_balance_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow service_role and system operations (no auth context)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Allow admins and governors to modify any fields
  IF has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'governor'::app_role) THEN
    RETURN NEW;
  END IF;
  
  -- Block regular users from modifying financial balance fields
  IF OLD.vault_balance IS DISTINCT FROM NEW.vault_balance THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify vault_balance directly. Use deposit/withdrawal functions.';
  END IF;
  
  IF OLD.frozen_balance IS DISTINCT FROM NEW.frozen_balance THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify frozen_balance directly.';
  END IF;
  
  IF OLD.lending_balance IS DISTINCT FROM NEW.lending_balance THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify lending_balance directly.';
  END IF;
  
  IF OLD.total_referral_earnings IS DISTINCT FROM NEW.total_referral_earnings THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify referral earnings directly.';
  END IF;
  
  -- Also protect membership_tier and kyc_status from user manipulation
  IF OLD.membership_tier IS DISTINCT FROM NEW.membership_tier THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify membership tier.';
  END IF;
  
  IF OLD.kyc_status IS DISTINCT FROM NEW.kyc_status THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify KYC status.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
DROP TRIGGER IF EXISTS protect_profile_balance_trigger ON profiles;
CREATE TRIGGER protect_profile_balance_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_profile_balance_fields();

-- Add documentation
COMMENT ON FUNCTION protect_profile_balance_fields() IS 
  'Security trigger that prevents regular users from modifying financial balance fields (vault_balance, frozen_balance, lending_balance, total_referral_earnings) and status fields (membership_tier, kyc_status). Only admins/governors or system operations can modify these fields.';