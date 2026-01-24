-- Protect loan approval workflow fields from non-admin updates
-- This trigger prevents borrowers/lenders from manipulating approval_status, approved_by, approved_at, rejection_reason

CREATE OR REPLACE FUNCTION protect_loan_approval_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow governors/admins to update any fields
  IF has_role(auth.uid(), 'governor'::app_role) OR has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- For regular users, prevent modification of approval workflow fields
  IF OLD.approval_status IS DISTINCT FROM NEW.approval_status OR
     OLD.approved_by IS DISTINCT FROM NEW.approved_by OR
     OLD.approved_at IS DISTINCT FROM NEW.approved_at OR
     OLD.rejection_reason IS DISTINCT FROM NEW.rejection_reason THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can modify loan approval fields';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to enforce the protection
DROP TRIGGER IF EXISTS protect_loan_approval_fields_trigger ON p2p_loans;
CREATE TRIGGER protect_loan_approval_fields_trigger
  BEFORE UPDATE ON p2p_loans
  FOR EACH ROW
  EXECUTE FUNCTION protect_loan_approval_fields();

-- Add comment for documentation
COMMENT ON FUNCTION protect_loan_approval_fields() IS 
  'Prevents non-admin users from manipulating loan approval workflow fields (approval_status, approved_by, approved_at, rejection_reason). Only governors and admins can modify these fields.';