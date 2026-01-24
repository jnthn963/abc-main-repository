-- Add audit logging for loan approval actions
-- This trigger logs all loan approval/rejection events for accountability

CREATE OR REPLACE FUNCTION log_loan_approval_action()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log when approval workflow fields change
  IF (OLD.approval_status IS DISTINCT FROM NEW.approval_status) OR
     (OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('funded', 'repaid', 'defaulted')) THEN
    
    INSERT INTO admin_audit_log (
      admin_id,
      action,
      details,
      ip_address
    ) VALUES (
      COALESCE(NEW.approved_by, auth.uid()),
      CASE 
        WHEN NEW.approval_status = 'approved' THEN 'LOAN_APPROVED'
        WHEN NEW.approval_status = 'rejected' THEN 'LOAN_REJECTED'
        WHEN NEW.status = 'funded' THEN 'LOAN_FUNDED'
        WHEN NEW.status = 'repaid' THEN 'LOAN_REPAID'
        WHEN NEW.status = 'defaulted' THEN 'LOAN_DEFAULTED'
        ELSE 'LOAN_STATUS_CHANGED'
      END,
      jsonb_build_object(
        'loan_id', NEW.id,
        'reference_number', NEW.reference_number,
        'borrower_id', NEW.borrower_id,
        'lender_id', NEW.lender_id,
        'principal_amount', NEW.principal_amount,
        'interest_rate', NEW.interest_rate,
        'collateral_amount', NEW.collateral_amount,
        'previous_approval_status', OLD.approval_status,
        'new_approval_status', NEW.approval_status,
        'previous_status', OLD.status,
        'new_status', NEW.status,
        'rejection_reason', NEW.rejection_reason,
        'approved_at', NEW.approved_at,
        'action_timestamp', NOW()
      ),
      'system'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for loan approval audit logging
DROP TRIGGER IF EXISTS log_loan_approval_trigger ON p2p_loans;
CREATE TRIGGER log_loan_approval_trigger
  AFTER UPDATE ON p2p_loans
  FOR EACH ROW
  EXECUTE FUNCTION log_loan_approval_action();

-- Add comment for documentation
COMMENT ON FUNCTION log_loan_approval_action() IS 
  'Audit logging trigger that records all loan approval, rejection, funding, repayment, and default events to admin_audit_log for accountability and compliance tracking.';