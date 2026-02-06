-- Update protect_loan_approval_trigger to allow service role calls
-- Service role (auth.uid() IS NULL) is trusted since edge functions verify JWT first

CREATE OR REPLACE FUNCTION protect_loan_approval_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow service role (NULL auth.uid) - edge functions verify JWT before calling
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if approval fields are being modified
  IF OLD.approval_status IS DISTINCT FROM NEW.approval_status
     OR OLD.approved_by IS DISTINCT FROM NEW.approved_by
     OR OLD.approved_at IS DISTINCT FROM NEW.approved_at
     OR OLD.rejection_reason IS DISTINCT FROM NEW.rejection_reason THEN
    
    -- Only governors and admins can modify approval fields
    IF NOT has_role(auth.uid(), 'admin'::app_role) 
       AND NOT has_role(auth.uid(), 'governor'::app_role) THEN
      RAISE EXCEPTION 'Unauthorized: Only administrators can modify loan approval fields';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;